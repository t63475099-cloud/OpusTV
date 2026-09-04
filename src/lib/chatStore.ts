"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserStatus = "online" | "offline" | "away";
export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatUser {
  id: string; // username lowercase
  name: string;
  nickname: string;
  uid?: string;
  avatar: string;
  status: UserStatus;
  bio?: string;
  verified?: boolean;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file";
  url: string;
  name?: string;
}

export interface ChatReaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: number;
  status: MessageStatus;
  attachments?: ChatAttachment[];
  replyToId?: string;
  reactions?: ChatReaction[];
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
  peerUsername?: string;
}

interface ChatState {
  me: string | null;
  users: Record<string, ChatUser>;
  friends: string[];
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  activeId: string | null;
  search: string;
  tab: "all" | "groups" | "unread";
  showInfo: boolean;
  replyTo: ChatMessage | null;
  loading: boolean;
  error: string | null;
  synced: boolean;

  setMe: (username: string | null) => void;
  setSearch: (q: string) => void;
  setTab: (t: "all" | "groups" | "unread") => void;
  setShowInfo: (v: boolean) => void;
  setReplyTo: (m: ChatMessage | null) => void;
  setActive: (id: string | null) => void;

  getUser: (id: string) => ChatUser | undefined;
  peerOf: (c: Conversation) => ChatUser | undefined;
  displayTitle: (c: Conversation) => string;
  filteredConversations: () => Conversation[];
  friendUsers: () => ChatUser[];
  totalUnread: () => number;

  syncFromServer: () => Promise<void>;
  addFriendByQuery: (query: string) => Promise<{ ok: boolean; message: string }>;
  openDirect: (username: string) => void;
  loadThread: (username: string) => Promise<void>;
  sendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  toggleMute: (conversationId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  createGroup: (title: string, memberIds: string[]) => string;
}

function convIdFor(me: string, peer: string) {
  const a = me.toLowerCase();
  const b = peer.toLowerCase();
  return a < b ? `dm_${a}_${b}` : `dm_${b}_${a}`;
}

function mapServerMsg(
  row: {
    id: string;
    from_user: string;
    to_user: string;
    body: string;
    reply_to?: string | null;
    attachments?: unknown;
    created_at: string;
    read_at?: string | null;
  },
  me: string
): ChatMessage {
  const mine = row.from_user.toLowerCase() === me.toLowerCase();
  let attachments: ChatAttachment[] | undefined;
  try {
    const raw = row.attachments;
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(arr)) attachments = arr as ChatAttachment[];
  } catch {}
  return {
    id: row.id,
    conversationId: convIdFor(row.from_user, row.to_user),
    senderId: row.from_user.toLowerCase(),
    text: row.body || "",
    timestamp: new Date(row.created_at).getTime(),
    status: mine ? (row.read_at ? "read" : "delivered") : row.read_at ? "read" : "delivered",
    attachments,
    replyToId: row.reply_to || undefined,
  };
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      me: null,
      users: {},
      friends: [],
      conversations: [],
      messages: {},
      activeId: null,
      search: "",
      tab: "all",
      showInfo: false,
      replyTo: null,
      loading: false,
      error: null,
      synced: false,

      setMe: (username) => set({ me: username ? username.toLowerCase() : null }),
      setSearch: (q) => set({ search: q }),
      setTab: (t) => set({ tab: t }),
      setShowInfo: (v) => set({ showInfo: v }),
      setReplyTo: (m) => set({ replyTo: m }),

      setActive: (id) => {
        set({ activeId: id, showInfo: false, replyTo: null });
        if (id) {
          const c = get().conversations.find((x) => x.id === id);
          const peer = c?.peerUsername || c?.participants.find((p) => p !== get().me);
          if (peer) void get().loadThread(peer);
        }
      },

      getUser: (id) => get().users[id.toLowerCase()],

      peerOf: (c) => {
        const me = get().me;
        const pid = c.peerUsername || c.participants.find((p) => p !== me);
        return pid ? get().users[pid.toLowerCase()] : undefined;
      },

      displayTitle: (c) => {
        if (c.isGroup) return c.title || "Nhóm";
        return get().peerOf(c)?.name || c.peerUsername || "Chat";
      },

      friendUsers: () => {
        const { friends, users } = get();
        return friends.map((f) => users[f]).filter(Boolean) as ChatUser[];
      },

      filteredConversations: () => {
        const { conversations, search, tab } = get();
        let list = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
        if (tab === "groups") list = list.filter((c) => c.isGroup);
        if (tab === "unread") list = list.filter((c) => c.unreadCount > 0);
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

      totalUnread: () =>
        get().conversations.reduce((n, c) => n + (c.unreadCount || 0), 0),

      syncFromServer: async () => {
        const me = get().me;
        if (!me) {
          set({ error: "Cần đăng nhập để chat", synced: false });
          return;
        }
        set({ loading: true, error: null });
        try {
          const [fr, inboxRes] = await Promise.all([
            fetch("/api/chat/friends").then((r) => r.json()),
            fetch("/api/chat/messages").then((r) => r.json()),
          ]);
          if (fr.error) throw new Error(fr.error);
          if (inboxRes.error) throw new Error(inboxRes.error);

          const users: Record<string, ChatUser> = { ...get().users };
          const friendIds: string[] = [];
          for (const f of fr.friends || []) {
            const id = String(f.username).toLowerCase();
            friendIds.push(id);
            users[id] = {
              id,
              name: f.username,
              nickname: f.username,
              uid: f.uid || undefined,
              avatar: "",
              status: "online",
              bio: f.bio || undefined,
              verified: !!f.verified,
            };
          }

          const conversations: Conversation[] = [];
          for (const row of inboxRes.inbox || []) {
            const peer = String(row.peer).toLowerCase();
            if (!users[peer]) {
              users[peer] = {
                id: peer,
                name: row.peer,
                nickname: row.peer,
                avatar: "",
                status: "offline",
              };
            }
            if (!friendIds.includes(peer)) friendIds.push(peer);
            const id = convIdFor(me, peer);
            const msg = mapServerMsg(row, me);
            conversations.push({
              id,
              isGroup: false,
              participants: [me, peer],
              peerUsername: peer,
              lastMessage: msg,
              unreadCount: row.unread || 0,
              updatedAt: msg.timestamp,
            });
          }

          set({
            users,
            friends: friendIds,
            conversations,
            loading: false,
            synced: true,
          });
        } catch (e: unknown) {
          set({
            loading: false,
            error: e instanceof Error ? e.message : "Không đồng bộ được",
            synced: false,
          });
        }
      },

      addFriendByQuery: async (query) => {
        try {
          const uid = String(query || "").trim();
          if (!/^\d{6,12}$/.test(uid)) {
            return { ok: false, message: "Nhập UID số của đối phương (trong Tài khoản)" };
          }
          const res = await fetch("/api/chat/friends", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid }),
          });
          const data = await res.json();
          if (!res.ok) return { ok: false, message: data.error || "Lỗi" };
          const id = String(data.friend.username).toLowerCase();
          set((s) => ({
            users: {
              ...s.users,
              [id]: {
                id,
                name: data.friend.username,
                nickname: data.friend.username,
                uid: data.friend.uid || undefined,
                avatar: "",
                status: "online",
                bio: data.friend.bio || undefined,
                verified: !!data.friend.verified,
              },
            },
            friends: s.friends.includes(id) ? s.friends : [...s.friends, id],
          }));
          get().openDirect(id);
          await get().syncFromServer();
          return { ok: true, message: `Đã kết bạn ${data.friend.username}` };
        } catch {
          return { ok: false, message: "Không kết nối server" };
        }
      },

      openDirect: (username) => {
        const me = get().me;
        if (!me) return;
        const peer = username.toLowerCase();
        const id = convIdFor(me, peer);
        const existing = get().conversations.find((c) => c.id === id);
        if (!existing) {
          set((s) => ({
            conversations: [
              {
                id,
                isGroup: false,
                participants: [me, peer],
                peerUsername: peer,
                unreadCount: 0,
                updatedAt: Date.now(),
              },
              ...s.conversations,
            ],
            messages: s.messages[id] ? s.messages : { ...s.messages, [id]: [] },
          }));
        }
        set({ activeId: id });
        void get().loadThread(peer);
      },

      loadThread: async (username) => {
        const me = get().me;
        if (!me) return;
        const peer = username.toLowerCase();
        const id = convIdFor(me, peer);
        try {
          const res = await fetch(`/api/chat/messages?with=${encodeURIComponent(peer)}`);
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Lỗi tải tin");
          const list = (data.messages || []).map((row: Parameters<typeof mapServerMsg>[0]) =>
            mapServerMsg(row, me)
          );
          set((s) => ({
            messages: { ...s.messages, [id]: list },
            conversations: s.conversations.map((c) =>
              c.id === id
                ? {
                    ...c,
                    unreadCount: 0,
                    lastMessage: list[list.length - 1] || c.lastMessage,
                    updatedAt: list[list.length - 1]?.timestamp || c.updatedAt,
                  }
                : c
            ),
          }));
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Lỗi tải tin" });
        }
      },

      sendMessage: async (text, attachments) => {
        const me = get().me;
        const { activeId, conversations, replyTo } = get();
        if (!me || !activeId) return;
        const conv = conversations.find((c) => c.id === activeId);
        const peer = conv?.peerUsername || conv?.participants.find((p) => p !== me);
        if (!peer) return;
        const trimmed = text.trim();
        if (!trimmed && !attachments?.length) return;

        const tempId = `local_${Date.now()}`;
        const optimistic: ChatMessage = {
          id: tempId,
          conversationId: activeId,
          senderId: me,
          text: trimmed,
          timestamp: Date.now(),
          status: "sent",
          attachments,
          replyToId: replyTo?.id,
        };
        set((s) => ({
          replyTo: null,
          messages: {
            ...s.messages,
            [activeId]: [...(s.messages[activeId] || []), optimistic],
          },
          conversations: s.conversations.map((c) =>
            c.id === activeId
              ? { ...c, lastMessage: optimistic, updatedAt: optimistic.timestamp, unreadCount: 0 }
              : c
          ),
        }));

        try {
          const res = await fetch("/api/chat/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: peer,
              text: trimmed,
              replyTo: replyTo?.id,
              attachments: attachments || [],
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Gửi thất bại");
          set((s) => ({
            messages: {
              ...s.messages,
              [activeId]: (s.messages[activeId] || []).map((m) =>
                m.id === tempId ? { ...m, id: data.id, status: "delivered" } : m
              ),
            },
          }));
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Gửi thất bại" });
        }
      },

      toggleMute: (conversationId) => {
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, muted: !c.muted } : c
          ),
        }));
      },

      toggleReaction: (messageId, emoji) => {
        const { activeId, me } = get();
        if (!activeId || !me) return;
        set((s) => {
          const list = (s.messages[activeId] || []).map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions || [])];
            const idx = reactions.findIndex((r) => r.emoji === emoji);
            if (idx >= 0) {
              const users = reactions[idx].userIds;
              if (users.includes(me)) {
                const next = users.filter((u) => u !== me);
                if (next.length === 0) reactions.splice(idx, 1);
                else reactions[idx] = { emoji, userIds: next };
              } else reactions[idx] = { emoji, userIds: [...users, me] };
            } else reactions.push({ emoji, userIds: [me] });
            return { ...m, reactions };
          });
          return { messages: { ...s.messages, [activeId]: list } };
        });
      },

      createGroup: () => {
        // Nhóm server sẽ bổ sung sau — hiện chỉ DM đồng bộ Neon
        return "";
      },
    }),
    { name: "opusfilm-chat-server-v1" }
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
