import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

const SQL_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_username_uidx ON users (username)`,
  `CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS sessions_token_hash_uidx ON sessions (session_token_hash)`,
  `CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`,
  `CREATE TABLE IF NOT EXISTS watch_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    thumbnail TEXT DEFAULT '',
    episode TEXT DEFAULT '',
    episode_slug TEXT DEFAULT '',
    server TEXT DEFAULT '',
    progress REAL NOT NULL DEFAULT 0,
    duration REAL NOT NULL DEFAULT 0,
    watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS watch_history_user_video_uidx ON watch_history (user_id, video_id)`,
  `CREATE INDEX IF NOT EXISTS watch_history_user_id_idx ON watch_history (user_id)`,
  `CREATE INDEX IF NOT EXISTS watch_history_video_id_idx ON watch_history (video_id)`,
  `CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    thumbnail TEXT DEFAULT '',
    type TEXT DEFAULT 'movie',
    year INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_video_uidx ON favorites (user_id, video_id)`,
  `CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites (user_id)`,
  `CREATE TABLE IF NOT EXISTS music_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    thumbnail TEXT DEFAULT '',
    artist TEXT DEFAULT '',
    category TEXT DEFAULT '',
    played_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS music_history_user_id_idx ON music_history (user_id)`,
  `CREATE INDEX IF NOT EXISTS music_history_played_at_idx ON music_history (played_at)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS music_history_user_video_uidx ON music_history (user_id, video_id)`,
  `CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL DEFAULT '{}',
    background_playback INTEGER NOT NULL DEFAULT 0,
    theme TEXT DEFAULT 'dark',
    language TEXT DEFAULT 'vi',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS settings_user_id_uidx ON settings (user_id)`,
  `CREATE TABLE IF NOT EXISTS video_social (
    id SERIAL PRIMARY KEY,
    slug TEXT NOT NULL,
    likes INTEGER NOT NULL DEFAULT 0,
    liked_by JSONB NOT NULL DEFAULT '[]',
    comments JSONB NOT NULL DEFAULT '[]',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS video_social_slug_uidx ON video_social (slug)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS recovery_pin_hash TEXT`,
];

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sql = neon(url) as any;
    for (const stmt of SQL_STATEMENTS) {
      await sql(stmt);
    }
    return NextResponse.json({ ok: true, statements: SQL_STATEMENTS.length });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "migrate failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
