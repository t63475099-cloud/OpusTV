"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BadgeCheck,
  Sparkles,
  MessageCircle,
  Flame,
  Info,
  Heart,
  KeyRound,
  XCircle,
} from "lucide-react";
import { useNotifStore, type NotifKind } from "@/lib/notifications";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";

function NotifIcon({ kind }: { kind: NotifKind }) {
  const cls = "w-4 h-4 shrink-0";
  switch (kind) {
    case "verify":
    case "verify_ok":
      return <BadgeCheck className={`${cls} text-sky-400`} />;
    case "verify_no":
      return <XCircle className={`${cls} text-amber-400`} />;
    case "level":
      return <Sparkles className={`${cls} text-violet-400`} />;
    case "reply":
      return <MessageCircle className={`${cls} text-emerald-400`} />;
    case "streak":
      return <Flame className={`${cls} text-orange-400`} />;
    case "like":
      return <Heart className={`${cls} text-rose-400`} />;
    case "key":
      return <KeyRound className={`${cls} text-amber-300`} />;
    case "mission":
      return <Sparkles className={`${cls} text-amber-300`} />;
    default:
      return <Info className={`${cls} text-zinc-400`} />;
  }
}

export default function NotificationBell() {
  const items = useNotifStore((s) => s.items);
  const unread = useNotifStore((s) => s.unreadCount());
  const markRead = useNotifStore((s) => s.markRead);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const add = useNotifStore((s) => s.add);
  const username = useAccountStore((s) => s.username);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const profileVerified = useSettingsStore((s) => s.profile.verified);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Đồng bộ thông báo xác minh / hệ thống khi đã đăng nhập
  useEffect(() => {
    if (!username) return;

    const poll = async () => {
      try {
        const res = await fetch("/api/auth/verify");
        if (!res.ok) return;
        const data = await res.json();
        if (data.verified) {
          if (!profileVerified) {
            updateProfile({ verified: true });
            add({
              kind: "verify_ok",
              title: "Đã có tích xanh",
              body: "Yêu cầu xác minh đã được duyệt. Huy hiệu hiển thị trên hồ sơ và bình luận.",
              href: "/tai-khoan",
              dedupeKey: `verify-ok-${username}`,
            });
          }
        } else if (data.request?.status === "rejected") {
          add({
            kind: "verify_no",
            title: "Yêu cầu xác minh bị từ chối",
            body: "Bạn có thể gửi lại yêu cầu với thông tin đầy đủ hơn.",
            href: "/tai-khoan",
            dedupeKey: `verify-no-${data.request.id || username}`,
          });
        } else if (data.request?.status === "pending") {
          add({
            kind: "verify",
            title: "Đang chờ duyệt tích xanh",
            body: "Yêu cầu xác minh của bạn đang được xem xét (24–48 giờ).",
            href: "/tai-khoan",
            dedupeKey: `verify-pending-${data.request.id || username}`,
          });
        }
      } catch {
        /* */
      }
    };

    void poll();
    const t = setInterval(poll, 60_000);
    return () => clearInterval(t);
  }, [username, profileVerified, updateProfile, add]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-white/10 text-zinc-200 transition"
        aria-label="Thông báo"
      >
        <Bell className={`w-5 h-5 ${unread > 0 ? "text-white" : ""}`} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-[#0f0f0f] shadow-[0_0_8px_rgba(244,63,94,0.6)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-400 animate-ping opacity-75 pointer-events-none" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(92vw,360px)] max-h-[min(70vh,420px)] overflow-hidden rounded-2xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col">
          <div className="flex items-center justify-between px-3.5 py-3 border-b border-white/10 shrink-0">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-zinc-400" />
              Thông báo
              {unread > 0 && (
                <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded-full">
                  {unread} mới
                </span>
              )}
            </p>
            {unread > 0 && (
              <button
                type="button"
                className="text-xs text-sky-400 hover:text-sky-300"
                onClick={() => markAllRead()}
              >
                Đã đọc hết
              </button>
            )}
          </div>

          <div className="px-3 py-2 border-b border-white/5">
            <Link href="/hop-thu" onClick={() => setOpen(false)} className="text-xs text-sky-400 hover:underline">
              Mở hòm thư đầy đủ →
            </Link>
          </div>
          <div className="overflow-y-auto overscroll-contain flex-1">
            {items.length === 0 ? (
              <p className="text-sm text-zinc-500 p-6 text-center">Chưa có thông báo</p>
            ) : (
              <ul className="py-1">
                {items.slice(0, 40).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href || "/tai-khoan"}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className={`flex gap-2.5 px-3 py-2.5 hover:bg-white/5 transition ${
                        n.read ? "opacity-60" : "bg-white/[0.02]"
                      }`}
                    >
                      <span className="mt-0.5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                        <NotifIcon kind={n.kind} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-sm text-white font-medium block leading-snug">
                          {n.title}
                        </span>
                        <span className="text-xs text-zinc-400 mt-0.5 line-clamp-2 block">
                          {n.body}
                        </span>
                        <span className="text-[10px] text-zinc-600 mt-1 block">
                          {new Date(n.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
