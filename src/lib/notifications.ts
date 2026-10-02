"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotifKind =
  | "reply"
  | "verify"
  | "verify_ok"
  | "verify_no"
  | "level"
  | "system"
  | "streak"
  | "like"
  | "key"
  | "mission"
  | "chat";

export interface AppNotification {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: number;
}

interface NotifState {
  items: AppNotification[];
  /** id đã xử lý để không spam (vd: verify approved) */
  seenKeys: string[];
  add: (n: Omit<AppNotification, "id" | "read" | "createdAt"> & { dedupeKey?: string }) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
  clear: () => void;
  markChatRead: () => void;
}

export const useNotifStore = create<NotifState>()(
  persist(
    (set, get) => ({
      items: [],
      seenKeys: [],
      add: (n) => {
        const dedupe = n.dedupeKey;
        if (dedupe && get().seenKeys.includes(dedupe)) return;
        const { dedupeKey: _, ...rest } = n as typeof n & { dedupeKey?: string };
        const now = Date.now();
        // Chặn spam: cùng title + body trong 15 giây
        const recent = get().items[0];
        if (
          recent &&
          recent.title === rest.title &&
          recent.body === rest.body &&
          now - recent.createdAt < 15_000
        ) {
          return;
        }
        set((s) => ({
          seenKeys: dedupe ? [...s.seenKeys, dedupe].slice(-200) : s.seenKeys,
          items: [
            {
              ...rest,
              id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
              read: false,
              createdAt: now,
            },
            ...s.items,
          ].slice(0, 100),
        }));
      },
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, read: true } : x)),
        })),
      markAllRead: () =>
        set((s) => ({ items: s.items.map((x) => ({ ...x, read: true })) })),
      unreadCount: () => get().items.filter((x) => !x.read).length,
      clear: () => set({ items: [] }),
      /** Đánh dấu đã đọc mọi thông báo chat (hoặc theo peer trong title/body) */
      markChatRead: () =>
        set((s) => ({
          items: s.items.map((x) => (x.kind === "chat" ? { ...x, read: true } : x)),
        })),
    }),
    { name: "opusfilm-notifications" }
  )
);
