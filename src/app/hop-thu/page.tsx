"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MessageCircle,
  BadgeCheck,
  Sparkles,
  Flame,
  Heart,
  Info,
  Trash2,
  Mail,
} from "lucide-react";
import { useNotifStore, type NotifKind } from "@/lib/notifications";

const FILTERS: { id: "all" | NotifKind | "social"; label: string }[] = [
  { id: "all", label: "Tất cả" },
  { id: "social", label: "Tương tác" },
  { id: "chat", label: "Opus Chat" },
  { id: "verify", label: "Xác minh" },
  { id: "system", label: "Hệ thống" },
];

function iconFor(kind: NotifKind) {
  const c = "w-4 h-4";
  switch (kind) {
    case "reply":
      return <MessageCircle className={`${c} text-emerald-400`} />;
    case "verify":
    case "verify_ok":
      return <BadgeCheck className={`${c} text-sky-400`} />;
    case "verify_no":
      return <BadgeCheck className={`${c} text-amber-400`} />;
    case "level":
      return <Sparkles className={`${c} text-violet-400`} />;
    case "streak":
      return <Flame className={`${c} text-orange-400`} />;
    case "like":
      return <Heart className={`${c} text-rose-400`} />;
    case "mission":
      return <Sparkles className={`${c} text-amber-300`} />;
    case "chat":
      return <MessageCircle className={`${c} text-rose-400`} />;
    default:
      return <Info className={`${c} text-zinc-400`} />;
  }
}

export default function HopThuPage() {
  const items = useNotifStore((s) => s.items);
  const markRead = useNotifStore((s) => s.markRead);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const clear = useNotifStore((s) => s.clear);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "social")
      return items.filter((n) => ["reply", "like"].includes(n.kind));
    if (filter === "chat")
      return items.filter((n) => n.kind === "chat");
    if (filter === "verify")
      return items.filter((n) => n.kind.startsWith("verify"));
    return items.filter((n) => n.kind === filter || n.kind === "system" || n.kind === "key");
  }, [items, filter]);

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="min-h-[100dvh] pt-14 pb-24 bg-[#07070c]">
      <div className="mx-auto max-w-lg px-3 sm:px-4">
        <div className="flex items-center gap-3 py-4">
          <Link href="/tai-khoan" className="p-2 rounded-full hover:bg-white/10 text-zinc-300" aria-label="Quay lại">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-sky-400" />
              Hòm thư
            </h1>
            <p className="text-xs text-zinc-500">
              {unread > 0 ? `${unread} chưa đọc` : "Không có tin mới"}
            </p>
          </div>
          {unread > 0 && (
            <button type="button" onClick={() => markAllRead()} className="text-xs text-sky-400 px-2 py-1">
              Đọc hết
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Xóa toàn bộ thông báo?")) clear();
              }}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
              aria-label="Xóa hết"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-3">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === f.id ? "bg-sky-600 text-white" : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <Mail className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-500">Hòm thư trống</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href || "/tai-khoan"}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-3 rounded-2xl border px-3.5 py-3 transition ${
                    n.read
                      ? "border-white/5 bg-white/[0.02] opacity-70"
                      : "border-sky-500/20 bg-sky-500/5"
                  }`}
                >
                  <span className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {iconFor(n.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="text-sm font-medium text-white block">{n.title}</span>
                    <span className="text-xs text-zinc-400 line-clamp-2 block mt-0.5">{n.body}</span>
                    <span className="text-[10px] text-zinc-600 mt-1 block">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </span>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 mt-2" />}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
