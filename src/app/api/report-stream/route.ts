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
    CREATE TABLE IF NOT EXISTS stream_reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      username TEXT DEFAULT '',
      slug TEXT NOT NULL,
      episode TEXT DEFAULT '',
      note TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function POST(req: NextRequest) {
  try {
    const u = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const slug = String(body.slug || "").slice(0, 200);
    const episode = String(body.episode || "").slice(0, 120);
    const note = String(body.note || "").slice(0, 500);
    if (!slug) {
      return NextResponse.json({ ok: false, error: "Thiếu slug" }, { status: 400 });
    }
    const db = sql();
    await ensure(db);
    await db`
      INSERT INTO stream_reports (user_id, username, slug, episode, note)
      VALUES (
        ${u?.userId || null},
        ${u?.username || ""},
        ${slug},
        ${episode},
        ${note}
      )
    `;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Admin xem danh sách báo lỗi nguồn */
export async function GET(req: NextRequest) {
  const secret =
    process.env.VERIFY_ADMIN_SECRET ||
    process.env.MIGRATE_SECRET ||
    "OpusFilm2026Secret";
  if ((req.headers.get("x-admin-secret") || "") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const db = sql();
    await ensure(db);
    const rows = await db`
      SELECT * FROM stream_reports
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return NextResponse.json({ ok: true, reports: rows });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
