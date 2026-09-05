"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface MiniTrack {
  id: string;
  title: string;
  artist: string;
  thumb?: string;
  /** giây đang nghe (ước lượng) */
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

export const useMusicPlayerStore = create<MiniState>()(
  persist(
    (set, get) => ({
      track: null,
      playing: false,
      expanded: false,
      setTrack: (t, autoPlay = true) =>
        set({
          track: t,
          playing: !!t && autoPlay,
          expanded: false,
        }),
      setPlaying: (v) => set({ playing: v }),
      setExpanded: (v) => set({ expanded: v }),
      setProgress: (sec) => {
        const t = get().track;
        if (!t) return;
        set({ track: { ...t, currentTime: Math.max(0, Math.floor(sec)) } });
      },
      stop: () => set({ track: null, playing: false, expanded: false }),
    }),
    {
      name: "opusfilm-mini-music",
      partialize: (s) => ({
        track: s.track,
        // không persist playing — trình duyệt chặn autoplay; vẫn giữ track để hiện playbox
      }),
    }
  )
);
