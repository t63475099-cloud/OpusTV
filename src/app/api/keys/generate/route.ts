import { NextRequest, NextResponse } from "next/server";
import { createKeys, listRecentKeys } from "@/lib/db/keys";

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
 *  - Không secret: tạo 1 mã công khai (cho user Get Key)
 *  - Có secret: tạo nhiều mã (admin)
 */
export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ ok: false, error: "DATABASE_URL chưa cấu hình" }, { status: 503 });
    }
    const body = await req.json().catch(() => ({}));
    const isAdmin = checkSecret(req);

    if (isAdmin) {
      const count = Number(body.count || 1);
      const note = String(body.note || "admin");
      const expiresDays = body.expiresDays != null ? Number(body.expiresDays) : 30;
      const codes = await createKeys(count, note, expiresDays > 0 ? expiresDays : undefined);
      return NextResponse.json({ ok: true, codes, count: codes.length, admin: true });
    }

    // User public: 1 key / request, hết hạn 7 ngày
    const codes = await createKeys(1, "public-get-key", 7);
    if (!codes.length) {
      return NextResponse.json({ ok: false, error: "Không tạo được mã" }, { status: 500 });
    }
    return NextResponse.json({
      ok: true,
      codes,
      code: codes[0],
      expiresInDays: 7,
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
