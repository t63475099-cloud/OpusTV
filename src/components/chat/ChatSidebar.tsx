"use client";

import Link from "next/link";
import { ArrowLeft, Search, Plus, MessageCircle, Users } from "lucide-react";
import { useChatStore, formatChatTime, type Conversation } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

function Row({
  c,
  active,
  onClick,
}: {
  c: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const title = displayTitle(c);
  const peer = peerOf(c);
  const last = c.lastMessage;
  const preview = last
    ? `${last.senderId === "me" ? "Bạn" : getUser(last.senderId)?.name || ""}: ${last.text || "Đính kèm"}`
    : "Chưa có tin nhắn";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
        active ? "bg-neutral-800" : "hover:bg-neutral-900"
      }`}
    >
      {c.isGroup ? (
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
      ) : (
        <ChatAvatar user={peer} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          {last && (
            <span className="text-[10px] text-zinc-500 shrink-0">{formatChatTime(last.timestamp)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-zinc-500 truncate">{preview}</p>
          {c.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-[10px] font-bold text-white flex items-center justify-center">
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
      className={`w-full md:w-[340px] lg:w-[360px] shrink-0 border-r border-neutral-800 flex flex-col bg-neutral-950 min-h-0 h-full ${
        hiddenOnMobileChat ? "hidden md:flex" : "flex"
      }`}
    >
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <Link href="/" className="md:hidden p-2 rounded-full hover:bg-neutral-800 text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="flex-1 text-lg font-bold text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-rose-500" />
          Tin nhắn
        </h1>
        <button
          type="button"
          onClick={onOpenCreate}
          className="p-2 rounded-full bg-rose-600/20 text-rose-400 hover:bg-rose-600/30"
          title="Kết bạn / Tạo nhóm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm hội thoại..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/40"
          />
        </div>
        <div className="flex gap-1 mt-2 p-0.5 rounded-xl bg-neutral-900 border border-neutral-800">
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
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                tab === k ? "bg-neutral-800 text-white" : "text-zinc-500"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 custom-scroll">
        {items.length === 0 ? (
          <p className="text-center text-sm text-zinc-600 py-10 px-4">
            Chưa có hội thoại. Bấm + để kết bạn bằng nickname hoặc UID.
          </p>
        ) : (
          items.map((c) => (
            <Row key={c.id} c={c} active={c.id === activeId} onClick={() => setActive(c.id)} />
          ))
        )}
      </div>
    </aside>
  );
}
