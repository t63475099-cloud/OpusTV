import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

/** Lấy grant chuỗi mới nhất cho user đang đăng nhập */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Cần đăng nhập" }, { status: 401 });
    }
    const db = sql();
    try {
      await db`
        CREATE TABLE IF NOT EXISTS streak_grants (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          days INTEGER NOT NULL,
          source_request_id INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
    } catch {
      /* ignore */
    }
    const rows = await db`
      SELECT id, days, created_at
      FROM streak_grants
      WHERE user_id = ${user.userId}
      ORDER BY id DESC
      LIMIT 1
    `;
    if (!rows.length) {
      return NextResponse.json({ ok: true, grant: null });
    }
    const g = rows[0] as { id: number; days: number; created_at: string };
    return NextResponse.json({
      ok: true,
      grant: { id: g.id, days: Number(g.days), createdAt: g.created_at },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
