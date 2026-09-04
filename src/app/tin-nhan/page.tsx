"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Plus,
  Phone,
  Video,
  Info,
  Send,
  Smile,
  Paperclip,
  Image as ImageIcon,
  BellOff,
  Bell,
  Ban,
  MoreVertical,
  MessageCircle,
  Users,
  X,
} from "lucide-react";
import {
  useChatStore,
  formatChatTime,
  type Conversation,
  type ChatMessage,
} from "@/lib/chatStore";
import ChatAvatar from "@/components/chat/ChatAvatar";
import NewChatModal from "@/components/chat/NewChatModal";

const EMOJIS = ["😀", "😂", "🥰", "👍", "🔥", "🍿", "🎬", "❤️", "😮", "👏"];

function ConvRow({
  c,
  active,
  onClick,
}: {
  c: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const title = displayTitle(c);
  const peer = peerOf(c);
  const last = c.lastMessage;
  const preview =
    last?.senderId === "me"
      ? `Bạn: ${last.text}`
      : last
      ? `${getUser(last.senderId)?.name?.split(" ").pop() || ""}: ${last.text}`.replace(/^: /, "")
      : "Chưa có tin nhắn";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition ${
        active ? "bg-white/10" : "hover:bg-white/5"
      }`}
    >
      {c.isGroup ? (
        <div className="relative w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center text-white shrink-0">
          <Users className="w-5 h-5" />
        </div>
      ) : (
        <ChatAvatar user={peer} />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-white truncate">{title}</p>
          {last && (
            <span className="text-[10px] text-zinc-500 shrink-0">{formatChatTime(last.timestamp)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p className="text-xs text-zinc-500 truncate">{preview}</p>
          {c.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center shrink-0">
              {c.unreadCount > 99 ? "99+" : c.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function Bubble({ m, mine, name }: { m: ChatMessage; mine: boolean; name?: string }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
          mine
            ? "bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-br-md"
            : "bg-neutral-800 text-zinc-100 rounded-bl-md"
        }`}
      >
        {!mine && name && (
          <p className="text-[10px] text-indigo-300 font-medium mb-0.5">{name}</p>
        )}
        {m.attachments?.map((a) =>
          a.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={a.url}
              alt={a.name || ""}
              className="rounded-lg max-h-40 mb-1 object-cover"
            />
          ) : (
            <p key={a.id} className="text-xs underline mb-1">
              {a.name || "Tệp đính kèm"}
            </p>
          )
        )}
        {m.text && <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>}
        <p className={`text-[10px] mt-1 ${mine ? "text-white/60" : "text-zinc-500"}`}>
          {formatChatTime(m.timestamp)}
          {mine && (
            <span className="ml-1.5">
              {m.status === "read" ? "Đã xem" : m.status === "delivered" ? "Đã nhận" : "Đã gửi"}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

export default function TinNhanPage() {
  const conversations = useChatStore((s) => s.filteredConversations);
  const activeId = useChatStore((s) => s.activeId);
  const setActive = useChatStore((s) => s.setActive);
  const messagesMap = useChatStore((s) => s.messages);
  const search = useChatStore((s) => s.search);
  const setSearch = useChatStore((s) => s.setSearch);
  const tab = useChatStore((s) => s.tab);
  const setTab = useChatStore((s) => s.setTab);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const typingIn = useChatStore((s) => s.typingIn);
  const displayTitle = useChatStore((s) => s.displayTitle);
  const peerOf = useChatStore((s) => s.peerOf);
  const getUser = useChatStore((s) => s.getUser);
  const showInfo = useChatStore((s) => s.showInfo);
  const setShowInfo = useChatStore((s) => s.setShowInfo);
  const toggleMute = useChatStore((s) => s.toggleMute);
  const allConv = useChatStore((s) => s.conversations);

  const [text, setText] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = conversations();
  const active = allConv.find((c) => c.id === activeId) || null;
  const msgs = activeId ? messagesMap[activeId] || [] : [];
  const peer = active ? peerOf(active) : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length, typingIn, activeId]);

  useEffect(() => {
    if (activeId) setMobileShowChat(true);
  }, [activeId]);

  const sharedImages = useMemo(() => {
    return msgs.flatMap((m) => m.attachments || []).filter((a) => a.type === "image");
  }, [msgs]);

  function onSend() {
    if (!text.trim()) return;
    sendMessage(text);
    setText("");
    setEmojiOpen(false);
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    const isImg = f.type.startsWith("image/");
    sendMessage(isImg ? "" : `Đã gửi tệp: ${f.name}`, [
      {
        id: `att_${Date.now()}`,
        type: isImg ? "image" : "file",
        url,
        name: f.name,
      },
    ]);
    e.target.value = "";
  }

  return (
    <div className="h-[100dvh] pt-14 bg-neutral-950 text-zinc-100 flex flex-col">
      <div className="flex-1 min-h-0 flex max-w-6xl w-full mx-auto border-x border-white/5">
        {/* Sidebar */}
        <aside
          className={`w-full md:w-[340px] lg:w-[360px] shrink-0 border-r border-white/10 flex flex-col bg-neutral-950 ${
            mobileShowChat ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-3 pt-3 pb-2 flex items-center gap-2">
            <Link href="/" className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="flex-1 text-lg font-bold text-white flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-rose-400" />
              Tin nhắn
            </h1>
            <button
              type="button"
              onClick={() => setNewOpen(true)}
              className="p-2 rounded-full bg-rose-600/20 text-rose-300 hover:bg-rose-600/30"
              title="Tạo chat"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm hội thoại..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-900 border border-white/10 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-rose-500/40"
              />
            </div>
            <div className="flex gap-1 mt-2 p-0.5 rounded-xl bg-neutral-900 border border-white/5">
              <button
                type="button"
                onClick={() => setTab("all")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  tab === "all" ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setTab("groups")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium ${
                  tab === "groups" ? "bg-white/10 text-white" : "text-zinc-500"
                }`}
              >
                Nhóm
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5">
            {list.length === 0 ? (
              <p className="text-center text-sm text-zinc-600 py-10">Không có hội thoại</p>
            ) : (
              list.map((c) => (
                <ConvRow
                  key={c.id}
                  c={c}
                  active={c.id === activeId}
                  onClick={() => setActive(c.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Chat workspace */}
        <main
          className={`flex-1 min-w-0 flex flex-col bg-neutral-950 ${
            mobileShowChat ? "flex" : "hidden md:flex"
          }`}
        >
          {!active ? (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 px-6">
              <MessageCircle className="w-14 h-14 mb-3 opacity-30" />
              <p className="text-sm">Chọn một hội thoại để bắt đầu</p>
              <button
                type="button"
                onClick={() => setNewOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium"
              >
                Tạo tin nhắn mới
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="h-14 shrink-0 px-2 sm:px-4 flex items-center gap-2 border-b border-white/10 bg-neutral-950/90 backdrop-blur">
                <button
                  type="button"
                  className="md:hidden p-2 rounded-full hover:bg-white/10 text-zinc-400"
                  onClick={() => {
                    setMobileShowChat(false);
                    setActive(null);
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                {active.isGroup ? (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <ChatAvatar user={peer} size="sm" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{displayTitle(active)}</p>
                  <p className="text-[11px] text-zinc-500 truncate">
                    {typingIn === activeId
                      ? "Đang nhập..."
                      : active.isGroup
                      ? `${active.participants.length} thành viên`
                      : peer?.status === "online"
                      ? "Đang hoạt động"
                      : peer?.status === "away"
                      ? "Vừa truy cập"
                      : "Ngoại tuyến"}
                  </p>
                </div>
                <button type="button" className="p-2 rounded-full hover:bg-white/10 text-zinc-400" title="Gọi thoại">
                  <Phone className="w-5 h-5" />
                </button>
                <button type="button" className="p-2 rounded-full hover:bg-white/10 text-zinc-400" title="Gọi video">
                  <Video className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowInfo(!showInfo)}
                  className={`p-2 rounded-full hover:bg-white/10 ${showInfo ? "text-rose-400" : "text-zinc-400"}`}
                  title="Thông tin"
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-1">
                {msgs.map((m) => (
                  <Bubble
                    key={m.id}
                    m={m}
                    mine={m.senderId === "me"}
                    name={getUser(m.senderId)?.name}
                  />
                ))}
                {typingIn === activeId && (
                  <div className="flex justify-start mb-2">
                    <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-zinc-400 text-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:0.3s]" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="shrink-0 border-t border-white/10 px-2 sm:px-4 py-2.5 bg-neutral-950">
                {emojiOpen && (
                  <div className="flex flex-wrap gap-1 mb-2 p-2 rounded-xl bg-neutral-900 border border-white/10">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        type="button"
                        className="text-xl p-1 hover:scale-125 transition"
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
                    className="p-2.5 rounded-full hover:bg-white/10 text-zinc-400"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="p-2.5 rounded-full hover:bg-white/10 text-zinc-400"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input ref={fileRef} type="file" className="hidden" accept="image/*,*/*" onChange={onPickFile} />
                  <div className="flex-1 rounded-2xl bg-neutral-900 border border-white/10 px-3 py-2">
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
            </>
          )}
        </main>

        {/* Info panel */}
        {active && showInfo && (
          <aside className="hidden lg:flex w-[280px] shrink-0 border-l border-white/10 flex-col bg-neutral-950">
            <div className="h-14 px-3 flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-semibold text-white">Chi tiết</span>
              <button type="button" onClick={() => setShowInfo(false)} className="p-2 rounded-full hover:bg-white/10 text-zinc-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center text-center border-b border-white/10">
              {active.isGroup ? (
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-rose-500 flex items-center justify-center mb-2">
                  <Users className="w-7 h-7 text-white" />
                </div>
              ) : (
                <ChatAvatar user={peer} size="lg" />
              )}
              <p className="mt-2 text-white font-semibold">{displayTitle(active)}</p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {active.isGroup ? `${active.participants.length} thành viên` : peer?.bio || peer?.status}
              </p>
            </div>
            <div className="p-3 space-y-1">
              <button
                type="button"
                onClick={() => toggleMute(active.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-zinc-300"
              >
                {active.muted ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {active.muted ? "Bật thông báo" : "Tắt thông báo"}
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm text-rose-400"
              >
                <Ban className="w-4 h-4" />
                Chặn người dùng
              </button>
            </div>
            <div className="px-3 pt-2">
              <p className="text-xs text-zinc-500 mb-2 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" /> Ảnh đã chia sẻ
              </p>
              {sharedImages.length === 0 ? (
                <p className="text-xs text-zinc-600">Chưa có ảnh</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {sharedImages.map((a) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={a.id} src={a.url} alt="" className="aspect-square object-cover rounded-lg" />
                  ))}
                </div>
              )}
            </div>
            {!active.isGroup && peer && (
              <div className="mt-auto p-3 text-[11px] text-zinc-600">
                <MoreVertical className="w-3 h-3 inline mr-1" />
                ID: {peer.id}
              </div>
            )}
          </aside>
        )}
      </div>

      <NewChatModal open={newOpen} onClose={() => setNewOpen(false)} />
    </div>
  );
}
