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
  /** id grant admin đã áp dụng — tránh áp lại */
  appliedGrantId: number | null;
  checkIn: () => { lit: boolean; current: number; best: number; already: boolean };
  status: () => {
    current: number;
    best: number;
    litToday: boolean;
    lastActive: string | null;
  };
  /** Admin cấp lại chuỗi (số ngày 1–vô hạn) */
  applyGrant: (days: number, grantId?: number) => void;
}

export const useStreakStore = create<StreakState>()(
  persist(
    (set, get) => ({
      current: 0,
      best: 0,
      lastActive: null,
      appliedGrantId: null,
      checkIn: () => {
        const today = todayKey();
        const s = get();
        if (s.lastActive === today) {
          return { lit: true, current: s.current, best: s.best, already: true };
        }
        let next = 1;
        if (s.lastActive === yesterdayKey()) next = s.current + 1;
        const best = Math.max(s.best, next);
        set({ current: next, best, lastActive: today });
        return { lit: true, current: next, best, already: false };
      },
      status: () => {
        const s = get();
        const today = todayKey();
        const yest = yesterdayKey();
        let current = s.current;
        if (s.lastActive !== today && s.lastActive !== yest && s.lastActive) {
          current = 0;
        }
        return {
          current: s.lastActive === today || s.lastActive === yest ? current : 0,
          best: s.best,
          litToday: s.lastActive === today,
          lastActive: s.lastActive,
        };
      },
      applyGrant: (days: number, grantId?: number) => {
        const d = Math.max(1, Math.floor(Number(days) || 0));
        if (!Number.isFinite(d) || d < 1) return;
        const s = get();
        if (grantId != null && s.appliedGrantId === grantId) return;
        const today = todayKey();
        set({
          current: d,
          best: Math.max(s.best, d),
          lastActive: today,
          appliedGrantId: grantId ?? s.appliedGrantId,
        });
      },
    }),
    { name: "opusfilm-watch-streak" }
  )
);

/** Gọi khi người dùng đang xem phim */
export function recordDailyStreak() {
  try {
    return useStreakStore.getState().checkIn();
  } catch {
    return { lit: false, current: 0, best: 0, already: false };
  }
}
