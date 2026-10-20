"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus, X } from "lucide-react";
import { useAccountStore } from "@/lib/account";

type ToastItem = {
  id: string;
  title: string;
  fromUsername: string | null;
};

/**
 * Poll hòm thư mỗi 20s khi đã đăng nhập.
 * Toast góc trên 10 giây khi có lời mời kết bạn mới (unread, kind friend_request).
 */
export default function FriendRequestToast() {
  const username = useAccountStore((s) => s.username);
  const seenRef = useRef<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!username) return;

    const poll = async () => {
      try {
        const res = await fetch("/api/inbox?category=friend", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.ok || !Array.isArray(data.items)) return;
        for (const item of data.items) {
          if (item.isRead || item.isHandled) continue;
          if (item.kind !== "friend_request") continue;
          const id = String(item.id);
          if (seenRef.current.has(id)) continue;
          seenRef.current.add(id);
          const toast: ToastItem = {
            id,
            title: String(item.title || "Có lời mời kết bạn mới"),
            fromUsername: item.fromUsername || null,
          };
          setToasts((list) => [...list, toast].slice(-3));
          window.setTimeout(() => dismiss(id), 10_000);
        }
      } catch {
        /* */
      }
    };

    void poll();
    const t = window.setInterval(poll, 20_000);
    return () => window.clearInterval(t);
  }, [username, dismiss]);

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-3 z-[120] flex flex-col items-center gap-2 px-3 sm:items-end sm:pr-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-violet-500/40 bg-[#13141C] px-3.5 py-3 shadow-xl animate-in fade-in slide-in-from-top-2 duration-300"
          role="status"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300">
            <UserPlus className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#F4F0E8] leading-snug">
              {t.title}
            </p>
            <Link
              href="/hop-thu?tab=friend"
              className="mt-1 inline-block text-xs font-medium text-violet-300 hover:text-violet-200"
              onClick={() => dismiss(t.id)}
            >
              Xem hòm thư
            </Link>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-md p-1 text-[#94A3B8] hover:text-white"
            aria-label="Đóng"
            onClick={() => dismiss(t.id)}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
      ))}
    </div>
  );
}
