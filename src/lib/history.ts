"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WatchHistory } from "./types";

interface HistoryState {
  /** Account binding — empty = guest/anonymous bucket */
  owner: string;
  history: WatchHistory[];
  addOrUpdate: (item: WatchHistory) => void;
  remove: (slug: string) => void;
  clear: () => void;
  getBySlug: (slug: string) => WatchHistory | undefined;
  /** Switch storage bucket when user logs in/out */
  bindAccount: (username: string | null) => void;
}

const GUEST_KEY = "opustv-watch-history:guest";

function storageKey(owner: string) {
  const o = (owner || "").trim().toLowerCase();
  return o ? `opustv-watch-history:u:${o}` : GUEST_KEY;
}

function readBucket(key: string): WatchHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    // zustand persist shape { state: { history }, version }
    if (parsed?.state?.history && Array.isArray(parsed.state.history)) {
      return parsed.state.history as WatchHistory[];
    }
    if (Array.isArray(parsed?.history)) return parsed.history as WatchHistory[];
    if (Array.isArray(parsed)) return parsed as WatchHistory[];
  } catch {
    /* */
  }
  return [];
}

function writeBucket(key: string, history: WatchHistory[], owner: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ state: { owner, history }, version: 0 })
    );
  } catch {
    /* */
  }
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      owner: "",
      history: [],
      addOrUpdate: (item) => {
        set((state) => {
          const filtered = state.history.filter((h) => h.slug !== item.slug);
          const history = [{ ...item, updatedAt: Date.now() }, ...filtered].slice(
            0,
            80
          );
          writeBucket(storageKey(state.owner), history, state.owner);
          return { history };
        });
      },
      remove: (slug) => {
        set((state) => {
          const history = state.history.filter((h) => h.slug !== slug);
          writeBucket(storageKey(state.owner), history, state.owner);
          return { history };
        });
      },
      clear: () => {
        const owner = get().owner;
        writeBucket(storageKey(owner), [], owner);
        set({ history: [] });
      },
      getBySlug: (slug) => get().history.find((h) => h.slug === slug),
      bindAccount: (username) => {
        const nextOwner = (username || "").trim().toLowerCase();
        const prev = get().owner;
        if (prev === nextOwner && get().history.length >= 0) {
          // still reload bucket to be safe on first hydrate
        }
        const history = readBucket(storageKey(nextOwner));
        set({ owner: nextOwner, history });
      },
    }),
    {
      name: "opustv-watch-history-meta",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ owner: s.owner }),
    }
  )
);

/** Migrate legacy single-key history into guest once */
export function migrateLegacyWatchHistory() {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem("opustv-watch-history");
    if (!legacy) return;
    const guest = localStorage.getItem(GUEST_KEY);
    if (!guest) {
      localStorage.setItem(GUEST_KEY, legacy);
    }
    localStorage.removeItem("opustv-watch-history");
  } catch {
    /* */
  }
}
