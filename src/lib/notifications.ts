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
  | "mission";

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
        set((s) => ({
          seenKeys: dedupe ? [...s.seenKeys, dedupe].slice(-200) : s.seenKeys,
          items: [
            {
              ...rest,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              read: false,
              createdAt: Date.now(),
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
    }),
    { name: "opusfilm-notifications" }
  )
);
