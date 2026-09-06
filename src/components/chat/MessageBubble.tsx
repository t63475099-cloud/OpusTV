"use client";

import { useState } from "react";
import {
  Reply,
  Check,
  CheckCheck,
  PhoneOutgoing,
  PhoneIncoming,
  PhoneMissed,
  Video,
  Copy,
  Forward,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ChatMessage } from "@/lib/chatStore";
import { formatChatTime, useChatStore } from "@/lib/chatStore";
import {
  parseCallLog,
  formatCallLogLabel,
  callLogTitle,
} from "@/lib/callLog";

const QUICK = ["❤️", "👍", "😂", "😮", "😢"];

export default function MessageBubble({
  m,
  mine,
  name,
  replyPreview,
  onCallBack,
  onForward,
}: {
  m: ChatMessage;
  mine: boolean;
  name?: string;
  replyPreview?: ChatMessage | null;
  onCallBack?: (mode: "audio" | "video") => void;
  onForward?: (messageId: string) => void;
}) {
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const editMessage = useChatStore((s) => s.editMessage);
  const deleteMessage = useChatStore((s) => s.deleteMessage);
  const [showBar, setShowBar] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(m.text || "");

  const call = parseCallLog(m.text || "");
  if (call) {
    const title = callLogTitle(call.kind, mine);
    const sub = formatCallLogLabel(call.mode, call.kind, call.durationSec, mine);
    const Icon =
      call.kind === "missed"
        ? PhoneMissed
        : call.mode === "video"
          ? Video
          : mine
            ? PhoneOutgoing
            : PhoneIncoming;
    const iconColor =
      call.kind === "missed" || call.kind === "rejected" || call.kind === "cancelled"
        ? "text-rose-400"
        : "text-zinc-300";

    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
        <div
          className={`max-w-[80%] rounded-2xl px-3 py-2.5 ${
            mine ? "bg-[#0068ff] text-white rounded-br-md" : "bg-[#2a2e36] text-zinc-100 rounded-bl-md"
          }`}
        >
          <p className={`text-[13px] mb-1 ${mine ? "text-white/90" : "text-zinc-300"}`}>{title}</p>
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 shrink-0 ${mine ? "text-white/80" : iconColor}`} />
            <span className="text-[14px] font-medium">{sub}</span>
          </div>
          {onCallBack && (
            <button
              type="button"
              onClick={() => onCallBack(call.mode)}
              className={`mt-2 w-full text-center text-[13px] font-semibold py-1.5 rounded-lg ${
                mine ? "bg-white/15 hover:bg-white/25" : "bg-[#3a3f4a] hover:bg-[#454b58]"
              }`}
            >
              Gọi lại
            </button>
          )}
          <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-zinc-500"}`}>
            {formatChatTime(m.timestamp)}
          </p>
        </div>
      </div>
    );
  }

  if (m.deleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
        <div className="max-w-[80%] rounded-2xl px-3 py-2 bg-transparent border border-dashed border-zinc-700 text-zinc-500 text-[13px] italic">
          Tin nhắn đã được xóa
        </div>
      </div>
    );
  }

  const StatusIcon =
    m.status === "read" ? CheckCheck : m.status === "delivered" ? CheckCheck : Check;
  const statusColor =
    m.status === "read" ? "text-sky-300" : mine ? "text-white/50" : "text-zinc-500";

  return (
    <div
      className={`group flex ${mine ? "justify-end" : "justify-start"} mb-2 relative`}
      onMouseEnter={() => setShowBar(true)}
      onMouseLeave={() => setShowBar(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`max-w-[80%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
        {!mine && name ? (
          <span className="text-[11px] text-zinc-500 mb-0.5 ml-1">{name}</span>
        ) : null}

        <div
          className={`relative rounded-2xl px-3 py-2 ${
            mine
              ? "bg-[#0068ff] text-white rounded-br-md"
              : "bg-[#2a2e36] text-zinc-100 rounded-bl-md"
          }`}
        >
          {m.forwardedFrom && (
            <p className={`text-[11px] mb-1 ${mine ? "text-white/70" : "text-zinc-400"}`}>
              Đã chuyển tiếp
            </p>
          )}
          {replyPreview && !replyPreview.deleted && (
            <div
              className={`mb-1.5 pl-2 border-l-2 text-[12px] line-clamp-2 ${
                mine ? "border-white/40 text-white/80" : "border-[#5b9dff] text-zinc-400"
              }`}
            >
              {replyPreview.text || "Đính kèm"}
            </div>
          )}

          {editing ? (
            <div className="space-y-2 min-w-[180px]">
              <input
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full rounded-lg bg-black/20 px-2 py-1 text-sm outline-none"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="text-[11px] opacity-80"
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className="text-[11px] font-semibold"
                  onClick={() => {
                    editMessage(m.id, editText);
                    setEditing(false);
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          ) : (
            <>
              {m.attachments?.map((a) => {
                if (a.type === "image") {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={a.id}
                      src={a.url}
                      alt={a.name || ""}
                      className="max-w-full max-h-56 rounded-lg mb-1 object-cover"
                    />
                  );
                }
                if (a.type === "audio") {
                  return (
                    <audio key={a.id} controls src={a.url} className="max-w-full mb-1 h-10" />
                  );
                }
                if (a.type === "sticker") {
                  return (
                    <span key={a.id} className="text-4xl leading-none block my-1">
                      {a.url}
                    </span>
                  );
                }
                return (
                  <a
                    key={a.id}
                    href={a.url}
                    download={a.name}
                    className={`block text-[13px] underline mb-1 ${
                      mine ? "text-white/90" : "text-sky-300"
                    }`}
                  >
                    📎 {a.name || "Tệp đính kèm"}
                  </a>
                );
              })}
              {m.text ? <p className="text-[14px] whitespace-pre-wrap break-words">{m.text}</p> : null}
            </>
          )}

          <div className={`flex items-center gap-1 mt-1 justify-end ${statusColor}`}>
            {m.editedAt ? <span className="text-[10px] opacity-70">đã sửa</span> : null}
            <span className="text-[10px]">{formatChatTime(m.timestamp)}</span>
            {mine && <StatusIcon className="w-3.5 h-3.5" />}
          </div>
        </div>

        {m.reactions && m.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-0.5 px-1">
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => toggleReaction(m.id, r.emoji)}
                className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#2a2e36] border border-white/10"
              >
                {r.emoji} {r.userIds.length}
              </button>
            ))}
          </div>
        )}
      </div>

      {(showBar || false) && (
        <div
          className={`absolute ${mine ? "right-0" : "left-0"} -top-8 flex items-center gap-0.5 rounded-full bg-neutral-900 border border-neutral-700 shadow-lg px-1 py-0.5 z-10`}
        >
          {QUICK.map((e) => (
            <button
              key={e}
              type="button"
              className="text-sm px-1 hover:scale-110"
              onClick={() => toggleReaction(m.id, e)}
            >
              {e}
            </button>
          ))}
          <button
            type="button"
            className="p-1 text-zinc-400 hover:text-white"
            title="Trả lời"
            onClick={() => setReplyTo(m)}
          >
            <Reply className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 text-zinc-400 hover:text-white"
            title="Sao chép"
            onClick={() => void navigator.clipboard.writeText(m.text || "")}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onForward && (
            <button
              type="button"
              className="p-1 text-zinc-400 hover:text-white"
              title="Chuyển tiếp"
              onClick={() => onForward(m.id)}
            >
              <Forward className="w-3.5 h-3.5" />
            </button>
          )}
          {mine && (
            <>
              <button
                type="button"
                className="p-1 text-zinc-400 hover:text-white"
                title="Sửa"
                onClick={() => {
                  setEditText(m.text || "");
                  setEditing(true);
                }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1 text-zinc-400 hover:text-rose-300"
                title="Xóa chỉ mình tôi"
                onClick={() => deleteMessage(m.id, "me")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                className="p-1 text-zinc-400 hover:text-rose-400"
                title="Thu hồi với mọi người"
                onClick={() => {
                  if (window.confirm("Thu hồi tin nhắn với mọi người?")) {
                    deleteMessage(m.id, "everyone");
                  }
                }}
              >
                <span className="text-[10px] font-bold leading-none">↩</span>
              </button>
            </>
          )}
          {!mine && (
            <button
              type="button"
              className="p-1 text-zinc-400 hover:text-rose-300"
              title="Ẩn tin này"
              onClick={() => deleteMessage(m.id, "me")}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
