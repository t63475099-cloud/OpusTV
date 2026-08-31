"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useNotifStore } from "@/lib/notifications";

export default function NotificationBell() {
  const items = useNotifStore((s) => s.items);
  const unread = useNotifStore((s) => s.unreadCount());
  const markRead = useNotifStore((s) => s.markRead);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-white/10 text-zinc-200 transition"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(92vw,340px)] max-h-[70vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl z-50">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-white/10">
            <p className="text-sm font-semibold text-white">Thông báo</p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-sky-400"
                onClick={() => markAllRead()}
              >
                Đã đọc hết
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="text-sm text-zinc-500 p-4 text-center">Chưa có thông báo</p>
          ) : (
            <ul className="py-1">
              {items.slice(0, 30).map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href || "#"}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                    className={`block px-3 py-2.5 hover:bg-white/5 ${
                      n.read ? "opacity-70" : ""
                    }`}
                  >
                    <p className="text-sm text-white font-medium">{n.title}</p>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.body}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
