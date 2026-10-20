"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  UserPlus,
  Bell,
  KeyRound,
  Check,
  X,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";

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
  { id: "friend", label: "Lời mời kết bạn" },
  { id: "other", label: "Thông báo khác" },
];

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return "Vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ`;
  return `${Math.floor(s / 86400)} ngày`;
}

function Icon({ kind }: { kind: string }) {
  if (kind === "friend_request")
    return <UserPlus className="h-4 w-4 text-violet-300" strokeWidth={1.75} />;
  if (kind === "key_approved" || kind === "key")
    return <KeyRound className="h-4 w-4 text-amber-300" strokeWidth={1.75} />;
  return <Bell className="h-4 w-4 text-slate-400" strokeWidth={1.75} />;
}

export default function HopThuPage() {
  const username = useAccountStore((s) => s.username);
  const [tab, setTab] = useState<TabId>("primary");

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("tab");
      if (q === "primary" || q === "friend" || q === "other") setTab(q);
    } catch {
      /* */
    }
  }, []);
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!username) {
      setItems([]);
      setLoading(false);
      return;
    }
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
  }, [username, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const unread = useMemo(() => items.filter((i) => !i.isRead).length, [items]);

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

  const markAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
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

  return (
    <div className="min-h-[100dvh] w-full bg-[#07080d] pb-24 pt-4 text-[#F4F0E8]">
      <div className="mx-auto max-w-lg px-3 sm:px-4">
        <div className="flex items-center gap-3 py-4">
          <Link
            href="/tai-khoan"
            className="rounded-full p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.75} />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Mail className="h-5 w-5 text-slate-300" strokeWidth={1.75} />
              Hòm thư
            </h1>
            <p className="text-xs text-slate-500">
              {!username
                ? "Đăng nhập để xem thư"
                : unread > 0
                  ? `${unread} chưa đọc`
                  : "Không có tin mới"}
            </p>
          </div>
          {username && unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAll()}
              className="text-xs font-medium text-violet-300 hover:text-violet-200"
            >
              Đọc hết
            </button>
          ) : null}
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-white/10 pb-0">
          {TABS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTab(f.id)}
              className={
                "shrink-0 border-b-2 px-3 py-2 text-xs font-semibold transition " +
                (tab === f.id
                  ? "border-violet-400 text-white"
                  : "border-transparent text-slate-500 hover:text-slate-300")
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {!username ? (
          <div className="rounded-2xl border border-white/10 bg-[#13141C] p-10 text-center">
            <p className="text-sm text-slate-500">
              <Link href="/tai-khoan" className="text-violet-300 hover:underline">
                Đăng nhập
              </Link>{" "}
              để mở hòm thư
            </p>
          </div>
        ) : loading ? (
          <p className="py-12 text-center text-sm text-slate-500">Đang tải…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#13141C] p-10 text-center">
            <Mail className="mx-auto mb-3 h-9 w-9 text-slate-600" strokeWidth={1.5} />
            <p className="text-sm text-slate-500">Chưa có thư trong mục này</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-white/10 bg-[#13141C]">
            {items.map((n) => (
              <li
                key={n.id}
                className={
                  "border-b border-white/5 last:border-0 " +
                  (!n.isRead ? "bg-white/[0.03]" : "")
                }
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-3.5 py-3 text-left hover:bg-white/[0.04]"
                  onClick={() => {
                    if (!n.isRead) void markRead(n.id);
                  }}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5">
                    <Icon kind={n.kind} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={
                          "text-sm leading-snug " +
                          (!n.isRead ? "font-semibold text-white" : "font-medium text-slate-300")
                        }
                      >
                        {n.title}
                      </span>
                      <span className="shrink-0 text-[11px] text-slate-500">
                        {timeAgo(n.createdAt)}
                      </span>
                    </span>
                    {n.fromUsername ? (
                      <span className="mt-0.5 block text-[11px] text-slate-500">
                        Từ {n.fromUsername}
                      </span>
                    ) : null}
                    {n.body ? (
                      <span className="mt-1 block text-xs text-slate-400 line-clamp-2">
                        {n.body}
                      </span>
                    ) : null}
                    {tab === "friend" &&
                    n.kind === "friend_request" &&
                    !n.isHandled &&
                    n.fromUsername ? (
                      <span className="mt-2 flex gap-2">
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            void friendAct(n, "accept");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              void friendAct(n, "accept");
                            }
                          }}
                          className={
                            "inline-flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white " +
                            (busyId === n.id ? "opacity-50" : "")
                          }
                        >
                          <Check className="h-3 w-3" strokeWidth={2} />
                          Chấp nhận
                        </span>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            void friendAct(n, "reject");
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.stopPropagation();
                              void friendAct(n, "reject");
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                          Từ chối
                        </span>
                      </span>
                    ) : null}
                    {n.isHandled ? (
                      <span className="mt-1 block text-[11px] text-slate-500">
                        Đã xử lý
                      </span>
                    ) : null}
                  </span>
                  {!n.isRead ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
