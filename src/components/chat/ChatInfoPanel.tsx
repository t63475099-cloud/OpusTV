"use client";

import { X, Bell, BellOff, Ban, Image as ImageIcon, Users } from "lucide-react";
import { useChatStore, type Conversation } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

export default function ChatInfoPanel({ conversation }: { conversation: Conversation }) {
  const setShowInfo = useChatStore((s) => s.setShowInfo);
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const toggleMute = useChatStore((s) => s.toggleMute);
  const messages = useChatStore((s) => s.messages[conversation.id] || []);

  const peer = peerOf(conversation);
  const images = messages.flatMap((m) => m.attachments || []).filter((a) => a.type === "image");
  const members = conversation.participants
    .map((id) => getUser(id))
    .filter(Boolean);

  return (
    <aside className="hidden lg:flex w-[280px] shrink-0 border-l border-white/[0.06] flex-col oc-glass">
      <div className="h-14 px-3 flex items-center justify-between border-b border-white/10">
        <span className="text-sm font-semibold text-white">Chi tiết</span>
        <button
          type="button"
          onClick={() => setShowInfo(false)}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 flex flex-col items-center text-center border-b border-white/10">
        {conversation.isGroup ? (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center mb-2">
            <Users className="w-7 h-7 text-white" />
          </div>
        ) : (
          <ChatAvatar user={peer} size="lg" />
        )}
        <p className="mt-2 text-white font-semibold">{displayTitle(conversation)}</p>
        {!conversation.isGroup && peer && (
          <p className="text-xs text-zinc-500 mt-1">
            @{peer.nickname}
            {peer.uid ? ` · UID ${peer.uid}` : ""}
          </p>
        )}
        <p className="text-xs text-zinc-600 mt-0.5">{peer?.bio}</p>
      </div>

      {conversation.isGroup && (
        <div className="px-3 py-3 border-b border-white/10">
          <p className="text-xs text-zinc-500 mb-2">Thành viên ({members.length})</p>
          <ul className="space-y-2">
            {members.map(
              (u) =>
                u && (
                  <li key={u.id} className="flex items-center gap-2">
                    <ChatAvatar user={u} size="sm" />
                    <span className="text-sm text-zinc-200 truncate">{u.name}</span>
                  </li>
                )
            )}
          </ul>
        </div>
      )}

      <div className="p-3 space-y-1">
        <button
          type="button"
          onClick={() => toggleMute(conversation.id)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 text-sm text-zinc-300"
        >
          {conversation.muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          {conversation.muted ? "Bật thông báo" : "Tắt thông báo"}
        </button>
        <button
          type="button"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-neutral-900 text-sm text-rose-400"
        >
          <Ban className="w-4 h-4" />
          Chặn
        </button>
      </div>

      <div className="px-3 pt-1 flex-1 overflow-y-auto">
        <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" /> Ảnh đã chia sẻ
        </p>
        {images.length === 0 ? (
          <p className="text-xs text-zinc-600">Chưa có ảnh</p>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {images.map((a) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={a.id} src={a.url} alt="" className="aspect-square object-cover rounded-lg" />
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
