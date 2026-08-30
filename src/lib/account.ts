import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSettingsStore } from "./settings";

interface AccountState {
  username: string | null;
  lastSyncAt: number | null;
  login: (username: string, pass: string) => Promise<{ ok: boolean; error?: string }>;
  register: (username: string, pass: string, pin: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  syncNow: () => Promise<{ ok: boolean; error?: string }>;
  resetPassword: (username: string, pin: string, newPass: string) => Promise<{ ok: boolean; error?: string }>;
  refreshMe: () => Promise<void>;
}

export const useAccountStore = create<AccountState>()(
  persist(
    (set, get) => ({
      username: null,
      lastSyncAt: null,

      login: async (username: string, pass: string) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: pass }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return { ok: false, error: data.error || "Đăng nhập thất bại" };
          }
          set({ username: data.username || username, lastSyncAt: Date.now() });
          await get().syncNow();
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e?.message || "Lỗi mạng" };
        }
      },

      register: async (username: string, pass: string, pin: string) => {
        try {
          const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password: pass, recoveryPin: pin }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return { ok: false, error: data.error || "Đăng ký thất bại" };
          }
          set({ username: data.username || username, lastSyncAt: Date.now() });
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e?.message || "Lỗi mạng" };
        }
      },

      logout: async () => {
        try {
          await fetch("/api/auth/logout", { method: "POST" });
        } catch {
          // bỏ qua lỗi mạng khi logout
        }
        set({ username: null, lastSyncAt: null });
      },

      syncNow: async () => {
        try {
          const currentAvatar = useSettingsStore.getState().profile.avatar;

          const res = await fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              avatar: currentAvatar || null,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return { ok: false, error: data.error || "Đồng bộ thất bại" };
          }

          if (data.user?.avatar) {
            useSettingsStore.getState().setAvatar(data.user.avatar);
          }

          set({ lastSyncAt: Date.now() });
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e?.message || "Lỗi đồng bộ" };
        }
      },

      refreshMe: async () => {
        await get().syncNow();
      },

      resetPassword: async (username: string, pin: string, newPass: string) => {
        try {
          const res = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, recoveryPin: pin, newPassword: newPass }),
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            return { ok: false, error: data.error || "Khôi phục thất bại" };
          }
          return { ok: true };
        } catch (e: any) {
          return { ok: false, error: e?.message || "Lỗi mạng" };
        }
      },
    }),
    {
      name: "opusfilm-account-storage",
    }
  )
);
