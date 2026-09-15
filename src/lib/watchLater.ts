"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchLaterItem {
  slug: string;
  name: string;
  poster?: string;
  year?: string;
  addedAt: number;
}

interface WatchLaterState {
  items: WatchLaterItem[];
  add: (item: Omit<WatchLaterItem, "addedAt">) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
}

export const useWatchLaterStore = create<WatchLaterState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const slug = item.slug;
        if (!slug) return;
        set((s) => ({
          items: [
            { ...item, addedAt: Date.now() },
            ...s.items.filter((x) => x.slug !== slug),
          ].slice(0, 100),
        }));
      },
      remove: (slug) =>
        set((s) => ({ items: s.items.filter((x) => x.slug !== slug) })),
      has: (slug) => get().items.some((x) => x.slug === slug),
      clear: () => set({ items: [] }),
    }),
    { name: "opus-watch-later" }
  )
);
