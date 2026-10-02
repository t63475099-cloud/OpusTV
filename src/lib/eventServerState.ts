/**
 * Server-authoritative event economy (Neon Postgres)
 * OCC via version column — no client-side coins source of truth
 */

import { neon } from "@neondatabase/serverless";
import { randomBytes, randomInt } from "crypto";
import type { UserAccountState, LastSpinResult } from "@/types/account";
import { SPIN_COST_SERVER } from "@/types/account";
import { broadcastAccountUpdate } from "@/lib/session/store";

const SPIN_REWARDS: {
  id: string;
  label: string;
  weight: number;
  coins?: number;
  shopId?: string;
  name?: string;
  kind?: string;
  meta?: string;
}[] = [
  { id: "c20", label: "+20 xu", weight: 28, coins: 20 },
  { id: "c50", label: "+50 xu", weight: 22, coins: 50 },
  { id: "c100", label: "+100 xu", weight: 12, coins: 100 },
  { id: "c200", label: "+200 xu", weight: 5, coins: 200 },
  {
    id: "mys",
    label: "Hộp quà",
    weight: 12,
    shopId: "mystery",
    name: "Hộp quà",
    kind: "mystery",
    meta: "box-std",
  },
  {
    id: "ep",
    label: "Thẻ 1 tập",
    weight: 10,
    shopId: "card_ep",
    name: "Thẻ 1 tập",
    kind: "unlock",
    meta: "card:ep",
  },
  {
    id: "fr",
    label: "Khung Conic",
    weight: 6,
    shopId: "frame_conic",
    name: "Khung Conic",
    kind: "frame",
    meta: "frame:conic",
  },
  {
    id: "bd",
    label: "Huy hiệu",
    weight: 5,
    shopId: "badge_mot",
    name: "Huy hiệu",
    kind: "badge",
    meta: "badge:mot",
  },
];

export const CHECKIN_REWARDS = [10, 15, 20, 30, 40, 55, 100] as const;
export const TOTAL_MISSIONS = 21;

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

/** Ngày theo giờ Việt Nam YYYY-MM-DD */
export function vietnamDayKey(d = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA → YYYY-MM-DD
  return fmt.format(d);
}

export function vietnamYesterdayKey(): string {
  const now = new Date();
  // approximate: format today then subtract 1 calendar day in VN by shifting UTC+7 noon
  const vn = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })
  );
  vn.setDate(vn.getDate() - 1);
  const y = vn.getFullYear();
  const m = String(vn.getMonth() + 1).padStart(2, "0");
  const day = String(vn.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

let ensured = false;

export async function ensureEventStateTable() {
  if (ensured) return;
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS event_user_state (
      user_id INTEGER PRIMARY KEY,
      username TEXT NOT NULL DEFAULT '',
      coins BIGINT NOT NULL DEFAULT 0,
      streak_days INTEGER NOT NULL DEFAULT 0,
      last_check_in TEXT,
      claimed_check_in_day TEXT,
      mission_day TEXT,
      mission_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
      mission_claim_count JSONB NOT NULL DEFAULT '{}'::jsonb,
      completed_tasks INTEGER NOT NULL DEFAULT 0,
      double_exp_until TIMESTAMPTZ,
      vip_until TIMESTAMPTZ,
      last_spin JSONB,
      total_earned BIGINT NOT NULL DEFAULT 0,
      inventory JSONB NOT NULL DEFAULT '[]'::jsonb,
      version BIGINT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  ensured = true;
}

function mapRow(
  row: Record<string, unknown>,
  userId: number
): UserAccountState {
  const claims = (row.mission_claim_count || {}) as Record<string, number>;
  let completed = Number(row.completed_tasks || 0);
  if (!completed) {
    completed = Object.values(claims).reduce((a, b) => a + (Number(b) || 0), 0);
  }
  const inv = Array.isArray(row.inventory) ? row.inventory : [];
  const lastSpin = row.last_spin as LastSpinResult | null;
  return {
    userId: String(userId),
    username: String(row.username || ""),
    coins: Number(row.coins || 0),
    streakDays: Number(row.streak_days || 0),
    completedTasks: completed,
    totalTasks: TOTAL_MISSIONS,
    missionProgress: (row.mission_progress || {}) as Record<string, number>,
    missionClaimCount: claims,
    missionDay: row.mission_day != null ? String(row.mission_day) : null,
    lastCheckIn: row.last_check_in != null ? String(row.last_check_in) : null,
    claimedCheckInDay:
      row.claimed_check_in_day != null ? String(row.claimed_check_in_day) : null,
    doubleExpUntil: row.double_exp_until
      ? String(row.double_exp_until)
      : null,
    vipUntil: row.vip_until ? String(row.vip_until) : null,
    lastSpinResult: lastSpin || null,
    totalEarned: Number(row.total_earned || 0),
    inventory: inv as UserAccountState["inventory"],
    version: Number(row.version || 1),
    updatedAt: row.updated_at
      ? String(row.updated_at)
      : new Date().toISOString(),
  };
}

export async function getOrCreateEventState(
  userId: number,
  username: string
): Promise<UserAccountState> {
  await ensureEventStateTable();
  const sql = db();
  let rows = await sql`
    SELECT * FROM event_user_state WHERE user_id = ${userId} LIMIT 1
  `;
  if (!rows.length) {
    // Seed from account_state coins if exists
    let seedCoins = 0;
    try {
      const acc = await sql`
        SELECT coins FROM account_state WHERE user_id = ${userId} LIMIT 1
      `;
      if (acc.length) seedCoins = Number((acc[0] as { coins: number }).coins || 0);
    } catch {
      /* */
    }
    await sql`
      INSERT INTO event_user_state (user_id, username, coins, version)
      VALUES (${userId}, ${username}, ${seedCoins}, 1)
      ON CONFLICT (user_id) DO NOTHING
    `;
    rows = await sql`SELECT * FROM event_user_state WHERE user_id = ${userId} LIMIT 1`;
  } else {
    if (username && String((rows[0] as { username: string }).username) !== username) {
      await sql`UPDATE event_user_state SET username = ${username} WHERE user_id = ${userId}`;
    }
    // Đồng bộ xu từ account_state nếu cao hơn (admin cấp / multi-device lệch)
    try {
      const acc = await sql`
        SELECT coins FROM account_state WHERE user_id = ${userId} LIMIT 1
      `;
      if (acc.length) {
        const accCoins = Number((acc[0] as { coins: number }).coins || 0);
        const evCoins = Number((rows[0] as { coins: number }).coins || 0);
        if (accCoins > evCoins) {
          await sql`
            UPDATE event_user_state
            SET coins = ${accCoins}, version = version + 1, updated_at = NOW()
            WHERE user_id = ${userId}
          `;
          rows = await sql`SELECT * FROM event_user_state WHERE user_id = ${userId} LIMIT 1`;
        }
      }
    } catch {
      /* */
    }
  }
  return mapRow(rows[0] as Record<string, unknown>, userId);
}

async function bumpAndBroadcast(userId: number, state: UserAccountState) {
  try {
    await broadcastAccountUpdate(userId, "STATE_MUTATED", {
      payload: state as unknown as Record<string, unknown>,
      message: "ACCOUNT_STATE_SYNC",
      bumpVersion: true,
    });
  } catch {
    /* session store optional */
  }
  emitEventSync(userId, state);
}

/** In-process SSE hub for /api/realtime/sync */
type Listener = (state: UserAccountState) => void;
const hub = new Map<number, Set<Listener>>();

export function subscribeEventSync(userId: number, fn: Listener): () => void {
  let set = hub.get(userId);
  if (!set) {
    set = new Set();
    hub.set(userId, set);
  }
  set.add(fn);
  return () => {
    set!.delete(fn);
    if (set!.size === 0) hub.delete(userId);
  };
}

function emitEventSync(userId: number, state: UserAccountState) {
  const set = hub.get(userId);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(state);
    } catch {
      /* */
    }
  }
}

export async function waitEventSync(
  userId: number,
  afterVersion: number,
  timeoutMs = 22000
): Promise<UserAccountState | null> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      unsub();
      resolve(null);
    }, timeoutMs);
    const unsub = subscribeEventSync(userId, (st) => {
      if (done) return;
      if (st.version > afterVersion) {
        done = true;
        clearTimeout(timer);
        unsub();
        resolve(st);
      }
    });
  });
}

function weightedPick(): (typeof SPIN_REWARDS)[0] {
  const totalW = SPIN_REWARDS.reduce((n, r) => n + r.weight, 0);
  let r = randomInt(0, Math.max(1, totalW));
  for (const item of SPIN_REWARDS) {
    r -= item.weight;
    if (r < 0) return item;
  }
  return SPIN_REWARDS[0];
}

export async function serverWheelSpin(
  userId: number,
  username: string,
  expectedVersion?: number
): Promise<{
  ok: boolean;
  error?: string;
  conflict?: boolean;
  state?: UserAccountState;
  label?: string;
  message?: string;
}> {
  await ensureEventStateTable();
  const sql = db();
  await getOrCreateEventState(userId, username);

  const cur = await sql`
    SELECT version, coins, inventory, total_earned FROM event_user_state
    WHERE user_id = ${userId} LIMIT 1
  `;
  if (!cur.length) return { ok: false, error: "Không có state" };
  const row = cur[0] as {
    version: number;
    coins: number;
    inventory: unknown;
    total_earned: number;
  };
  const ver = Number(row.version);
  if (expectedVersion != null && Number(expectedVersion) !== ver) {
    const state = await getOrCreateEventState(userId, username);
    return {
      ok: false,
      conflict: true,
      error: "Xung đột phiên bản — thử lại",
      state,
    };
  }
  const coins = Number(row.coins);
  if (coins < SPIN_COST_SERVER) {
    return { ok: false, error: `Cần ${SPIN_COST_SERVER} xu` };
  }

  const pick = weightedPick();
  let nextCoins = coins - SPIN_COST_SERVER;
  let totalEarned = Number(row.total_earned || 0);
  let inv = Array.isArray(row.inventory)
    ? [...(row.inventory as UserAccountState["inventory"])]
    : [];
  let coinsDelta = -SPIN_COST_SERVER;

  if (pick.coins) {
    nextCoins += pick.coins;
    totalEarned += pick.coins;
    coinsDelta += pick.coins;
  } else if (pick.shopId) {
    inv.unshift({
      id: `inv_${Date.now()}_${randomBytes(3).toString("hex")}`,
      shopId: pick.shopId,
      name: pick.name || pick.label,
      kind: pick.kind || "item",
      meta: pick.meta,
      qty: 1,
      acquiredAt: Date.now(),
    });
    inv = inv.slice(0, 80);
  }

  const lastSpin: LastSpinResult = {
    reward: pick.label,
    rewardId: pick.id,
    coinsDelta,
    timestamp: new Date().toISOString(),
  };

  const updated = await sql`
    UPDATE event_user_state
    SET coins = ${nextCoins},
        total_earned = ${totalEarned},
        inventory = ${JSON.stringify(inv)}::jsonb,
        last_spin = ${JSON.stringify(lastSpin)}::jsonb,
        version = version + 1,
        updated_at = NOW()
    WHERE user_id = ${userId} AND version = ${ver}
    RETURNING *
  `;
  if (!updated.length) {
    const state = await getOrCreateEventState(userId, username);
    return {
      ok: false,
      conflict: true,
      error: "Double-spin blocked — thử lại",
      state,
    };
  }

  const state = mapRow(updated[0] as Record<string, unknown>, userId);
  // mirror coins to account_state for cross-feature consistency
  try {
    await sql`
      INSERT INTO account_state (user_id, state_version, coins, updated_at)
      VALUES (${userId}, ${state.version}, ${state.coins}, NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET coins = ${state.coins},
            state_version = GREATEST(account_state.state_version, ${state.version}),
            updated_at = NOW()
    `;
  } catch {
    /* */
  }
  await bumpAndBroadcast(userId, state);
  return {
    ok: true,
    state,
    label: pick.label,
    message: pick.coins
      ? `Trúng ${pick.label}!`
      : `Trúng ${pick.name || pick.label}!`,
  };
}

export async function serverCheckIn(
  userId: number,
  username: string,
  expectedVersion?: number
): Promise<{
  ok: boolean;
  error?: string;
  conflict?: boolean;
  state?: UserAccountState;
  coins?: number;
  message?: string;
}> {
  await ensureEventStateTable();
  const sql = db();
  await getOrCreateEventState(userId, username);

  const today = vietnamDayKey();
  const yest = vietnamYesterdayKey();

  const cur = await sql`
    SELECT version, coins, streak_days, last_check_in, claimed_check_in_day, total_earned
    FROM event_user_state WHERE user_id = ${userId} LIMIT 1
  `;
  if (!cur.length) return { ok: false, error: "Không có state" };
  const row = cur[0] as {
    version: number;
    coins: number;
    streak_days: number;
    last_check_in: string | null;
    claimed_check_in_day: string | null;
    total_earned: number;
  };
  const ver = Number(row.version);
  if (expectedVersion != null && Number(expectedVersion) !== ver) {
    const state = await getOrCreateEventState(userId, username);
    return { ok: false, conflict: true, error: "Xung đột phiên bản", state };
  }
  if (row.claimed_check_in_day === today) {
    return { ok: false, error: "Hôm nay đã điểm danh" };
  }

  let nextStreak = 1;
  if (row.last_check_in === yest) nextStreak = Number(row.streak_days || 0) + 1;
  if (nextStreak > 7) nextStreak = 1;
  const reward = CHECKIN_REWARDS[nextStreak - 1] ?? 10;
  const nextCoins = Number(row.coins) + reward;
  const totalEarned = Number(row.total_earned || 0) + reward;

  const updated = await sql`
    UPDATE event_user_state
    SET coins = ${nextCoins},
        total_earned = ${totalEarned},
        streak_days = ${nextStreak},
        last_check_in = ${today},
        claimed_check_in_day = ${today},
        version = version + 1,
        updated_at = NOW()
    WHERE user_id = ${userId} AND version = ${ver}
    RETURNING *
  `;
  if (!updated.length) {
    const state = await getOrCreateEventState(userId, username);
    return { ok: false, conflict: true, error: "Race — thử lại", state };
  }
  const state = mapRow(updated[0] as Record<string, unknown>, userId);
  try {
    await sql`
      INSERT INTO account_state (user_id, state_version, coins, updated_at)
      VALUES (${userId}, ${state.version}, ${state.coins}, NOW())
      ON CONFLICT (user_id) DO UPDATE
        SET coins = ${state.coins}, updated_at = NOW()
    `;
  } catch {
    /* */
  }
  await bumpAndBroadcast(userId, state);
  return {
    ok: true,
    state,
    coins: reward,
    message: `+${reward} xu · Ngày ${nextStreak}/7`,
  };
}
