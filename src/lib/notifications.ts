"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotifKind = "reply" | "verify" | "level" | "system";

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
  add: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: () => number;
}

export const useNotifStore = create<NotifState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (n) =>
        set((s) => ({
          items: [
            {
              ...n,
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              read: false,
              createdAt: Date.now(),
            },
            ...s.items,
          ].slice(0, 80),
        })),
      markRead: (id) =>
        set((s) => ({
          items: s.items.map((x) => (x.id === id ? { ...x, read: true } : x)),
        })),
      markAllRead: () =>
        set((s) => ({ items: s.items.map((x) => ({ ...x, read: true })) })),
      unreadCount: () => get().items.filter((x) => !x.read).length,
    }),
    { name: "opusfilm-notifications" }
  )
);
