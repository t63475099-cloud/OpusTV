"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export const CHECKIN_REWARDS = [10, 15, 20, 30, 40, 55, 100] as const;

export const UNLOCK_COST = {
  episode: 50,
  movie: 120,
} as const;

/** Quy đổi xu → VND */
export const COIN_TO_VND = 100; // 10 xu = 1.000₫ → 1 xu = 100₫
export const MIN_REDEEM_COINS = 100; // tối thiểu 100 xu = 10.000₫
export const REDEEM_FEE_RATE = 0.02; // 2% phí

export type PaymentMethodId =
  | "bank"
  | "momo"
  | "zalopay"
  | "vnpay"
  | "shopeepay"
  | "viettel"
  | "card";

export interface PaymentMethod {
  id: PaymentMethodId;
  name: string;
  desc: string;
  minCoins: number;
}

export const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "bank", name: "Chuyển khoản ngân hàng", desc: "Vietcombank, MB, Techcombank, TPBank…", minCoins: MIN_REDEEM_COINS },
  { id: "momo", name: "MoMo", desc: "Ví MoMo", minCoins: MIN_REDEEM_COINS },
  { id: "zalopay", name: "ZaloPay", desc: "Ví ZaloPay", minCoins: MIN_REDEEM_COINS },
  { id: "vnpay", name: "VNPay", desc: "Cổng VNPay / QR ngân hàng", minCoins: MIN_REDEEM_COINS },
  { id: "shopeepay", name: "ShopeePay", desc: "Ví ShopeePay", minCoins: MIN_REDEEM_COINS },
  { id: "viettel", name: "Viettel Money", desc: "Ví Viettel Money", minCoins: MIN_REDEEM_COINS },
  { id: "card", name: "Thẻ quốc tế", desc: "Visa / Mastercard / JCB", minCoins: MIN_REDEEM_COINS },
];

export type RedeemStatus = "pending" | "processing" | "done" | "rejected";

export interface RedeemRequest {
  id: string;
  coins: number;
  vndGross: number;
  fee: number;
  vndNet: number;
  method: PaymentMethodId;
  accountName: string;
  accountInfo: string;
  status: RedeemStatus;
  createdAt: number;
}



/** Mỗi lần nhận nhiệm vụ */
export const MISSION_REWARD = 1000;
/** Không giới hạn số lần nhận mỗi nhiệm vụ / ngày */
export const MISSION_MAX_CLAIMS = Number.POSITIVE_INFINITY;

/** Chi phí 1 lượt vòng quay */
export const SPIN_COST = 100;

export type ShopItemKind = "unlock" | "frame" | "badge" | "boost" | "vip" | "mystery" | "coins" | "vip_xp" | "pass_xp";

export interface ShopItemDef {
  id: string;
  name: string;
  desc: string;
  cost: number;
  kind: ShopItemKind;
  /** frame id / badge id / unlock key meta */
  meta?: string;
  icon: string;
}

export const SHOP_ITEMS: ShopItemDef[] = [
  // ── 0. Pass XP (Opus Pass) ──
  { id: "pass_xp_200", name: "Gói 200 Pass XP", desc: "Mua XP cho Opus Pass", cost: 150, kind: "pass_xp", meta: "200", icon: "🎫" },
  { id: "pass_xp_600", name: "Gói 600 Pass XP", desc: "Mua XP cho Opus Pass", cost: 400, kind: "pass_xp", meta: "600", icon: "🎫" },
  { id: "pass_xp_1500", name: "Gói 1500 Pass XP", desc: "Mua XP cho Opus Pass", cost: 900, kind: "pass_xp", meta: "1500", icon: "🎫" },
  { id: "pass_xp_5000", name: "Gói 5000 Pass XP", desc: "Mua XP cho Opus Pass", cost: 2800, kind: "pass_xp", meta: "5000", icon: "🎫" },

  // ── 1. Nâng điểm VIP (xu → điểm VIP, không lấy từ nhiệm vụ) ──
  { id: "vip_rank_up", name: "Nâng điểm VIP +1000", desc: "1000 xu → +1000 điểm VIP", cost: 1000, kind: "vip_xp", meta: "1000", icon: "📈" },
  { id: "vip_rank_5k", name: "Nâng điểm VIP +5000", desc: "4500 xu → +5000 điểm VIP", cost: 4500, kind: "vip_xp", meta: "5000", icon: "📊" },
  { id: "vip_rank_12k", name: "Nâng điểm VIP +12000", desc: "10000 xu → +12000 điểm VIP", cost: 10000, kind: "vip_xp", meta: "12000", icon: "🚀" },

  // ── 2. Gói VIP thời hạn ──
  { id: "vip_flash", name: "VIP Flash 12h", desc: "Huy hiệu VIP 12 giờ", cost: 120, kind: "vip", meta: "vip12", icon: "✨" },
  { id: "vip_1d", name: "VIP 1 ngày", desc: "Huy hiệu VIP 24 giờ", cost: 200, kind: "vip", meta: "vip24", icon: "👑" },
  { id: "vip_3d", name: "VIP 3 ngày", desc: "VIP cộng dồn 72 giờ", cost: 500, kind: "vip", meta: "vip72", icon: "👑" },
  { id: "vip_7d", name: "VIP 7 ngày", desc: "VIP một tuần", cost: 1000, kind: "vip", meta: "vip168", icon: "👑" },

  // ── 3. Mở khóa xem phim ──
  { id: "card_ep", name: "Thẻ mở 1 tập", desc: "Mở khóa 1 tập phim", cost: 50, kind: "unlock", meta: "episode", icon: "🎬" },
  { id: "card_hd_ep", name: "Thẻ tập Full HD", desc: "1 tập chất lượng cao", cost: 70, kind: "unlock", meta: "episode", icon: "📽️" },
  { id: "card_skip", name: "Thẻ tiện ích xem", desc: "Hỗ trợ trải nghiệm xem", cost: 90, kind: "unlock", meta: "episode", icon: "🚫" },
  { id: "card_ep3", name: "Thẻ mở 3 tập", desc: "Mở 3 tập bất kỳ", cost: 120, kind: "unlock", meta: "episode", icon: "🎞️" },
  { id: "card_movie", name: "Thẻ xem trọn bộ", desc: "Mở cả series", cost: 120, kind: "unlock", meta: "movie", icon: "🍿" },
  { id: "card_weekend", name: "Gói cuối tuần", desc: "Mở nhiều tập trong 48h", cost: 150, kind: "unlock", meta: "episode", icon: "🗓️" },
  { id: "card_movie_hd", name: "Thẻ trọn bộ HD", desc: "Series + ưu tiên HD", cost: 180, kind: "unlock", meta: "movie", icon: "📺" },
  { id: "card_binge", name: "Gói binge 10 tập", desc: "Mở nhiều tập", cost: 280, kind: "unlock", meta: "episode", icon: "📚" },

  // ── 4. Tăng tốc / boost ──
  { id: "boost_focus", name: "Tăng tốc nhiệm vụ", desc: "x2 xu · 24h", cost: 240, kind: "boost", meta: "x2", icon: "⏱️" },
  { id: "boost_x2", name: "Nhân đôi xu x2", desc: "Xu nhiệm vụ x2 · 24h", cost: 250, kind: "boost", meta: "x2", icon: "✨" },
  { id: "boost_lucky", name: "Bùa may mắn", desc: "Cộng dồn x2 khi đang bật", cost: 320, kind: "boost", meta: "x2", icon: "🍀" },
  { id: "boost_x2_3d", name: "x2 xu 3 ngày", desc: "Nhân đôi 72h", cost: 600, kind: "boost", meta: "x2", icon: "⚡" },

  // ── 5. Hộp quà ──
  { id: "mystery_mini", name: "Hộp mini", desc: "Quà nhỏ ngẫu nhiên · bấm Mở trong kho", cost: 45, kind: "mystery", meta: "box-mini", icon: "🎀" },
  { id: "mystery", name: "Hộp quà bí ẩn", desc: "Vào kho → Mở nhận quà ngẫu nhiên", cost: 80, kind: "mystery", meta: "box", icon: "🎁" },
  { id: "mystery_gold", name: "Hộp quà vàng", desc: "Tỉ lệ quà hiếm cao hơn", cost: 200, kind: "mystery", meta: "box-gold", icon: "📦" },
  { id: "mystery_crystal", name: "Hộp tinh thể", desc: "Ngẫu nhiên khung / huy hiệu", cost: 280, kind: "mystery", meta: "box-crystal", icon: "💠" },

  // ── 6. Khung viền ──
  { id: "frame_emerald", name: "Khung Emerald", desc: "Rừng ngọc", cost: 260, kind: "frame", meta: "frame:emerald-forest", icon: "💚" },
  { id: "frame_flame", name: "Khung Flame Ring", desc: "Vòng lửa", cost: 280, kind: "frame", meta: "frame:flame-ring", icon: "🔥" },
  { id: "frame_frost", name: "Khung Mystic Frost", desc: "Băng giá", cost: 280, kind: "frame", meta: "frame:mystic-frost", icon: "❄️" },
  { id: "frame_conic", name: "Khung Conic Spin", desc: "Viền xoay đa sắc", cost: 300, kind: "frame", meta: "frame:conic-rainbow", icon: "🌀" },
  { id: "frame_spirit", name: "Khung Spirit Orb", desc: "Quả cầu linh", cost: 300, kind: "frame", meta: "frame:spirit-orb", icon: "🔮" },
  { id: "frame_halo", name: "Khung Celestial Halo", desc: "Hào quang", cost: 310, kind: "frame", meta: "frame:celestial-halo", icon: "😇" },
  { id: "frame_galaxy", name: "Khung Galaxy", desc: "Tinh vân", cost: 320, kind: "frame", meta: "frame:galaxy-nebula", icon: "🌌" },
  { id: "frame_emp", name: "Khung EMP Pulse", desc: "Xung điện", cost: 330, kind: "frame", meta: "frame:emp-pulse", icon: "📡" },
  { id: "frame_solar", name: "Khung Solar Eclipse", desc: "Nhật thực", cost: 340, kind: "frame", meta: "frame:solar-eclipse", icon: "☀️" },
  { id: "frame_lunar", name: "Khung Lunar Eclipse", desc: "Nguyệt thực", cost: 340, kind: "frame", meta: "frame:lunar-eclipse", icon: "🌙" },
  { id: "frame_plasma", name: "Khung Cyber Plasma", desc: "Neon flicker", cost: 350, kind: "frame", meta: "frame:neon-flicker", icon: "⚡" },
  { id: "frame_lightning", name: "Khung Mythic Lightning", desc: "Sét thần", cost: 360, kind: "frame", meta: "frame:mythic-lightning", icon: "⛈️" },
  { id: "frame_rainbow2", name: "Khung Rainbow+", desc: "Cầu vồng nâng cấp", cost: 380, kind: "frame", meta: "frame:conic-rainbow", icon: "🌈" },

  // ── 7. Huy hiệu ──
  { id: "badge_early", name: "Early Bird", desc: "Thành viên sớm", cost: 130, kind: "badge", meta: "badge:early", icon: "🌅" },
  { id: "badge_night", name: "Cú Đêm", desc: "Xem xuyên đêm", cost: 140, kind: "badge", meta: "badge:cu-dem", icon: "🦉" },
  { id: "badge_chat", name: "Tán Gẫu", desc: "Opus Chat", cost: 140, kind: "badge", meta: "badge:chat", icon: "💬" },
  { id: "badge_heart", name: "Trái Tim Vàng", desc: "Yêu thích nhiều", cost: 145, kind: "badge", meta: "badge:heart", icon: "💛" },
  { id: "badge_mot", name: "Mọt Phim Kỳ Cựu", desc: "Huy hiệu xem phim", cost: 150, kind: "badge", meta: "badge:mot-phim", icon: "🏅" },
  { id: "badge_music", name: "Music Soul", desc: "Opus Music", cost: 150, kind: "badge", meta: "badge:music", icon: "🎵" },
  { id: "badge_star", name: "Ngôi Sao", desc: "Nổi bật", cost: 155, kind: "badge", meta: "badge:star", icon: "⭐" },
  { id: "badge_streak", name: "Chuỗi Lửa", desc: "Điểm danh bền bỉ", cost: 160, kind: "badge", meta: "badge:chuoi-lua", icon: "🔥" },
  { id: "badge_pioneer", name: "Người Tiên Phong", desc: "Khám phá tính năng mới", cost: 165, kind: "badge", meta: "badge:pioneer", icon: "🚀" },
  { id: "badge_coder", name: "Code Master", desc: "Opus Code", cost: 170, kind: "badge", meta: "badge:code", icon: "💻" },
  { id: "badge_collector", name: "Nhà Sưu Tầm", desc: "Sưu tập huy hiệu", cost: 175, kind: "badge", meta: "badge:collector", icon: "🧰" },
  { id: "badge_tycoon", name: "Đại Gia Xu", desc: "Huy hiệu giàu xu", cost: 180, kind: "badge", meta: "badge:dai-gia", icon: "💎" },
  { id: "badge_season", name: "Huy hiệu Mùa", desc: "Theo mùa sự kiện", cost: 190, kind: "badge", meta: "badge:season", icon: "🎌" },
  { id: "badge_vip", name: "Huy hiệu VIP", desc: "Biểu tượng VIP", cost: 220, kind: "badge", meta: "badge:vip", icon: "👑" },
  { id: "badge_legend", name: "Huyền Thoại", desc: "Cấp cao", cost: 400, kind: "badge", meta: "badge:legend", icon: "🏆" },

  // ── 8. Gói xu ──
  { id: "coin_pack_50", name: "Gói 50 xu", desc: "Nhận ngay 50 xu", cost: 40, kind: "coins", meta: "50", icon: "🪙" },
  { id: "coin_pack_120", name: "Gói 120 xu", desc: "Nhận ngay 120 xu", cost: 90, kind: "coins", meta: "120", icon: "🪙" },
  { id: "coin_pack_300", name: "Gói 300 xu", desc: "Nhận ngay 300 xu", cost: 200, kind: "coins", meta: "300", icon: "💰" },
];

/**
 * 15 cấp VIP — theo điểm VIP (vipPoints), KHÔNG theo xu nhiệm vụ.
 * VIP 15 cần 999.999.999 điểm.
 */
export const VIP_LEVELS: { level: number; need: number; title: string; color: string }[] = [
  { level: 1, need: 0, title: "Tân binh", color: "#94a3b8" },
  { level: 2, need: 1_000, title: "Đồng I", color: "#cd7c32" },
  { level: 3, need: 5_000, title: "Đồng II", color: "#d4924a" },
  { level: 4, need: 20_000, title: "Bạc I", color: "#c0c0c0" },
  { level: 5, need: 80_000, title: "Bạc II", color: "#e8e8e8" },
  { level: 6, need: 250_000, title: "Vàng I", color: "#eab308" },
  { level: 7, need: 800_000, title: "Vàng II", color: "#facc15" },
  { level: 8, need: 2_500_000, title: "Bạch kim I", color: "#67e8f9" },
  { level: 9, need: 8_000_000, title: "Bạch kim II", color: "#22d3ee" },
  { level: 10, need: 25_000_000, title: "Kim cương I", color: "#60a5fa" },
  { level: 11, need: 70_000_000, title: "Kim cương II", color: "#3b82f6" },
  { level: 12, need: 180_000_000, title: "Tinh anh", color: "#a78bfa" },
  { level: 13, need: 400_000_000, title: "Cao thủ", color: "#c084fc" },
  { level: 14, need: 700_000_000, title: "Chiến thần", color: "#f472b6" },
  { level: 15, need: 999_999_999, title: "Huyền thoại", color: "#f43f5e" },
];

/** Tiến độ VIP theo điểm VIP (không dùng xu nhiệm vụ) */
export function getVipProgress(vipPoints: number) {
  const earned = Math.max(0, vipPoints || 0);
  let cur = VIP_LEVELS[0];
  let next = VIP_LEVELS[1] || VIP_LEVELS[0];
  for (let i = 0; i < VIP_LEVELS.length; i++) {
    if (earned >= VIP_LEVELS[i].need) {
      cur = VIP_LEVELS[i];
      next = VIP_LEVELS[Math.min(i + 1, VIP_LEVELS.length - 1)];
    }
  }
  const span = Math.max(1, next.need - cur.need);
  const into = Math.min(span, Math.max(0, earned - cur.need));
  const pct = cur.level >= 15 ? 100 : Math.round((into / span) * 100);
  return { cur, next, pct, earned };
}


export interface InventoryItem {
  id: string;
  shopId: string;
  name: string;
  kind: ShopItemKind;
  meta?: string;
  qty: number;
  acquiredAt: number;
  expiresAt?: number | null;
}

export interface LiveFeedItem {
  id: string;
  text: string;
  at: number;
}

export const SPIN_REWARDS: { id: string; label: string; weight: number; coins?: number; shopId?: string }[] = [
  { id: "c20", label: "+20 xu", weight: 28, coins: 20 },
  { id: "c50", label: "+50 xu", weight: 22, coins: 50 },
  { id: "c100", label: "+100 xu", weight: 12, coins: 100 },
  { id: "c200", label: "+200 xu", weight: 5, coins: 200 },
  { id: "mys", label: "Hộp quà", weight: 12, shopId: "mystery" },
  { id: "ep", label: "Thẻ 1 tập", weight: 10, shopId: "card_ep" },
  { id: "fr", label: "Khung Conic", weight: 6, shopId: "frame_conic" },
  { id: "bd", label: "Huy hiệu", weight: 5, shopId: "badge_mot" },
];



export type MissionId =
  | "watch5"
  | "watch15"
  | "watch30"
  | "favorite"
  | "favorite3"
  | "comment"
  | "share"
  | "search"
  | "music"
  | "openEvent"
  | "episode2"
  | "login";

export interface MissionDef {
  id: MissionId;
  title: string;
  desc: string;
  target: number;
  unit: "sec" | "count";
}

export const DAILY_MISSIONS: MissionDef[] = [
  {
    id: "openEvent",
    title: "Ghé trang Sự kiện",
    desc: "Mở trang sự kiện",
    target: 1,
    unit: "count",
  },
  {
    id: "login",
    title: "Đăng nhập tài khoản",
    desc: "Vào Tài khoản khi đã đăng nhập",
    target: 1,
    unit: "count",
  },
  {
    id: "watch5",
    title: "Xem phim 5 phút",
    desc: "Có thể lặp lại nhiều lần trong ngày",
    target: 5 * 60,
    unit: "sec",
  },
  {
    id: "watch15",
    title: "Xem phim 15 phút",
    desc: "Mỗi lần đủ 15 phút nhận thêm xu",
    target: 15 * 60,
    unit: "sec",
  },
  {
    id: "watch30",
    title: "Xem phim 30 phút",
    desc: "Buổi xem dài",
    target: 30 * 60,
    unit: "sec",
  },
  {
    id: "episode2",
    title: "Xem 2 tập khác nhau",
    desc: "Đổi tập / đổi phim",
    target: 2,
    unit: "count",
  },
  {
    id: "favorite",
    title: "Thêm 1 yêu thích",
    desc: "Bấm trái tim",
    target: 1,
    unit: "count",
  },
  {
    id: "favorite3",
    title: "Thêm 3 yêu thích",
    desc: "Sưu tầm trong ngày",
    target: 3,
    unit: "count",
  },
  {
    id: "comment",
    title: "Viết 1 bình luận",
    desc: "Bình luận dưới phim",
    target: 1,
    unit: "count",
  },
  {
    id: "share",
    title: "Chia sẻ 1 phim",
    desc: "Nút Chia sẻ trang xem",
    target: 1,
    unit: "count",
  },
  {
    id: "search",
    title: "Tìm kiếm 1 lần",
    desc: "Gõ từ khóa tìm phim",
    target: 1,
    unit: "count",
  },
  {
    id: "music",
    title: "Nghe Opus Music",
    desc: "Phát một bài nhạc",
    target: 1,
    unit: "count",
  },
];

export interface UnlockRecord {
  key: string;
  permanent: boolean;
  expiresAt: number | null;
  spent: number;
  at: number;
}

type ProgressMap = Record<MissionId, number>;
type ClaimCountMap = Record<MissionId, number>;

function emptyProgress(): ProgressMap {
  const o = {} as ProgressMap;
  for (const m of DAILY_MISSIONS) o[m.id] = 0;
  return o;
}
function emptyClaims(): ClaimCountMap {
  const o = {} as ClaimCountMap;
  for (const m of DAILY_MISSIONS) o[m.id] = 0;
  return o;
}

export interface EventState {
  coins: number;
  redeemHistory: RedeemRequest[];
  streakDay: number;
  lastCheckIn: string | null;
  claimedCheckInDay: string | null;
  missionDay: string | null;
  missionProgress: ProgressMap;
  /** Số lần đã nhận thưởng mỗi nhiệm vụ hôm nay (không giới hạn) */
  missionClaimCount: ClaimCountMap;
  unlocks: UnlockRecord[];
  /** Tổng xu đã kiếm (hiển thị thống kê, KHÔNG dùng cho VIP) */
  totalEarned: number;
  /** Điểm VIP — chỉ tăng khi đổi xu → điểm VIP trong cửa hàng */
  vipPoints: number;
  episodeSlugsToday: string[];
  inventory: InventoryItem[];
  equippedFrame: string | null;
  equippedBadge: string | null;
  boostExpiresAt: number | null;
  vipExpiresAt: number | null;
  liveFeed: LiveFeedItem[];

  ensureMissionDay: () => void;
  getStreakStatus: () => {
    streakDay: number;
    canClaim: boolean;
    missed: boolean;
    todayReward: number;
    cycleDay: number;
  };

  claimCheckIn: () => { ok: boolean; coins: number; message: string };
  addMissionProgress: (id: MissionId, amount?: number) => void;
  trackEpisode: (slug: string) => void;
  redeemCash: (opts: {
    coins: number;
    method: PaymentMethodId;
    accountName: string;
    accountInfo: string;
  }) => { ok: boolean; error?: string; request?: RedeemRequest };
  cancelRedeem: (id: string) => boolean;
  claimMission: (id: MissionId) => { ok: boolean; coins: number; message: string };
  spendUnlock: (
    key: string,
    cost: number,
    permanent?: boolean
  ) => { ok: boolean; message: string };
  isUnlocked: (key: string) => boolean;
  dailyMissionSummary: () => { done: number; total: number; pct: number };
  buyShopItem: (shopId: string) => { ok: boolean; message: string };
  openMysteryBox: (invId: string) => { ok: boolean; message: string };
  equipItem: (invId: string) => { ok: boolean; message: string };
  activateItem: (invId: string) => { ok: boolean; message: string };
  luckySpin: () => { ok: boolean; message: string; label?: string };
  pushLive: (text: string) => void;
  coinMultiplier: () => number;
  isVipActive: () => boolean;
}

export const useEventStore = create<EventState>()(
  persist(
    (set, get) => ({
      coins: 0,
      redeemHistory: [],
      streakDay: 0,
      lastCheckIn: null,
      claimedCheckInDay: null,
      missionDay: null,
      missionProgress: emptyProgress(),
      missionClaimCount: emptyClaims(),
      unlocks: [],
      totalEarned: 0,
      vipPoints: 0,
      episodeSlugsToday: [],
      inventory: [],
      equippedFrame: null,
      equippedBadge: null,
      boostExpiresAt: null,
      vipExpiresAt: null,
      liveFeed: [],

      ensureMissionDay: () => {
        const today = dayKey();
        const s = get();
        if (s.missionDay === today) {
          set({
            missionProgress: { ...emptyProgress(), ...s.missionProgress },
            missionClaimCount: { ...emptyClaims(), ...(s.missionClaimCount || {}) },
          });
          return;
        }
        set({
          missionDay: today,
          missionProgress: emptyProgress(),
          missionClaimCount: emptyClaims(),
          episodeSlugsToday: [],
        });
      },

      getStreakStatus: () => {
        const s = get();
        const today = dayKey();
        const yest = yesterdayKey();
        let streakDay = s.streakDay;
        let missed = false;
        if (s.lastCheckIn !== today && s.lastCheckIn !== yest && s.lastCheckIn) {
          missed = true;
          streakDay = 0;
        }
        const nextIndex =
          s.lastCheckIn === today
            ? Math.max(0, ((streakDay - 1) % 7 + 7) % 7)
            : streakDay % 7;
        return {
          streakDay: missed && s.lastCheckIn !== today ? 0 : streakDay,
          canClaim: s.claimedCheckInDay !== today,
          missed,
          todayReward: CHECKIN_REWARDS[nextIndex] ?? 10,
          cycleDay:
            s.lastCheckIn === today
              ? ((streakDay - 1) % 7) + 1
              : (streakDay % 7) + 1,
        };
      },

      claimCheckIn: () => {
        const today = dayKey();
        const s = get();
        if (s.claimedCheckInDay === today) {
          return { ok: false, coins: 0, message: "Hôm nay đã nhận điểm danh" };
        }
        const yest = yesterdayKey();
        let next = 1;
        if (s.lastCheckIn === yest) next = s.streakDay + 1;
        else next = 1;
        if (next > 7) next = 1;
        const reward = CHECKIN_REWARDS[next - 1] ?? 10;
        set({
          streakDay: next,
          lastCheckIn: today,
          claimedCheckInDay: today,
          coins: s.coins + reward,
          totalEarned: s.totalEarned + reward,
        });
        return { ok: true, coins: reward, message: `+${reward} xu · Ngày ${next}/7` };
      },

      addMissionProgress: (id, amount = 1) => {
        get().ensureMissionDay();
        const s = get();
        const def = DAILY_MISSIONS.find((m) => m.id === id);
        if (!def) return;
        const cur = s.missionProgress[id] || 0;
        // Không giới hạn số lần — cộng dồn tiến độ để claim nhiều lần
        set({
          missionProgress: {
            ...s.missionProgress,
            [id]: cur + amount,
          },
        });
      },

      trackEpisode: (slug) => {
        get().ensureMissionDay();
        const s = get();
        if (!slug || s.episodeSlugsToday.includes(slug)) return;
        set({ episodeSlugsToday: [...s.episodeSlugsToday, slug] });
        get().addMissionProgress("episode2", 1);
      },


      redeemCash: ({ coins: amount, method, accountName, accountInfo }) => {
        const state = get();
        const amt = Math.floor(Number(amount) || 0);
        if (amt < MIN_REDEEM_COINS) {
          return { ok: false, error: `Tối thiểu ${MIN_REDEEM_COINS} xu` };
        }
        if (amt > state.coins) {
          return { ok: false, error: "Không đủ xu" };
        }
        if (!PAYMENT_METHODS.some((m) => m.id === method)) {
          return { ok: false, error: "Phương thức không hợp lệ" };
        }
        const name = (accountName || "").trim();
        const info = (accountInfo || "").trim();
        if (name.length < 2) return { ok: false, error: "Nhập tên chủ tài khoản" };
        if (info.length < 4) return { ok: false, error: "Nhập số tài khoản / SĐT ví" };

        const vndGross = amt * COIN_TO_VND;
        const fee = Math.round(vndGross * REDEEM_FEE_RATE);
        const vndNet = Math.max(0, vndGross - fee);
        const req: RedeemRequest = {
          id: `rd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          coins: amt,
          vndGross,
          fee,
          vndNet,
          method,
          accountName: name,
          accountInfo: info,
          status: "pending",
          createdAt: Date.now(),
        };
        set({
          coins: state.coins - amt,
          redeemHistory: [req, ...(state.redeemHistory || [])].slice(0, 50),
        });
        return { ok: true, request: req };
      },
      cancelRedeem: (id) => {
        const state = get();
        const list = state.redeemHistory || [];
        const item = list.find((r) => r.id === id);
        if (!item || item.status !== "pending") return false;
        set({
          coins: state.coins + item.coins,
          redeemHistory: list.map((r) =>
            r.id === id ? { ...r, status: "rejected" as RedeemStatus } : r
          ),
        });
        return true;
      },

      claimMission: (id) => {
        get().ensureMissionDay();
        const s = get();
        const def = DAILY_MISSIONS.find((m) => m.id === id);
        if (!def) return { ok: false, coins: 0, message: "Không có nhiệm vụ" };
        const claims = s.missionClaimCount?.[id] || 0;
        const cur = s.missionProgress[id] || 0;
        if (cur < def.target) {
          return { ok: false, coins: 0, message: "Chưa đủ tiến độ" };
        }
        // Trừ 1 lần target, cộng 1000 xu (MISSION_REWARD) — KHÔNG cộng điểm VIP
        const nextProg = cur - def.target;
        const nextClaims = claims + 1;
        const mult = get().coinMultiplier();
        const gain = MISSION_REWARD * mult;
        set({
          missionProgress: { ...s.missionProgress, [id]: nextProg },
          missionClaimCount: { ...s.missionClaimCount, [id]: nextClaims },
          coins: s.coins + gain,
          totalEarned: s.totalEarned + gain,
          // vipPoints không đổi — xu nhiệm vụ không tính vào VIP
        });
        return {
          ok: true,
          coins: gain,
          message: mult > 1 ? `+${gain} xu (x${mult}) · Lần ${nextClaims}` : `+${gain} xu · Lần ${nextClaims}`,
        };
      },

      spendUnlock: (key, cost, permanent = true) => {
        const s = get();
        if (get().isUnlocked(key)) return { ok: true, message: "Đã mở" };
        if (s.coins < cost) {
          return { ok: false, message: `Cần ${cost} xu (có ${s.coins})` };
        }
        set({
          coins: s.coins - cost,
          unlocks: [
            ...s.unlocks.filter((u) => u.key !== key),
            {
              key,
              permanent,
              expiresAt: permanent ? null : Date.now() + 86400000,
              spent: cost,
              at: Date.now(),
            },
          ],
        });
        return { ok: true, message: permanent ? "Mở vĩnh viễn" : "Mở 24h" };
      },

      isUnlocked: (key) => {
        const now = Date.now();
        return get().unlocks.some(
          (u) => u.key === key && (u.permanent || (u.expiresAt != null && u.expiresAt > now))
        );
      },


      pushLive: (text) => {
        const item = {
          id: `lf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          text,
          at: Date.now(),
        };
        set((s) => ({ liveFeed: [item, ...(s.liveFeed || [])].slice(0, 40) }));
      },

      coinMultiplier: () => {
        const exp = get().boostExpiresAt;
        if (exp && exp > Date.now()) return 2;
        return 1;
      },

      isVipActive: () => {
        const exp = get().vipExpiresAt;
        return !!(exp && exp > Date.now());
      },

      buyShopItem: (shopId) => {
        const def = SHOP_ITEMS.find((x) => x.id === shopId);
        if (!def) return { ok: false, message: "Không có vật phẩm" };
        const s = get();
        if (s.coins < def.cost) return { ok: false, message: `Cần ${def.cost} xu` };

        // Pass XP — ưu tiên gọi qua UI (buyXpPack); fallback trừ xu + cộng XP qua localStorage bridge
        if (def.kind === "pass_xp") {
          const add = Math.max(0, parseInt(def.meta || "0", 10) || 0);
          set({ coins: s.coins - def.cost });
          try {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("opus-pass-add-xp", { detail: { xp: add } }));
            }
          } catch { /* */ }
          get().pushLive(`+${add} Pass XP`);
          return { ok: true, message: `+${add} Pass XP` };
        }

        // Nâng điểm VIP bằng xu (không cộng totalEarned làm điểm VIP)
        if (def.kind === "vip_xp") {
          const add = Math.max(0, parseInt(def.meta || "1000", 10) || 1000);
          set({
            coins: s.coins - def.cost,
            vipPoints: (s.vipPoints || 0) + add,
          });
          get().pushLive(`+${add} điểm VIP`);
          return { ok: true, message: `+${add} điểm VIP (tiến cấp)` };
        }

        // Gói xu: cộng thẳng — không cộng điểm VIP
        if (def.kind === "coins") {
          const add = Math.max(0, parseInt(def.meta || "0", 10) || 0);
          set({
            coins: s.coins - def.cost + add,
            totalEarned: s.totalEarned + add,
          });
          get().pushLive(`Nhận gói +${add} xu`);
          return { ok: true, message: `+${add} xu vào ví` };
        }

        // Hộp quà / vật phẩm khác → vào kho (hộp mở sau)
        const finalName = def.name;
        const finalKind = def.kind;
        const finalMeta = def.meta;
        const inv = [...(s.inventory || [])];
        const existing = inv.find(
          (i) => i.kind === finalKind && i.meta === finalMeta && i.name === finalName
        );
        if (existing) existing.qty += 1;
        else {
          inv.unshift({
            id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            shopId: def.id,
            name: finalName,
            kind: finalKind as InventoryItem["kind"],
            meta: finalMeta,
            qty: 1,
            acquiredAt: Date.now(),
          });
        }
        set({ coins: s.coins - def.cost, inventory: inv });
        get().pushLive(`Bạn vừa đổi ${finalName}`);
        return { ok: true, message: `Đã thêm vào kho: ${finalName}` };
      },

      equipItem: (invId) => {
        const item = (get().inventory || []).find((i) => i.id === invId);
        if (!item) return { ok: false, message: "Không tìm thấy" };
        if (item.kind === "frame") {
          const frame = item.meta || null;
          set({ equippedFrame: frame });
          try {
            const raw = localStorage.getItem("opusfilm-settings");
            if (raw && frame) {
              const j = JSON.parse(raw);
              const state = j?.state || j;
              if (state) {
                state.avatarFrame = frame;
                if (state.profile) state.profile.avatarFrame = frame;
                localStorage.setItem("opusfilm-settings", JSON.stringify(j.state ? j : { state }));
              }
            }
          } catch { /* */ }
          return { ok: true, message: "Đã trang bị khung viền" };
        }
        if (item.kind === "badge") {
          set({ equippedBadge: item.meta || null });
          return { ok: true, message: "Đã trang bị huy hiệu" };
        }
        return { ok: false, message: "Không trang bị được vật phẩm này" };
      },

      activateItem: (invId) => {
        const s = get();
        const inv = [...(s.inventory || [])];
        const idx = inv.findIndex((i) => i.id === invId);
        if (idx < 0) return { ok: false, message: "Không tìm thấy" };
        const item = inv[idx];
        if (item.kind === "boost") {
          item.qty -= 1;
          if (item.qty <= 0) inv.splice(idx, 1);
          const DAY = 86400000;
          const base = Math.max(Date.now(), s.boostExpiresAt || 0);
          const until = base + DAY;
          set({ inventory: inv, boostExpiresAt: until });
          const h = Math.round((until - Date.now()) / 3600000);
          return { ok: true, message: `x2 xu · còn ~${h}h (cộng dồn)` };
        }
        if (item.kind === "vip") {
          item.qty -= 1;
          if (item.qty <= 0) inv.splice(idx, 1);
          let hours = 24;
          if (item.meta === "vip12") hours = 12;
          if (item.meta === "vip72") hours = 72;
          if (item.meta === "vip168") hours = 168;
          const MS = hours * 3600000;
          const base = Math.max(Date.now(), s.vipExpiresAt || 0);
          const until = base + MS;
          set({ inventory: inv, vipExpiresAt: until });
          const h = Math.round((until - Date.now()) / 3600000);
          return { ok: true, message: `VIP · còn ~${h}h (cộng dồn)` };
        }
        if (item.kind === "unlock") {
          const key =
            item.meta === "movie"
              ? `credit:movie:${Date.now()}`
              : `credit:episode:${Date.now()}`;
          item.qty -= 1;
          if (item.qty <= 0) inv.splice(idx, 1);
          set({
            inventory: inv,
            unlocks: [
              ...s.unlocks,
              { key, permanent: true, expiresAt: null, spent: 0, at: Date.now() },
            ],
          });
          return { ok: true, message: "Đã kích hoạt thẻ mở khóa" };
        }
        return { ok: false, message: "Dùng Trang bị cho khung/huy hiệu" };
      },

      openMysteryBox: (invId) => {
        const s = get();
        const inv = [...(s.inventory || [])];
        const idx = inv.findIndex((i) => i.id === invId);
        if (idx < 0) return { ok: false, message: "Không tìm thấy hộp" };
        const box = inv[idx];
        if (box.kind !== "mystery") return { ok: false, message: "Không phải hộp quà" };
        box.qty -= 1;
        if (box.qty <= 0) inv.splice(idx, 1);

        const pool = SHOP_ITEMS.filter((x) => x.kind !== "mystery" && x.kind !== "coins");
        // hộp vàng/crystal bias
        let pick = pool[Math.floor(Math.random() * pool.length)];
        if (box.meta === "box-gold" || box.meta === "box-crystal") {
          const rare = pool.filter((x) => x.kind === "frame" || x.kind === "badge" || x.kind === "vip");
          if (rare.length && Math.random() < 0.65) pick = rare[Math.floor(Math.random() * rare.length)];
        }
        if (box.meta === "box-mini") {
          const small = pool.filter((x) => x.cost <= 160);
          if (small.length) pick = small[Math.floor(Math.random() * small.length)];
        }

        // 20% chance pure coins
        if (Math.random() < 0.2) {
          const bonus = 40 + Math.floor(Math.random() * 120);
          set({
            inventory: inv,
            coins: s.coins + bonus,
            totalEarned: s.totalEarned + bonus,
          });
          get().pushLive(`Mở hộp: +${bonus} xu`);
          return { ok: true, message: `Mở hộp nhận +${bonus} xu` };
        }

        const existing = inv.find(
          (i) => i.kind === pick.kind && i.meta === pick.meta && i.name === pick.name
        );
        if (existing) existing.qty += 1;
        else {
          inv.unshift({
            id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            shopId: pick.id,
            name: pick.name,
            kind: pick.kind,
            meta: pick.meta,
            qty: 1,
            acquiredAt: Date.now(),
          });
        }
        set({ inventory: inv });
        get().pushLive(`Mở hộp: ${pick.name}`);
        return { ok: true, message: `Nhận được: ${pick.name}` };
      },


      luckySpin: () => {
        const s = get();
        if (s.coins < SPIN_COST) return { ok: false, message: `Cần ${SPIN_COST} xu` };
        const totalW = SPIN_REWARDS.reduce((n, r) => n + r.weight, 0);
        let r = Math.random() * totalW;
        let pick = SPIN_REWARDS[0];
        for (const item of SPIN_REWARDS) {
          r -= item.weight;
          if (r <= 0) {
            pick = item;
            break;
          }
        }
        set({ coins: s.coins - SPIN_COST });
        if (pick.coins) {
          set((st) => ({
            coins: st.coins + (pick.coins || 0),
            totalEarned: st.totalEarned + (pick.coins || 0),
          }));
          get().pushLive(`Vòng quay: +${pick.coins} xu`);
          return { ok: true, message: `Trúng ${pick.label}!`, label: pick.label };
        }
        if (pick.shopId) {
          const def = SHOP_ITEMS.find((x) => x.id === pick.shopId);
          if (def) {
            const inv = [...(get().inventory || [])];
            inv.unshift({
              id: `inv_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
              shopId: def.id,
              name: def.name,
              kind: def.kind,
              meta: def.meta,
              qty: 1,
              acquiredAt: Date.now(),
            });
            set({ inventory: inv });
            get().pushLive(`Vòng quay: ${def.name}`);
            return { ok: true, message: `Trúng ${def.name}!`, label: def.name };
          }
        }
        return { ok: true, message: "Chúc may mắn!", label: pick.label };
      },

      dailyMissionSummary: () => {
        get().ensureMissionDay();
        const s = get();
        let done = 0;
        for (const m of DAILY_MISSIONS) {
          done += s.missionClaimCount?.[m.id] || 0;
        }
        // Không trần — % hiển thị theo số nhiệm vụ đã claim ít nhất 1 lần
        const started = DAILY_MISSIONS.filter(
          (m) => (s.missionClaimCount?.[m.id] || 0) > 0 || (s.missionProgress?.[m.id] || 0) > 0
        ).length;
        const total = Math.max(1, DAILY_MISSIONS.length);
        return {
          done,
          total,
          pct: Math.min(100, Math.round((started / total) * 100)),
        };
      },
    }),
    { name: "opusfilm-event-coins-v2" }
  )
);
