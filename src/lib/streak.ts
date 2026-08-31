"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
}

interface StreakState {
  current: number;
  best: number;
  lastActive: string | null;
  checkIn: () => { lit: boolean; current: number; best: number; already: boolean };
  status: () => {
    current: number;
    best: number;
    litToday: boolean;
    lastActive: string | null;
  };
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      current: 0,
      best: 0,
      lastActive: null,
      checkIn: () => {
        const today = todayKey();
        const s = get();
        if (s.lastActive === today) {
          return { lit: false, current: s.current, best: s.best, already: true };
        }
        const yest = yesterdayKey();
        let next = 1;
        if (s.lastActive === yest) {
          next = s.current + 1;
        }
        const best = Math.max(s.best, next);
        set({ current: next, best, lastActive: today });
        return { lit: true, current: next, best, already: false };
      },
      status: () => {
        const s = get();
        const today = todayKey();
        let current = s.current;
        if (s.lastActive && s.lastActive !== today && s.lastActive !== yesterdayKey()) {
          current = 0;
        }
        return {
          current,
          best: s.best,
          litToday: s.lastActive === today,
          lastActive: s.lastActive,
        };
      },
    }),
    { name: "opusfilm-watch-streak" }
  )
);

/** Gọi từ history / player khi user xem phim — tương thích history.ts */
export function recordDailyStreak(): {
  lit: boolean;
  current: number;
  best: number;
  already: boolean;
} {
  try {
    return useStreakStore.getState().checkIn();
  } catch {
    return { lit: false, current: 0, best: 0, already: false };
  }
}
