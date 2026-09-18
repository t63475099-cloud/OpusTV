"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlaylistTrack {
  id: string;
  title: string;
  channel?: string;
  thumb?: string;
  duration?: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: PlaylistTrack[];
  createdAt: number;
}

interface PlaylistState {
  playlists: Playlist[];
  activeId: string | null;
  create: (name: string) => string;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  addTrack: (playlistId: string, track: PlaylistTrack) => void;
  removeTrack: (playlistId: string, trackId: string) => void;
  setActive: (id: string | null) => void;
}

export const useMusicPlaylist = create<PlaylistState>()(
  persist(
    (set, get) => ({
      playlists: [],
      activeId: null,
      create: (name) => {
        const id = `pl_${Date.now().toString(36)}`;
        set({
          playlists: [
            { id, name: name.trim() || "Playlist mới", tracks: [], createdAt: Date.now() },
            ...get().playlists,
          ],
          activeId: id,
        });
        return id;
      },
      rename: (id, name) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === id ? { ...p, name: name.trim() || p.name } : p
          ),
        }),
      remove: (id) =>
        set({
          playlists: get().playlists.filter((p) => p.id !== id),
          activeId: get().activeId === id ? null : get().activeId,
        }),
      addTrack: (playlistId, track) =>
        set({
          playlists: get().playlists.map((p) => {
            if (p.id !== playlistId) return p;
            if (p.tracks.some((t) => t.id === track.id)) return p;
            return { ...p, tracks: [...p.tracks, track] };
          }),
        }),
      removeTrack: (playlistId, trackId) =>
        set({
          playlists: get().playlists.map((p) =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter((t) => t.id !== trackId) }
              : p
          ),
        }),
      setActive: (id) => set({ activeId: id }),
    }),
    { name: "opus-music-playlist-v1" }
  )
);
