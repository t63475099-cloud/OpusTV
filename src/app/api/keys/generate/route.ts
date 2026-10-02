import { NextRequest, NextResponse } from "next/server";
import { createKeys, listRecentKeys } from "@/lib/db/keys";
import type { KeyTier } from "@/lib/keyEngine";

function checkSecret(req: NextRequest) {
  const secret = process.env.KEY_ADMIN_SECRET || process.env.MIGRATE_SECRET || "";
  if (!secret) return false;
  const h =
    req.headers.get("x-key-secret") ||
    req.headers.get("x-admin-secret") ||
    "";
  return h === secret;
}

/** POST: tạo mã
 *  - Không secret: tạo 1 mã công khai 24H (cho user Get Key)
 *  - Có secret: tạo nhiều mã (admin) — hỗ trợ tier 24H/12H/CUSTOM
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    const body = await req.json().catch(() => ({}));
    const isAdmin = checkSecret(req);

    if (isAdmin) {
      const count = Math.min(50, Math.max(1, Math.floor(Number(body.count || 1))));
      const note = String(body.note || "admin").slice(0, 120);
      const tierRaw = String(body.tier || "24H").toUpperCase();
      const tier: KeyTier =
        tierRaw === "12H" ? "12H" : tierRaw === "CUSTOM" ? "CUSTOM" : "24H";
      const customPrefix = body.customPrefix ? String(body.customPrefix) : undefined;
      const customHours =
        body.customHours != null ? Number(body.customHours) : undefined;

      const codes = await createKeys(count, note, undefined, {
        tier,
        customPrefix,
        customHours,
      });
      return NextResponse.json({
        ok: true,
        codes,
        count: codes.length,
        tier,
        admin: true,
      });
    }

    // User public: 1 key 24H
    const codes = await createKeys(1, "public-get-key", undefined, { tier: "24H" });
    if (!codes.length) {
      return NextResponse.json({ ok: false, error: "Không tạo được mã" }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      codes,
      code: codes[0],
      tier: "24H",
      expiresInHours: 24,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** GET danh sách — chỉ admin */
export async function GET(req: NextRequest) {
  try {
    if (!checkSecret(req)) {
      return NextResponse.json({ ok: false, error: "Sai mã quản trị" }, { status: 401 });
    }
    const keys = await listRecentKeys(40);
    return NextResponse.json({ ok: true, keys });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
