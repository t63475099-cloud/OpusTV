"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  expGain,
  levelFromExp,
  rankFromLevel,
  progressToNext,
  BADGES,
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
        const { pct } = progressToNext(s.exp);
        const hours = s.watchMinutes / 60;
        const badges = BADGES.filter((b) => {
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
          pct,
          badges,
        };
      },
    }),
    { name: "opusfilm-xp" }
  )
);
