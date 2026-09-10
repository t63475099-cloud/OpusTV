"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEventStore } from "@/lib/eventCoins";

export const PASS_MAX_LEVEL = 150;
export const PREMIUM_PASS_COST = 5000;
export const PASS_XP_PER_LEVEL = 120;
/** Mỗi mùa 45 ngày */
export const SEASON_DAYS = 45;
export const SEASON_MS = SEASON_DAYS * 24 * 60 * 60 * 1000;

/** Gói mua Pass XP bằng xu (cũng có trong Cửa hàng) */
export const PASS_XP_PACKS: { id: string; xp: number; cost: number; name: string }[] = [
  { id: "pass_xp_200", xp: 200, cost: 150, name: "Gói 200 Pass XP" },
  { id: "pass_xp_600", xp: 600, cost: 400, name: "Gói 600 Pass XP" },
  { id: "pass_xp_1500", xp: 1500, cost: 900, name: "Gói 1500 Pass XP" },
  { id: "pass_xp_5000", xp: 5000, cost: 2800, name: "Gói 5000 Pass XP" },
];

export type PassRewardKind =
  | "coins"
  | "vip_hours"
  | "frame"
  | "badge"
  | "mystery"
  | "boost"
  | "none";

export interface PassReward {
  kind: PassRewardKind;
  label: string;
  icon: string;
  value?: number | string;
}

export interface PassTier {
  level: number;
  xpToReach: number;
  free: PassReward;
  premium: PassReward;
}

const FRAME_POOL = [
  "frame:conic-rainbow",
  "frame:neon-flicker",
  "frame:galaxy-nebula",
  "frame:flame-ring",
  "frame:mystic-frost",
  "frame:spirit-orb",
  "frame:celestial-halo",
  "frame:emp-pulse",
  "frame:solar-eclipse",
  "frame:lunar-eclipse",
  "frame:mythic-lightning",
  "frame:emerald-forest",
];

const BADGE_POOL = [
  "badge:mot-phim",
  "badge:dai-gia",
  "badge:chuoi-lua",
  "badge:legend",
  "badge:vip",
  "badge:star",
  "badge:code",
  "badge:collector",
  "badge:season",
  "badge:pioneer",
];

function seasonShift(season: number, i: number, mod: number) {
  return (i + season * 7) % mod;
}

function freeReward(level: number, season: number): PassReward {
  const s = Math.max(1, season);
  if (level % 25 === 0) {
    return { kind: "mystery", label: `Hộp S${s}`, icon: "🎁", value: "box" };
  }
  if (level % 15 === 0) {
    return { kind: "boost", label: "x2 xu 24h", icon: "⚡" };
  }
  if (level % 10 === 0) {
    const v = 80 + level * 2 + s * 5;
    return { kind: "coins", label: `+${v} xu`, icon: "🪙", value: v };
  }
  if (level % 5 === 0) {
    const v = 40 + level + s * 2;
    return { kind: "coins", label: `+${v} xu`, icon: "🪙", value: v };
  }
  const v = 15 + Math.floor(level / 2) + s;
  return { kind: "coins", label: `+${v} xu`, icon: "🪙", value: v };
}

function premiumReward(level: number, season: number): PassReward {
  const s = Math.max(1, season);
  if (level === 150) {
    return {
      kind: "badge",
      label: `Huyền thoại S${s}`,
      icon: "🏆",
      value: BADGE_POOL[seasonShift(s, 0, BADGE_POOL.length)],
    };
  }
  if (level % 30 === 0) {
    const fr = FRAME_POOL[seasonShift(s, level / 30, FRAME_POOL.length)];
    return { kind: "frame", label: `Khung S${s}`, icon: "🌀", value: fr };
  }
  if (level % 20 === 0) {
    const bd = BADGE_POOL[seasonShift(s, level / 20, BADGE_POOL.length)];
    return { kind: "badge", label: `Huy hiệu S${s}`, icon: "🏅", value: bd };
  }
  if (level % 12 === 0) {
    return { kind: "vip_hours", label: "VIP 24h", icon: "👑", value: 24 };
  }
  if (level % 8 === 0) {
    return { kind: "mystery", label: "Hộp vàng", icon: "📦", value: "box-gold" };
  }
  if (level % 4 === 0) {
    return { kind: "boost", label: "x2 xu 24h", icon: "✨" };
  }
  const amt = 50 + level * 3 + s * 8;
  return { kind: "coins", label: `+${amt} xu`, icon: "💰", value: amt };
}

export function buildPassTiers(season: number): PassTier[] {
  const tiers: PassTier[] = [];
  let cum = 0;
  for (let level = 1; level <= PASS_MAX_LEVEL; level++) {
    cum += PASS_XP_PER_LEVEL + Math.floor(level * 2);
    tiers.push({
      level,
      xpToReach: cum,
      free: freeReward(level, season),
      premium: premiumReward(level, season),
    });
  }
  return tiers;
}

export function levelFromXp(xp: number, tiers?: PassTier[]): number {
  const list = tiers && tiers.length ? tiers : buildPassTiers(1);
  let lv = 0;
  for (const t of list) {
    if (xp >= t.xpToReach) lv = t.level;
    else break;
  }
  return lv;
}

export function xpProgress(xp: number, tiers: PassTier[]) {
  const level = levelFromXp(xp, tiers);
  const curTier = tiers.find((t) => t.level === level);
  const nextTier = tiers.find((t) => t.level === level + 1);
  const prevNeed = curTier?.xpToReach ?? 0;
  const nextNeed = nextTier?.xpToReach ?? prevNeed;
  const span = Math.max(1, nextNeed - prevNeed);
  const into = Math.min(span, Math.max(0, xp - prevNeed));
  const pct = level >= PASS_MAX_LEVEL ? 100 : Math.round((into / span) * 100);
  return { level, pct, prevNeed, nextNeed, into, span };
}

export function formatSeasonDate(ts: number) {
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function formatRemain(ms: number) {
  if (ms <= 0) return "0 ngày";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  if (days > 0) return `${days} ngày ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}p`;
  return `${mins} phút`;
}

function grantReward(reward: PassReward) {
  const ev = useEventStore.getState();
  if (reward.kind === "coins") {
    const amt = Number(reward.value) || 0;
    useEventStore.setState({
      coins: ev.coins + amt,
      totalEarned: ev.totalEarned + amt,
    });
    return;
  }
  if (reward.kind === "vip_hours") {
    const hours = Number(reward.value) || 24;
    const base = Math.max(Date.now(), ev.vipExpiresAt || 0);
    useEventStore.setState({ vipExpiresAt: base + hours * 3600000 });
    return;
  }
  if (reward.kind === "boost") {
    const base = Math.max(Date.now(), ev.boostExpiresAt || 0);
    useEventStore.setState({ boostExpiresAt: base + 86400000 });
    return;
  }
  if (reward.kind === "frame" || reward.kind === "badge" || reward.kind === "mystery") {
    const inv = [...(ev.inventory || [])];
    const kind = reward.kind === "mystery" ? "mystery" : reward.kind;
    const meta =
      reward.kind === "mystery"
        ? String(reward.value || "box")
        : String(reward.value || "");
    const name = reward.label;
    const existing = inv.find((i) => i.kind === kind && i.meta === meta && i.name === name);
    if (existing) existing.qty += 1;
    else {
      inv.unshift({
        id: `inv_pass_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        shopId: `pass_${kind}`,
        name,
        kind: kind as "frame" | "badge" | "mystery",
        meta,
        qty: 1,
        acquiredAt: Date.now(),
      });
    }
    useEventStore.setState({ inventory: inv });
  }
}

interface OpusPassState {
  season: number;
  seasonStartedAt: number;
  xp: number;
  premium: boolean;
  claimedFree: number[];
  claimedPremium: number[];

  ensureSeason: () => void;
  getSeasonEndAt: () => number;
  getTiers: () => PassTier[];
  addXp: (amount: number) => void;
  buyXpPack: (packId: string) => { ok: boolean; message: string };
  buyPremium: () => { ok: boolean; message: string };
  claimTier: (level: number, track: "free" | "premium") => { ok: boolean; message: string };
  claimAll: () => { ok: boolean; message: string; count: number };
  getLevel: () => number;
}

function defaultStart() {
  return Date.now();
}

export const useOpusPassStore = create<OpusPassState>()(
  persist(
    (set, get) => ({
      season: 1,
      seasonStartedAt: defaultStart(),
      xp: 0,
      premium: false,
      claimedFree: [],
      claimedPremium: [],

      ensureSeason: () => {
        const s = get();
        let started = s.seasonStartedAt || Date.now();
        let season = s.season || 1;
        let changed = false;
        // Cuộn mùa nếu đã qua nhiều chu kỳ 45 ngày
        while (Date.now() >= started + SEASON_MS) {
          started = started + SEASON_MS;
          season += 1;
          changed = true;
        }
        if (changed) {
          set({
            season,
            seasonStartedAt: started,
            xp: 0,
            premium: false,
            claimedFree: [],
            claimedPremium: [],
          });
        } else if (!s.seasonStartedAt) {
          set({ seasonStartedAt: started, season });
        }
      },

      getSeasonEndAt: () => {
        get().ensureSeason();
        const started = get().seasonStartedAt || Date.now();
        return started + SEASON_MS;
      },

      getTiers: () => {
        get().ensureSeason();
        return buildPassTiers(get().season || 1);
      },

      addXp: (amount) => {
        get().ensureSeason();
        const a = Math.max(0, Math.floor(amount));
        if (!a) return;
        set((s) => ({ xp: s.xp + a }));
      },

      buyXpPack: (packId) => {
        get().ensureSeason();
        const pack = PASS_XP_PACKS.find((p) => p.id === packId);
        if (!pack) return { ok: false, message: "Gói không tồn tại" };
        const ev = useEventStore.getState();
        if (ev.coins < pack.cost) return { ok: false, message: `Cần ${pack.cost} xu` };
        useEventStore.setState({ coins: ev.coins - pack.cost });
        set((s) => ({ xp: s.xp + pack.xp }));
        return { ok: true, message: `+${pack.xp} Pass XP` };
      },

      buyPremium: () => {
        get().ensureSeason();
        const ev = useEventStore.getState();
        if (get().premium) return { ok: true, message: "Đã mở Premium Pass mùa này" };
        if (ev.coins < PREMIUM_PASS_COST) {
          return { ok: false, message: `Cần ${PREMIUM_PASS_COST} xu` };
        }
        useEventStore.setState({ coins: ev.coins - PREMIUM_PASS_COST });
        set({ premium: true });
        return { ok: true, message: "Đã mở khóa Premium Pass!" };
      },

      claimTier: (level, track) => {
        get().ensureSeason();
        const s = get();
        const tiers = buildPassTiers(s.season);
        const tier = tiers.find((t) => t.level === level);
        if (!tier) return { ok: false, message: "Mốc không tồn tại" };
        const lv = levelFromXp(s.xp, tiers);
        if (lv < level) return { ok: false, message: "Chưa đạt cấp này" };
        if (track === "free") {
          if (s.claimedFree.includes(level)) return { ok: false, message: "Đã nhận" };
          grantReward(tier.free);
          set({ claimedFree: [...s.claimedFree, level] });
          return { ok: true, message: `Nhận Free C${level}: ${tier.free.label}` };
        }
        if (!s.premium) return { ok: false, message: "Cần Premium Pass" };
        if (s.claimedPremium.includes(level)) return { ok: false, message: "Đã nhận" };
        grantReward(tier.premium);
        set({ claimedPremium: [...s.claimedPremium, level] });
        return { ok: true, message: `Nhận Premium C${level}: ${tier.premium.label}` };
      },

      claimAll: () => {
        get().ensureSeason();
        const s = get();
        const tiers = buildPassTiers(s.season);
        const lv = levelFromXp(s.xp, tiers);
        let count = 0;
        for (let level = 1; level <= lv; level++) {
          if (!get().claimedFree.includes(level)) {
            const r = get().claimTier(level, "free");
            if (r.ok) count++;
          }
          if (get().premium && !get().claimedPremium.includes(level)) {
            const r = get().claimTier(level, "premium");
            if (r.ok) count++;
          }
        }
        return {
          ok: count > 0,
          count,
          message: count > 0 ? `Đã nhận ${count} phần thưởng` : "Không có phần thưởng mới",
        };
      },

      getLevel: () => {
        get().ensureSeason();
        return levelFromXp(get().xp, buildPassTiers(get().season));
      },
    }),
    { name: "opusfilm-opus-pass-v2" }
  )
);


if (typeof window !== "undefined") {
  window.addEventListener("opus-pass-add-xp", ((e: Event) => {
    const xp = Number((e as CustomEvent).detail?.xp) || 0;
    if (xp > 0) useOpusPassStore.getState().addXp(xp);
  }) as EventListener);
}
