"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ArrowLeft,
  Info,
  Phone,
  Video,
  Send,
  Smile,
  Paperclip,
  X,
} from "lucide-react";
import {
  useChatStore,
  formatLastSeen,
  formatChatTime,
  type Conversation,
} from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";
import MessageBubble from "./MessageBubble";
import CallModal from "./CallModal";

const EMOJIS = ["😀", "😂", "😍", "🥰", "👍", "🔥", "😢", "😮", "🎉", "❤️"];

export default function ChatWindow({
  conversation,
  onBack,
}: {
  conversation: Conversation | null;
  onBack: () => void;
}) {
  const me = useChatStore((s) => s.me);
  const peerOf = useChatStore((s) => s.peerOf);
  const displayTitle = useChatStore((s) => s.displayTitle);
  const messages = useChatStore((s) =>
    conversation ? s.messages[conversation.id] || [] : []
  );
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadThread = useChatStore((s) => s.loadThread);
  const setShowInfo = useChatStore((s) => s.setShowInfo);
  const showInfo = useChatStore((s) => s.showInfo);
  const replyTo = useChatStore((s) => s.replyTo);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const toggleReaction = useChatStore((s) => s.toggleReaction);
  const notifyTyping = useChatStore((s) => s.notifyTyping);
  const pollTyping = useChatStore((s) => s.pollTyping);
  const typingPeers = useChatStore((s) => s.typingPeers);
  const getUser = useChatStore((s) => s.getUser);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const peer = conversation ? peerOf(conversation) : null;
  const peerId = conversation?.peerUsername || peer?.id || "";
  const peerTyping = !!(peerId && typingPeers[peerId] && Date.now() - typingPeers[peerId] < 6000);
  const livePeer = peerId ? getUser(peerId) || peer : peer;

  useEffect(() => {
    if (!peerId) return;
    void loadThread(peerId);
  }, [peerId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  useEffect(() => {
    if (!peerId) return;
    const id = window.setInterval(() => {
      void pollTyping(peerId);
    }, 2000);
    return () => window.clearInterval(id);
  }, [peerId, pollTyping]);

  const onType = useCallback(
    (value: string) => {
      setText(value);
      if (!peerId || !value.trim()) return;
      if (typingTimer.current) clearTimeout(typingTimer.current);
      notifyTyping(peerId);
      typingTimer.current = setTimeout(() => {}, 1500);
    },
    [peerId, notifyTyping]
  );

  const onSend = async () => {
    const v = text.trim();
    if (!v) return;
    setText("");
    setEmojiOpen(false);
    await sendMessage(v);
  };

  if (!conversation) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center bg-neutral-950/80 text-zinc-500 text-sm px-6 text-center">
        <p className="text-white/80 font-medium mb-1">Opus Chat</p>
        <p>Chọn một cuộc trò chuyện hoặc kết bạn bằng UID</p>
      </div>
    );
  }

  const reply = replyTo
    ? messages.find((m) => m.id === replyTo.id) || replyTo
    : null;

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-neutral-950 h-full relative overflow-hidden">
      {/* Canvas glow nền */}
      <div className="pointer-events-none absolute inset-0 opacity-50">
        <div className="absolute -top-20 right-0 w-64 h-64 rounded-full bg-rose-600/20 blur-[90px] animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute bottom-20 left-0 w-56 h-56 rounded-full bg-indigo-600/15 blur-[80px] animate-[pulse_8s_ease-in-out_infinite]" />
      </div>

      {/* Header Zalo-style */}
      <header className="relative z-10 shrink-0 flex items-center gap-2 px-2 sm:px-3 h-14 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-300"
          aria-label="Quay lại"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ChatAvatar user={livePeer} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {displayTitle(conversation)}
          </p>
          <p className="text-[11px] text-zinc-400 truncate leading-tight">
            {peerTyping ? (
              <span className="text-emerald-400 animate-pulse">Đang soạn tin…</span>
            ) : (
              formatLastSeen(livePeer)
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCall("audio")}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-200"
          aria-label="Gọi thoại"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setCall("video")}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-200"
          aria-label="Gọi video"
        >
          <Video className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-200 hidden sm:inline-flex"
          aria-label="Thông tin"
        >
          <Info className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <div
        data-chat-scroll
        className="relative z-10 flex-1 overflow-y-auto px-3 sm:px-5 py-4 custom-scroll overscroll-contain space-y-1"
      >
        {messages.map((m, i) => {
          const mine = m.senderId === me;
          const prev = messages[i - 1];
          const showTime =
            !prev || m.timestamp - prev.timestamp > 5 * 60 * 1000;
          const replyMsg = m.replyToId
            ? messages.find((x) => x.id === m.replyToId)
            : undefined;
          return (
            <div key={m.id} className="animate-[fadeInUp_0.28s_ease]">
              {showTime && (
                <p className="text-center text-[10px] text-zinc-500 my-3">
                  {formatChatTime(m.timestamp)}
                </p>
              )}
              <MessageBubble
                m={m}
                mine={mine}
                name={mine ? undefined : livePeer?.name}
                replyPreview={replyMsg}
              />
            </div>
          );
        })}
        {peerTyping && (
          <div className="flex items-center gap-2 mt-2 animate-[fadeInUp_0.2s_ease]">
            <ChatAvatar user={livePeer} size="sm" showStatus={false} />
            <div className="rounded-2xl rounded-bl-md bg-neutral-800/90 px-3 py-2 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Reply chain bar */}
      {replyTo && (
        <div className="relative z-10 shrink-0 mx-3 mb-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2">
          <div className="flex-1 min-w-0 border-l-2 border-rose-500 pl-2">
            <p className="text-[11px] text-rose-400 font-medium">Trả lời trong chuỗi</p>
            <p className="text-xs text-zinc-400 truncate">{replyTo.text || "Đính kèm"}</p>
          </div>
          <button type="button" onClick={() => setReplyTo(null)} className="p-1 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="relative z-10 shrink-0 border-t border-white/10 bg-neutral-950/90 backdrop-blur-xl px-2 sm:px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {emojiOpen && (
          <div className="flex flex-wrap gap-1 mb-2 p-2 rounded-xl bg-neutral-900 border border-white/10">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="text-xl p-1 hover:scale-110 transition"
                onClick={() => setText((t) => t + e)}
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
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
            onClick={() => {
              const url = window.prompt("Dán link ảnh");
              if (url?.trim()) {
                void sendMessage(" ", [
                  {
                    id: `a_${Date.now()}`,
                    type: "image",
                    url: url.trim(),
                  },
                ]);
              }
            }}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 rounded-2xl bg-neutral-900 border border-white/10 px-3 py-2">
            <textarea
              value={text}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
              rows={1}
              placeholder="Nhập tin nhắn..."
              className="w-full bg-transparent text-sm text-white placeholder:text-zinc-600 outline-none resize-none max-h-28"
            />
          </div>
          <button
            type="button"
            onClick={() => void onSend()}
            disabled={!text.trim()}
            className="p-2.5 rounded-full bg-rose-600 text-white disabled:opacity-40 hover:bg-rose-500 active:scale-95 transition"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <CallModal open={!!call} mode={call || "audio"} peer={livePeer} onClose={() => setCall(null)} />
    </div>
  );
}
