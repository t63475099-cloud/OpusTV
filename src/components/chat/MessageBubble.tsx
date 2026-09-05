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
      className={`group flex ${mine ? "justify-end" : "justify-start"} mb-1.5 relative`}
      onMouseEnter={() => setShowBar(true)}
      onMouseLeave={() => setShowBar(false)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`max-w-[78%] sm:max-w-[70%] relative`}>
        {showBar && (
          <div
            className={`absolute -top-8 ${mine ? "right-0" : "left-0"} flex items-center gap-0.5 px-1 py-0.5 rounded-full bg-[#2a2e36] border border-[#3a3f4a] z-10 shadow-lg`}
          >
            {QUICK.map((e) => (
              <button
                key={e}
                type="button"
                className="text-sm px-1 hover:scale-110"
                onClick={(ev) => {
                  ev.stopPropagation();
                  toggleReaction(m.id, e);
                }}
              >
                {e}
              </button>
            ))}
            <button
              type="button"
              className="p-1 text-zinc-400 hover:text-white"
              title="Trả lời"
              onClick={(ev) => {
                ev.stopPropagation();
                setReplyTo(m);
              }}
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div
          className={`rounded-2xl px-3 py-1.5 ${
            mine
              ? "bg-[#0068ff] text-white rounded-br-md"
              : "bg-[#2a2e36] text-zinc-100 rounded-bl-md"
          }`}
        >
          {!mine && name && (
            <p className="text-[11px] text-[#5b9dff] font-medium mb-0.5">{name}</p>
          )}
          {replyPreview && (
            <div
              className={`mb-1 pl-2 border-l-2 text-[11px] ${
                mine ? "border-white/40 text-white/80" : "border-[#0068ff] text-zinc-400"
              }`}
            >
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
                className="rounded-lg max-h-52 mb-1 object-cover"
              />
            ) : (
              <p key={a.id} className="text-xs underline mb-1">
                {a.name || "Tệp"}
              </p>
            )
          )}
          {m.text?.trim() && (
            <p className="text-[14.5px] whitespace-pre-wrap break-words leading-snug">
              {m.text}
            </p>
          )}
          <p
            className={`text-[10px] mt-0.5 flex items-center gap-0.5 justify-end ${
              mine ? "text-white/70" : "text-zinc-500"
            }`}
          >
            {formatChatTime(m.timestamp)}
            {mine &&
              (m.status === "read" ? (
                <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
              ) : m.status === "delivered" ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              ))}
          </p>
        </div>

        {m.reactions && m.reactions.length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-0.5 ${mine ? "justify-end" : "justify-start"}`}>
            {m.reactions.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => toggleReaction(m.id, r.emoji)}
                className="text-[11px] px-1.5 py-0.5 rounded-full bg-[#2a2e36] border border-[#3a3f4a]"
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
