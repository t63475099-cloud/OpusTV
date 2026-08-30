import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { WatchHistory } from "./types";
import { recordDailyStreak } from "./streak";

interface HistoryState {
  history: WatchHistory[];
  addToHistory: (item: Omit<WatchHistory, "watchedAt">) => void;
  removeFromHistory: (slug: string) => void;
  clearHistory: () => void;
  getProgress: (slug: string) => WatchHistory | undefined;
  setHistory: (history: WatchHistory[]) => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      addToHistory: (item) => {
        // Tự động thắp lửa chuỗi xem phim mỗi ngày (Daily Streak)
        try {
          recordDailyStreak();
        } catch {}

        set((state) => {
          const filtered = state.history.filter((h) => h.slug !== item.slug);
          const newItem: WatchHistory = {
            ...item,
            watchedAt: Date.now(),
          };
          return {
            history: [newItem, ...filtered].slice(0, 50),
          };
        });
      },

      removeFromHistory: (slug) => {
        set((state) => ({
          history: state.history.filter((h) => h.slug !== slug),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getProgress: (slug) => {
        return get().history.find((h) => h.slug === slug);
      },

      setHistory: (history) => {
        set({ history: Array.isArray(history) ? history : [] });
      },
    }),
    {
      name: "opustv-history",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Hỗ trợ hàm helper cho các component không dùng Hook
export function getHistory(): WatchHistory[] {
  return useHistoryStore.getState().history;
}

export function addToHistory(item: Omit<WatchHistory, "watchedAt">) {
  useHistoryStore.getState().addToHistory(item);
}

export function removeFromHistory(slug: string) {
  useHistoryStore.getState().removeFromHistory(slug);
}

export function clearHistory() {
  useHistoryStore.getState().clearHistory();
}
