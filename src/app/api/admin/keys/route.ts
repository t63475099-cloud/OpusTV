import { NextRequest, NextResponse } from "next/server";
import {
  createKeys,
  listKeys,
  revokeKey,
  unrevokeKey,
  getKeysVersion,
  waitKeysVersion,
  bumpKeysVersion,
} from "@/lib/db/keys";
import type { KeyTier } from "@/lib/keyEngine";

function checkSecret(req: NextRequest): boolean {
  const secret = process.env.KEY_ADMIN_SECRET || process.env.MIGRATE_SECRET || "";
  if (!secret) return false;
  const h =
    req.headers.get("x-key-secret") ||
    req.headers.get("x-admin-secret") ||
    req.nextUrl.searchParams.get("secret") ||
    "";
  return h === secret;
}

/**
 * GET
 *  - ?stream=1  → SSE real-time (version bump khi key used/revoked/created)
 *  - còn lại    → JSON danh sách keys (filter tier / status / limit)
 */
export async function GET(req: NextRequest) {
  try {
    if (!checkSecret(req)) {
      return NextResponse.json({ ok: false, error: "Sai mã quản trị" }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }

    const { searchParams } = req.nextUrl;
    const stream = searchParams.get("stream") === "1" || searchParams.get("sse") === "1";

    if (stream) {
      const encoder = new TextEncoder();
      let closed = false;
      let lastVersion = getKeysVersion();

      const streamBody = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: unknown) => {
            if (closed) return;
            try {
              controller.enqueue(
                encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
              );
            } catch {
              closed = true;
            }
          };

          // initial snapshot
          const tierParam = (searchParams.get("tier") || "ALL").toUpperCase();
          const statusParam = searchParams.get("status") || "all";
          const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 80)));
          const tier = (["24H", "12H", "CUSTOM", "ALL"].includes(tierParam)
            ? tierParam
            : "ALL") as KeyTier | "ALL";

          const keys = await listKeys({ limit, tier, status: statusParam });
          send("snapshot", { ok: true, version: lastVersion, keys, ts: Date.now() });

          // long-poll style: wait for version change, then push update
          const loop = async () => {
            while (!closed) {
              try {
                const next = await waitKeysVersion(lastVersion, 22000);
                if (closed) break;
                if (next !== lastVersion) {
                  lastVersion = next;
                  const updated = await listKeys({ limit, tier, status: statusParam });
                  send("update", {
                    ok: true,
                    version: lastVersion,
                    keys: updated,
                    ts: Date.now(),
                  });
                } else {
                  // heartbeat keep-alive
                  send("ping", { version: lastVersion, ts: Date.now() });
                }
              } catch {
                if (!closed) {
                  send("ping", { version: lastVersion, ts: Date.now() });
                }
              }
            }
          };

          void loop();
        },
        cancel() {
          closed = true;
        },
      });

      return new Response(streamBody, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
        },
      });
    }

    // regular JSON list
    const tierParam = (searchParams.get("tier") || "ALL").toUpperCase();
    const statusParam = searchParams.get("status") || "all";
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") || 80)));
    const tier = (["24H", "12H", "CUSTOM", "ALL"].includes(tierParam)
      ? tierParam
      : "ALL") as KeyTier | "ALL";

    const keys = await listKeys({ limit, tier, status: statusParam });
    return NextResponse.json({
      ok: true,
      version: getKeysVersion(),
      keys,
      count: keys.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST — sinh batch keys
 * body: { count, tier, customPrefix?, customHours?, note? }
 */
export async function POST(req: NextRequest) {
  try {
    if (!checkSecret(req)) {
      return NextResponse.json({ ok: false, error: "Sai mã quản trị" }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const count = Math.min(50, Math.max(1, Math.floor(Number(body.count) || 1)));
    const tierRaw = String(body.tier || "24H").toUpperCase();
    const tier: KeyTier =
      tierRaw === "12H" ? "12H" : tierRaw === "CUSTOM" ? "CUSTOM" : "24H";
    const customPrefix = body.customPrefix ? String(body.customPrefix) : undefined;
    const customHours =
      body.customHours != null ? Number(body.customHours) : undefined;
    const note = String(body.note || `admin-${tier}`).slice(0, 120);

    const codes = await createKeys(count, note, undefined, {
      tier,
      customPrefix,
      customHours,
    });

    bumpKeysVersion();

    return NextResponse.json({
      ok: true,
      codes,
      count: codes.length,
      tier,
      version: getKeysVersion(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * PATCH — thu hồi / mở khóa lại
 * body: { code, action: "revoke" | "unrevoke" }
 */
export async function PATCH(req: NextRequest) {
  try {
    if (!checkSecret(req)) {
      return NextResponse.json({ ok: false, error: "Sai mã quản trị" }, { status: 401 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }

    const body = await req.json().catch(() => ({}));
    const code = String(body.code || body.keyCode || "").trim();
    const action = String(body.action || "revoke").toLowerCase();

    if (!code) {
      return NextResponse.json({ ok: false, error: "Thiếu mã key" }, { status: 400 });
    }

    if (action === "unrevoke" || action === "unlock") {
      const r = await unrevokeKey(code);
      if (!r.ok) {
        return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
      }
      return NextResponse.json({
        ok: true,
        action: "unrevoke",
        code,
        version: getKeysVersion(),
      });
    }

    const r = await revokeKey(code);
    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
    }
    return NextResponse.json({
      ok: true,
      action: "revoke",
      code,
      version: getKeysVersion(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
