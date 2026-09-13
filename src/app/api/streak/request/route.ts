import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

async function ensureTable(db: ReturnType<typeof sql>) {
  await db`
    CREATE TABLE IF NOT EXISTS streak_restore_requests (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      username TEXT NOT NULL,
      days INTEGER NOT NULL DEFAULT 1,
      reason TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'pending',
      admin_note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

/** User gửi khiếu nại mất chuỗi */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const days = Math.floor(Number(body.days) || 0);
    const reason = String(body.reason || "").trim().slice(0, 500);
    if (days < 1 || days > 999999) {
      return NextResponse.json(
        { ok: false, error: "Số chuỗi phải từ 1 trở lên" },
        { status: 400 }
      );
    }
    const db = sql();
    await ensureTable(db);
    // Chỉ 1 đơn pending / user
    const existing = await db`
      SELECT id FROM streak_restore_requests
      WHERE user_id = ${user.userId} AND status = 'pending'
      LIMIT 1
    `;
    if (existing.length) {
      return NextResponse.json(
        { ok: false, error: "Bạn đã có đơn đang chờ duyệt" },
        { status: 400 }
      );
    }
    const ins = await db`
      INSERT INTO streak_restore_requests (user_id, username, days, reason, status)
      VALUES (${user.userId}, ${user.username}, ${days}, ${reason || "Mất chuỗi do bảo trì web"}, 'pending')
      RETURNING id, days, status, created_at
    `;
    return NextResponse.json({ ok: true, request: ins[0] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** User xem đơn của mình */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    const db = sql();
    await ensureTable(db);
    const rows = await db`
      SELECT id, days, reason, status, created_at, updated_at
      FROM streak_restore_requests
      WHERE user_id = ${user.userId}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    return NextResponse.json({ ok: true, items: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
