"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WatchHistory } from "./types";

interface HistoryState {
  history: WatchHistory[];
  addOrUpdate: (item: WatchHistory) => void;
  remove: (slug: string) => void;
  clear: () => void;
  getBySlug: (slug: string) => WatchHistory | undefined;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      addOrUpdate: (item) => {
        set((state) => {
          const filtered = state.history.filter((h) => h.slug !== item.slug);
          return {
            history: [{ ...item, updatedAt: Date.now() }, ...filtered].slice(0, 80),
          };
        });
      },
      remove: (slug) => {
        set((state) => ({
          history: state.history.filter((h) => h.slug !== slug),
        }));
      },
      clear: () => set({ history: [] }),
      getBySlug: (slug) => get().history.find((h) => h.slug === slug),
    }),
    { name: "opustv-watch-history" }
  )
);
