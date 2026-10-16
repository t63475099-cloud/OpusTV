export type QuestDifficulty = "easy" | "medium" | "hard";

export interface QuestDef {
  id: string;
  title: string;
  reward: number;
  difficulty: QuestDifficulty;
  /** daily reset at 00:00 local server day key */
  daily: boolean;
  once: boolean;
  target: number;
}

export const QUESTS: QuestDef[] = [
  { id: "daily_checkin", title: "Điểm danh hàng ngày", reward: 25, difficulty: "easy", daily: true, once: false, target: 1 },
  { id: "browse_5_movies", title: "Xem chi tiết 5 phim trong ngày", reward: 25, difficulty: "easy", daily: true, once: false, target: 5 },
  { id: "share_link", title: "Chia sẻ liên kết hệ thống", reward: 30, difficulty: "easy", daily: true, once: false, target: 1 },
  { id: "online_30m", title: "Hoạt động trực tuyến 30 phút", reward: 70, difficulty: "medium", daily: true, once: false, target: 30 },
  { id: "streak_3", title: "Chuỗi điểm danh 3 ngày", reward: 120, difficulty: "medium", daily: false, once: false, target: 3 },
  { id: "profile_secure", title: "Hoàn thiện bảo mật hồ sơ", reward: 150, difficulty: "medium", daily: false, once: true, target: 1 },
  { id: "streak_7", title: "Chuỗi điểm danh 7 ngày", reward: 350, difficulty: "hard", daily: false, once: false, target: 7 },
  { id: "streak_15", title: "Chuỗi điểm danh 15 ngày", reward: 800, difficulty: "hard", daily: false, once: false, target: 15 },
  { id: "streak_30", title: "Chuỗi điểm danh 30 ngày", reward: 1800, difficulty: "hard", daily: false, once: false, target: 30 },
  { id: "online_50h", title: "Cột mốc 50 giờ trực tuyến", reward: 3500, difficulty: "hard", daily: false, once: true, target: 3000 },
];

export function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}
