"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Phone,
  Video,
  Info,
  Send,
  Smile,
  Paperclip,
  X,
} from "lucide-react";
import { useChatStore, type Conversation } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";
import MessageBubble from "./MessageBubble";
import CallModal from "./CallModal";

const EMOJIS = ["😀", "😂", "🥰", "👍", "🔥", "🍿", "🎬", "❤️", "😮", "👏"];

export default function ChatWindow({
  conversation,
  onBack,
}: {
  conversation: Conversation | null;
  onBack: () => void;
}) {
  const messagesMap = useChatStore((s) => s.messages);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const showInfo = useChatStore((s) => s.showInfo);
  const setShowInfo = useChatStore((s) => s.setShowInfo);
  const replyTo = useChatStore((s) => s.replyTo);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const me = useChatStore((s) => s.me);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const activeId = conversation?.id;
  const msgs = activeId ? messagesMap[activeId] || [] : [];
  const peer = conversation ? peerOf(conversation) : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, activeId]);

  if (!conversation) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center text-zinc-500 bg-neutral-950">
        <p className="text-sm">Chọn hội thoại hoặc kết bạn bằng UID</p>
      </div>
    );
  }

  function onSend() {
    if (!text.trim()) return;
    void sendMessage(text);
    setText("");
    setEmojiOpen(false);
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const isImg = f.type.startsWith("image/");
    void sendMessage(isImg ? "" : `Tệp: ${f.name}`, [
      { id: `a_${Date.now()}`, type: isImg ? "image" : "file", url, name: f.name },
    ]);
    e.target.value = "";
  }

  const statusText = conversation.isGroup
    ? `${conversation.participants.length} thành viên`
    : peer?.uid
    ? `UID ${peer.uid}`
    : peer?.status === "online"
    ? "Đang hoạt động"
    : "Bạn bè";

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-neutral-950 h-full">
      <div className="h-14 shrink-0 px-2 sm:px-4 flex items-center gap-2 border-b border-neutral-800">
        <button
          type="button"
          className="md:hidden p-2 rounded-full hover:bg-neutral-800 text-zinc-400"
          onClick={onBack}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {conversation.isGroup ? (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white text-xs font-bold">
            G
          </div>
        ) : (
          <ChatAvatar user={peer} size="sm" />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{displayTitle(conversation)}</p>
          <p className="text-[11px] text-zinc-500 truncate">{statusText}</p>
        </div>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-neutral-800 text-zinc-400"
          onClick={() => setCall("audio")}
          title="Gọi thoại"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-neutral-800 text-zinc-400"
          onClick={() => setCall("video")}
          title="Gọi video"
        >
          <Video className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className={`p-2 rounded-full hover:bg-neutral-800 ${
            showInfo ? "text-rose-400" : "text-zinc-400"
          }`}
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 custom-scroll">
        {msgs.map((m) => {
          const reply = m.replyToId ? msgs.find((x) => x.id === m.replyToId) : null;
          return (
            <MessageBubble
              key={m.id}
              m={m}
              mine={!!me && m.senderId === me}
              name={getUser(m.senderId)?.name}
              replyPreview={reply}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 border-t border-neutral-800 px-2 sm:px-4 py-2.5">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-zinc-400">
            <div className="flex-1 min-w-0 border-l-2 border-rose-500 pl-2">
              <p className="text-rose-300 font-medium">Trả lời</p>
              <p className="truncate">{replyTo.text || "Đính kèm"}</p>
            </div>
            <button type="button" onClick={() => setReplyTo(null)} className="p-1 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {emojiOpen && (
          <div className="flex flex-wrap gap-1 mb-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="text-xl p-1 hover:scale-125 transition"
                onClick={() => setText((prev) => prev + e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className="p-2.5 rounded-full hover:bg-neutral-800 text-zinc-400"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="p-2.5 rounded-full hover:bg-neutral-800 text-zinc-400"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input ref={fileRef} type="file" className="hidden" accept="image/*,*/*" onChange={onFile} />
          <div className="flex-1 rounded-2xl bg-neutral-900 border border-neutral-800 px-3 py-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none resize-none max-h-28"
            />
          </div>
          <button
            type="button"
            onClick={onSend}
            disabled={!text.trim()}
            className="p-2.5 rounded-full bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-500"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <CallModal open={!!call} mode={call || "audio"} peer={peer} onClose={() => setCall(null)} />
    </div>
  );
}
