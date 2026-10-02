/**
 * Session + Account state store (Postgres/Neon)
 * - stateVersion optimistic concurrency
 * - in-process SSE waiters (same instance) + DB version polling
 */

import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "crypto";
import { hashToken } from "@/lib/password";
import type {
  AccountStateEvent,
  AccountStateEventType,
  DeviceType,
  UserAccountSnapshot,
  UserSessionInfo,
} from "@/lib/session/types";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

let schemaReady = false;

export async function ensureRealtimeSchema() {
  if (schemaReady) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS account_state (
      user_id INTEGER PRIMARY KEY,
      state_version BIGINT NOT NULL DEFAULT 1,
      coins INTEGER NOT NULL DEFAULT 0,
      vip_expires_at TIMESTAMPTZ,
      key_tier TEXT,
      key_expires_at TIMESTAMPTZ,
      payload JSONB DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS account_state_events (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      event_type TEXT NOT NULL,
      source_session_id INTEGER,
      target_session_id INTEGER,
      state_version BIGINT NOT NULL DEFAULT 0,
      payload JSONB DEFAULT '{}'::jsonb,
      message TEXT DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS account_state_events_user_idx ON account_state_events (user_id, id DESC)`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_name TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS user_agent TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS platform TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS device_id TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS ip_address TEXT`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ`;
  await sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'User'`;
  schemaReady = true;
}

function parseDeviceType(ua: string, platform: string): DeviceType {
  const s = `${ua} ${platform}`.toLowerCase();
  if (/ipad|tablet|kindle/.test(s)) return "tablet";
  if (/mobi|iphone|android.*mobile|phone/.test(s)) return "mobile";
  if (/windows|macintosh|linux|cros/.test(s)) return "desktop";
  return "unknown";
}

function parseBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) return "Chrome";
  if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) return "Safari";
  if (/firefox\//i.test(ua)) return "Firefox";
  if (/opr\//i.test(ua)) return "Opera";
  return "Browser";
}

function parseOs(ua: string, platform: string): string {
  const s = `${ua} ${platform}`;
  if (/iPhone|iPad|iOS/i.test(s)) return "iOS";
  if (/Android/i.test(s)) return "Android";
  if (/Windows/i.test(s)) return "Windows";
  if (/Mac OS|Macintosh/i.test(s)) return "macOS";
  if (/Linux/i.test(s)) return "Linux";
  return platform || "Unknown";
}

export function makeDeviceId(seed?: string): string {
  const raw = seed || randomBytes(16).toString("hex");
  return createHash("sha256").update(raw).digest("hex").slice(0, 24);
}

/** In-memory waiters per userId for same-instance fanout */
const waiters = new Map<number, Set<(ev: AccountStateEvent) => void>>();
const versionCache = new Map<number, number>();

export function subscribeUserEvents(
  userId: number,
  fn: (ev: AccountStateEvent) => void
): () => void {
  let set = waiters.get(userId);
  if (!set) {
    set = new Set();
    waiters.set(userId, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) waiters.delete(userId);
  };
}

function emitLocal(ev: AccountStateEvent) {
  versionCache.set(ev.userId, ev.stateVersion);
  const set = waiters.get(ev.userId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(ev);
    } catch {
      /* */
    }
  }
}

export async function broadcastAccountUpdate(
  userId: number,
  type: AccountStateEventType,
  opts?: {
    sourceSessionId?: number | null;
    targetSessionId?: number | null;
    payload?: Record<string, unknown> | Partial<UserAccountSnapshot> | null;
    message?: string;
    bumpVersion?: boolean;
  }
): Promise<AccountStateEvent> {
  await ensureRealtimeSchema();
  const sql = db();
  let version = versionCache.get(userId) || 0;

  if (opts?.bumpVersion !== false && type !== "HEARTBEAT") {
    const rows = await sql`
      INSERT INTO account_state (user_id, state_version, updated_at)
      VALUES (${userId}, 1, NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET state_version = account_state.state_version + 1,
            updated_at = NOW()
      RETURNING state_version
    `;
    version = Number((rows[0] as { state_version: number }).state_version);
  } else {
    const rows = await sql`
      SELECT state_version FROM account_state WHERE user_id = ${userId} LIMIT 1
    `;
    version = rows.length
      ? Number((rows[0] as { state_version: number }).state_version)
      : version || 1;
  }

  const payload = opts?.payload || null;
  const message = opts?.message || "";
  const sourceSessionId = opts?.sourceSessionId ?? null;
  const targetSessionId = opts?.targetSessionId ?? null;

  await sql`
    INSERT INTO account_state_events
      (user_id, event_type, source_session_id, target_session_id, state_version, payload, message)
    VALUES (
      ${userId},
      ${type},
      ${sourceSessionId},
      ${targetSessionId},
      ${version},
      ${JSON.stringify(payload || {})}::jsonb,
      ${message}
    )
  `;

  // trim old events (keep last 200 per user)
  await sql`
    DELETE FROM account_state_events
    WHERE user_id = ${userId}
      AND id NOT IN (
        SELECT id FROM account_state_events
        WHERE user_id = ${userId}
        ORDER BY id DESC
        LIMIT 200
      )
  `;

  const ev: AccountStateEvent = {
    type,
    userId,
    sourceSessionId,
    targetSessionId: targetSessionId ?? undefined,
    stateVersion: version,
    payload,
    message,
    ts: Date.now(),
  };
  emitLocal(ev);
  return ev;
}

export async function getAccountSnapshot(userId: number): Promise<UserAccountSnapshot | null> {
  await ensureRealtimeSchema();
  const sql = db();
  const users = await sql`
    SELECT id, username, uid, verified, role
    FROM users WHERE id = ${userId} LIMIT 1
  `;
  if (!users.length) return null;
  const u = users[0] as {
    id: number;
    username: string;
    uid: string | null;
    verified: number;
    role: string | null;
  };

  let st = await sql`
    SELECT state_version, coins, vip_expires_at, key_tier, key_expires_at, updated_at
    FROM account_state WHERE user_id = ${userId} LIMIT 1
  `;
  if (!st.length) {
    await sql`
      INSERT INTO account_state (user_id, state_version, coins)
      VALUES (${userId}, 1, 0)
      ON CONFLICT (user_id) DO NOTHING
    `;
    st = await sql`
      SELECT state_version, coins, vip_expires_at, key_tier, key_expires_at, updated_at
      FROM account_state WHERE user_id = ${userId} LIMIT 1
    `;
  }
  const s = (st[0] || {}) as {
    state_version?: number;
    coins?: number;
    vip_expires_at?: string | null;
    key_tier?: string | null;
    key_expires_at?: string | null;
    updated_at?: string;
  };

  let banned = false;
  let banReason: string | null = null;
  try {
    const bans = await sql`
      SELECT reason, ban_until, permanent FROM user_bans
      WHERE user_id = ${userId}
      ORDER BY id DESC LIMIT 1
    `;
    if (bans.length) {
      const b = bans[0] as {
        reason: string;
        ban_until: string | null;
        permanent: boolean;
      };
      const until = b.ban_until ? new Date(b.ban_until).getTime() : 0;
      banned = !!b.permanent || !b.ban_until || until > Date.now();
      if (banned) banReason = String(b.reason || "");
    }
  } catch {
    /* */
  }

  return {
    userId: u.id,
    username: u.username,
    uid: u.uid,
    verified: Number(u.verified) === 1,
    role: u.role || "User",
    stateVersion: Number(s.state_version || 1),
    coins: Number(s.coins || 0),
    vipExpiresAt: s.vip_expires_at ? String(s.vip_expires_at) : null,
    keyTierActive: s.key_tier ? String(s.key_tier) : null,
    keyExpiresAt: s.key_expires_at ? String(s.key_expires_at) : null,
    banned,
    banReason,
    updatedAt: s.updated_at ? String(s.updated_at) : new Date().toISOString(),
  };
}

export async function validateSession(
  token: string | null | undefined
): Promise<{
  ok: boolean;
  userId?: number;
  username?: string;
  sessionId?: number;
  deviceId?: string | null;
  reason?: string;
}> {
  if (!token) return { ok: false, reason: "missing_token" };
  await ensureRealtimeSchema();
  const sql = db();
  const tokenHash = hashToken(token);
  const rows = await sql`
    SELECT s.id, s.user_id, s.device_id, s.revoked_at, s.expires_at, u.username
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.session_token_hash = ${tokenHash}
    LIMIT 1
  `;
  if (!rows.length) return { ok: false, reason: "not_found" };
  const r = rows[0] as {
    id: number;
    user_id: number;
    device_id: string | null;
    revoked_at: string | null;
    expires_at: string;
    username: string;
  };
  if (r.revoked_at) return { ok: false, reason: "revoked", sessionId: r.id, userId: r.user_id };
  if (new Date(r.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired", sessionId: r.id, userId: r.user_id };
  }
  // touch last_active
  try {
    await sql`UPDATE sessions SET last_active_at = NOW() WHERE id = ${r.id}`;
  } catch {
    /* */
  }
  return {
    ok: true,
    userId: r.user_id,
    username: r.username,
    sessionId: r.id,
    deviceId: r.device_id,
  };
}

export async function listLiveSessions(
  userId: number,
  currentToken?: string | null
): Promise<UserSessionInfo[]> {
  await ensureRealtimeSchema();
  const sql = db();
  const currentHash = currentToken ? hashToken(currentToken) : "";
  const rows = await sql`
    SELECT id, created_at, expires_at, device_name, user_agent, platform,
           device_id, ip_address, last_active_at, session_token_hash, revoked_at
    FROM sessions
    WHERE user_id = ${userId}
      AND revoked_at IS NULL
      AND expires_at > NOW()
    ORDER BY COALESCE(last_active_at, created_at) DESC
    LIMIT 50
  `;
  const now = Date.now();
  return (rows as Record<string, unknown>[]).map((r) => {
    const ua = String(r.user_agent || "");
    const platform = String(r.platform || "");
    const lastActive = r.last_active_at
      ? new Date(String(r.last_active_at)).getTime()
      : new Date(String(r.created_at)).getTime();
    const online = now - lastActive < 90_000;
    return {
      sessionId: Number(r.id),
      deviceId: String(r.device_id || `sid-${r.id}`),
      deviceType: parseDeviceType(ua, platform),
      deviceName:
        String(r.device_name || "").trim() ||
        platform ||
        parseOs(ua, platform) ||
        `Thiết bị #${r.id}`,
      browser: parseBrowser(ua),
      os: parseOs(ua, platform),
      platform,
      userAgent: ua,
      ipAddress: r.ip_address != null ? String(r.ip_address) : null,
      lastActiveAt: r.last_active_at
        ? String(r.last_active_at)
        : String(r.created_at),
      createdAt: String(r.created_at),
      expiresAt: String(r.expires_at),
      isCurrentDevice: !!currentHash && String(r.session_token_hash) === currentHash,
      online,
    };
  });
}

export async function revokeSessionRemote(
  userId: number,
  sessionId: number,
  sourceSessionId?: number | null
): Promise<{ ok: boolean; error?: string }> {
  await ensureRealtimeSchema();
  const sql = db();
  const rows = await sql`
    UPDATE sessions
    SET revoked_at = NOW(), expires_at = NOW()
    WHERE id = ${sessionId} AND user_id = ${userId} AND revoked_at IS NULL
    RETURNING id
  `;
  if (!rows.length) return { ok: false, error: "Phiên không tồn tại hoặc đã thu hồi" };
  await broadcastAccountUpdate(userId, "SESSION_TERMINATED", {
    sourceSessionId: sourceSessionId ?? null,
    targetSessionId: sessionId,
    message: "Phiên đã bị đăng xuất từ thiết bị khác",
    bumpVersion: true,
  });
  await broadcastAccountUpdate(userId, "DEVICES_CHANGED", {
    sourceSessionId: sourceSessionId ?? null,
    bumpVersion: false,
  });
  return { ok: true };
}

export async function revokeOtherSessionsRemote(
  userId: number,
  currentToken: string
): Promise<{ ok: boolean; revoked: number }> {
  await ensureRealtimeSchema();
  const sql = db();
  const currentHash = hashToken(currentToken);
  const rows = await sql`
    UPDATE sessions
    SET revoked_at = NOW(), expires_at = NOW()
    WHERE user_id = ${userId}
      AND session_token_hash <> ${currentHash}
      AND revoked_at IS NULL
    RETURNING id
  `;
  const ids = (rows as { id: number }[]).map((r) => r.id);
  for (const id of ids) {
    await broadcastAccountUpdate(userId, "SESSION_TERMINATED", {
      sourceSessionId: null,
      targetSessionId: id,
      message: "Đăng xuất tất cả thiết bị khác",
      bumpVersion: false,
    });
  }
  if (ids.length) {
    await broadcastAccountUpdate(userId, "DEVICES_CHANGED", { bumpVersion: true });
  }
  return { ok: true, revoked: ids.length };
}

/**
 * OCC consume — trừ coins / VIP với kiểm tra state_version
 */
export async function consumeAccountResource(
  userId: number,
  kind: "coins" | "vip_hours" | "points",
  amount: number,
  expectedVersion?: number,
  sourceSessionId?: number | null,
  note?: string
): Promise<{
  ok: boolean;
  error?: string;
  conflict?: boolean;
  snapshot?: UserAccountSnapshot;
}> {
  await ensureRealtimeSchema();
  const sql = db();
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Số lượng không hợp lệ" };
  }

  // ensure row
  await sql`
    INSERT INTO account_state (user_id, state_version, coins)
    VALUES (${userId}, 1, 0)
    ON CONFLICT (user_id) DO NOTHING
  `;

  const cur = await sql`
    SELECT state_version, coins, vip_expires_at FROM account_state WHERE user_id = ${userId} LIMIT 1
  `;
  if (!cur.length) return { ok: false, error: "Không có state" };
  const row = cur[0] as {
    state_version: number;
    coins: number;
    vip_expires_at: string | null;
  };
  const ver = Number(row.state_version);

  if (expectedVersion != null && Number(expectedVersion) !== ver) {
    const snap = await getAccountSnapshot(userId);
    return {
      ok: false,
      conflict: true,
      error: "Xung đột phiên bản (thiết bị khác đã cập nhật). Thử lại.",
      snapshot: snap || undefined,
    };
  }

  if (kind === "coins" || kind === "points") {
    if (Number(row.coins) < amount) {
      return { ok: false, error: "Không đủ số dư" };
    }
    const updated = await sql`
      UPDATE account_state
      SET coins = coins - ${amount},
          state_version = state_version + 1,
          updated_at = NOW(),
          payload = COALESCE(payload, '{}'::jsonb) || ${JSON.stringify({ lastConsume: note || kind, at: Date.now() })}::jsonb
      WHERE user_id = ${userId}
        AND state_version = ${ver}
        AND coins >= ${amount}
      RETURNING state_version, coins
    `;
    if (!updated.length) {
      const snap = await getAccountSnapshot(userId);
      return {
        ok: false,
        conflict: true,
        error: "Xung đột hoặc không đủ số dư (double-spend blocked)",
        snapshot: snap || undefined,
      };
    }
  } else if (kind === "vip_hours") {
    const baseMs = row.vip_expires_at
      ? Math.max(Date.now(), new Date(row.vip_expires_at).getTime())
      : Date.now();
    const next = new Date(baseMs + amount * 3600000).toISOString();
    const updated = await sql`
      UPDATE account_state
      SET vip_expires_at = ${next},
          state_version = state_version + 1,
          updated_at = NOW()
      WHERE user_id = ${userId}
        AND state_version = ${ver}
      RETURNING state_version
    `;
    if (!updated.length) {
      const snap = await getAccountSnapshot(userId);
      return {
        ok: false,
        conflict: true,
        error: "Xung đột phiên bản VIP",
        snapshot: snap || undefined,
      };
    }
  }

  const snap = await getAccountSnapshot(userId);
  await broadcastAccountUpdate(userId, "STATE_MUTATED", {
    sourceSessionId: sourceSessionId ?? null,
    payload: snap || undefined,
    message: `consume:${kind}:${amount}`,
    bumpVersion: false, // already bumped in UPDATE
  });
  return { ok: true, snapshot: snap || undefined };
}

export async function waitForUserEvent(
  userId: number,
  afterVersion: number,
  timeoutMs = 25000
): Promise<AccountStateEvent | null> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      unsub();
      resolve(null);
    }, timeoutMs);

    const unsub = subscribeUserEvents(userId, (ev) => {
      if (done) return;
      if (ev.stateVersion > afterVersion || ev.type === "SESSION_TERMINATED" || ev.type === "FORCE_LOGOUT") {
        done = true;
        clearTimeout(timer);
        unsub();
        resolve(ev);
      }
    });

    // Also poll DB in case event came from another instance
    void (async () => {
      try {
        await ensureRealtimeSchema();
        const sql = db();
        const rows = await sql`
          SELECT event_type, source_session_id, target_session_id, state_version, payload, message,
                 EXTRACT(EPOCH FROM created_at) * 1000 AS ts
          FROM account_state_events
          WHERE user_id = ${userId} AND state_version > ${afterVersion}
          ORDER BY id DESC
          LIMIT 1
        `;
        if (done) return;
        if (rows.length) {
          const r = rows[0] as Record<string, unknown>;
          done = true;
          clearTimeout(timer);
          unsub();
          resolve({
            type: String(r.event_type) as AccountStateEventType,
            userId,
            sourceSessionId: r.source_session_id != null ? Number(r.source_session_id) : null,
            targetSessionId: r.target_session_id != null ? Number(r.target_session_id) : null,
            stateVersion: Number(r.state_version),
            payload: (r.payload as Record<string, unknown>) || null,
            message: String(r.message || ""),
            ts: Number(r.ts) || Date.now(),
          });
        }
      } catch {
        /* */
      }
    })();
  });
}

export async function forceLogoutUser(
  userId: number,
  message = "Tài khoản đã bị khóa hoặc mật khẩu đã đổi"
): Promise<void> {
  await ensureRealtimeSchema();
  const sql = db();
  await sql`
    UPDATE sessions
    SET revoked_at = NOW(), expires_at = NOW()
    WHERE user_id = ${userId} AND revoked_at IS NULL
  `;
  await broadcastAccountUpdate(userId, "FORCE_LOGOUT", {
    message,
    bumpVersion: true,
  });
}
