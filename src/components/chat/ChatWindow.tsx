"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Info,
  Phone,
  Video,
  Send,
  Smile,
  X,
  Search,
  Pin,
} from "lucide-react";
import {
  useChatStore,
  formatLastSeen,
  formatChatDayLabel,
  type Conversation,
  type ChatAttachment,
  type ChatMessage,
} from "@/lib/chatStore";
import ChatAvatar, { GroupAvatar } from "./ChatAvatar";
import MessageBubble from "./MessageBubble";
import CallModal from "./CallModal";
import VoiceRecorder from "./VoiceRecorder";
import StickerEmojiPicker from "./StickerEmojiPicker";
import AttachmentBar from "./AttachmentBar";

const EMPTY_MSGS: ChatMessage[] = [];

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
  const convId = conversation?.id ?? null;
  const messages = useChatStore((s) => {
    if (!convId) return EMPTY_MSGS;
    return s.messages[convId] ?? EMPTY_MSGS;
  });
  const sendMessage = useChatStore((s) => s.sendMessage);
  const loadThread = useChatStore((s) => s.loadThread);
  const loadGroupThread = useChatStore((s) => s.loadGroupThread);
  const activeId = useChatStore((s) => s.activeId);
  const replyTo = useChatStore((s) => s.replyTo);
  const setReplyTo = useChatStore((s) => s.setReplyTo);
  const notifyTyping = useChatStore((s) => s.notifyTyping);
  const pollTyping = useChatStore((s) => s.pollTyping);
  const typingPeers = useChatStore((s) => s.typingPeers);
  const getUser = useChatStore((s) => s.getUser);
  const markConversationRead = useChatStore((s) => s.markConversationRead);
  const forwardMessage = useChatStore((s) => s.forwardMessage);
  const conversations = useChatStore((s) => s.conversations);

  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [call, setCall] = useState<"audio" | "video" | null>(null);
  const [pending, setPending] = useState<ChatAttachment[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [forwardId, setForwardId] = useState<string | null>(null);
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
    if (!activeId) return;
    const conv = useChatStore.getState().conversations.find((c) => c.id === activeId);
    if (conv?.isGroup) void loadGroupThread(activeId);
    else if (peerId) void loadThread(peerId);
    markConversationRead(activeId);
  }, [activeId, peerId, loadThread, loadGroupThread, markConversationRead]);

  useEffect(() => {
    if (!peerId || conversation?.isGroup) return;
    const id = window.setInterval(() => void pollTyping(peerId), 2500);
    return () => clearInterval(id);
  }, [peerId, pollTyping, conversation?.isGroup]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, peerTyping]);

  const onType = useCallback(
    (value: string) => {
      setText(value);
      if (!peerId || !value.trim() || conversation?.isGroup) return;
      notifyTyping(peerId);
    },
    [peerId, notifyTyping, conversation?.isGroup]
  );

  const filtered = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        (m.text || "").toLowerCase().includes(q) ||
        (m.attachments || []).some((a) => (a.name || "").toLowerCase().includes(q))
    );
  }, [messages, searchQ]);

  const onSend = async () => {
    const v = text.trim();
    if ((!v && !pending.length) || !conversation) return;
    setText("");
    setPickerOpen(false);
    const atts = [...pending];
    setPending([]);
    await sendMessage(v || (atts.length ? " " : ""), atts.length ? atts : undefined);
    inputRef.current?.focus();
  };

  const msgMap = useMemo(() => {
    const m = new Map<string, ChatMessage>();
    for (const x of messages) m.set(x.id, x);
    return m;
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 bg-[#1a1d21]">
        <div className="w-16 h-16 rounded-2xl bg-[#0068ff]/20 flex items-center justify-center mb-4">
          <Send className="w-7 h-7 text-[#5b9dff]" />
        </div>
        <p className="text-white font-medium">Chọn một hội thoại</p>
        <p className="text-sm text-zinc-500 mt-1 max-w-xs">
          Chọn bạn bè bên trái hoặc bấm + để kết bạn bằng UID
        </p>
      </div>
    );
  }

  const title = displayTitle(conversation);
  const subtitle = conversation.isGroup
    ? `${conversation.participants.length} thành viên`
    : peerTyping
      ? "Đang soạn tin..."
      : formatLastSeen(livePeer);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-[#1a1d21]">
      {/* Header */}
      <header
        data-chat-header
        className="shrink-0 flex items-center gap-2 px-2 sm:px-3 h-14 border-b border-[#2a2d34] bg-[#16181c]"
      >
        <button
          type="button"
          onClick={onBack}
          className="lg:hidden p-2 rounded-full hover:bg-white/10 text-zinc-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onToggleInfo}
          className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
        >
          {conversation.isGroup ? (
            <GroupAvatar
              members={conversation.participants.map((id) => getUser(id))}
              size="sm"
              title={title}
            />
          ) : (
            <ChatAvatar user={livePeer} size="sm" />
          )}
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-white truncate flex items-center gap-1">
              {title}
              {conversation.pinned ? <Pin className="w-3 h-3 text-amber-400" /> : null}
            </p>
            <p className="text-[12px] text-zinc-400 truncate">{subtitle}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => setSearchOpen((v) => !v)}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-300"
          title="Tìm trong chat"
        >
          <Search className="w-5 h-5" />
        </button>
        {!conversation.isGroup && (
          <>
            <button
              type="button"
              onClick={() => setCall("audio")}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-300"
              title="Gọi thoại"
            >
              <Phone className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setCall("video")}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-300"
              title="Gọi video"
            >
              <Video className="w-5 h-5" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={onToggleInfo}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-300"
          title="Thông tin"
        >
          <Info className="w-5 h-5" />
        </button>
      </header>

      {searchOpen && (
        <div className="shrink-0 px-3 py-2 border-b border-[#2a2d34] bg-[#16181c]">
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Tìm tin nhắn trong hội thoại..."
            className="w-full rounded-xl bg-[#2a2e36] px-3 py-2 text-sm text-white outline-none"
            autoFocus
          />
        </div>
      )}

      {conversation.isGroup && conversation.announcement ? (
        <div className="shrink-0 px-3 py-2 bg-amber-500/10 border-b border-amber-500/20 text-[12px] text-amber-100/90">
          <span className="font-semibold text-amber-300">Ghim: </span>
          {conversation.announcement}
        </div>
      ) : null}

      {/* Messages */}
      <div
        data-chat-scroll
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-3 min-h-0"
      >
        {filtered.map((m, i) => {
          const prev = filtered[i - 1];
          const showDay =
            !prev ||
            new Date(prev.timestamp).toDateString() !==
              new Date(m.timestamp).toDateString();
          return (
            <div key={m.id}>
              {showDay && (
                <div className="flex justify-center my-3">
                  <span className="text-[11px] px-3 py-1 rounded-full bg-[#2a2e36] text-zinc-400">
                    {formatChatDayLabel(m.timestamp)}
                  </span>
                </div>
              )}
              <MessageBubble
                m={m}
                mine={m.senderId === me}
                name={
                  conversation.isGroup && m.senderId !== me
                    ? getUser(m.senderId)?.name || m.senderId
                    : undefined
                }
                replyPreview={m.replyToId ? msgMap.get(m.replyToId) : null}
                onCallBack={!conversation.isGroup ? (mode) => setCall(mode) : undefined}
                onForward={(id) => setForwardId(id)}
              />
            </div>
          );
        })}
        {peerTyping && (
          <p className="text-[12px] text-zinc-500 px-2 py-1 animate-pulse">Đang soạn tin...</p>
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-[#16181c] border-t border-[#2a2d34]">
          <div className="flex-1 min-w-0 border-l-2 border-[#0068ff] pl-2">
            <p className="text-[11px] text-[#5b9dff]">Trả lời</p>
            <p className="text-xs text-zinc-400 truncate">{replyTo.text || "Đính kèm"}</p>
          </div>
          <button type="button" onClick={() => setReplyTo(null)} className="p-1 text-zinc-500">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 border-t border-[#2a2d34] bg-[#16181c] px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {pickerOpen && (
          <div className="mb-2">
            <StickerEmojiPicker
              onPickEmoji={(e) => setText((t) => t + e)}
              onPickSticker={(s) => {
                void sendMessage("", [
                  { id: `st_${Date.now()}`, type: "sticker", url: s, name: "sticker" },
                ]);
                setPickerOpen(false);
              }}
            />
          </div>
        )}
        <AttachmentBar pending={pending} setPending={setPending} />
        <div className="flex items-end gap-1">
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="p-2 text-zinc-400 hover:text-white"
          >
            <Smile className="w-5 h-5" />
          </button>
          <VoiceRecorder
            onSend={(att) => {
              void sendMessage("", [att]);
            }}
          />
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
            placeholder={`Nhập tin nhắn với ${title}`}
            className="flex-1 min-w-0 max-h-28 resize-none rounded-lg bg-[#2a2e36] px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none focus:ring-1 focus:ring-[#0068ff]/40"
          />
          <button
            type="button"
            onClick={() => void onSend()}
            disabled={!text.trim() && !pending.length}
            className="p-2.5 rounded-full bg-[#0068ff] text-white disabled:opacity-40 disabled:bg-[#2a2e36]"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {forwardId && (
        <div className="fixed inset-0 z-[180] flex items-end sm:items-center justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setForwardId(null)}
          />
          <div className="relative w-full sm:max-w-sm max-h-[70vh] rounded-t-2xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-800 font-semibold text-white">
              Chuyển tiếp tới
            </div>
            <div className="overflow-y-auto max-h-[50vh]">
              {conversations
                .filter((c) => c.id !== conversation.id)
                .map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-white/5 text-sm text-white border-b border-neutral-800/60"
                    onClick={() => {
                      void forwardMessage(forwardId, c.id);
                      setForwardId(null);
                    }}
                  >
                    {displayTitle(c)}
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      <CallModal
        open={!!call}
        mode={call || "audio"}
        peer={livePeer}
        role="caller"
        onClose={() => setCall(null)}
      />
    </div>
  );
}
