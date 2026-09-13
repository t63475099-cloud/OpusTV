import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { getSessionUser } from "@/lib/session";

function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Thiếu DATABASE_URL");
  return neon(url);
}

async function ensure(db: ReturnType<typeof sql>) {
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
  try {
    await db`ALTER TABLE coin_grants ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ`;
  } catch {
    /* */
  }
}

/** Chỉ trả grant CHƯA nhận — tránh F5 cộng lại toàn bộ lịch sử */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: true, grants: [], grant: null });
    const db = sql();
    await ensure(db);
    const rows = await db`
      SELECT id, amount, note, created_at FROM coin_grants
      WHERE user_id = ${user.userId} AND claimed_at IS NULL
      ORDER BY id ASC
      LIMIT 50
    `;
    const grants = (
      rows as { id: number; amount: number; note: string; created_at: string }[]
    ).map((g) => ({
      id: g.id,
      amount: Number(g.amount),
      note: g.note || "",
      createdAt: g.created_at,
    }));
    return NextResponse.json({
      ok: true,
      grants,
      grant: grants.length ? grants[grants.length - 1] : null,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Đánh dấu đã nhận sau khi client cộng/trừ xu thành công */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids)
      ? body.ids.map((x: unknown) => Number(x)).filter((x: number) => Number.isFinite(x) && x > 0)
      : body.id
        ? [Number(body.id)].filter((x) => Number.isFinite(x) && x > 0)
        : [];
    if (!ids.length) {
      return NextResponse.json({ ok: false, error: "Thiếu ids" }, { status: 400 });
    }
    const db = sql();
    await ensure(db);
    // Chỉ claim grant của chính user, chưa claim
    for (const id of ids.slice(0, 50)) {
      await db`
        UPDATE coin_grants
        SET claimed_at = NOW()
        WHERE id = ${id} AND user_id = ${user.userId} AND claimed_at IS NULL
      `;
    }
    return NextResponse.json({ ok: true, claimed: ids.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
