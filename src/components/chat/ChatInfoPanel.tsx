"use client";

import { X, Bell, BellOff, Ban, Image as ImageIcon, Users, Phone, Video } from "lucide-react";
import { useState } from "react";
import CallModal from "./CallModal";
import { useChatStore, formatLastSeen, type Conversation } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";
import type { ChatMessage } from "@/lib/chatStore";

const EMPTY_MSGS: ChatMessage[] = [];

export default function ChatInfoPanel({ conversation }: { conversation: Conversation }) {
  const setShowInfo = useChatStore((s) => s.setShowInfo);
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const toggleMute = useChatStore((s) => s.toggleMute);
  const convId = conversation.id;
  const messages = useChatStore((s) => s.messages[convId] ?? EMPTY_MSGS);

  const peer = peerOf(conversation);
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const images = messages.flatMap((m) => m.attachments || []).filter((a) => a.type === "image");
  const members = conversation.participants.map((id) => getUser(id)).filter(Boolean);

  return (
    <aside className="flex flex-col h-full w-full bg-[#16181c] min-h-0">
      <div className="h-14 px-3 flex items-center justify-between border-b border-[#2a2d34]">
        <span className="text-sm font-semibold text-white">Thông tin hội thoại</span>
        <button
          type="button"
          onClick={() => setShowInfo(false)}
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-400"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-5 flex flex-col items-center text-center border-b border-[#2a2d34]">
          {conversation.isGroup ? (
            <div className="w-16 h-16 rounded-full bg-[#0068ff] flex items-center justify-center mb-2">
              <Users className="w-8 h-8 text-white" />
            </div>
          ) : (
            <div className="mb-2">
              <ChatAvatar user={peer} size="lg" />
            </div>
          )}
          <p className="text-base font-semibold text-white">{displayTitle(conversation)}</p>
          {!conversation.isGroup && peer && (
            <p className="text-xs text-zinc-500 mt-1">{formatLastSeen(peer)}</p>
          )}
          {peer?.uid && (
            <p className="text-[11px] text-zinc-600 mt-1 font-mono">UID: {peer.uid}</p>
          )}
        </div>

        <div className="grid grid-cols-4 gap-1 p-3 border-b border-[#2a2d34]">
          <button
            type="button"
            onClick={() => setCall("audio")}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-[#2a2e36] text-[#5b9dff]"
          >
            <Phone className="w-5 h-5" />
            <span className="text-[10px]">Gọi</span>
          </button>
          <button
            type="button"
            onClick={() => setCall("video")}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-[#2a2e36] text-[#5b9dff]"
          >
            <Video className="w-5 h-5" />
            <span className="text-[10px]">Video</span>
          </button>
          <button
            type="button"
            onClick={() => toggleMute(conversation.id)}
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-[#2a2e36] text-zinc-300"
          >
            {conversation.muted ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            <span className="text-[10px]">{conversation.muted ? "Bật TB" : "Tắt TB"}</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-[#2a2e36] text-zinc-300"
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Tạo nhóm</span>
          </button>
          <button
            type="button"
            className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-[#2a2e36] text-red-400"
          >
            <Ban className="w-5 h-5" />
            <span className="text-[10px]">Chặn</span>
          </button>
        </div>

        {conversation.isGroup && (
          <div className="p-3 border-b border-[#2a2d34]">
            <p className="text-xs text-zinc-500 mb-2">Thành viên ({members.length})</p>
            <div className="space-y-2">
              {members.map((u) =>
                u ? (
                  <div key={u.id} className="flex items-center gap-2">
                    <ChatAvatar user={u} size="sm" />
                    <span className="text-sm text-zinc-200 truncate">{u.name}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>
        )}

        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
            <ImageIcon className="w-3.5 h-3.5" />
            Ảnh/Video ({images.length})
          </div>
          {images.length === 0 ? (
            <p className="text-xs text-zinc-600">Chưa có ảnh chia sẻ</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {images.slice(0, 9).map((a) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={a.id}
                  src={a.url}
                  alt=""
                  className="aspect-square object-cover rounded-md"
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <CallModal
        open={!!call}
        mode={call || "audio"}
        peer={peer}
        role="caller"
        onClose={() => setCall(null)}
      />
    </aside>
  );
}

