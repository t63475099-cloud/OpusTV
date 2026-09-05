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

function sameEpisode(a: ActiveFilm, b: Partial<ActiveFilm>) {
  return (
    a.slug === b.slug &&
    (a.episodeSlug || "") === (b.episodeSlug || "")
  );
}

export const useActiveMediaStore = create<ActiveMediaState>()(
  persist(
    (set, get) => ({
      film: null,
      music: null,
      setFilm: (f) => {
        if (!f) {
          set({ film: null });
          return;
        }
        const prev = get().film;
        // Cùng phim/tập: giữ mốc thời gian lớn hơn — không bao giờ đè về 0
        if (prev && sameEpisode(prev, f)) {
          const currentTime = Math.max(prev.currentTime || 0, f.currentTime || 0);
          const duration = Math.max(prev.duration || 0, f.duration || 0);
          set({
            film: {
              ...prev,
              ...f,
              currentTime,
              duration,
              m3u8: f.m3u8 || prev.m3u8,
              embed: f.embed || prev.embed,
            },
          });
          return;
        }
        set({ film: f });
      },
      updateFilmTime: (currentTime, duration) => {
        const film = get().film;
        if (!film) return;
        // Chỉ cập nhật nếu tiến tới (hoặc lệch seek hợp lệ > 1s)
        const next = Math.max(0, currentTime);
        if (next < film.currentTime - 15) {
          // seek lùi xa mới cho phép
        }
        set({
          film: {
            ...film,
            currentTime: next,
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
      setMusic: (m) => {
        if (!m) {
          set({ music: null });
          return;
        }
        const prev = get().music;
        if (prev && prev.id === m.id) {
          set({
            music: {
              ...prev,
              ...m,
              currentTime: Math.max(prev.currentTime || 0, m.currentTime || 0),
            },
          });
          return;
        }
        set({ music: m });
      },
      clearFilm: () => set({ film: null }),
      clearMusic: () => set({ music: null }),
      clearAll: () => set({ film: null, music: null }),
    }),
    {
      name: "opus-active-media-v2",
      partialize: (s) => ({ film: s.film, music: s.music }),
    }
  )
);
