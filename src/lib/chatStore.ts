"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserStatus = "online" | "offline" | "away";
export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  status: UserStatus;
  lastSeen?: number;
  bio?: string;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  name?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId?: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  attachments?: ChatAttachment[];
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title?: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  muted?: boolean;
  updatedAt: number;
}

function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** Liên hệ mẫu — OpusFilm */
export const SEED_USERS: ChatUser[] = [
  {
    id: "me",
    name: "Bạn",
    avatar: "",
    status: "online",
  },
  {
    id: "bot_ai",
    name: "Opus Bot",
    avatar: "🤖",
    status: "online",
    bio: "Trợ lý OpusFilm — trả lời tự động",
  },
  {
    id: "u_lan",
    name: "Minh Lan",
    avatar: "🌸",
    status: "online",
    bio: "Fan phim Hàn",
  },
  {
    id: "u_huy",
    name: "Quốc Huy",
    avatar: "🎬",
    status: "away",
    lastSeen: Date.now() - 3600000,
    bio: "Mọt phim hành động",
  },
  {
    id: "u_mai",
    name: "Thu Mai",
    avatar: "✨",
    status: "offline",
    lastSeen: Date.now() - 86400000,
    bio: "Xem mọi thể loại",
  },
  {
    id: "u_khoa",
    name: "Anh Khoa",
    avatar: "🔥",
    status: "online",
    bio: "Opus Music mỗi ngày",
  },
];

const BOT_REPLIES = [
  "Hay đó! Bạn đang xem phim gì trên OpusFilm?",
  "Mình gợi ý vài tựa hot trên trang chủ nhé 🍿",
  "Ok, mình nhận được rồi.",
  "Thử mục Sự kiện để nhận xu xem phim nhé!",
  "Nếu cần hỗ trợ, vào Cài đặt → Hỗ trợ nhé.",
  "Ngon, giữ liên lạc trên OpusFilm!",
];

function seedConversations(): {
  users: ChatUser[];
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
} {
  const users = SEED_USERS;
  const now = Date.now();
  const convBot: Conversation = {
    id: "c_bot",
    isGroup: false,
    participants: ["me", "bot_ai"],
    unreadCount: 1,
    updatedAt: now - 60000,
  };
  const convLan: Conversation = {
    id: "c_lan",
    isGroup: false,
    participants: ["me", "u_lan"],
    unreadCount: 0,
    updatedAt: now - 3600000,
  };
  const convGroup: Conversation = {
    id: "c_group",
    isGroup: true,
    title: "Fan OpusFilm",
    participants: ["me", "u_lan", "u_huy", "u_khoa"],
    unreadCount: 2,
    updatedAt: now - 120000,
  };

  const msgBot: ChatMessage[] = [
    {
      id: uid("m"),
      conversationId: "c_bot",
      senderId: "bot_ai",
      text: "Xin chào! Mình là Opus Bot. Nhắn gì mình cũng trả lời được.",
      timestamp: now - 120000,
      status: "read",
    },
  ];
  const msgLan: ChatMessage[] = [
    {
      id: uid("m"),
      conversationId: "c_lan",
      senderId: "u_lan",
      text: "Tối nay xem phim gì?",
      timestamp: now - 3600000,
      status: "read",
    },
    {
      id: uid("m"),
      conversationId: "c_lan",
      senderId: "me",
      text: "Đang lướt OpusFilm đây",
      timestamp: now - 3500000,
      status: "read",
    },
  ];
  const msgGroup: ChatMessage[] = [
    {
      id: uid("m"),
      conversationId: "c_group",
      senderId: "u_huy",
      text: "Ai xem tập mới chưa?",
      timestamp: now - 300000,
      status: "delivered",
    },
    {
      id: uid("m"),
      conversationId: "c_group",
      senderId: "u_khoa",
      text: "Mình vừa xong, hay lắm!",
      timestamp: now - 180000,
      status: "delivered",
    },
  ];

  convBot.lastMessage = msgBot[msgBot.length - 1];
  convLan.lastMessage = msgLan[msgLan.length - 1];
  convGroup.lastMessage = msgGroup[msgGroup.length - 1];

  return {
    users,
    conversations: [convBot, convGroup, convLan],
    messages: {
      c_bot: msgBot,
      c_lan: msgLan,
      c_group: msgGroup,
    },
  };
}

interface ChatState {
  users: ChatUser[];
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeId: string | null;
  typingIn: string | null;
  search: string;
  tab: "all" | "groups";
  showInfo: boolean;

  setSearch: (q: string) => void;
  setTab: (t: "all" | "groups") => void;
  setShowInfo: (v: boolean) => void;
  setActive: (id: string | null) => void;
  getUser: (id: string) => ChatUser | undefined;
  peerOf: (c: Conversation) => ChatUser | undefined;
  displayTitle: (c: Conversation) => string;
  filteredConversations: () => Conversation[];

  sendMessage: (text: string, attachments?: ChatAttachment[]) => void;
  markRead: (conversationId: string) => void;
  createDirect: (userId: string) => string;
  createGroup: (title: string, memberIds: string[]) => string;
  toggleMute: (conversationId: string) => void;
  totalUnread: () => number;
}

const seed = seedConversations();

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      users: seed.users,
      conversations: seed.conversations,
      messages: seed.messages,
      activeId: null,
      typingIn: null,
      search: "",
      tab: "all",
      showInfo: false,

      setSearch: (q) => set({ search: q }),
      setTab: (t) => set({ tab: t }),
      setShowInfo: (v) => set({ showInfo: v }),

      setActive: (id) => {
        set({ activeId: id, showInfo: false });
        if (id) get().markRead(id);
      },

      getUser: (id) => get().users.find((u) => u.id === id),

      peerOf: (c) => {
        if (c.isGroup) return undefined;
        const pid = c.participants.find((p) => p !== "me");
        return pid ? get().getUser(pid) : undefined;
      },

      displayTitle: (c) => {
        if (c.isGroup) return c.title || "Nhóm chat";
        return get().peerOf(c)?.name || "Cuộc trò chuyện";
      },

      filteredConversations: () => {
        const { conversations, search, tab } = get();
        let list = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
        if (tab === "groups") list = list.filter((c) => c.isGroup);
        const q = search.trim().toLowerCase();
        if (q) {
          list = list.filter((c) => {
            const title = get().displayTitle(c).toLowerCase();
            const last = c.lastMessage?.text?.toLowerCase() || "";
            return title.includes(q) || last.includes(q);
          });
        }
        return list;
      },

      markRead: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: (s.messages[conversationId] || []).map((m) =>
              m.senderId !== "me" ? { ...m, status: "read" as MessageStatus } : m
            ),
          },
        }));
      },

      sendMessage: (text, attachments) => {
        const trimmed = text.trim();
        if (!trimmed && !attachments?.length) return;
        const { activeId, conversations } = get();
        if (!activeId) return;
        const conv = conversations.find((c) => c.id === activeId);
        if (!conv) return;

        const peer = conv.participants.find((p) => p !== "me");
        const msg: ChatMessage = {
          id: uid("m"),
          conversationId: activeId,
          senderId: "me",
          receiverId: peer,
          text: trimmed,
          timestamp: Date.now(),
          status: "sent",
          attachments,
        };

        set((s) => {
          const list = [...(s.messages[activeId] || []), msg];
          return {
            messages: { ...s.messages, [activeId]: list },
            conversations: s.conversations.map((c) =>
              c.id === activeId
                ? { ...c, lastMessage: msg, updatedAt: msg.timestamp, unreadCount: 0 }
                : c
            ),
          };
        });

        // delivered shortly
        setTimeout(() => {
          set((s) => ({
            messages: {
              ...s.messages,
              [activeId]: (s.messages[activeId] || []).map((m) =>
                m.id === msg.id ? { ...m, status: "delivered" as MessageStatus } : m
              ),
            },
          }));
        }, 400);

        // Auto-reply from bot or mock peer
        const replyFrom =
          peer === "bot_ai" || conv.isGroup
            ? peer === "bot_ai"
              ? "bot_ai"
              : conv.participants.find((p) => p !== "me") || "bot_ai"
            : peer;

        if (replyFrom) {
          set({ typingIn: activeId });
          setTimeout(() => {
            const replyText =
              replyFrom === "bot_ai"
                ? BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)]
                : conv.isGroup
                ? "Ok mình thấy rồi 👍"
                : "Ok nhé, mình trả lời sau!";

            const reply: ChatMessage = {
              id: uid("m"),
              conversationId: activeId,
              senderId: replyFrom,
              receiverId: "me",
              text: replyText,
              timestamp: Date.now(),
              status: "delivered",
            };

            set((s) => {
              const isActive = s.activeId === activeId;
              const list = [...(s.messages[activeId] || []), reply];
              return {
                typingIn: null,
                messages: { ...s.messages, [activeId]: list },
                conversations: s.conversations.map((c) =>
                  c.id === activeId
                    ? {
                        ...c,
                        lastMessage: reply,
                        updatedAt: reply.timestamp,
                        unreadCount: isActive ? 0 : (c.unreadCount || 0) + 1,
                      }
                    : c
                ),
              };
            });
          }, 1100);
        }
      },

      createDirect: (userId) => {
        const existing = get().conversations.find(
          (c) =>
            !c.isGroup &&
            c.participants.includes("me") &&
            c.participants.includes(userId)
        );
        if (existing) {
          set({ activeId: existing.id });
          return existing.id;
        }
        const id = uid("c");
        const conv: Conversation = {
          id,
          isGroup: false,
          participants: ["me", userId],
          unreadCount: 0,
          updatedAt: Date.now(),
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          messages: { ...s.messages, [id]: [] },
          activeId: id,
        }));
        return id;
      },

      createGroup: (title, memberIds) => {
        const id = uid("c");
        const members = Array.from(new Set(["me", ...memberIds]));
        const conv: Conversation = {
          id,
          isGroup: true,
          title: title.trim() || "Nhóm mới",
          participants: members,
          unreadCount: 0,
          updatedAt: Date.now(),
        };
        set((s) => ({
          conversations: [conv, ...s.conversations],
          messages: { ...s.messages, [id]: [] },
          activeId: id,
        }));
        return id;
      },

      toggleMute: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, muted: !c.muted } : c
          ),
        }));
      },

      totalUnread: () =>
        get().conversations.reduce((n, c) => n + (c.unreadCount || 0), 0),
    }),
    { name: "opusfilm-chat-v1" }
  )
);

export function formatChatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}
