export interface StreakData {
  currentStreak: number;
  bestStreak: number;
  lastWatchDate: string | null; // Định dạng YYYY-MM-DD
  updatedAt: number;
}

const STREAK_KEY = "opustv_watch_streak";

/**
 * Lấy ngày theo định dạng chuẩn YYYY-MM-DD theo giờ địa phương
 */
export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Đọc dữ liệu chuỗi từ LocalStorage và kiểm tra xem có bị đứt chuỗi hay không
 */
export function getStreakData(): StreakData {
  if (typeof window === "undefined") {
    return { currentStreak: 0, bestStreak: 0, lastWatchDate: null, updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return { currentStreak: 0, bestStreak: 0, lastWatchDate: null, updatedAt: 0 };
    }

    const data: StreakData = JSON.parse(raw);
    if (data.lastWatchDate) {
      const today = getLocalDateString();
      const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

      // Nếu lần xem cuối trước hôm qua thì chuỗi đã bị ngắt về 0
      if (data.lastWatchDate !== today && data.lastWatchDate !== yesterday) {
        return { ...data, currentStreak: 0 };
      }
    }
    return data;
  } catch {
    return { currentStreak: 0, bestStreak: 0, lastWatchDate: null, updatedAt: 0 };
  }
}

/**
 * Ghi nhận chuỗi khi người dùng xem phim
 */
export function recordDailyStreak(): {
  streak: number;
  isNewDay: boolean;
  isFirstStreak: boolean;
} {
  if (typeof window === "undefined") {
    return { streak: 0, isNewDay: false, isFirstStreak: false };
  }

  const currentData = getStreakData();
  const today = getLocalDateString();
  const yesterday = getLocalDateString(new Date(Date.now() - 86400000));

  let newStreak = currentData.currentStreak;
  let isNewDay = false;
  let isFirstStreak = false;

  if (!currentData.lastWatchDate) {
    newStreak = 1;
    isNewDay = true;
    isFirstStreak = true;
  } else if (currentData.lastWatchDate === today) {
    // Đã thắp sáng hôm nay
    return { streak: newStreak, isNewDay: false, isFirstStreak: false };
  } else if (currentData.lastWatchDate === yesterday) {
    // Nối tiếp chuỗi từ hôm qua
    newStreak = (currentData.currentStreak || 0) + 1;
    isNewDay = true;
  } else {
    // Bị đứt chuỗi, bắt đầu lại từ 1
    newStreak = 1;
    isNewDay = true;
  }

  const bestStreak = Math.max(currentData.bestStreak || 0, newStreak);
  const updated: StreakData = {
    currentStreak: newStreak,
    bestStreak,
    lastWatchDate: today,
    updatedAt: Date.now(),
  };

  localStorage.setItem(STREAK_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent("streak-updated", { detail: updated }));

  return { streak: newStreak, isNewDay, isFirstStreak };
}
