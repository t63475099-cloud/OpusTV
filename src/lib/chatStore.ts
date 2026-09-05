"use client";

import { create } from "zustand";
import { useNotifStore } from "@/lib/notifications";
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
  /** epoch ms — lần truy cập cuối (Zalo-style) */
  lastSeen?: number;
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
  /** peer username đang soạn tin */
  typingPeers: Record<string, number>;

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
  heartbeat: () => Promise<void>;
  notifyTyping: (peer: string) => void;
  pollTyping: (peer: string) => Promise<void>;
  isPeerTyping: (peer: string) => boolean;
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

/** Hiển thị trạng thái kiểu Zalo */
export function formatLastSeen(user?: ChatUser | null): string {
  if (!user) return "";
  const now = Date.now();
  const last = user.lastSeen || 0;
  if (user.status === "online" || (last && now - last < 90_000)) {
    return "Đang hoạt động";
  }
  if (!last) return "Không hoạt động";
  const diff = now - last;
  if (diff < 60_000) return "Vừa truy cập";
  if (diff < 3600_000) return `Truy cập ${Math.floor(diff / 60_000)} phút trước`;
  const d = new Date(last);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (sameDay) return `Truy cập lúc ${hh}:${mm}`;
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `Truy cập ${dd}/${mo} lúc ${hh}:${mm}`;
}

function statusFromLastSeen(lastSeen?: number): UserStatus {
  if (!lastSeen) return "offline";
  const diff = Date.now() - lastSeen;
  if (diff < 90_000) return "online";
  if (diff < 15 * 60_000) return "away";
  return "offline";
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
      typingPeers: {},

      setMe: (username) => {
        const me = username ? username.toLowerCase() : null;
        set({ me });
        // Đồng bộ avatar OpusFilm (local settings) vào hồ sơ chat của mình
        if (me) {
          try {
            // lazy import tránh vòng phụ thuộc lúc module load
            void import("@/lib/settings").then(({ useSettingsStore }) => {
              const profile = useSettingsStore.getState().profile;
              const av = profile?.avatar || "";
              const name = (profile?.name || me).trim();
              set((s) => ({
                users: {
                  ...s.users,
                  [me]: {
                    id: me,
                    name: name || me,
                    nickname: me,
                    avatar: av || s.users[me]?.avatar || "",
                    status: "online",
                    lastSeen: Date.now(),
                    verified: !!profile?.verified,
                  },
                },
              }));
            });
          } catch {}
        }
      },
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
        const prevActive = get().activeId;
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
              name: f.displayName || f.username,
              nickname: f.username,
              uid: f.uid || undefined,
              avatar: f.avatar || users[id]?.avatar || "",
              status: statusFromLastSeen(users[id]?.lastSeen),
              lastSeen: users[id]?.lastSeen,
              bio: f.bio || undefined,
              verified: !!f.verified,
            };
          }

          // Hội thoại: mỗi bạn bè luôn có 1 slot (không mất khi chưa nhắn)
          const convMap = new Map<string, Conversation>();
          for (const peer of friendIds) {
            const id = convIdFor(me, peer);
            convMap.set(id, {
              id,
              isGroup: false,
              participants: [me, peer],
              peerUsername: peer,
              unreadCount: 0,
              updatedAt: Date.now(),
              lastMessage: get().conversations.find((c) => c.id === id)?.lastMessage,
            });
          }

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
            convMap.set(id, {
              id,
              isGroup: false,
              participants: [me, peer],
              peerUsername: peer,
              lastMessage: msg,
              unreadCount: row.unread || 0,
              updatedAt: msg.timestamp,
            });
          }

          const conversations = Array.from(convMap.values()).sort(
            (a, b) => b.updatedAt - a.updatedAt
          );

          // Presence Zalo-style
          try {
            await fetch("/api/chat/presence", { method: "POST" });
            if (friendIds.length) {
              const pr = await fetch(
                `/api/chat/presence?users=${encodeURIComponent(friendIds.join(","))}`
              ).then((r) => r.json());
              const presence = (pr.presence || {}) as Record<string, number>;
              for (const id of friendIds) {
                if (!users[id]) continue;
                const lastSeen = presence[id] || users[id].lastSeen;
                users[id] = {
                  ...users[id],
                  lastSeen,
                  status: statusFromLastSeen(lastSeen),
                };
              }
            }
          } catch {}

          set({
            users,
            friends: friendIds,
            conversations,
            loading: false,
            synced: true,
            activeId: prevActive && conversations.some((c) => c.id === prevActive) ? prevActive : get().activeId,
          });

          // Đồng bộ thông báo tin nhắn → chuông + hòm thư
          try {
            const notif = useNotifStore.getState();
            for (const row of inboxRes.inbox || []) {
              const unread = Number(row.unread || 0);
              if (unread <= 0) continue;
              const from = String(row.from_user || "").toLowerCase();
              if (!from || from === me) continue;
              const peer = String(row.peer || from).toLowerCase();
              const name = users[peer]?.name || row.peer || from;
              const body = String(row.body || "").trim();
              notif.add({
                kind: "chat",
                title: `Opus Chat · ${name}`,
                body: body
                  ? body.length > 100
                    ? body.slice(0, 100) + "…"
                    : body
                  : unread > 1
                    ? `${unread} tin nhắn mới`
                    : "Tin nhắn mới",
                href: "/tin-nhan",
                dedupeKey: `chat-msg-${row.id}`,
              });
            }
          } catch {
            /* ignore */
          }
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
                name: data.friend.displayName || data.friend.username,
                nickname: data.friend.username,
                uid: data.friend.uid || undefined,
                avatar: data.friend.avatar || "",
                status: "offline",
                bio: data.friend.bio || undefined,
                verified: !!data.friend.verified,
              },
            },
            friends: s.friends.includes(id) ? s.friends : [...s.friends, id],
          }));
          get().openDirect(id);
          await get().syncFromServer();
          // giữ hội thoại sau sync
          get().openDirect(id);
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

      heartbeat: async () => {
        try {
          await fetch("/api/chat/presence", { method: "POST" });
        } catch {}
      },

      notifyTyping: (peer) => {
        if (!get().me || !peer) return;
        void fetch("/api/chat/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: peer }),
        }).catch(() => {});
      },

      pollTyping: async (peer) => {
        if (!peer) return;
        try {
          const res = await fetch(
            `/api/chat/typing?peer=${encodeURIComponent(peer)}`
          );
          const data = await res.json();
          const on = !!data.typing;
          set((s) => {
            const next = { ...s.typingPeers };
            const key = peer.toLowerCase();
            if (on) next[key] = Date.now();
            else delete next[key];
            return { typingPeers: next };
          });
        } catch {}
      },

      isPeerTyping: (peer) => {
        const at = get().typingPeers[peer.toLowerCase()];
        return !!(at && Date.now() - at < 6000);
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
