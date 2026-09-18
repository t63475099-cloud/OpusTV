"use client";

import { create } from "zustand";

interface MusicSleepState {
  endsAt: number | null;
  minutes: number | null;
  setMinutes: (m: number | null) => void;
  tick: () => boolean; // true if should stop
  clear: () => void;
}

export const useMusicSleepStore = create<MusicSleepState>((set, get) => ({
  endsAt: null,
  minutes: null,
  setMinutes: (m) => {
    if (m == null || m <= 0) {
      set({ endsAt: null, minutes: null });
      return;
    }
    set({ minutes: m, endsAt: Date.now() + m * 60_000 });
  },
  tick: () => {
    const { endsAt } = get();
    if (!endsAt) return false;
    if (Date.now() >= endsAt) {
      set({ endsAt: null, minutes: null });
      return true;
    }
    return false;
  },
  clear: () => set({ endsAt: null, minutes: null }),
}));
