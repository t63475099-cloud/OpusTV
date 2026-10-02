import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session";
import {
  consumeAccountResource,
  ensureRealtimeSchema,
  getAccountSnapshot,
  validateSession,
} from "@/lib/session/store";

export const dynamic = "force-dynamic";

/**
 * POST /api/account/consume
 * Body: { kind: "coins"|"vip_hours"|"points", amount, expectedVersion?, note? }
 * Demonstrates OCC multi-device sync + double-spend protection.
 */
export async function POST(req: NextRequest) {
  try {
    await ensureRealtimeSchema();
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || "";
    const session = await validateSession(token);
    if (!session.ok || !session.userId) {
      return NextResponse.json(
        { ok: false, error: "Chưa đăng nhập hoặc phiên đã thu hồi" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const kind = String(body.kind || "coins") as "coins" | "vip_hours" | "points";
    if (!["coins", "vip_hours", "points"].includes(kind)) {
      return NextResponse.json({ ok: false, error: "kind không hợp lệ" }, { status: 400 });
    }
    const amount = Number(body.amount);
    const expectedVersion =
      body.expectedVersion != null ? Number(body.expectedVersion) : undefined;
    const note = String(body.note || "").slice(0, 120);

    const result = await consumeAccountResource(
      session.userId,
      kind,
      amount,
      expectedVersion,
      session.sessionId ?? null,
      note
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          conflict: !!result.conflict,
          snapshot: result.snapshot,
          stateVersion: result.snapshot?.stateVersion,
        },
        { status: result.conflict ? 409 : 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      snapshot: result.snapshot,
      stateVersion: result.snapshot?.stateVersion,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** GET — current account snapshot for this session */
export async function GET() {
  try {
    await ensureRealtimeSchema();
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || "";
    const session = await validateSession(token);
    if (!session.ok || !session.userId) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const snapshot = await getAccountSnapshot(session.userId);
    return NextResponse.json({
      ok: true,
      snapshot,
      sessionId: session.sessionId,
      stateVersion: snapshot?.stateVersion ?? 0,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
