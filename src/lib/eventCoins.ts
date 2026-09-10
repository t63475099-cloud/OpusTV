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
export const MISSION_REWARD = 100;
/** Không giới hạn số lần nhận mỗi nhiệm vụ / ngày */
export const MISSION_MAX_CLAIMS = Number.POSITIVE_INFINITY;

/** Chi phí 1 lượt vòng quay */
export const SPIN_COST = 100;

export type ShopItemKind = "unlock" | "frame" | "badge" | "boost" | "vip" | "mystery" | "coins";

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
  { id: "card_ep", name: "Thẻ mở 1 tập", desc: "Mở khóa 1 tập phim bất kỳ", cost: 50, kind: "unlock", meta: "episode", icon: "🎬" },
  { id: "card_movie", name: "Thẻ xem trọn bộ", desc: "Mở cả series một lần", cost: 120, kind: "unlock", meta: "movie", icon: "🍿" },
  { id: "vip_1d", name: "VIP OpusFilm 1 ngày", desc: "Huy hiệu VIP trong 24 giờ", cost: 200, kind: "vip", meta: "vip24", icon: "👑" },
  { id: "frame_conic", name: "Khung Conic Spin", desc: "Viền avatar xoay đa sắc", cost: 300, kind: "frame", meta: "frame:conic-rainbow", icon: "🌀" },
  { id: "frame_plasma", name: "Khung Cyber Plasma", desc: "Viền plasma công nghệ", cost: 350, kind: "frame", meta: "frame:neon-flicker", icon: "⚡" },
  { id: "badge_mot", name: "Huy hiệu Mọt Phim", desc: "Danh hiệu Mọt Phim Kỳ Cựu", cost: 150, kind: "badge", meta: "badge:mot-phim", icon: "🏅" },
  { id: "badge_tycoon", name: "Huy hiệu Đại Gia Xu", desc: "Danh hiệu Đại Gia Xu", cost: 180, kind: "badge", meta: "badge:dai-gia", icon: "💎" },
  { id: "boost_x2", name: "Nhân đôi xu x2", desc: "Xu nhiệm vụ x2 trong 24 giờ", cost: 250, kind: "boost", meta: "x2", icon: "✨" },
  { id: "mystery", name: "Hộp quà bí ẩn", desc: "Ngẫu nhiên xu hoặc vật phẩm", cost: 80, kind: "mystery", icon: "🎁" },
];

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
  totalEarned: number;
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
        // Trừ 1 lần target, cộng 100 xu, +1 claim
        const nextProg = cur - def.target;
        const nextClaims = claims + 1;
        const mult = get().coinMultiplier();
        const gain = MISSION_REWARD * mult;
        set({
          missionProgress: { ...s.missionProgress, [id]: nextProg },
          missionClaimCount: { ...s.missionClaimCount, [id]: nextClaims },
          coins: s.coins + gain,
          totalEarned: s.totalEarned + gain,
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

        let finalName = def.name;
        let finalKind = def.kind;
        let finalMeta = def.meta;
        let bonusCoins = 0;
        if (def.kind === "mystery") {
          const roll = Math.random();
          if (roll < 0.45) {
            bonusCoins = 30 + Math.floor(Math.random() * 70);
            set({
              coins: s.coins - def.cost + bonusCoins,
              totalEarned: s.totalEarned + bonusCoins,
            });
            get().pushLive(`Bạn mở hộp quà nhận +${bonusCoins} xu`);
            return { ok: true, message: `+${bonusCoins} xu từ hộp quà` };
          } else if (roll < 0.7) {
            finalName = "Thẻ mở 1 tập (hộp quà)";
            finalKind = "unlock";
            finalMeta = "episode";
          } else if (roll < 0.88) {
            finalName = "Khung Conic (hộp quà)";
            finalKind = "frame";
            finalMeta = "frame:conic-rainbow";
          } else {
            finalName = "Huy hiệu Mọt Phim (hộp quà)";
            finalKind = "badge";
            finalMeta = "badge:mot-phim";
          }
        }

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
          const DAY = 86400000;
          const base = Math.max(Date.now(), s.vipExpiresAt || 0);
          const until = base + DAY;
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
