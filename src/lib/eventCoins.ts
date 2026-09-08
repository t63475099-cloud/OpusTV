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
/** Số lần nhận tối đa mỗi nhiệm vụ / ngày */
export const MISSION_MAX_CLAIMS = 10;

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
  /** Số lần đã nhận thưởng mỗi nhiệm vụ hôm nay (0–10) */
  missionClaimCount: ClaimCountMap;
  unlocks: UnlockRecord[];
  totalEarned: number;
  episodeSlugsToday: string[];

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
        const claims = s.missionClaimCount?.[id] || 0;
        if (claims >= MISSION_MAX_CLAIMS) return;
        const cur = s.missionProgress[id] || 0;
        // Cho phép vượt target để user claim nhiều lần; cap ở target * remaining claims
        const maxProg = def.target * (MISSION_MAX_CLAIMS - claims);
        if (cur >= maxProg) return;
        set({
          missionProgress: {
            ...s.missionProgress,
            [id]: Math.min(maxProg, cur + amount),
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
        if (claims >= MISSION_MAX_CLAIMS) {
          return { ok: false, coins: 0, message: `Đã nhận tối đa ${MISSION_MAX_CLAIMS} lần` };
        }
        const cur = s.missionProgress[id] || 0;
        if (cur < def.target) {
          return { ok: false, coins: 0, message: "Chưa đủ tiến độ" };
        }
        // Trừ 1 lần target, cộng 100 xu, +1 claim
        const nextProg = cur - def.target;
        const nextClaims = claims + 1;
        set({
          missionProgress: { ...s.missionProgress, [id]: nextProg },
          missionClaimCount: { ...s.missionClaimCount, [id]: nextClaims },
          coins: s.coins + MISSION_REWARD,
          totalEarned: s.totalEarned + MISSION_REWARD,
        });
        return {
          ok: true,
          coins: MISSION_REWARD,
          message: `+${MISSION_REWARD} xu · Lần ${nextClaims}/${MISSION_MAX_CLAIMS}`,
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

      dailyMissionSummary: () => {
        get().ensureMissionDay();
        const s = get();
        let done = 0;
        const total = DAILY_MISSIONS.length * MISSION_MAX_CLAIMS;
        for (const m of DAILY_MISSIONS) {
          done += s.missionClaimCount?.[m.id] || 0;
        }
        return {
          done,
          total,
          pct: Math.round((done / total) * 100),
        };
      },
    }),
    { name: "opusfilm-event-coins-v1" }
  )
);
