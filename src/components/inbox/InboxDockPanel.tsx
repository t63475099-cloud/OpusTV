"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Mail,
  UserPlus,
  Bell,
  KeyRound,
  Check,
  X,
  ChevronLeft,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { cn } from "@/lib/utils";

type InboxItem = {
  id: string;
  category: string;
  kind: string;
  title: string;
  body: string;
  fromUsername: string | null;
  isRead: boolean;
  isHandled: boolean;
  createdAt: string | null;
};

type TabId = "primary" | "friend" | "other";

const TABS: { id: TabId; label: string }[] = [
  { id: "primary", label: "Chính" },
  { id: "friend", label: "Lời mời" },
  { id: "other", label: "Khác" },
];

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)}p`;
  if (s < 86400) return `${Math.floor(s / 3600)}g`;
  return `${Math.floor(s / 86400)}n`;
}

function RowIcon({ kind }: { kind: string }) {
  if (kind === "friend_request")
    return <UserPlus className="h-3.5 w-3.5 text-violet-300" strokeWidth={1.75} />;
  if (kind === "key_approved" || kind === "key")
    return <KeyRound className="h-3.5 w-3.5 text-amber-300" strokeWidth={1.75} />;
  return <Bell className="h-3.5 w-3.5 text-foreground-muted" strokeWidth={1.75} />;
}

/** Panel hòm thư dạng lưới dọc — nhúng trong sheet dock */
export function InboxDockPanel({
  open,
  onBack,
}: {
  open: boolean;
  onBack: () => void;
}) {
  const username = useAccountStore((s) => s.username);
  const [tab, setTab] = useState<TabId>("primary");
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username || !open) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/inbox?category=${tab}`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok) setItems(data.items || []);
    } catch {
      /* */
    } finally {
      setLoading(false);
    }
  }, [username, tab, open]);

  useEffect(() => {
    void load();
  }, [load]);

  const markRead = async (id: string) => {
    setItems((list) =>
      list.map((x) => (x.id === id ? { ...x, isRead: true } : x))
    );
    await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", id }),
    });
  };

  const friendAct = async (item: InboxItem, action: "accept" | "reject") => {
    if (!item.fromUsername) return;
    setBusyId(item.id);
    try {
      await fetch("/api/leaderboard/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username: item.fromUsername }),
      });
      await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_handled", id: item.id }),
      });
      setItems((list) =>
        list.map((x) =>
          x.id === item.id ? { ...x, isHandled: true, isRead: true } : x
        )
      );
    } finally {
      setBusyId(null);
    }
  };

  if (!open) return null;

  return (
    <div className="flex max-h-[min(52vh,420px)] flex-col">
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <button
          type="button"
          onClick={onBack}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
          aria-label="Quay lại"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">Hòm thư</p>
          <p className="text-[11px] text-foreground-muted">
            {username ? "Thư và lời mời" : "Cần đăng nhập"}
          </p>
        </div>
        <Mail className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
      </div>

      <div className="mb-2 flex gap-0.5 border-b border-border">
        {TABS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setTab(f.id)}
            className={cn(
              "flex-1 border-b-2 px-1 py-2 text-[11px] font-semibold transition",
              tab === f.id
                ? "border-primary text-foreground"
                : "border-transparent text-foreground-muted hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!username ? (
        <p className="py-8 text-center text-xs text-foreground-muted">
          Đăng nhập để xem hòm thư
        </p>
      ) : loading ? (
        <p className="py-8 text-center text-xs text-foreground-muted">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-xs text-foreground-muted">
          Chưa có thư trong mục này
        </p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-0 overflow-y-auto overscroll-contain">
          {items.map((n) => (
            <li
              key={n.id}
              className={cn(
                "border-b border-border last:border-0",
                !n.isRead && "bg-surface-elevated/40"
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (!n.isRead) void markRead(n.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !n.isRead) void markRead(n.id);
                }}
                className="flex w-full cursor-pointer items-start gap-2.5 px-1.5 py-2.5 text-left"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-elevated">
                  <RowIcon kind={n.kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span
                      className={cn(
                        "line-clamp-2 text-[12.5px] leading-snug",
                        !n.isRead
                          ? "font-semibold text-foreground"
                          : "font-medium text-foreground-muted"
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="shrink-0 text-[10px] text-foreground-subtle">
                      {timeAgo(n.createdAt)}
                    </span>
                  </span>
                  {n.fromUsername ? (
                    <span className="mt-0.5 block text-[10px] text-foreground-subtle">
                      Từ {n.fromUsername}
                    </span>
                  ) : null}
                  {n.body ? (
                    <span className="mt-0.5 line-clamp-1 block text-[11px] text-foreground-muted">
                      {n.body}
                    </span>
                  ) : null}
                  {tab === "friend" &&
                  n.kind === "friend_request" &&
                  !n.isHandled &&
                  n.fromUsername ? (
                    <span className="mt-1.5 flex gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === n.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void friendAct(n, "accept");
                        }}
                        className="inline-flex items-center gap-0.5 rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground"
                      >
                        <Check className="h-3 w-3" strokeWidth={2} />
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        disabled={busyId === n.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void friendAct(n, "reject");
                        }}
                        className="inline-flex items-center gap-0.5 rounded-md border border-border px-2 py-0.5 text-[10px] font-medium"
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                        Từ chối
                      </button>
                    </span>
                  ) : null}
                  {n.isHandled ? (
                    <span className="mt-1 block text-[10px] text-foreground-subtle">
                      Đã xử lý
                    </span>
                  ) : null}
                </span>
                {!n.isRead ? (
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function useInboxUnread(pollMs = 25_000) {
  const username = useAccountStore((s) => s.username);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!username) {
      setUnread(0);
      return;
    }
    const poll = async () => {
      try {
        const res = await fetch("/api/inbox?count=1", { cache: "no-store" });
        const data = await res.json();
        if (data.ok) setUnread(Number(data.unread) || 0);
      } catch {
        /* */
      }
    };
    void poll();
    const t = setInterval(poll, pollMs);
    return () => clearInterval(t);
  }, [username, pollMs]);

  return unread;
}
