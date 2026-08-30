import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

function checkSecret(req: NextRequest) {
  const secret =
    process.env.VERIFY_ADMIN_SECRET ||
    process.env.MIGRATE_SECRET ||
    "OpusFilm2026Secret";
  const h = req.headers.get("x-admin-secret") || "";
  return h === secret;
}

/** GET: danh sách yêu cầu pending (admin) */
export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    const rows = await db`
      SELECT r.id, r.user_id, r.full_name, r.field, r.social_link, r.status, r.created_at,
             u.username, u.verified
      FROM verification_requests r
      JOIN users u ON u.id = r.user_id
      WHERE r.status = 'pending'
      ORDER BY r.created_at ASC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, items: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** POST: duyệt / từ chối */
export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body.id || 0);
    const action = String(body.action || ""); // approve | reject
    const note = String(body.note || "").slice(0, 200);
    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Thiếu id/action" }, { status: 400 });
    }
    const db = sql();
    const rows = await db`
      SELECT user_id FROM verification_requests WHERE id = ${id} LIMIT 1
    `;
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy" }, { status: 404 });
    }
    const userId = (rows[0] as { user_id: number }).user_id;
    const status = action === "approve" ? "approved" : "rejected";
    await db`
      UPDATE verification_requests
      SET status = ${status}, note = ${note}, updated_at = NOW()
      WHERE id = ${id}
    `;
    if (action === "approve") {
      await db`UPDATE users SET verified = 1, updated_at = NOW() WHERE id = ${userId}`;
    }
    return NextResponse.json({ ok: true, status });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
