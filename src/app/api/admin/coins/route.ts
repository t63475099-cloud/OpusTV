import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { resolveUserByUidOrUsername } from "@/lib/adminResolveUser";

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
    // uid ưu tiên; vẫn nhận username để tương thích
    const target = String(body.uid || body.username || "").trim();
    // Cho phép số lớn (tối đa ~2 tỷ)
    const amount = Math.floor(Number(body.amount) || 0);
    const note = String(body.note || "Admin cấp xu").slice(0, 200);

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Nhập UID (khuyến nghị) hoặc username" },
        { status: 400 }
      );
    }
    if (!Number.isFinite(amount) || amount < 1 || amount > 2_000_000_000) {
      return NextResponse.json(
        { ok: false, error: "Số xu phải từ 1 đến 2.000.000.000" },
        { status: 400 }
      );
    }

    const u = await resolveUserByUidOrUsername(target);
    if (!u) {
      return NextResponse.json(
        { ok: false, error: "Không tìm thấy tài khoản với UID/username này" },
        { status: 404 }
      );
    }

    const db = sql();
    await ensure(db);
    const ins = await db`
      INSERT INTO coin_grants (user_id, username, amount, note)
      VALUES (${u.id}, ${u.username}, ${amount}, ${note})
      RETURNING id, username, amount, created_at
    `;
    return NextResponse.json({
      ok: true,
      grant: ins[0],
      resolved: { username: u.username, uid: u.uid },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
