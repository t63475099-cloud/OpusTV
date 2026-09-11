/** Payload đồng bộ giữa các thiết bị (cùng tài khoản) */

export interface EventSyncData {
  coins?: number;
  totalEarned?: number;
  vipPoints?: number;
  streakDay?: number;
  lastCheckIn?: string | null;
  claimedCheckInDay?: string | null;
  missionDay?: string | null;
  missionProgress?: Record<string, number>;
  missionClaimCount?: Record<string, number>;
  unlocks?: unknown[];
  episodeSlugsToday?: string[];
  inventory?: unknown[];
  equippedFrame?: string | null;
  equippedBadge?: string | null;
  boostExpiresAt?: number | null;
  vipExpiresAt?: number | null;
  redeemHistory?: unknown[];
  liveFeed?: unknown[];
  updatedAt?: number;
}

export interface OpusPassSyncData {
  season?: number;
  seasonStartedAt?: number;
  xp?: number;
  premium?: boolean;
  claimedFree?: number[];
  claimedPremium?: number[];
  updatedAt?: number;
}

export interface SyncPayload {
  history: unknown[];
  favorites: unknown[];
  settings?: unknown;
  profile?: unknown;
  musicWatched: unknown[];
  /** Sự kiện / VIP / kho đồ / nhiệm vụ */
  events?: EventSyncData | null;
  /** Opus Pass theo mùa */
  opusPass?: OpusPassSyncData | null;
  updatedAt: number;
}

export function mergeByKey<T extends Record<string, unknown>>(
  local: T[],
  remote: T[],
  key: string,
  timeField = "updatedAt"
): T[] {
  const map = new Map<string, T>();
  for (const item of [...(remote || []), ...(local || [])]) {
    if (!item || typeof item !== "object") continue;
    const k = String(item[key] ?? "");
    if (!k) continue;
    const prev = map.get(k);
    const tNew = Number(item[timeField] ?? item["addedAt"] ?? item["watchedAt"] ?? 0);
    const tOld = prev ? Number(prev[timeField] ?? prev["addedAt"] ?? prev["watchedAt"] ?? 0) : -1;
    if (!prev || tNew >= tOld) map.set(k, item);
  }
  return Array.from(map.values()).sort((a, b) => {
    const ta = Number(a[timeField] ?? a["addedAt"] ?? a["watchedAt"] ?? 0);
    const tb = Number(b[timeField] ?? b["addedAt"] ?? b["watchedAt"] ?? 0);
    return tb - ta;
  });
}

function maxNum(a?: number | null, b?: number | null) {
  return Math.max(Number(a) || 0, Number(b) || 0);
}

function mergeNumMap(
  a?: Record<string, number>,
  b?: Record<string, number>
): Record<string, number> {
  const out: Record<string, number> = { ...(a || {}) };
  for (const [k, v] of Object.entries(b || {})) {
    out[k] = Math.max(Number(out[k]) || 0, Number(v) || 0);
  }
  return out;
}

function invKey(item: Record<string, unknown>) {
  return `${item.kind || ""}|${item.meta || ""}|${item.name || ""}|${item.shopId || ""}`;
}

function mergeInventory(local: unknown[], remote: unknown[]): unknown[] {
  const map = new Map<string, Record<string, unknown>>();
  for (const raw of [...(remote || []), ...(local || [])]) {
    if (!raw || typeof raw !== "object") continue;
    const item = raw as Record<string, unknown>;
    const k = invKey(item);
    const prev = map.get(k);
    if (!prev) {
      map.set(k, { ...item });
      continue;
    }
    const qty = Math.max(Number(prev.qty) || 0, Number(item.qty) || 0);
    const acquiredAt = Math.max(Number(prev.acquiredAt) || 0, Number(item.acquiredAt) || 0);
    map.set(k, { ...prev, ...item, qty, acquiredAt });
  }
  return Array.from(map.values()).sort(
    (a, b) => Number(b.acquiredAt || 0) - Number(a.acquiredAt || 0)
  );
}

/** Gộp tiến độ sự kiện giữa 2 thiết bị — ưu tiên tiến độ cao hơn */
export function mergeEvents(
  local?: EventSyncData | null,
  remote?: EventSyncData | null
): EventSyncData | null {
  if (!local && !remote) return null;
  if (!local) return { ...(remote as EventSyncData), updatedAt: Date.now() };
  if (!remote) return { ...local, updatedAt: Date.now() };

  const sameMissionDay =
    local.missionDay && remote.missionDay && local.missionDay === remote.missionDay;

  return {
    coins: maxNum(local.coins, remote.coins),
    totalEarned: maxNum(local.totalEarned, remote.totalEarned),
    vipPoints: maxNum(local.vipPoints, remote.vipPoints),
    streakDay: maxNum(local.streakDay, remote.streakDay),
    lastCheckIn:
      (local.lastCheckIn || "") >= (remote.lastCheckIn || "")
        ? local.lastCheckIn ?? null
        : remote.lastCheckIn ?? null,
    claimedCheckInDay:
      (local.claimedCheckInDay || "") >= (remote.claimedCheckInDay || "")
        ? local.claimedCheckInDay ?? null
        : remote.claimedCheckInDay ?? null,
    missionDay: local.missionDay || remote.missionDay || null,
    missionProgress: sameMissionDay
      ? mergeNumMap(local.missionProgress, remote.missionProgress)
      : (local.missionDay || "") >= (remote.missionDay || "")
        ? { ...(local.missionProgress || {}) }
        : { ...(remote.missionProgress || {}) },
    missionClaimCount: sameMissionDay
      ? mergeNumMap(local.missionClaimCount, remote.missionClaimCount)
      : (local.missionDay || "") >= (remote.missionDay || "")
        ? { ...(local.missionClaimCount || {}) }
        : { ...(remote.missionClaimCount || {}) },
    unlocks: mergeByKey(
      (local.unlocks || []) as Record<string, unknown>[],
      (remote.unlocks || []) as Record<string, unknown>[],
      "key",
      "at"
    ),
    episodeSlugsToday: Array.from(
      new Set([...(local.episodeSlugsToday || []), ...(remote.episodeSlugsToday || [])])
    ).slice(0, 40),
    inventory: mergeInventory(
      (local.inventory || []) as unknown[],
      (remote.inventory || []) as unknown[]
    ),
    equippedFrame: local.equippedFrame || remote.equippedFrame || null,
    equippedBadge: local.equippedBadge || remote.equippedBadge || null,
    boostExpiresAt: Math.max(local.boostExpiresAt || 0, remote.boostExpiresAt || 0) || null,
    vipExpiresAt: Math.max(local.vipExpiresAt || 0, remote.vipExpiresAt || 0) || null,
    redeemHistory: mergeByKey(
      (local.redeemHistory || []) as Record<string, unknown>[],
      (remote.redeemHistory || []) as Record<string, unknown>[],
      "id",
      "createdAt"
    ).slice(0, 50),
    liveFeed: (local.liveFeed?.length ? local.liveFeed : remote.liveFeed || []).slice(0, 40),
    updatedAt: Date.now(),
  };
}

/** Gộp Opus Pass — ưu tiên mùa mới hơn; cùng mùa thì gộp XP/claim */
export function mergeOpusPass(
  local?: OpusPassSyncData | null,
  remote?: OpusPassSyncData | null
): OpusPassSyncData | null {
  if (!local && !remote) return null;
  if (!local) return { ...(remote as OpusPassSyncData), updatedAt: Date.now() };
  if (!remote) return { ...local, updatedAt: Date.now() };

  const ls = Number(local.season) || 1;
  const rs = Number(remote.season) || 1;

  // Mùa khác nhau → lấy mùa cao hơn (mới hơn)
  if (ls !== rs) {
    const newer = ls > rs ? local : remote;
    return { ...newer, updatedAt: Date.now() };
  }

  // Cùng mùa
  const claimedFree = Array.from(
    new Set([...(local.claimedFree || []), ...(remote.claimedFree || [])])
  ).sort((a, b) => a - b);
  const claimedPremium = Array.from(
    new Set([...(local.claimedPremium || []), ...(remote.claimedPremium || [])])
  ).sort((a, b) => a - b);

  return {
    season: ls,
    seasonStartedAt: Math.min(
      Number(local.seasonStartedAt) || Date.now(),
      Number(remote.seasonStartedAt) || Date.now()
    ),
    xp: maxNum(local.xp, remote.xp),
    premium: !!(local.premium || remote.premium),
    claimedFree,
    claimedPremium,
    updatedAt: Date.now(),
  };
}

export function mergePayload(local: SyncPayload, remote: SyncPayload): SyncPayload {
  return {
    history: mergeByKey(
      (local.history || []) as Record<string, unknown>[],
      (remote.history || []) as Record<string, unknown>[],
      "slug",
      "updatedAt"
    ),
    favorites: mergeByKey(
      (local.favorites || []) as Record<string, unknown>[],
      (remote.favorites || []) as Record<string, unknown>[],
      "slug",
      "addedAt"
    ),
    musicWatched: mergeByKey(
      (local.musicWatched || []) as Record<string, unknown>[],
      (remote.musicWatched || []) as Record<string, unknown>[],
      "id",
      "watchedAt"
    ),
    settings: remote.settings ?? local.settings,
    // Tên & UID: ưu tiên remote (tài khoản đã tạo trên server), tránh tên guest máy khác ghi đè
    profile: (() => {
      const r = { ...((remote.profile as object) || {}) } as Record<string, unknown>;
      const l = { ...((local.profile as object) || {}) } as Record<string, unknown>;
      const rName = String(r.name ?? "").trim();
      const lName = String(l.name ?? "").trim();
      const rUid = String(r.uid ?? "").trim();
      const lUid = String(l.uid ?? "").trim();
      return {
        ...l,
        ...r,
        name: rName || lName,
        uid: rUid || lUid || r.uid || l.uid,
      };
    })(),
    events: mergeEvents(local.events, remote.events),
    opusPass: mergeOpusPass(local.opusPass, remote.opusPass),
    updatedAt: Date.now(),
  };
}
