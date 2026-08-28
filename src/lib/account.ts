"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SyncPayload } from "./userData";
import { mergePayload } from "./userData";
import { useHistoryStore } from "./history";
import { useFavoritesStore } from "./favorites";
import { useMusicHistoryStore } from "./musicHistory";
import { useSettingsStore } from "./settings";

interface AccountState {
  username: string | null;
  storage: "neon" | null;
  lastSyncAt: number | null;
  setSession: (username: string) => void;
  logout: () => Promise<void>;
  collectLocal: () => SyncPayload;
  applyRemote: (data: SyncPayload) => void;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, password: string, phone: string) => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (username: string, phone: string, otp: string, newPassword: string) => Promise<{ ok: boolean; error?: string; message?: string }>;
  sendOtp: (username: string, phone: string) => Promise<{ ok: boolean; error?: string; retryAfter?: number; message?: string; otp?: string }>;
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
        useSettingsStore.setState((s) => ({
          profile: { ...s.profile, loggedIn: false },
        }));
      },

      collectLocal: () => {
        const history = useHistoryStore.getState().history;
        const favorites = useFavoritesStore.getState().favorites;
        const musicWatched = useMusicHistoryStore.getState().watched;
        const settings = useSettingsStore.getState().settings;
        const profile = useSettingsStore.getState().profile;
        return {
          history,
          favorites,
          musicWatched,
          settings,
          profile,
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
          useSettingsStore.setState((s) => ({
            profile: {
              ...s.profile,
              ...(data.profile as object),
              loggedIn: true,
            },
          }));
        }
      },

      register: async (username, password, phone: string) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, phone }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Đăng ký thất bại" };
          get().setSession(data.username);
          // Đẩy dữ liệu local lên Neon (merge)
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: get().collectLocal() }),
          });
          set({ lastSyncAt: Date.now() });
          useSettingsStore.setState((s) => ({
            profile: { ...s.profile, name: data.username, loggedIn: true },
          }));
          return { ok: true };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },

      login: async (username, password) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Đăng nhập thất bại" };
          get().setSession(data.username);
          const local = get().collectLocal();
          const remote = (data.data || {
            history: [],
            favorites: [],
            musicWatched: [],
            updatedAt: 0,
          }) as SyncPayload;
          const merged = mergePayload(local, remote);
          get().applyRemote(merged);
          await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: merged }),
          });
          set({ lastSyncAt: Date.now() });
          useSettingsStore.setState((s) => ({
            profile: { ...s.profile, name: data.username, loggedIn: true },
          }));
          return { ok: true };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },

      syncNow: async () => {
        if (!get().username) return { ok: false, error: "Chưa đăng nhập" };
        try {
          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: get().collectLocal() }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Đồng bộ lỗi" };
          if (data.data) get().applyRemote(data.data);
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
          } else {
            set({ username: null, storage: null });
          }
        } catch {
          /* ignore */
        }
      },

      resetPassword: async (username, phone, otp, newPassword) => {
        try {
          const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, phone, otp, newPassword }),
          });
          const data = await res.json();
          if (!data.ok) return { ok: false, error: data.error || "Không đặt lại được" };
          return { ok: true, message: data.message };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },

      sendOtp: async (username, phone) => {
        try {
          const res = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, phone }),
          });
          const data = await res.json();
          if (!data.ok)
            return {
              ok: false,
              error: data.error || "Không gửi OTP",
              retryAfter: data.retryAfter,
            };
          return {
            ok: true,
            message: data.message,
            retryAfter: data.retryAfter || 60,
            otp: data.otp,
          };
        } catch {
          return { ok: false, error: "Không kết nối được máy chủ" };
        }
      },
    }),
    { name: "opusfilm-account-session" }
  )
);
