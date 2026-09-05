"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Phiên phát Film — persist để reload vẫn hiện playbox + mốc thời gian */

export interface ActiveFilm {
  slug: string;
  name: string;
  poster: string;
  episode?: string;
  episodeSlug?: string;
  server?: string;
  currentTime: number;
  duration: number;
}

export interface ActiveMusic {
  id: string;
  title: string;
  artist: string;
  thumb?: string;
  currentTime?: number;
}

interface ActiveMediaState {
  film: ActiveFilm | null;
  music: ActiveMusic | null;
  setFilm: (f: ActiveFilm | null) => void;
  updateFilmTime: (currentTime: number, duration?: number) => void;
  setMusic: (m: ActiveMusic | null) => void;
  clearFilm: () => void;
  clearMusic: () => void;
  clearAll: () => void;
}

export const useActiveMediaStore = create<ActiveMediaState>()(
  persist(
    (set, get) => ({
      film: null,
      music: null,
      setFilm: (f) => set({ film: f }),
      updateFilmTime: (currentTime, duration) => {
        const film = get().film;
        if (!film) return;
        // Chỉ ghi khi đang cùng slug (tránh ghi đè khi đã clear)
        set({
          film: {
            ...film,
            currentTime: Math.max(0, currentTime),
            duration:
              duration && duration > 0 ? duration : film.duration,
          },
        });
      },
      setMusic: (m) => set({ music: m }),
      clearFilm: () => set({ film: null }),
      clearMusic: () => set({ music: null }),
      clearAll: () => set({ film: null, music: null }),
    }),
    {
      name: "opus-active-media",
      partialize: (s) => ({
        film: s.film,
        music: s.music,
      }),
    }
  )
);
