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
  return (req.headers.get("x-admin-secret") || "") === secret;
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
}

export async function GET(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    await ensure(db);
    const recent = await db`
      SELECT id, username, amount, note, created_at FROM coin_grants
      ORDER BY id DESC LIMIT 40
    `;
    return NextResponse.json({ ok: true, recent });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const username = String(body.username || "")
      .trim()
      .toLowerCase()
      .slice(0, 64);
    const amount = Math.floor(Number(body.amount) || 0);
    const note = String(body.note || "Admin cấp xu").slice(0, 200);
    if (!username || amount < 1 || amount > 99999999) {
      return NextResponse.json(
        { ok: false, error: "username và amount (1+) bắt buộc" },
        { status: 400 }
      );
    }
    const db = sql();
    await ensure(db);
    const users = await db`
      SELECT id, username FROM users WHERE lower(username) = ${username} LIMIT 1
    `;
    if (!users.length) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy tài khoản" }, { status: 404 });
    }
    const u = users[0] as { id: number; username: string };
    const ins = await db`
      INSERT INTO coin_grants (user_id, username, amount, note)
      VALUES (${u.id}, ${u.username}, ${amount}, ${note})
      RETURNING id, username, amount, created_at
    `;
    return NextResponse.json({ ok: true, grant: ins[0] });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
