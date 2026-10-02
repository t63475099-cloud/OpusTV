"use client";

import { useEventStore } from "@/lib/eventCoins";

import { useMemo, useEffect, useState } from "react";
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
import StreakRestoreForm from "@/components/StreakRestoreForm";

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
      return <MessageCircle className={`${c} text-emerald-500`} />;
    case "verify":
    case "verify_ok":
      return <BadgeCheck className={`${c} text-sky-500`} />;
    case "verify_no":
      return <BadgeCheck className={`${c} text-amber-500`} />;
    case "level":
      return <Sparkles className={`${c} text-violet-500`} />;
    case "streak":
      return <Flame className={`${c} text-orange-500`} />;
    case "like":
      return <Heart className={`${c} text-rose-500`} />;
    case "mission":
      return <Sparkles className={`${c} text-amber-500`} />;
    case "chat":
      return <MessageCircle className={`${c} text-rose-500`} />;
    default:
      return <Info className={`${c} text-foreground-muted`} />;
  }
}

export default function HopThuPage() {
  useEffect(() => {
    try {
      useEventStore.getState().addMissionProgress("mailbox");
    } catch {
      /* */
    }
  }, []);

  const items = useNotifStore((s) => s.items);
  const markRead = useNotifStore((s) => s.markRead);
  const markAllRead = useNotifStore((s) => s.markAllRead);
  const clear = useNotifStore((s) => s.clear);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  const filtered = useMemo(() => {
    let list = items;
    if (filter === "social") list = items.filter((n) => ["reply", "like"].includes(n.kind));
    else if (filter === "chat") list = items.filter((n) => n.kind === "chat");
    else if (filter === "verify") list = items.filter((n) => n.kind.startsWith("verify"));
    else if (filter !== "all")
      list = items.filter(
        (n) => n.kind === filter || n.kind === "system" || n.kind === "key"
      );

    // Gộp bản trùng liên tiếp (cùng title + body trong 30s)
    const out: typeof list = [];
    for (const n of list) {
      const prev = out[out.length - 1];
      if (
        prev &&
        prev.title === n.title &&
        prev.body === n.body &&
        Math.abs(prev.createdAt - n.createdAt) < 30_000
      ) {
        continue;
      }
      out.push(n);
    }
    return out;
  }, [items, filter]);

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="min-h-[100dvh] w-full bg-background pb-24 pt-4 text-foreground">
      <div className="mx-auto max-w-lg px-3 sm:px-4">
        <div className="flex items-center gap-3 py-4">
          <Link
            href="/tai-khoan"
            className="rounded-full p-2 text-foreground-muted hover:bg-surface-elevated"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <Mail className="h-5 w-5 text-sky-500" />
              Hòm thư
            </h1>
            <p className="text-xs text-foreground-muted">
              {unread > 0 ? `${unread} chưa đọc` : "Không có tin mới"}
            </p>
          </div>
          {unread > 0 && (
            <button
              type="button"
              onClick={() => markAllRead()}
              className="px-2 py-1 text-xs font-medium text-sky-600 dark:text-sky-400"
            >
              Đọc hết
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Xóa toàn bộ thông báo?")) clear();
              }}
              className="rounded-full p-2 text-foreground-muted hover:bg-surface-elevated"
              aria-label="Xóa hết"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="mb-4">
          <StreakRestoreForm />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                filter === f.id
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface text-foreground-muted hover:bg-surface-elevated"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <Mail className="mx-auto mb-3 h-10 w-10 text-foreground-subtle" />
            <p className="text-sm text-foreground-muted">Hòm thư trống</p>
          </div>
        ) : (
          <ul className="hop-thu-scroll max-h-[calc(100dvh-10rem)] space-y-2 overflow-y-auto pr-1">
            {filtered.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.href || "/tai-khoan"}
                  onClick={() => markRead(n.id)}
                  className={`flex gap-3 rounded-2xl border px-3.5 py-3 transition ${
                    n.read
                      ? "border-border bg-surface opacity-90"
                      : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface-elevated">
                    {iconFor(n.kind)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {n.title}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-xs text-foreground-muted">
                      {n.body}
                    </span>
                    <span className="mt-1 block text-[10px] text-foreground-subtle">
                      {new Date(n.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </span>
                  {!n.read && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
