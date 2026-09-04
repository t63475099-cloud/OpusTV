import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url);
}

export async function ensureChatTables() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS chat_friendships (
      id SERIAL PRIMARY KEY,
      user_a TEXT NOT NULL,
      user_b TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'accepted',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS chat_friendships_pair_uidx
    ON chat_friendships (user_a, user_b)
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      body TEXT NOT NULL DEFAULT '',
      reply_to TEXT,
      attachments JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      read_at TIMESTAMPTZ
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_from_idx ON chat_messages (from_user)`;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_to_idx ON chat_messages (to_user)`;
  await sql`CREATE INDEX IF NOT EXISTS chat_messages_pair_time_idx ON chat_messages (from_user, to_user, created_at DESC)`;
}

function pairKey(u1: string, u2: string): [string, string] {
  const a = u1.toLowerCase();
  const b = u2.toLowerCase();
  return a < b ? [a, b] : [b, a];
}

/** Chỉ trả public profile — không password / session */
export async function findUserPublicByUid(uid: string) {
  const sql = getSql();
  const q = uid.trim();
  if (!/^\d{6,12}$/.test(q)) return null;
  const rows = await sql`
    SELECT username, uid, bio, verified
    FROM users
    WHERE uid = ${q}
    LIMIT 1
  `;
  const u = (rows as { username: string; uid: string | null; bio: string | null; verified: number }[])[0];
  if (!u) return null;
  return {
    username: u.username,
    uid: u.uid,
    bio: u.bio,
    verified: !!u.verified,
  };
}

export async function getPublicProfile(username: string) {
  const sql = getSql();
  const rows = await sql`
    SELECT username, uid, bio, verified
    FROM users
    WHERE lower(username) = lower(${username})
    LIMIT 1
  `;
  const u = (rows as { username: string; uid: string | null; bio: string | null; verified: number }[])[0];
  if (!u) return null;
  return {
    username: u.username,
    uid: u.uid,
    bio: u.bio,
    verified: !!u.verified,
  };
}

export async function areFriends(me: string, other: string) {
  await ensureChatTables();
  const [a, b] = pairKey(me, other);
  if (a === b) return false;
  const sql = getSql();
  const rows = await sql`
    SELECT 1 FROM chat_friendships
    WHERE user_a = ${a} AND user_b = ${b} AND status = 'accepted'
    LIMIT 1
  `;
  return (rows as unknown[]).length > 0;
}

export async function addFriendship(me: string, other: string) {
  await ensureChatTables();
  const [a, b] = pairKey(me, other);
  if (a === b) throw new Error("Không thể tự kết bạn");
  const sql = getSql();
  await sql`
    INSERT INTO chat_friendships (user_a, user_b, status)
    VALUES (${a}, ${b}, 'accepted')
    ON CONFLICT (user_a, user_b) DO NOTHING
  `;
}

/** Kết bạn chỉ qua UID — mỗi tài khoản độc lập */
export async function addFriendByUid(meUsername: string, targetUid: string) {
  const target = await findUserPublicByUid(targetUid);
  if (!target) throw new Error("Không tìm thấy UID này");
  if (target.username.toLowerCase() === meUsername.toLowerCase()) {
    throw new Error("Không thể tự kết bạn");
  }
  await addFriendship(meUsername, target.username);
  return target;
}

export async function listFriends(me: string) {
  await ensureChatTables();
  const sql = getSql();
  const m = me.toLowerCase();
  const rows = await sql`
    SELECT
      CASE WHEN user_a = ${m} THEN user_b ELSE user_a END AS friend
    FROM chat_friendships
    WHERE (user_a = ${m} OR user_b = ${m}) AND status = 'accepted'
  `;
  const names = (rows as { friend: string }[]).map((r) => r.friend);
  if (names.length === 0) return [];
  const users = await sql`
    SELECT username, uid, bio, verified
    FROM users
    WHERE lower(username) = ANY(${names})
  `;
  return (users as { username: string; uid: string | null; bio: string | null; verified: number }[]).map(
    (u) => ({
      username: u.username,
      uid: u.uid,
      bio: u.bio,
      verified: !!u.verified,
    })
  );
}

export async function listInbox(me: string) {
  await ensureChatTables();
  const sql = getSql();
  const m = me.toLowerCase();
  const rows = await sql`
    SELECT DISTINCT ON (peer)
      peer,
      id,
      from_user,
      to_user,
      body,
      created_at,
      read_at
    FROM (
      SELECT
        CASE WHEN from_user = ${m} THEN to_user ELSE from_user END AS peer,
        id, from_user, to_user, body, created_at, read_at
      FROM chat_messages
      WHERE from_user = ${m} OR to_user = ${m}
    ) t
    ORDER BY peer, created_at DESC
  `;
  return rows as {
    peer: string;
    id: string;
    from_user: string;
    to_user: string;
    body: string;
    created_at: string;
    read_at: string | null;
  }[];
}

export async function getThread(me: string, other: string, limit = 120) {
  await ensureChatTables();
  if (!(await areFriends(me, other))) {
    throw new Error("Chỉ chat được với bạn bè (kết bạn bằng UID)");
  }
  const sql = getSql();
  const m = me.toLowerCase();
  const o = other.toLowerCase();
  const rows = await sql`
    SELECT id, from_user, to_user, body, reply_to, attachments, created_at, read_at
    FROM chat_messages
    WHERE (from_user = ${m} AND to_user = ${o})
       OR (from_user = ${o} AND to_user = ${m})
    ORDER BY created_at ASC
    LIMIT ${limit}
  `;
  return rows as {
    id: string;
    from_user: string;
    to_user: string;
    body: string;
    reply_to: string | null;
    attachments: unknown;
    created_at: string;
    read_at: string | null;
  }[];
}

export async function sendMessage(opts: {
  from: string;
  to: string;
  body: string;
  replyTo?: string | null;
  attachments?: unknown[];
}) {
  await ensureChatTables();
  if (!(await areFriends(opts.from, opts.to))) {
    throw new Error("Chưa kết bạn — gửi UID của bạn để đối phương kết bạn trước");
  }
  const sql = getSql();
  const id = `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  const from = opts.from.toLowerCase();
  const to = opts.to.toLowerCase();
  const att = JSON.stringify(opts.attachments || []);
  await sql`
    INSERT INTO chat_messages (id, from_user, to_user, body, reply_to, attachments)
    VALUES (
      ${id},
      ${from},
      ${to},
      ${opts.body || ""},
      ${opts.replyTo || null},
      ${att}::jsonb
    )
  `;
  return id;
}

export async function markThreadRead(me: string, other: string) {
  await ensureChatTables();
  const sql = getSql();
  const m = me.toLowerCase();
  const o = other.toLowerCase();
  await sql`
    UPDATE chat_messages
    SET read_at = NOW()
    WHERE from_user = ${o} AND to_user = ${m} AND read_at IS NULL
  `;
}

export async function unreadCount(me: string, other: string) {
  const sql = getSql();
  const m = me.toLowerCase();
  const o = other.toLowerCase();
  const rows = await sql`
    SELECT COUNT(*)::int AS n
    FROM chat_messages
    WHERE from_user = ${o} AND to_user = ${m} AND read_at IS NULL
  `;
  return (rows as { n: number }[])[0]?.n || 0;
}
