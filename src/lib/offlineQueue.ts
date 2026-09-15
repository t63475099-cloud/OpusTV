"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface OfflineItem {
  id: string;
  slug: string;
  name: string;
  poster?: string;
  episodeName?: string;
  episodeSlug?: string;
  quality: string;
  addedAt: number;
  progress: number; // 0-100 mock
  status: "queued" | "downloading" | "done" | "failed";
}

interface OfflineState {
  items: OfflineItem[];
  add: (item: Omit<OfflineItem, "id" | "addedAt" | "progress" | "status">) => void;
  remove: (id: string) => void;
  tick: () => void;
  clearDone: () => void;
}

export const useOfflineQueue = create<OfflineState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) => {
        const id = `${item.slug}:${item.episodeSlug || "full"}`;
        if (get().items.some((x) => x.id === id)) return;
        set({
          items: [
            {
              ...item,
              id,
              addedAt: Date.now(),
              progress: 0,
              status: "queued",
            },
            ...get().items,
          ].slice(0, 30),
        });
      },
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      tick: () => {
        set({
          items: get().items.map((x) => {
            if (x.status === "done" || x.status === "failed") return x;
            const next = Math.min(100, x.progress + 8 + Math.floor(Math.random() * 12));
            return {
              ...x,
              status: next >= 100 ? "done" : "downloading",
              progress: next,
            };
          }),
        });
      },
      clearDone: () => set({ items: get().items.filter((x) => x.status !== "done") }),
    }),
    { name: "opus-offline-queue-v1" }
  )
);
