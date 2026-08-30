/** Payload đồng bộ giữa các thiết bị */
export interface SyncPayload {
  history: unknown[];
  favorites: unknown[];
  settings?: unknown;
  profile?: unknown;
  musicWatched: unknown[];
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
    // Tên hiển thị / avatar / khung: ưu tiên bản local (thiết bị đang dùng)
    profile: {
      ...((remote.profile as object) || {}),
      ...((local.profile as object) || {}),
    },
    updatedAt: Date.now(),
  };
}
