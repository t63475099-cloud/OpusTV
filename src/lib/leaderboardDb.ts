import { sql } from "@/lib/neonSql";

let ready = false;
let inflight: Promise<void> | null = null;

export function generateUid8(): string {
  let s = "";
  for (let i = 0; i < 8; i++) s += String(Math.floor(Math.random() * 10));
  return s;
}

export async function ensureLeaderboardTables() {
  if (ready) return;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_vip BOOLEAN DEFAULT FALSE`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ`;
      await sql`
        CREATE TABLE IF NOT EXISTS friendships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          requester_username VARCHAR(64) NOT NULL,
          addressee_username VARCHAR(64) NOT NULL,
          status VARCHAR(16) NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT friendships_pair_unique UNIQUE (requester_username, addressee_username)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS idx_friendships_req ON friendships (requester_username)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_friendships_addr ON friendships (addressee_username)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships (status)`;
      // Backfill UID for users missing one (batch, not per-request spam)
      const missing = (await sql`
        SELECT id::text AS id FROM users WHERE uid IS NULL OR uid = '' LIMIT 50
      `) as Array<{ id: string }>;
      for (const row of missing) {
        let uid = generateUid8();
        for (let a = 0; a < 5; a++) {
          const hit = (await sql`SELECT id FROM users WHERE uid = ${uid} LIMIT 1`) as unknown[];
          if (!hit.length) break;
          uid = generateUid8();
        }
        await sql`UPDATE users SET uid = ${uid} WHERE id = ${row.id}::int AND (uid IS NULL OR uid = '')`;
      }
      ready = true;
    } catch (e) {
      inflight = null;
      throw e;
    }
  })();
  return inflight;
}

export type LeaderboardEntry = {
  rank: number;
  username: string;
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  totalKeysBought: number;
  totalAmountSpent: number;
  isVip: boolean;
  createdAt: string | null;
};

/** Aggregate real approved orders — single GROUP BY query */
export async function fetchLeaderboard(limit = 50): Promise<LeaderboardEntry[]> {
  await ensureLeaderboardTables();
  const lim = Math.min(100, Math.max(1, limit));
  const rows = (await sql`
    SELECT
      lower(o.username) AS username,
      COUNT(*)::int AS keys_bought,
      COALESCE(SUM(o.amount_vnd), 0)::bigint AS amount_spent,
      MAX(u.uid) AS uid,
      MAX(u.created_at)::text AS created_at,
      BOOL_OR(COALESCE(u.is_lifetime_vip, FALSE)) AS is_life,
      MAX(u.vip_expires_at)::text AS vip_exp,
      MAX(u.id) AS user_id
    FROM key_purchase_orders o
    LEFT JOIN users u ON lower(u.username) = lower(o.username)
    WHERE o.status = 'APPROVED'
      AND o.username IS NOT NULL
      AND o.username <> ''
    GROUP BY lower(o.username)
    ORDER BY amount_spent DESC, keys_bought DESC
    LIMIT ${lim}
  `) as Array<Record<string, unknown>>;

  // Lấy avatar / tên hiển thị từ settings (payload.profile)
  const profileMap = new Map<string, { name?: string; avatar?: string }>();
  try {
    const usernames = rows.map((r) => String(r.username || "")).filter(Boolean);
    if (usernames.length) {
      const profiles = (await sql`
        SELECT lower(u.username) AS username, s.payload
        FROM users u
        LEFT JOIN settings s ON s.user_id = u.id
        WHERE lower(u.username) = ANY(${usernames})
      `) as Array<Record<string, unknown>>;
      for (const p of profiles) {
        const payload = p.payload as Record<string, unknown> | null;
        const profile = (payload?.profile as Record<string, unknown>) || {};
        profileMap.set(String(p.username), {
          name: typeof profile.name === "string" ? profile.name : undefined,
          avatar: typeof profile.avatar === "string" ? profile.avatar : undefined,
        });
      }
    }
  } catch { /* settings optional */ }

  return rows.map((r, i) => {
    const vipExp = r.vip_exp ? Date.parse(String(r.vip_exp)) : NaN;
    const isVip =
      !!r.is_life || (Number.isFinite(vipExp) && vipExp > Date.now());
    const uname = String(r.username || "");
    const prof = profileMap.get(uname);
    return {
      rank: i + 1,
      username: uname,
      uid: r.uid ? String(r.uid) : "—",
      displayName: (prof?.name && prof.name.trim()) || uname,
      avatarUrl: prof?.avatar || null,
      totalKeysBought: Number(r.keys_bought) || 0,
      totalAmountSpent: Number(r.amount_spent) || 0,
      isVip,
      createdAt: r.created_at ? String(r.created_at) : null,
    };
  });
}

export type FriendStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends"
  | "self";

export async function getFriendStatus(
  me: string,
  other: string
): Promise<FriendStatus> {
  const a = me.trim().toLowerCase();
  const b = other.trim().toLowerCase();
  if (!a || !b) return "none";
  if (a === b) return "self";
  await ensureLeaderboardTables();
  const rows = (await sql`
    SELECT requester_username, addressee_username, status
    FROM friendships
    WHERE (
      (lower(requester_username) = ${a} AND lower(addressee_username) = ${b})
      OR (lower(requester_username) = ${b} AND lower(addressee_username) = ${a})
    )
    LIMIT 1
  `) as Array<Record<string, unknown>>;
  if (!rows[0]) return "none";
  const st = String(rows[0].status || "");
  if (st === "accepted") return "friends";
  if (st === "pending") {
    const req = String(rows[0].requester_username || "").toLowerCase();
    return req === a ? "pending_sent" : "pending_received";
  }
  return "none";
}
