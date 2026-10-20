import { sql } from "@/lib/neonSql";

let ready = false;
let inflight: Promise<void> | null = null;

export type InboxCategory = "primary" | "friend" | "other";

export async function ensureInboxTables() {
  if (ready) return;
  if (inflight) return inflight;
  inflight = (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS user_inbox (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(64) NOT NULL,
        category VARCHAR(16) NOT NULL DEFAULT 'other',
        kind VARCHAR(32) NOT NULL DEFAULT 'system',
        title TEXT NOT NULL,
        body TEXT NOT NULL DEFAULT '',
        from_username VARCHAR(64),
        ref_id TEXT,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        is_handled BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_inbox_user ON user_inbox (username, created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_inbox_unread ON user_inbox (username, is_read) WHERE is_read = FALSE`;
    ready = true;
  })();
  return inflight;
}

export async function pushInboxItem(opts: {
  username: string;
  category: InboxCategory;
  kind: string;
  title: string;
  body?: string;
  fromUsername?: string;
  refId?: string;
}) {
  await ensureInboxTables();
  const u = opts.username.trim().toLowerCase();
  if (!u) return null;
  // Tránh spam cùng ref trong 1 phút
  if (opts.refId) {
    const dup = (await sql`
      SELECT id FROM user_inbox
      WHERE lower(username) = ${u}
        AND ref_id = ${opts.refId}
        AND created_at > NOW() - INTERVAL '2 minutes'
      LIMIT 1
    `) as unknown[];
    if (dup.length) return null;
  }
  const rows = (await sql`
    INSERT INTO user_inbox (username, category, kind, title, body, from_username, ref_id)
    VALUES (
      ${u},
      ${opts.category},
      ${opts.kind},
      ${opts.title.slice(0, 200)},
      ${(opts.body || "").slice(0, 500)},
      ${opts.fromUsername ? opts.fromUsername.toLowerCase() : null},
      ${opts.refId || null}
    )
    RETURNING id::text
  `) as Array<{ id: string }>;
  return rows[0]?.id || null;
}

export async function listInbox(username: string, category?: string) {
  await ensureInboxTables();
  const u = username.trim().toLowerCase();
  if (category && category !== "all") {
    return (await sql`
      SELECT id::text, category, kind, title, body, from_username, ref_id,
             is_read, is_handled, created_at::text
      FROM user_inbox
      WHERE lower(username) = ${u} AND category = ${category}
      ORDER BY created_at DESC
      LIMIT 80
    `) as Array<Record<string, unknown>>;
  }
  return (await sql`
    SELECT id::text, category, kind, title, body, from_username, ref_id,
           is_read, is_handled, created_at::text
    FROM user_inbox
    WHERE lower(username) = ${u}
    ORDER BY created_at DESC
    LIMIT 100
  `) as Array<Record<string, unknown>>;
}

export async function unreadCount(username: string) {
  await ensureInboxTables();
  const u = username.trim().toLowerCase();
  const rows = (await sql`
    SELECT COUNT(*)::int AS c FROM user_inbox
    WHERE lower(username) = ${u} AND is_read = FALSE
  `) as Array<{ c: number }>;
  return Number(rows[0]?.c) || 0;
}
