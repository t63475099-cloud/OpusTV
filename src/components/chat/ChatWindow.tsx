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
  Search,
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

const EMOJIS = ["😀", "😂", "😍", "🥰", "👍", "🔥", "😢", "😮", "🎉", "❤️", "🙏", "👏"];

export default function ChatWindow({
  conversation,
  onBack,
  onToggleInfo,
}: {
  conversation: Conversation | null;
  onBack: () => void;
  onToggleInfo?: () => void;
}) {
  const me = useChatStore((s) => s.me);
  const peerOf = useChatStore((s) => s.peerOf);
  const displayTitle = useChatStore((s) => s.displayTitle);
  const messages = useChatStore((s) =>
    conversation ? s.messages[conversation.id] || [] : []
  );
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadThread = useChatStore((s) => s.loadThread);
  const replyTo = useChatStore((s) => s.replyTo);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const notifyTyping = useChatStore((s) => s.notifyTyping);
  const pollTyping = useChatStore((s) => s.pollTyping);
  const typingPeers = useChatStore((s) => s.typingPeers);
  const getUser = useChatStore((s) => s.getUser);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const peer = conversation ? peerOf(conversation) : null;
  const peerId = conversation?.peerUsername || peer?.id || "";
  const peerTyping = !!(
    peerId &&
    typingPeers?.[peerId] &&
    Date.now() - typingPeers[peerId] < 6000
  );
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
    const id = window.setInterval(() => void pollTyping(peerId), 2500);
    return () => window.clearInterval(id);
  }, [peerId, pollTyping]);

  const onType = useCallback(
    (value: string) => {
      setText(value);
      if (!peerId || !value.trim()) return;
      notifyTyping(peerId);
    },
    [peerId, notifyTyping]
  );

  const onSend = async () => {
    const v = text.trim();
    if (!v || !conversation) return;
    setText("");
    setEmojiOpen(false);
    await sendMessage(v);
    inputRef.current?.focus();
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#1a1d21]">
        <div className="w-16 h-16 rounded-2xl bg-[#0068ff]/20 flex items-center justify-center mb-4">
          <Send className="w-7 h-7 text-[#5b9dff]" />
        </div>
        <p className="text-white font-medium text-base mb-1">Chọn một hội thoại</p>
        <p className="text-sm text-zinc-500 max-w-xs">
          Chọn bạn bè bên trái hoặc bấm + để kết bạn bằng UID
        </p>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full min-h-0 bg-[#1a1d21]"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <header className="shrink-0 flex items-center gap-2 px-2 sm:px-3 h-14 border-b border-[#2a2d34] bg-[#16181c]">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onBack();
          }}
          className="md:hidden p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300"
          aria-label="Quay lại danh sách"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <ChatAvatar user={livePeer} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-white truncate">
            {displayTitle(conversation)}
          </p>
          <p className="text-[12px] truncate leading-tight">
            {peerTyping ? (
              <span className="text-[#5b9dff]">Đang soạn tin…</span>
            ) : (
              <span className="text-zinc-500">{formatLastSeen(livePeer)}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCall("audio");
          }}
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300"
          aria-label="Gọi thoại"
        >
          <Phone className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCall("video");
          }}
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300"
          aria-label="Gọi video"
        >
          <Video className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300 hidden sm:inline-flex"
          aria-label="Tìm kiếm"
        >
          <Search className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleInfo?.();
          }}
          className="p-2 rounded-full hover:bg-[#2a2e36] text-zinc-300 hidden sm:inline-flex"
          aria-label="Thông tin"
        >
          <Info className="w-5 h-5" />
        </button>
      </header>

      {/* Messages */}
      <div
        data-chat-scroll
        className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 min-h-0 overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {messages.map((m, i) => {
          const mine = m.senderId === me;
          const prev = messages[i - 1];
          const showTime = !prev || m.timestamp - prev.timestamp > 5 * 60 * 1000;
          const replyMsg = m.replyToId
            ? messages.find((x) => x.id === m.replyToId)
            : undefined;
          return (
            <div key={m.id}>
              {showTime && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] text-zinc-400 bg-[#2a2e36] px-3 py-0.5 rounded-full">
                    {formatChatTime(m.timestamp)}
                  </span>
                </div>
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
          <div className="flex items-center gap-2 mt-1 mb-2">
            <ChatAvatar user={livePeer} size="sm" showStatus={false} />
            <div className="rounded-2xl rounded-bl-md bg-[#2a2e36] px-3 py-2 flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="shrink-0 mx-3 mb-1 px-3 py-2 rounded-lg bg-[#2a2e36] flex items-start gap-2 border-l-2 border-[#0068ff]">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#5b9dff] font-semibold">Trả lời</p>
            <p className="text-xs text-zinc-400 truncate">{replyTo.text || "Đính kèm"}</p>
          </div>
          <button type="button" onClick={() => setReplyTo(null)} className="text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-[#2a2d34] bg-[#16181c] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {emojiOpen && (
          <div className="flex flex-wrap gap-1 mb-2 px-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                className="text-xl p-1 hover:scale-110 transition-transform"
                onClick={() => setText((t) => t + e)}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-1">
          <button
            type="button"
            onClick={() => setEmojiOpen((v) => !v)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <Smile className="w-5 h-5" />
          </button>
          <button
            type="button"
            className="p-2 text-zinc-400 hover:text-white"
            onClick={() => {
              const url = window.prompt("Dán link ảnh");
              if (url?.trim()) {
                void sendMessage(" ", [
                  { id: `a_${Date.now()}`, type: "image", url: url.trim() },
                ]);
              }
            }}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => onType(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void onSend();
              }
            }}
            rows={1}
            placeholder={`Nhập tin nhắn với ${displayTitle(conversation)}`}
            className="flex-1 min-w-0 max-h-28 resize-none rounded-lg bg-[#2a2e36] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-[#0068ff]/40"
          />
          <button
            type="button"
            onClick={() => void onSend()}
            disabled={!text.trim()}
            className="p-2.5 rounded-full bg-[#0068ff] text-white disabled:opacity-40 disabled:bg-[#2a2e36]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      <CallModal
        open={!!call}
        mode={call || "audio"}
        peer={livePeer}
        onClose={() => setCall(null)}
      />
    </div>
  );
}
