"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEventStore } from "@/lib/eventCoins";

export const PASS_MAX_LEVEL = 150;
export const PREMIUM_PASS_COST = 5000;
/** XP mỗi cấp (cấp n cần n * PASS_XP_PER_LEVEL để lên n+1, tích lũy) */
export const PASS_XP_PER_LEVEL = 120;

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
  /** coins amount / vip hours / meta id */
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

function freeReward(level: number): PassReward {
  if (level % 25 === 0) {
    return { kind: "mystery", label: "Hộp quà", icon: "🎁" };
  }
  if (level % 15 === 0) {
    return { kind: "boost", label: "x2 xu 24h", icon: "⚡" };
  }
  if (level % 10 === 0) {
    return { kind: "coins", label: `+${80 + level * 2} xu`, icon: "🪙", value: 80 + level * 2 };
  }
  if (level % 5 === 0) {
    return { kind: "coins", label: `+${40 + level} xu`, icon: "🪙", value: 40 + level };
  }
  return { kind: "coins", label: `+${15 + Math.floor(level / 2)} xu`, icon: "🪙", value: 15 + Math.floor(level / 2) };
}

function premiumReward(level: number): PassReward {
  if (level === 150) {
    return { kind: "badge", label: "Huyền thoại Pass", icon: "🏆", value: "badge:legend" };
  }
  if (level % 30 === 0) {
    const fr = FRAME_POOL[(level / 30) % FRAME_POOL.length];
    return { kind: "frame", label: "Khung độc quyền", icon: "🌀", value: fr };
  }
  if (level % 20 === 0) {
    const bd = BADGE_POOL[(level / 20) % BADGE_POOL.length];
    return { kind: "badge", label: "Huy hiệu Pass", icon: "🏅", value: bd };
  }
  if (level % 12 === 0) {
    return { kind: "vip_hours", label: "VIP 24h", icon: "👑", value: 24 };
  }
  if (level % 8 === 0) {
    return { kind: "mystery", label: "Hộp vàng", icon: "📦", value: "box-gold" };
  }
  if (level % 4 === 0) {
    return { kind: "boost", label: "x2 xu 24h", icon: "✨", value: 24 };
  }
  const amt = 50 + level * 3;
  return { kind: "coins", label: `+${amt} xu`, icon: "💰", value: amt };
}

/** Sinh 150 mốc — xpToReach là tổng XP cần để đạt cấp đó */
export function buildPassTiers(): PassTier[] {
  const tiers: PassTier[] = [];
  let cum = 0;
  for (let level = 1; level <= PASS_MAX_LEVEL; level++) {
    cum += PASS_XP_PER_LEVEL + Math.floor(level * 2);
    tiers.push({
      level,
      xpToReach: cum,
      free: freeReward(level),
      premium: premiumReward(level),
    });
  }
  return tiers;
}

export const PASS_TIERS = buildPassTiers();

export function levelFromXp(xp: number): number {
  let lv = 0;
  for (const t of PASS_TIERS) {
    if (xp >= t.xpToReach) lv = t.level;
    else break;
  }
  return lv;
}

export function xpProgress(xp: number) {
  const level = levelFromXp(xp);
  const curTier = PASS_TIERS.find((t) => t.level === level);
  const nextTier = PASS_TIERS.find((t) => t.level === level + 1);
  const prevNeed = curTier?.xpToReach ?? 0;
  const nextNeed = nextTier?.xpToReach ?? prevNeed;
  const span = Math.max(1, nextNeed - prevNeed);
  const into = Math.min(span, Math.max(0, xp - prevNeed));
  const pct = level >= PASS_MAX_LEVEL ? 100 : Math.round((into / span) * 100);
  return { level, pct, prevNeed, nextNeed, into, span };
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
  xp: number;
  premium: boolean;
  claimedFree: number[];
  claimedPremium: number[];

  addXp: (amount: number) => void;
  buyPremium: () => { ok: boolean; message: string };
  claimTier: (level: number, track: "free" | "premium") => { ok: boolean; message: string };
  claimAll: () => { ok: boolean; message: string; count: number };
  getLevel: () => number;
}

export const useOpusPassStore = create<OpusPassState>()(
  persist(
    (set, get) => ({
      xp: 0,
      premium: false,
      claimedFree: [],
      claimedPremium: [],

      addXp: (amount) => {
        const a = Math.max(0, Math.floor(amount));
        if (!a) return;
        set((s) => ({ xp: s.xp + a }));
      },

      buyPremium: () => {
        const ev = useEventStore.getState();
        if (get().premium) return { ok: true, message: "Đã mở Premium Pass" };
        if (ev.coins < PREMIUM_PASS_COST) {
          return { ok: false, message: `Cần ${PREMIUM_PASS_COST} xu` };
        }
        useEventStore.setState({ coins: ev.coins - PREMIUM_PASS_COST });
        set({ premium: true });
        return { ok: true, message: "Đã mở khóa Premium Pass!" };
      },

      claimTier: (level, track) => {
        const s = get();
        const tier = PASS_TIERS.find((t) => t.level === level);
        if (!tier) return { ok: false, message: "Mốc không tồn tại" };
        const lv = levelFromXp(s.xp);
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
        const s = get();
        const lv = levelFromXp(s.xp);
        let count = 0;
        for (let level = 1; level <= lv; level++) {
          if (!s.claimedFree.includes(level)) {
            const r = get().claimTier(level, "free");
            if (r.ok) count++;
          }
          if (s.premium && !get().claimedPremium.includes(level)) {
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

      getLevel: () => levelFromXp(get().xp),
    }),
    { name: "opusfilm-opus-pass-v1" }
  )
);
