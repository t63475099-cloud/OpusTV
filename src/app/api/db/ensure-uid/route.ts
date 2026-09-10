import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

/** Thêm cột uid/bio/verified nếu thiếu + gán UID cho user cũ */
export async function POST(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET || "";
  const header = req.headers.get("x-migrate-secret") || "";
  if (!secret || header !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL missing" }, { status: 503 });
  }
  try {
    const sql = neon(url);
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER NOT NULL DEFAULT 0`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_uid_uidx ON users (uid)`;
    const rows = await sql`SELECT id FROM users WHERE uid IS NULL OR uid = ''`;
    let assigned = 0;
    for (const row of rows as { id: number }[]) {
      let uid = "";
      for (let i = 0; i < 20; i++) {
        uid = String(Math.floor(1000000000 + Math.random() * 9000000000));
        const exists = await sql`SELECT 1 FROM users WHERE uid = ${uid} LIMIT 1`;
        if ((exists as unknown[]).length === 0) break;
      }
      await sql`UPDATE users SET uid = ${uid}, updated_at = NOW() WHERE id = ${row.id}`;
      assigned++;
    }
    return NextResponse.json({ ok: true, assigned });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
