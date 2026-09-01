/** EXP / Level / Badge system */

export type RankId = "newbie" | "fan" | "elite" | "legend" | "god";

export interface RankDef {
  id: RankId;
  label: string;
  minLevel: number;
  color: string;
}

export const RANKS: RankDef[] = [
  { id: "newbie", label: "Tân thủ", minLevel: 1, color: "#a1a1aa" },
  { id: "fan", label: "Fan cứng", minLevel: 5, color: "#38bdf8" },
  { id: "elite", label: "Tinh anh", minLevel: 12, color: "#a855f7" },
  { id: "legend", label: "Chiến thần", minLevel: 25, color: "#f43f5e" },
  { id: "god", label: "Huyền thoại", minLevel: 40, color: "#fbbf24" },
];

export const BADGES = [
  { id: "vip", label: "VIP", icon: "✦", need: { level: 10 } },
  { id: "moth", label: "Mọt phim", icon: "🎬", need: { watchHours: 10 } },
  { id: "moth100", label: "Mọt 100h", icon: "🏆", need: { watchHours: 100 } },
  { id: "chatty", label: "Thảo luận", icon: "💬", need: { comments: 20 } },
  { id: "melody", label: "Nhạc sĩ", icon: "🎵", need: { musicPlays: 50 } },
] as const;

export function levelFromExp(exp: number): number {
  // ~100 exp per level, soft curve
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, exp) / 50)) + 1);
}

export function expForLevel(level: number): number {
  return Math.pow(Math.max(0, level - 1), 2) * 50;
}

export function rankFromLevel(level: number): RankDef {
  let r = RANKS[0];
  for (const x of RANKS) {
    if (level >= x.minLevel) r = x;
  }
  return r;
}

export function progressToNext(exp: number): {
  level: number;
  pct: number;
  nextAt: number;
  currentAt: number;
  need: number;
} {
  const level = levelFromExp(exp);
  const cur = expForLevel(level);
  const next = expForLevel(level + 1);
  const pct = next > cur ? Math.min(100, ((exp - cur) / (next - cur)) * 100) : 100;
  return {
    level,
    pct,
    nextAt: next,
    currentAt: cur,
    need: Math.max(0, next - exp),
  };
}

/** Hạng kế tiếp theo level */
export function nextRankFromLevel(level: number): RankDef | null {
  const higher = RANKS.filter((r) => r.minLevel > level).sort(
    (a, b) => a.minLevel - b.minLevel
  );
  return higher[0] || null;
}

export type Activity =
  | { type: "watch_min"; minutes: number }
  | { type: "music_play" }
  | { type: "comment" }
  | { type: "like" };

export function expGain(a: Activity): number {
  switch (a.type) {
    case "watch_min":
      return Math.min(30, Math.max(0, a.minutes)) * 2;
    case "music_play":
      return 5;
    case "comment":
      return 8;
    case "like":
      return 1;
    default:
      return 0;
  }
}
