"use client";

import { useState } from "react";
import { X, BellOff, Bell, Pin, UserX, UserCheck, Users } from "lucide-react";
import type { Conversation } from "@/lib/chatStore";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";

export default function ChatInfoPanel({
  conversation,
  onClose,
}: {
  conversation: Conversation;
  onClose: () => void;
}) {
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const togglePin = useChatStore((s) => s.togglePin);
  const muteFor = useChatStore((s) => s.muteFor);
  const setGroupAnnouncement = useChatStore((s) => s.setGroupAnnouncement);
  const setGroupTitle = useChatStore((s) => s.setGroupTitle);
  const addGroupMembers = useChatStore((s) => s.addGroupMembers);
  const friendUsers = useChatStore((s) => s.friendUsers);
  const blockUser = useChatStore((s) => s.blockUser);
  const unblockUser = useChatStore((s) => s.unblockUser);
  const blockedUsers = useChatStore((s) => s.blockedUsers);

  const peer = peerOf(conversation);
  const members = conversation.participants.map((id) => getUser(id)).filter(Boolean);
  const [ann, setAnn] = useState(conversation.announcement || "");
  const [gTitle, setGTitle] = useState(conversation.title || "");
  const [addId, setAddId] = useState("");

  const isBlocked =
    !conversation.isGroup &&
    !!peer &&
    (conversation.blocked || blockedUsers.includes(peer.id));

  let friends: ReturnType<typeof friendUsers> = [];
  try {
    friends = typeof friendUsers === "function" ? friendUsers() : [];
  } catch {
    friends = [];
  }

  return (
    <aside className="w-full sm:w-[320px] shrink-0 h-full border-l border-[#2a2d34] bg-[#16181c] flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 h-14 border-b border-[#2a2d34]">
        <p className="text-sm font-semibold text-white">Thông tin hội thoại</p>
        <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-zinc-400">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div className="flex flex-col items-center text-center">
          {conversation.isGroup ? (
            <div className="w-16 h-16 rounded-full bg-[#0068ff] flex items-center justify-center text-white text-xl font-bold mb-2">
              <Users className="w-7 h-7" />
            </div>
          ) : (
            <ChatAvatar user={peer} size="lg" />
          )}
          <p className="text-white font-semibold mt-2">
            {conversation.isGroup
              ? conversation.title || "Nhóm"
              : peer?.name || peer?.id}
          </p>
          {!conversation.isGroup && peer && (
            <p className="text-xs text-zinc-500">@{peer.id}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => togglePin(conversation.id)}
            className="rounded-xl bg-[#2a2e36] hover:bg-[#32363f] py-3 flex flex-col items-center gap-1 text-zinc-200"
          >
            <Pin className="w-5 h-5" />
            <span className="text-[11px]">{conversation.pinned ? "Bỏ ghim" : "Ghim"}</span>
          </button>
          <button
            type="button"
            onClick={() =>
              muteFor(conversation.id, conversation.muted ? null : 8)
            }
            className="rounded-xl bg-[#2a2e36] hover:bg-[#32363f] py-3 flex flex-col items-center gap-1 text-zinc-200"
          >
            {conversation.muted ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            <span className="text-[11px]">{conversation.muted ? "Bật TB" : "Tắt TB"}</span>
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wide text-zinc-500">Tắt thông báo</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { h: 1, label: "1 giờ" },
              { h: 8, label: "8 giờ" },
              { h: 24, label: "1 ngày" },
              { h: null as number | null, label: "Bật lại" },
            ].map((o) => (
              <button
                key={String(o.label)}
                type="button"
                onClick={() => muteFor(conversation.id, o.h)}
                className="px-2.5 py-1.5 rounded-lg text-[11px] bg-[#2a2e36] text-zinc-300 hover:bg-[#32363f]"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {conversation.isGroup && (
          <div className="space-y-3">
            <div>
              <p className="text-[11px] text-zinc-500 mb-1">Tên nhóm</p>
              <div className="flex gap-2">
                <input
                  value={gTitle}
                  onChange={(e) => setGTitle(e.target.value)}
                  className="flex-1 rounded-lg bg-[#2a2e36] px-2 py-1.5 text-sm text-white outline-none"
                />
                <button
                  type="button"
                  className="px-3 rounded-lg bg-rose-600 text-white text-xs font-medium"
                  onClick={() => setGroupTitle(conversation.id, gTitle)}
                >
                  Lưu
                </button>
              </div>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 mb-1">Thông báo ghim nhóm</p>
              <textarea
                value={ann}
                onChange={(e) => setAnn(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-[#2a2e36] px-2 py-1.5 text-sm text-white outline-none resize-none"
                placeholder="Nội dung ghim..."
              />
              <button
                type="button"
                className="mt-1 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-medium"
                onClick={() => setGroupAnnouncement(conversation.id, ann)}
              >
                Ghim thông báo
              </button>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 mb-1">Thêm thành viên</p>
              <select
                value={addId}
                onChange={(e) => setAddId(e.target.value)}
                className="w-full rounded-lg bg-[#2a2e36] px-2 py-1.5 text-sm text-white outline-none mb-1"
              >
                <option value="">Chọn bạn bè...</option>
                {friends
                  .filter((f) => !conversation.participants.includes(f.id))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name || f.id}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                disabled={!addId}
                className="px-3 py-1.5 rounded-lg bg-[#0068ff] text-white text-xs font-medium disabled:opacity-40"
                onClick={() => {
                  if (!addId) return;
                  addGroupMembers(conversation.id, [addId]);
                  setAddId("");
                }}
              >
                Thêm
              </button>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 mb-2">
                Thành viên ({conversation.participants.length})
              </p>
              <div className="space-y-2">
                {members.map((u) =>
                  u ? (
                    <div key={u.id} className="flex items-center gap-2">
                      <ChatAvatar user={u} size="sm" showStatus={false} />
                      <span className="text-sm text-zinc-200 truncate">{u.name || u.id}</span>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          </div>
        )}

        {!conversation.isGroup && peer && (
          <button
            type="button"
            onClick={() =>
              isBlocked ? unblockUser(peer.id) : blockUser(peer.id)
            }
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium ${
              isBlocked
                ? "bg-emerald-600/20 text-emerald-300"
                : "bg-rose-600/15 text-rose-300"
            }`}
          >
            {isBlocked ? (
              <>
                <UserCheck className="w-4 h-4" /> Bỏ chặn
              </>
            ) : (
              <>
                <UserX className="w-4 h-4" /> Chặn người dùng
              </>
            )}
          </button>
        )}
      </div>
    </aside>
  );
}
