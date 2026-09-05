"use client";

import Link from "next/link";
import { Search, Plus, Users, Home } from "lucide-react";
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
}: {
  c: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const me = useChatStore((s) => s.me);
  const title = displayTitle(c);
  const peer = peerOf(c);
  const last = c.lastMessage;
  const preview = last
    ? `${last.senderId === me ? "Bạn: " : ""}${last.text || "Đính kèm"}`
    : peer
      ? formatLastSeen(peer) || "Chưa có tin nhắn"
      : "Chưa có tin nhắn";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
        active ? "bg-[#2a2e36]" : "hover:bg-[#1f2228]"
      }`}
    >
      {c.isGroup ? (
        <div className="w-12 h-12 rounded-full bg-[#0068ff] flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-white" />
        </div>
      ) : (
        <ChatAvatar user={peer} />
      )}
      <div className="flex-1 min-w-0 border-b border-[#2a2d34]/60 pb-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[15px] font-medium text-white truncate">{title}</p>
          {last && (
            <span className="text-[11px] text-zinc-500 shrink-0">
              {formatChatTime(last.timestamp)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-[13px] text-zinc-400 truncate">{preview}</p>
          {c.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-[#c11e33] text-[10px] font-bold text-white flex items-center justify-center">
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
  onSelectConversation,
}: {
  onOpenCreate: () => void;
  onSelectConversation: (id: string) => void;
}) {
  const conversations = useChatStore((s) => s.conversations || []);
  const activeId = useChatStore((s) => s.activeId);
  const search = useChatStore((s) => s.search);
  const setSearch = useChatStore((s) => s.setSearch);
  const tab = useChatStore((s) => s.tab);
  const setTab = useChatStore((s) => s.setTab);
  const filteredConversations = useChatStore((s) => s.filteredConversations);

  let items: Conversation[] = conversations;
  try {
    items = typeof filteredConversations === "function" ? filteredConversations() : conversations;
  } catch {
    items = conversations;
  }
  if (!Array.isArray(items)) items = [];

  return (
    <aside className="flex flex-col h-full w-full min-h-0 bg-[#16181c]">
      {/* Header Zalo-like */}
      <div className="shrink-0 px-3 pt-3 pb-2 flex items-center gap-2">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-400"
          title="Về OpusFilm"
          onClick={(e) => e.stopPropagation()}
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm"
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#2a2e36] text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-[#0068ff]/50"
          />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreate();
          }}
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300"
          title="Kết bạn"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="px-3 pb-2 flex gap-4 text-sm border-b border-[#2a2d34]">
        {(
          [
            ["all", "Ưu tiên"],
            ["unread", "Khác"],
            ["groups", "Nhóm"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setTab(k)}
            className={`pb-2 border-b-2 transition ${
              tab === k
                ? "border-[#0068ff] text-[#5b9dff] font-semibold"
                : "border-transparent text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        data-chat-scroll
        className="flex-1 overflow-y-auto overscroll-contain min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {items.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-zinc-500">Chưa có hội thoại</p>
            <p className="text-xs text-zinc-600 mt-1">Bấm + để kết bạn bằng UID</p>
          </div>
        ) : (
          items.map((c) => (
            <Row
              key={c.id}
              c={c}
              active={c.id === activeId}
              onClick={() => onSelectConversation(c.id)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
