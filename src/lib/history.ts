import { recordDailyStreak } from "./streak";

export interface HistoryItem {
  slug: string;
  name: string;
  origin_name?: string;
  poster_url?: string;
  episode_name?: string;
  episode_slug?: string;
  server_name?: string;
  progress?: number;
  duration?: number;
  updated_at?: number;
}

const HISTORY_KEY = "opustv_watch_history";

export function getHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addToHistory(item: HistoryItem) {
  if (typeof window === "undefined") return;
  try {
    // 1. Tự động kích hoạt chuỗi xem mỗi ngày (Daily Streak)
    recordDailyStreak();

    // 2. Lưu thông tin phim vào lịch sử
    const history = getHistory();
    const existingIndex = history.findIndex((h) => h.slug === item.slug);

    const newItem = {
      ...item,
      updated_at: Date.now(),
    };

    if (existingIndex > -1) {
      history.splice(existingIndex, 1);
    }

    history.unshift(newItem);

    // Giữ tối đa 50 phim trong lịch sử
    if (history.length > 50) {
      history.pop();
    }

    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    window.dispatchEvent(new Event("history-updated"));
  } catch (err) {
    console.error("Lỗi khi lưu lịch sử:", err);
  }
}

export function clearHistory() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event("history-updated"));
}

export function removeFromHistory(slug: string) {
  if (typeof window === "undefined") return;
  const history = getHistory().filter((h) => h.slug !== slug);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  window.dispatchEvent(new Event("history-updated"));
}
