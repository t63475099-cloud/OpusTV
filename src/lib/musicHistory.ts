"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MusicWatched {
  id: string;
  title: string;
  artist: string;
  thumb?: string;
  category?: string;
  watchedAt: number;
}

interface MusicHistState {
  watched: MusicWatched[];
  add: (t: Omit<MusicWatched, "watchedAt">) => void;
  clear: () => void;
  ids: () => Set<string>;
  replaceAll: (items: MusicWatched[]) => void;
}

export const useMusicHistoryStore = create<MusicHistState>()(
  persist(
    (set, get) => ({
      watched: [],
      add: (t) => {
        set((s) => {
          const rest = s.watched.filter((x) => x.id !== t.id);
          return {
            watched: [{ ...t, watchedAt: Date.now() }, ...rest].slice(0, 120),
          };
        });
      },
      clear: () => set({ watched: [] }),
      ids: () => new Set(get().watched.map((w) => w.id)),
      replaceAll: (items) => set({ watched: items.slice(0, 120) }),
    }),
    { name: "opusfilm-music-watched" }
  )
);
