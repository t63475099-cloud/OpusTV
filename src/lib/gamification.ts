/** EXP / Level / Badge system — cấp tối đa 999 */

export type RankId =
  | "newbie"
  | "fan"
  | "elite"
  | "legend"
  | "god"
  | "immortal"
  | "apex";

export interface RankDef {
  id: RankId;
  label: string;
  minLevel: number;
  color: string;
}

export const MAX_LEVEL = 999;

export const RANKS: RankDef[] = [
  { id: "newbie", label: "Tân thủ", minLevel: 1, color: "#a1a1aa" },
  { id: "fan", label: "Fan cứng", minLevel: 5, color: "#38bdf8" },
  { id: "elite", label: "Tinh anh", minLevel: 12, color: "#a855f7" },
  { id: "legend", label: "Chiến thần", minLevel: 25, color: "#f43f5e" },
  { id: "god", label: "Huyền thoại", minLevel: 40, color: "#fbbf24" },
  { id: "immortal", label: "Bất diệt", minLevel: 100, color: "#22d3ee" },
  { id: "apex", label: "Đỉnh phong", minLevel: 500, color: "#fb7185" },
];

export const BADGES = [
  { id: "vip", label: "VIP", icon: "✦", need: { level: 10 } },
  { id: "moth", label: "Mọt phim", icon: "🎬", need: { watchHours: 10 } },
  { id: "moth100", label: "Mọt 100h", icon: "🏆", need: { watchHours: 100 } },
  { id: "chatty", label: "Thảo luận", icon: "💬", need: { comments: 20 } },
  { id: "melody", label: "Nhạc sĩ", icon: "🎵", need: { musicPlays: 50 } },
  { id: "lv50", label: "Cấp 50", icon: "⭐", need: { level: 50 } },
  { id: "lv100", label: "Cấp 100", icon: "🌟", need: { level: 100 } },
  { id: "lv500", label: "Cấp 500", icon: "💫", need: { level: 500 } },
  { id: "lv999", label: "Cấp 999", icon: "👑", need: { level: 999 } },
] as const;

export function levelFromExp(exp: number): number {
  const raw = Math.max(1, Math.floor(Math.sqrt(Math.max(0, exp) / 50)) + 1);
  return Math.min(MAX_LEVEL, raw);
}

export function expForLevel(level: number): number {
  const lv = Math.min(MAX_LEVEL, Math.max(1, level));
  return Math.pow(Math.max(0, lv - 1), 2) * 50;
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
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, pct: 100, nextAt: expForLevel(MAX_LEVEL), currentAt: expForLevel(MAX_LEVEL), need: 0 };
  }
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
