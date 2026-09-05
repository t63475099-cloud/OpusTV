"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useActiveMediaStore } from "@/lib/activeMediaStore";

export interface MiniTrack {
  id: string;
  title: string;
  artist: string;
  thumb?: string;
  currentTime?: number;
}

interface MiniState {
  track: MiniTrack | null;
  playing: boolean;
  expanded: boolean;
  setTrack: (t: MiniTrack | null, autoPlay?: boolean) => void;
  setPlaying: (v: boolean) => void;
  setExpanded: (v: boolean) => void;
  setProgress: (sec: number) => void;
  stop: () => void;
}

/**
 * Persist track + currentTime.
 * Reload: playbox vẫn hiện, playing = false (user bấm play để tiếp tục).
 */
export const useMusicPlayerStore = create<MiniState>()(
  persist(
    (set, get) => ({
      track: null,
      playing: false,
      expanded: false,
      setTrack: (t, autoPlay = true) => {
        set({
          track: t,
          playing: !!t && autoPlay,
          expanded: false,
        });
        if (t) {
          useActiveMediaStore.getState().setMusic({
            id: t.id,
            title: t.title,
            artist: t.artist,
            thumb: t.thumb,
            currentTime: t.currentTime,
          });
        } else {
          useActiveMediaStore.getState().clearMusic();
        }
      },
      setPlaying: (v) => set({ playing: v }),
      setExpanded: (v) => set({ expanded: v }),
      setProgress: (sec) => {
        const t = get().track;
        if (!t) return;
        const next = { ...t, currentTime: Math.max(0, Math.floor(sec)) };
        set({ track: next });
        useActiveMediaStore.getState().setMusic({
          id: next.id,
          title: next.title,
          artist: next.artist,
          thumb: next.thumb,
          currentTime: next.currentTime,
        });
      },
      stop: () => {
        set({ track: null, playing: false, expanded: false });
        useActiveMediaStore.getState().clearMusic();
      },
    }),
    {
      name: "opusfilm-mini-music",
      partialize: (s) => ({ track: s.track }),
      // Sau rehydrate luôn pause — user bấm play
      onRehydrateStorage: () => (state) => {
        if (state) state.playing = false;
      },
    }
  )
);
