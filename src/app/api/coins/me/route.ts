import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: true, grant: null });
    const db = sql();
    try {
      await db`
        CREATE TABLE IF NOT EXISTS coin_grants (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          username TEXT NOT NULL,
          amount INTEGER NOT NULL,
          note TEXT DEFAULT '',
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;
    } catch {
      /* */
    }
    const rows = await db`
      SELECT id, amount, note, created_at FROM coin_grants
      WHERE user_id = ${user.userId}
      ORDER BY id DESC LIMIT 1
    `;
    if (!rows.length) return NextResponse.json({ ok: true, grant: null });
    const g = rows[0] as { id: number; amount: number; note: string; created_at: string };
    return NextResponse.json({
      ok: true,
      grant: {
        id: g.id,
        amount: Number(g.amount),
        note: g.note,
        createdAt: g.created_at,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
