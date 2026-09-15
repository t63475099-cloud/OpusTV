"use client";

import { create } from "zustand";
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
  queue: MiniTrack[];
  playing: boolean;
  expanded: boolean;
  setTrack: (t: MiniTrack | null, autoPlay?: boolean) => void;
  setPlaying: (v: boolean) => void;
  setExpanded: (v: boolean) => void;
  setProgress: (sec: number) => void;
  addToQueue: (t: MiniTrack) => void;
  playNext: () => void;
  clearQueue: () => void;
  stop: () => void;
}

export const useMusicPlayerStore = create<MiniState>()((set, get) => ({
  track: null,
  queue: [],
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
  addToQueue: (t) => {
    if (!t?.id) return;
    set((s) => ({
      queue: [...s.queue.filter((x) => x.id !== t.id), t].slice(0, 50),
    }));
  },
  playNext: () => {
    const q = get().queue;
    if (!q.length) {
      get().stop();
      return;
    }
    const [next, ...rest] = q;
    set({ queue: rest });
    get().setTrack(next, true);
  },
  clearQueue: () => set({ queue: [] }),
  stop: () => {
    set({ track: null, playing: false, expanded: false, queue: [] });
    useActiveMediaStore.getState().clearMusic();
  },
}));
