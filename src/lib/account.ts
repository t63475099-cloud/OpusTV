"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SyncPayload } from "./userData";
import { mergePayload } from "./userData";
import { useHistoryStore } from "./history";
import { useFavoritesStore } from "./favorites";
import { useMusicHistoryStore } from "./musicHistory";
import { useSettingsStore } from "./settings";
import { useEventStore } from "./eventCoins";
import { useOpusPassStore } from "./opusPass";

interface AccountState {
  username: string | null;
  storage: "neon" | null;
  lastSyncAt: number | null;
  setSession: (username: string) => void;
  logout: () => Promise<void>;
  collectLocal: () => SyncPayload;
  applyRemote: (data: SyncPayload) => void;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, password: string, recoveryPin: string, activationKey: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (username: string, recoveryPin: string, newPassword: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  syncNow: () => Promise<{ ok: boolean; error?: string }>;
  refreshMe: () => Promise<void>;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      username: null,
      storage: null,
      lastSyncAt: null,

      setSession: (username) => set({ username, storage: "neon" }),

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          /* ignore */
        }
        set({ username: null, storage: null, lastSyncAt: null });
        // Xóa sạch hồ sơ local — tránh tên/avatar tài khoản A dính sang B
        useSettingsStore.getState().logout();
      },

      collectLocal: () => {
        const history = useHistoryStore.getState().history;
        const favorites = useFavoritesStore.getState().favorites;
        const musicWatched = useMusicHistoryStore.getState().watched;
        const settings = useSettingsStore.getState().settings;
        const profile = useSettingsStore.getState().profile;
        const ev = useEventStore.getState();
        const pass = useOpusPassStore.getState();
        return {
          history,
          favorites,
          musicWatched,
          settings,
          profile,
          events: {
            coins: ev.coins,
            totalEarned: ev.totalEarned,
            vipPoints: ev.vipPoints || 0,
            streakDay: ev.streakDay,
            lastCheckIn: ev.lastCheckIn,
            claimedCheckInDay: ev.claimedCheckInDay,
            missionDay: ev.missionDay,
            missionProgress: { ...(ev.missionProgress || {}) },
            missionClaimCount: { ...(ev.missionClaimCount || {}) },
            unlocks: [...(ev.unlocks || [])],
            episodeSlugsToday: [...(ev.episodeSlugsToday || [])],
            inventory: [...(ev.inventory || [])],
            equippedFrame: ev.equippedFrame,
            equippedBadge: ev.equippedBadge,
            boostExpiresAt: ev.boostExpiresAt,
            vipExpiresAt: ev.vipExpiresAt,
            redeemHistory: [...(ev.redeemHistory || [])],
            liveFeed: [...(ev.liveFeed || [])].slice(0, 20),
            updatedAt: Date.now(),
          },
          opusPass: {
            season: pass.season || 1,
            seasonStartedAt: pass.seasonStartedAt || Date.now(),
            xp: pass.xp || 0,
            premium: !!pass.premium,
            claimedFree: [...(pass.claimedFree || [])],
            claimedPremium: [...(pass.claimedPremium || [])],
            updatedAt: Date.now(),
          },
          updatedAt: Date.now(),
        };
      },

      applyRemote: (data) => {
        if (Array.isArray(data.history)) {
          useHistoryStore.setState({ history: data.history as never[] });
        }
        if (Array.isArray(data.favorites)) {
          useFavoritesStore.setState({ favorites: data.favorites as never[] });
        }
        if (Array.isArray(data.musicWatched)) {
          useMusicHistoryStore.getState().replaceAll(data.musicWatched as never[]);
        }
        if (data.settings && typeof data.settings === "object") {
          useSettingsStore.setState((s) => ({
            settings: { ...s.settings, ...(data.settings as object) },
          }));
        }
        if (data.profile && typeof data.profile === "object") {
          useSettingsStore.setState((s) => {
            const remote = data.profile as Record<string, unknown>;
            const local = s.profile;
            const rt = Number(remote.profileUpdatedAt) || 0;
            const lt = Number(local.profileUpdatedAt) || 0;
            // Hồ sơ identity: lấy bản mới hơn (tránh avatar/tên bị kéo về bản cũ)
            const useRemote = rt >= lt;
            const src = useRemote ? remote : (local as unknown as Record<string, unknown>);
            const other = useRemote ? (local as unknown as Record<string, unknown>) : remote;
            const name =
              String(src.name ?? "").trim() ||
              String(other.name ?? "").trim() ||
              get().username ||
              "";
            const avatar =
              (typeof src.avatar === "string" && src.avatar) ||
              (typeof other.avatar === "string" && other.avatar) ||
              undefined;
            const remoteUid = String(remote.uid ?? "").trim();
            const localUid = String(local.uid || "").trim();
            return {
              profile: {
                ...local,
                ...remote,
                name,
                avatar,
                avatarPosition:
                  String(src.avatarPosition || other.avatarPosition || "50% 50%"),
                avatarFrame: String(
                  src.avatarFrame || other.avatarFrame || "frame:none"
                ),
                bio: String(src.bio ?? other.bio ?? ""),
                uid: remoteUid || localUid || "",
                verified: !!(remote.verified ?? local.verified),
                loggedIn: true,
                profileUpdatedAt: Math.max(rt, lt) || Date.now(),
              },
            };
          });
        }
        // Sự kiện / VIP / kho
        if (data.events && typeof data.events === "object") {
          const e = data.events as Record<string, unknown>;
          useEventStore.setState({
            coins: Number(e.coins) || 0,
            totalEarned: Number(e.totalEarned) || 0,
            vipPoints: Number(e.vipPoints) || 0,
            streakDay: Number(e.streakDay) || 0,
            lastCheckIn: (e.lastCheckIn as string) || null,
            claimedCheckInDay: (e.claimedCheckInDay as string) || null,
            missionDay: (e.missionDay as string) || null,
            missionProgress: (e.missionProgress as never) || {},
            missionClaimCount: (e.missionClaimCount as never) || {},
            unlocks: Array.isArray(e.unlocks) ? (e.unlocks as never[]) : [],
            episodeSlugsToday: Array.isArray(e.episodeSlugsToday)
              ? (e.episodeSlugsToday as string[])
              : [],
            inventory: Array.isArray(e.inventory) ? (e.inventory as never[]) : [],
            equippedFrame: (e.equippedFrame as string) || null,
            equippedBadge: (e.equippedBadge as string) || null,
            boostExpiresAt: e.boostExpiresAt ? Number(e.boostExpiresAt) : null,
            vipExpiresAt: e.vipExpiresAt ? Number(e.vipExpiresAt) : null,
            redeemHistory: Array.isArray(e.redeemHistory) ? (e.redeemHistory as never[]) : [],
            liveFeed: Array.isArray(e.liveFeed) ? (e.liveFeed as never[]) : [],
          });
        }
        // Opus Pass
        if (data.opusPass && typeof data.opusPass === "object") {
          const p = data.opusPass as Record<string, unknown>;
          useOpusPassStore.setState({
            season: Number(p.season) || 1,
            seasonStartedAt: Number(p.seasonStartedAt) || Date.now(),
            xp: Number(p.xp) || 0,
            premium: !!p.premium,
            claimedFree: Array.isArray(p.claimedFree) ? (p.claimedFree as number[]) : [],
            claimedPremium: Array.isArray(p.claimedPremium)
              ? (p.claimedPremium as number[])
              : [],
          });
        }
      },

      register: async (username, password, recoveryPin: string, activationKey: string) => {
        try {
          const { collectDeviceInfoAsync } = await import("@/lib/deviceInfo");
          const device = await collectDeviceInfoAsync();
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username,
              password,
              recoveryPin,
              activationKey,
              ...device,
              device,
            }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Đăng ký thất bại" };
          get().setSession(data.username);
          // Hồ sơ mới sạch — đúng username lúc tạo, không avatar guest
          useSettingsStore.setState({
            profile: {
              name: String(data.username),
              uid: data.uid || "",
              bio: "",
              email: "",
              avatar: undefined,
              avatarPosition: "50% 50%",
              avatarFrame: "frame:none",
              verified: false,
              loggedIn: true,
              profileUpdatedAt: Date.now(),
            },
          });
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: get().collectLocal() }),
          });
          set({ lastSyncAt: Date.now() });
          return { ok: true };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },

      login: async (username, password) => {
        try {
          const { collectDeviceInfoAsync } = await import("@/lib/deviceInfo");
          const device = await collectDeviceInfoAsync();
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, ...device, device }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Đăng nhập thất bại" };
          get().setSession(data.username);
          const remote = (data.data || {
            history: [],
            favorites: [],
            musicWatched: [],
            updatedAt: 0,
          }) as SyncPayload;
          const remoteProfile = (remote.profile || {}) as Record<string, unknown>;
          const accountName =
            String(remoteProfile.name || "").trim() || String(data.username || username);
          const accountUid = String(data.uid || remoteProfile.uid || "").trim();
          const accountAvatar =
            typeof remoteProfile.avatar === "string" ? remoteProfile.avatar : undefined;

          // Bỏ profile guest local — chỉ lấy dữ liệu gắn tài khoản server
          const local = get().collectLocal();
          const merged = mergePayload(
            {
              ...local,
              profile: {
                name: accountName,
                uid: accountUid,
                avatar: accountAvatar,
                avatarPosition: remoteProfile.avatarPosition || "50% 50%",
                avatarFrame: remoteProfile.avatarFrame || "frame:none",
                bio: remoteProfile.bio || "",
                verified: !!remoteProfile.verified,
                loggedIn: true,
                profileUpdatedAt: Number(remoteProfile.profileUpdatedAt) || Date.now(),
              },
            },
            {
              ...remote,
              profile: {
                ...remoteProfile,
                name: accountName,
                uid: accountUid || remoteProfile.uid,
                avatar: accountAvatar ?? remoteProfile.avatar,
                loggedIn: true,
              },
            }
          );
          get().applyRemote(merged);
          useSettingsStore.setState({
            profile: {
              name: accountName,
              uid: accountUid,
              bio: String(remoteProfile.bio || ""),
              email: String(remoteProfile.email || ""),
              avatar: accountAvatar,
              avatarPosition: String(remoteProfile.avatarPosition || "50% 50%"),
              avatarFrame: String(remoteProfile.avatarFrame || "frame:none"),
              verified: !!remoteProfile.verified,
              loggedIn: true,
              profileUpdatedAt: Number(remoteProfile.profileUpdatedAt) || Date.now(),
            },
          });
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: merged }),
          });
          set({ lastSyncAt: Date.now() });
          return { ok: true };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },


      syncNow: async () => {
        if (!get().username) return { ok: false, error: "Chưa đăng nhập" };
        try {
          // Lấy remote trước để merge với local (xu/VIP/Pass không bị ghi đè thấp hơn)
          let remote: SyncPayload = {
            history: [],
            favorites: [],
            musicWatched: [],
            updatedAt: 0,
          };
          try {
            const getRes = await fetch("/api/auth/sync");
            const getData = await getRes.json();
            if (getData?.ok && getData.data) remote = getData.data as SyncPayload;
          } catch { /* */ }
          const local = get().collectLocal();
          const merged = mergePayload(local, remote);
          get().applyRemote(merged);
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: merged }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Đồng bộ lỗi" };
          if (data.data) {
            const again = mergePayload(get().collectLocal(), data.data as SyncPayload);
            get().applyRemote(again);
          }
          set({ lastSyncAt: Date.now() });
          return { ok: true };
        } catch {
          return { ok: false, error: "Mạng lỗi" };
        }
      },

      refreshMe: async () => {
        try {
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          if (data.ok && data.user?.username) {
            set({ username: data.user.username, storage: "neon" });
            if (data.user.uid) {
              useSettingsStore.setState((s) => ({
                profile: {
                  ...s.profile,
                  uid: data.user.uid,
                  verified: data.user.verified ?? s.profile.verified,
                  loggedIn: true,
                },
              }));
            }
          } else {
            set({ username: null, storage: null });
          }
        } catch {
          /* ignore */
        }
      },

      resetPassword: async (username, recoveryPin, newPassword) => {
        try {
          const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, recoveryPin, newPassword }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Không đặt lại được" };
          return { ok: true, message: data.message };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },

    }),
    { name: "opusfilm-account-session" }
  )
);
