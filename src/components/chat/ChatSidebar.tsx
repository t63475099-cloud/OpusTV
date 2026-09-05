"use client";

import Link from "next/link";
import { ArrowLeft, Search, Plus, MessageCircle, Users } from "lucide-react";
import {
  useChatStore,
  formatChatTime,
  formatLastSeen,
  type Conversation,
} from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

function Row({
  c,
  active,
  onClick,
  index,
}: {
  c: Conversation;
  active: boolean;
  onClick: () => void;
  index: number;
}) {
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const me = useChatStore((s) => s.me);
  const title = displayTitle(c);
  const peer = peerOf(c);
  const last = c.lastMessage;
  const preview = last
    ? `${last.senderId === me ? "Bạn" : getUser(last.senderId)?.name || ""}: ${last.text || "Đính kèm"}`
    : peer
      ? formatLastSeen(peer)
      : "Chưa có tin nhắn";

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      className={`oc-row oc-bubble-in w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-left ${
        active
          ? "oc-glass ring-1 ring-rose-500/25"
          : "hover:bg-white/[0.04]"
      }`}
    >
      {c.isGroup ? (
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-500 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
          <Users className="w-5 h-5 text-white" />
        </div>
      ) : (
        <ChatAvatar user={peer} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          {last && (
            <span className="text-[10px] text-zinc-500 shrink-0 tabular-nums">
              {formatChatTime(last.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-zinc-400/90 truncate">{preview}</p>
          {c.unreadCount > 0 && (
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-[10px] font-bold text-white flex items-center justify-center shadow-md shadow-rose-500/30">
              {c.unreadCount > 99 ? "99+" : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function ChatSidebar({
  onOpenCreate,
  hiddenOnMobileChat,
}: {
  onOpenCreate: () => void;
  hiddenOnMobileChat?: boolean;
}) {
  const list = useChatStore((s) => s.filteredConversations);
  const activeId = useChatStore((s) => s.activeId);
  const setActive = useChatStore((s) => s.setActive);
  const search = useChatStore((s) => s.search);
  const setSearch = useChatStore((s) => s.setSearch);
  const tab = useChatStore((s) => s.tab);
  const setTab = useChatStore((s) => s.setTab);
  const items = list();

  return (
    <aside
      data-chat-root
      className={`w-full md:w-[340px] lg:w-[380px] shrink-0 flex flex-col min-h-0 h-full border-r border-white/[0.06] oc-glass ${
        hiddenOnMobileChat ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <Link
          href="/"
          className="p-2.5 rounded-full oc-glass-soft text-zinc-300 hover:text-white transition active:scale-95"
          title="Về OpusFilm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-white flex items-center gap-2 min-w-0 tracking-tight">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-violet-600 shadow-lg shadow-rose-500/25">
            <MessageCircle className="w-4 h-4 text-white" />
          </span>
          <span className="truncate">Opus Chat</span>
        </h1>
        <button
          type="button"
          onClick={onOpenCreate}
          className="p-2.5 rounded-full bg-gradient-to-br from-rose-500/30 to-violet-500/20 text-rose-300 hover:from-rose-500/40 border border-white/10 transition active:scale-95"
          title="Kết bạn"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pb-2 space-y-2">
        <div className="relative oc-glass-input rounded-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm hội thoại..."
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-2xl oc-glass-soft">
          {(
            [
              ["all", "Tất cả"],
              ["groups", "Nhóm"],
              ["unread", "Chưa đọc"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition ${
                tab === k ? "oc-tab-active" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div
        data-chat-scroll
        className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 custom-scroll overscroll-contain"
      >
        {items.length === 0 ? (
          <div className="mx-2 mt-6 oc-glass rounded-2xl p-8 text-center">
            <MessageCircle className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Chưa có hội thoại</p>
            <p className="text-xs text-zinc-600 mt-1">Bấm + để kết bạn bằng UID</p>
          </div>
        ) : (
          items.map((c, i) => (
            <Row
              key={c.id}
              c={c}
              index={i}
              active={c.id === activeId}
              onClick={() => setActive(c.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
