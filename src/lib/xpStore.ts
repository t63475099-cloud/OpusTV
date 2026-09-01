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

interface XpState {
  exp: number;
  watchMinutes: number;
  musicPlays: number;
  comments: number;
  add: (a: Activity) => void;
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
        const badges = BADGES.filter((b) => {
          const n = b.need as Record<string, number>;
          if (n.level && level < n.level) return false;
          if (n.watchHours && hours < n.watchHours) return false;
          if (n.comments && s.comments < n.comments) return false;
          if (n.musicPlays && s.musicPlays < n.musicPlays) return false;
          return true;
        }).map((b) => ({ id: b.id, label: b.label, icon: b.icon }));
        const ranks = RANKS.map((r) => ({
          id: r.id,
          label: r.label,
          minLevel: r.minLevel,
          color: r.color,
          active: rank.id === r.id,
          reached: level >= r.minLevel,
        }));
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
          ranks,
          badges,
        };
      },
    }),
    { name: "opusfilm-xp" }
  )
);
