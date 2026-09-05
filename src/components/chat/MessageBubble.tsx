"use client";

import { useState } from "react";
import { Reply, Check, CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/lib/chatStore";
import { formatChatTime, useChatStore } from "@/lib/chatStore";

const QUICK = ["❤️", "👍", "😂", "😮", "😢"];

export default function MessageBubble({
  m,
  mine,
  name,
  replyPreview,
}: {
  m: ChatMessage;
  mine: boolean;
  name?: string;
  replyPreview?: ChatMessage | null;
}) {
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const [showBar, setShowBar] = useState(false);

  return (
    <div
      className={`group flex ${mine ? "justify-end" : "justify-start"} mb-2 relative oc-bubble-in`}
      onMouseEnter={() => setShowBar(true)}
      onMouseLeave={() => setShowBar(false)}
    >
      <div className={`max-w-[82%] relative ${mine ? "items-end" : "items-start"}`}>
        {showBar && (
          <div
            className={`absolute -top-9 ${mine ? "right-0" : "left-0"} flex items-center gap-0.5 px-1.5 py-1 rounded-full oc-glass z-10 oc-bubble-in`}
          >
            {QUICK.map((e) => (
              <button
                key={e}
                type="button"
                className="text-sm px-1 hover:scale-125 transition-transform"
                onClick={() => toggleReaction(m.id, e)}
              >
                {e}
              </button>
            ))}
            <button
              type="button"
              className="p-1 rounded-full hover:bg-white/10 text-zinc-400"
              title="Trả lời"
              onClick={() => setReplyTo(m)}
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div
          className={`rounded-2xl px-3.5 py-2 shadow-lg ${
            mine
              ? "bg-gradient-to-br from-rose-500 via-rose-600 to-fuchsia-700 text-white rounded-br-md shadow-rose-600/20"
              : "oc-glass text-zinc-100 rounded-bl-md"
          }`}
        >
          {!mine && name && (
            <p className="text-[10px] text-rose-300/90 font-semibold mb-0.5">{name}</p>
          )}
          {replyPreview && (
            <div
              className={`mb-1.5 pl-2 border-l-2 text-[11px] rounded-sm ${
                mine ? "border-white/40 text-white/75 bg-white/10" : "border-rose-500/60 text-zinc-400 bg-black/20"
              } py-1 pr-1`}
            >
              <p className="font-medium truncate">Chuỗi trả lời</p>
              <p className="truncate">{replyPreview.text || "Đính kèm"}</p>
            </div>
          )}
          {m.attachments?.map((a) =>
            a.type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={a.id}
                src={a.url}
                alt={a.name || ""}
                className="rounded-xl max-h-48 mb-1 object-cover ring-1 ring-white/10"
              />
            ) : (
              <p key={a.id} className="text-xs underline mb-1">
                {a.name || "Tệp"}
              </p>
            )
          )}
          {m.text && (
            <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
          )}
          <p
            className={`text-[10px] mt-1 flex items-center gap-1 justify-end ${
              mine ? "text-white/55" : "text-zinc-500"
            }`}
          >
            {formatChatTime(m.timestamp)}
            {mine &&
              (m.status === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
              ) : m.status === "delivered" ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              ))}
          </p>
        </div>

        {m.reactions && m.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => toggleReaction(m.id, r.emoji)}
                className="text-[11px] px-1.5 py-0.5 rounded-full oc-glass-soft"
              >
                {r.emoji} {r.userIds.length}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
