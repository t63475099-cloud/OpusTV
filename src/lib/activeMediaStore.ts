"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveFilm {
  slug: string;
  name: string;
  poster: string;
  episode?: string;
  episodeSlug?: string;
  server?: string;
  currentTime: number;
  duration: number;
  /** link phát để playbox phát tại chỗ */
  m3u8?: string;
  embed?: string;
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
  setFilmStream: (m3u8?: string, embed?: string) => void;
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
        set({
          film: {
            ...film,
            currentTime: Math.max(0, currentTime),
            duration: duration && duration > 0 ? duration : film.duration,
          },
        });
      },
      setFilmStream: (m3u8, embed) => {
        const film = get().film;
        if (!film) return;
        set({
          film: {
            ...film,
            m3u8: m3u8 || film.m3u8,
            embed: embed || film.embed,
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
      partialize: (s) => ({ film: s.film, music: s.music }),
    }
  )
);
