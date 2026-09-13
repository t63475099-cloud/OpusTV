"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  expGain,
  levelFromExp,
  rankFromLevel,
  progressToNext,
  nextRankFromLevel,
  BADGES,
  RANKS,
  type Activity,
} from "@/lib/gamification";
import { useNotifStore } from "@/lib/notifications";
import { useEventStore } from "@/lib/eventCoins";

/** Gói đổi xu → EXP */
export const EXP_COIN_PACKS = [
  { id: "p50", label: "+50 EXP", coins: 100, exp: 50 },
  { id: "p200", label: "+200 EXP", coins: 350, exp: 200 },
  { id: "p500", label: "+500 EXP", coins: 800, exp: 500 },
  { id: "p2000", label: "+2.000 EXP", coins: 2_800, exp: 2_000 },
  { id: "p10000", label: "+10.000 EXP", coins: 12_000, exp: 10_000 },
  { id: "p50000", label: "+50.000 EXP", coins: 55_000, exp: 50_000 },
] as const;

interface XpState {
  exp: number;
  watchMinutes: number;
  musicPlays: number;
  comments: number;
  add: (a: Activity) => void;
  /** Đổi xu Sự kiện lấy EXP cấp bậc */
  buyExpWithCoins: (packId: string) => { ok: boolean; message: string };
  badges: () => string[];
  summary: () => {
    exp: number;
    level: number;
    rankLabel: string;
    rankColor: string;
    pct: number;
    need: number;
    nextAt: number;
    nextRankLabel: string | null;
    nextRankLevel: number | null;
    ranks: { id: string; label: string; minLevel: number; color: string; active: boolean; reached: boolean }[];
    badges: { id: string; label: string; icon: string }[];
  };
}

export const useXpStore = create<XpState>()(
  persist(
    (set, get) => ({
      exp: 0,
      watchMinutes: 0,
      musicPlays: 0,
      comments: 0,
      add: (a) => {
        const gain = expGain(a);
        if (gain <= 0 && a.type !== "watch_min") return;
        const prev = get();
        const prevLevel = levelFromExp(prev.exp);
        const next = {
          exp: prev.exp + gain,
          watchMinutes:
            prev.watchMinutes + (a.type === "watch_min" ? a.minutes : 0),
          musicPlays: prev.musicPlays + (a.type === "music_play" ? 1 : 0),
          comments: prev.comments + (a.type === "comment" ? 1 : 0),
        };
        set(next);
        const newLevel = levelFromExp(next.exp);
        if (newLevel > prevLevel) {
          const rank = rankFromLevel(newLevel);
          try {
            useNotifStore.getState().add({
              kind: "level",
              title: `Lên cấp ${newLevel}!`,
              body: `Bạn đạt danh hiệu ${rank.label}`,
              href: "/tai-khoan",
            });
          } catch {
            /* */
          }
        }
      },
      buyExpWithCoins: (packId) => {
        const pack = EXP_COIN_PACKS.find((p) => p.id === packId);
        if (!pack) return { ok: false, message: "Gói không hợp lệ" };
        const coins = useEventStore.getState().coins || 0;
        if (coins < pack.coins) {
          return {
            ok: false,
            message: `Cần ${pack.coins} xu (có ${coins.toLocaleString("vi-VN")})`,
          };
        }
        useEventStore.setState({
          coins: coins - pack.coins,
          coinsUpdatedAt: Date.now(),
        });
        const prev = get();
        const prevLevel = levelFromExp(prev.exp);
        const nextExp = prev.exp + pack.exp;
        set({ exp: nextExp });
        const newLevel = levelFromExp(nextExp);
        if (newLevel > prevLevel) {
          const rank = rankFromLevel(newLevel);
          try {
            useNotifStore.getState().add({
              kind: "level",
              title: `Lên cấp ${newLevel}!`,
              body: `Bạn đạt danh hiệu ${rank.label}`,
              href: "/tai-khoan",
            });
          } catch {
            /* */
          }
        }
        return {
          ok: true,
          message: `−${pack.coins} xu · +${pack.exp} EXP` + (newLevel > prevLevel ? ` · Lv.${newLevel}` : ""),
        };
      },
      badges: () => {
        const s = get();
        const hours = s.watchMinutes / 60;
        return BADGES.filter((b) => {
          const n = b.need as Record<string, number>;
          if (n.level && levelFromExp(s.exp) < n.level) return false;
          if (n.watchHours && hours < n.watchHours) return false;
          if (n.comments && s.comments < n.comments) return false;
          if (n.musicPlays && s.musicPlays < n.musicPlays) return false;
          return true;
        }).map((b) => b.id);
      },
      summary: () => {
        const s = get();
        const level = levelFromExp(s.exp);
        const rank = rankFromLevel(level);
        const prog = progressToNext(s.exp);
        const nr = nextRankFromLevel(level);
        const hours = s.watchMinutes / 60;
        const badgeList = BADGES.filter((b) => {
          const n = b.need as Record<string, number>;
          if (n.level && level < n.level) return false;
          if (n.watchHours && hours < n.watchHours) return false;
          if (n.comments && s.comments < n.comments) return false;
          if (n.musicPlays && s.musicPlays < n.musicPlays) return false;
          return true;
        }).map((b) => ({ id: b.id, label: b.label, icon: b.icon }));
        return {
          exp: s.exp,
          level,
          rankLabel: rank.label,
          rankColor: rank.color,
          pct: prog.pct,
          need: prog.need,
          nextAt: prog.nextAt,
          nextRankLabel: nr?.label ?? null,
          nextRankLevel: nr?.minLevel ?? null,
          ranks: RANKS.map((r) => ({
            ...r,
            active: rank.id === r.id,
            reached: level >= r.minLevel,
          })),
          badges: badgeList,
        };
      },
    }),
    { name: "opusfilm-xp-v1" }
  )
);
