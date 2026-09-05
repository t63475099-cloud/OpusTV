import { neon } from "@neondatabase/serverless";

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  return neon(url);
}

export async function ensureChatTables() {
  const sql = getSql();
  // Cột hồ sơ public — tránh lỗi "column uid does not exist"
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified INTEGER NOT NULL DEFAULT 0`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_uid_uidx ON users (uid)`;
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
  await sql`
    CREATE TABLE IF NOT EXISTS chat_presence (
      username TEXT PRIMARY KEY,
      last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS chat_typing (
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (from_user, to_user)
    )
  `;
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
  // Lấy avatar / tên hiển thị từ settings (đồng bộ OpusFilm)
  const sql = getSql();
  let avatar: string | undefined;
  let displayName: string | undefined;
  try {
    const rows = await sql`
      SELECT s.payload
      FROM users u
      LEFT JOIN settings s ON s.user_id = u.id
      WHERE lower(u.username) = lower(${target.username})
      LIMIT 1
    `;
    const payload = (rows as { payload: unknown }[])[0]?.payload as Record<string, unknown> | undefined;
    const profile = (payload?.profile as Record<string, unknown>) || {};
    if (typeof profile.avatar === "string" && profile.avatar) avatar = profile.avatar;
    if (typeof profile.name === "string" && profile.name.trim()) displayName = profile.name.trim();
  } catch {}
  return { ...target, avatar, displayName };
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
    SELECT u.id, u.username, u.uid, u.bio, u.verified
    FROM users u
    WHERE lower(u.username) = ANY(${names})
  `;
  const out: {
    username: string;
    uid: string | null;
    bio: string | null;
    verified: boolean;
    avatar?: string;
    displayName?: string;
  }[] = [];
  for (const u of users as {
    id: number;
    username: string;
    uid: string | null;
    bio: string | null;
    verified: number;
  }[]) {
    let avatar: string | undefined;
    let displayName: string | undefined;
    try {
      const st = await sql`
        SELECT payload FROM settings WHERE user_id = ${u.id} LIMIT 1
      `;
      const payload = (st as { payload: unknown }[])[0]?.payload as Record<string, unknown> | undefined;
      const profile = (payload?.profile as Record<string, unknown>) || payload || {};
      if (typeof profile.avatar === "string" && profile.avatar) avatar = profile.avatar;
      if (typeof profile.name === "string" && profile.name.trim()) displayName = profile.name.trim();
    } catch {
      /* settings table may differ */
    }
    out.push({
      username: u.username,
      uid: u.uid,
      bio: u.bio,
      verified: !!u.verified,
      avatar,
      displayName,
    });
  }
  return out;
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


/** Heartbeat — cập nhật đang online */
export async function touchPresence(username: string) {
  await ensureChatTables();
  const sql = getSql();
  const u = username.toLowerCase();
  await sql`
    INSERT INTO chat_presence (username, last_seen)
    VALUES (${u}, NOW())
    ON CONFLICT (username) DO UPDATE SET last_seen = NOW()
  `;
}

export async function getPresenceMap(usernames: string[]) {
  await ensureChatTables();
  if (!usernames.length) return {} as Record<string, number>;
  const sql = getSql();
  const names = usernames.map((x) => x.toLowerCase());
  const rows = await sql`
    SELECT username, last_seen
    FROM chat_presence
    WHERE username = ANY(${names})
  `;
  const out: Record<string, number> = {};
  for (const r of rows as { username: string; last_seen: string }[]) {
    out[r.username] = new Date(r.last_seen).getTime();
  }
  return out;
}

/** Báo đang soạn tin (TTL ~5s phía client) */
export async function setTyping(from: string, to: string) {
  await ensureChatTables();
  const sql = getSql();
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  if (f === t) return;
  await sql`
    INSERT INTO chat_typing (from_user, to_user, updated_at)
    VALUES (${f}, ${t}, NOW())
    ON CONFLICT (from_user, to_user) DO UPDATE SET updated_at = NOW()
  `;
}

export async function getTypingFrom(peer: string, me: string) {
  await ensureChatTables();
  const sql = getSql();
  const p = peer.toLowerCase();
  const m = me.toLowerCase();
  const rows = await sql`
    SELECT updated_at FROM chat_typing
    WHERE from_user = ${p} AND to_user = ${m}
    LIMIT 1
  `;
  const at = (rows as { updated_at: string }[])[0]?.updated_at;
  if (!at) return false;
  return Date.now() - new Date(at).getTime() < 6000;
}
