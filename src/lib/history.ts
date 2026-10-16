"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WatchHistory } from "./types";

interface HistoryState {
  /** Bound account (lowercase). Empty string = not bound / guest offline only. */
  owner: string;
  history: WatchHistory[];
  addOrUpdate: (item: WatchHistory) => void;
  remove: (slug: string) => void;
  clear: () => void;
  getBySlug: (slug: string) => WatchHistory | undefined;
  /** Switch to this user's isolated bucket. null/empty → clear UI (no continue watching). */
  bindAccount: (username: string | null) => void;
  /** Replace in-memory + disk for current owner only (server sync). */
  replaceHistory: (items: WatchHistory[]) => void;
}

const GUEST_KEY = "opustv-watch-history:guest";

export function historyStorageKey(owner: string): string {
  const o = (owner || "").trim().toLowerCase();
  // Only real accounts get isolated keys; unbound never shows continue-watching
  return o ? `opustv-watch-history:u:${o}` : GUEST_KEY;
}

function readBucket(key: string): WatchHistory[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
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
      JSON.stringify({ state: { owner, history }, version: 1 })
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
        const owner = get().owner;
        // Chưa đăng nhập: không ghi lịch sử tiếp tục xem (tránh lẫn máy)
        if (!owner) return;
        set((state) => {
          const filtered = state.history.filter((h) => h.slug !== item.slug);
          const history = [
            { ...item, updatedAt: Date.now() },
            ...filtered,
          ].slice(0, 80);
          writeBucket(historyStorageKey(owner), history, owner);
          return { history };
        });
      },
      remove: (slug) => {
        const owner = get().owner;
        if (!owner) return;
        set((state) => {
          const history = state.history.filter((h) => h.slug !== slug);
          writeBucket(historyStorageKey(owner), history, owner);
          return { history };
        });
      },
      clear: () => {
        const owner = get().owner;
        if (owner) writeBucket(historyStorageKey(owner), [], owner);
        set({ history: [] });
      },
      getBySlug: (slug) => {
        if (!get().owner) return undefined;
        return get().history.find((h) => h.slug === slug);
      },
      bindAccount: (username) => {
        const nextOwner = (username || "").trim().toLowerCase();
        if (!nextOwner) {
          // Logout / guest: empty list → ẩn "Tiếp tục xem"
          set({ owner: "", history: [] });
          return;
        }
        const history = readBucket(historyStorageKey(nextOwner));
        set({ owner: nextOwner, history });
      },
      replaceHistory: (items) => {
        const owner = get().owner;
        if (!owner) {
          set({ history: [] });
          return;
        }
        const history = Array.isArray(items) ? items.slice(0, 80) : [];
        writeBucket(historyStorageKey(owner), history, owner);
        set({ history });
      },
    }),
    {
      name: "opustv-watch-history-meta",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ owner: s.owner }),
      onRehydrateStorage: () => (state) => {
        // After meta rehydrate, load that owner's bucket (or clear)
        if (!state) return;
        const owner = (state.owner || "").trim().toLowerCase();
        if (!owner) {
          state.history = [];
          return;
        }
        state.history = readBucket(historyStorageKey(owner));
      },
    }
  )
);

/** Legacy shared key → only migrate into guest; never into a real user */
export function migrateLegacyWatchHistory() {
  if (typeof window === "undefined") return;
  try {
    const legacy = localStorage.getItem("opustv-watch-history");
    if (!legacy) return;
    // Do not auto-attach legacy list to any logged-in user
    if (!localStorage.getItem(GUEST_KEY)) {
      localStorage.setItem(GUEST_KEY, legacy);
    }
    localStorage.removeItem("opustv-watch-history");
  } catch {
    /* */
  }
}
