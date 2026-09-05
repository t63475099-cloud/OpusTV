"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Plus, Users, Home, UserCircle } from "lucide-react";
import {
  useChatStore,
  formatChatTime,
  formatLastSeen,
  type Conversation,
} from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";
import ChatProfileModal from "./ChatProfileModal";
import { parseCallLog, formatCallLogLabel } from "@/lib/callLog";

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
  const me = useChatStore((s) => s.me);
  const title = displayTitle(c);
  const peer = peerOf(c);
  const last = c.lastMessage;
  const call = last ? parseCallLog(last.text || "") : null;
  const preview = last
    ? call
      ? formatCallLogLabel(call.mode, call.kind, call.durationSec, last.senderId === me)
      : `${last.senderId === me ? "Bạn: " : ""}${last.text || "Đính kèm"}`
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
        <div className="relative w-12 h-12 shrink-0">
          <div className="w-12 h-12 rounded-full bg-[#0068ff] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>
      ) : (
        <ChatAvatar user={peer || undefined} size="md" showStatus />
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
  const me = useChatStore((s) => s.me);
  const getUser = useChatStore((s) => s.getUser);
  const search = useChatStore((s) => s.search);
  const setSearch = useChatStore((s) => s.setSearch);
  const tab = useChatStore((s) => s.tab);
  const setTab = useChatStore((s) => s.setTab);
  const activeId = useChatStore((s) => s.activeId);
  const conversations = useChatStore((s) => s.conversations);
  const [profileOpen, setProfileOpen] = useState(false);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...conversations];
    if (tab === "groups") list = list.filter((c) => c.isGroup);
    else if (tab === "unread") list = list.filter((c) => c.unreadCount > 0);
    if (q) {
      list = list.filter((c) => {
        const title = (c.title || c.participants.join(" ")).toLowerCase();
        const last = (c.lastMessage?.text || "").toLowerCase();
        return title.includes(q) || last.includes(q);
      });
    }
    return list.sort((a, b) => {
      const ta = a.lastMessage?.timestamp || 0;
      const tb = b.lastMessage?.timestamp || 0;
      return tb - ta;
    });
  }, [conversations, search, tab]);

  return (
    <aside className="flex flex-col h-full min-h-0 w-full bg-[#16181c] border-r border-[#2a2d34]">
      {/* Top bar */}
      <div className="shrink-0 px-3 pt-3 pb-2 flex items-center gap-2">
        <Link
          href="/"
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300"
          title="Trang chủ"
        >
          <Home className="w-5 h-5" />
        </Link>
        <div className="flex-1 flex items-center gap-2 rounded-full bg-[#2a2e36] px-3 h-9">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm kiếm"
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500 min-w-0"
          />
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="p-2 rounded-full bg-[#0068ff] text-white"
          title="Kết bạn / Nhóm"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Avatar chat riêng */}
      <div className="px-3 pb-2">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="w-full flex items-center gap-2 rounded-xl hover:bg-[#2a2e36] p-2 text-left"
          title="Đổi avatar Opus Chat"
        >
          <ChatAvatar user={me ? getUser(me) : null} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-white truncate">
              {me ? getUser(me)?.name || me : "Chưa đăng nhập"}
            </p>
            <p className="text-[11px] text-zinc-500 flex items-center gap-1">
              <UserCircle className="w-3 h-3" />
              Đổi ảnh đại diện
            </p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 px-4 text-sm shrink-0">
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

      {/* List */}
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

      <ChatProfileModal open={profileOpen} onClose={() => setProfileOpen(false)} />
    </aside>
  );
}
