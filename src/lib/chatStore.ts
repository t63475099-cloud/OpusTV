"use client";

import { create } from "zustand";
import { useNotifStore } from "@/lib/notifications";

export type UserStatus = "online" | "offline" | "away";
export type MessageStatus = "sent" | "delivered" | "read";

export interface ChatUser {
  id: string; // username lowercase
  name: string;
  nickname: string;
  uid?: string;
  avatar: string;
  /** id khung viền avatar (tùy chọn) */
  frame?: string;
  status: UserStatus;
  /** epoch ms — lần truy cập cuối (Zalo-style) */
  lastSeen?: number;
  bio?: string;
  verified?: boolean;
}

export interface ChatAttachment {
  id: string;
  type: "image" | "file" | "audio" | "sticker";
  url: string;
  name?: string;
  size?: number;
  duration?: number;
  mime?: string;
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
  editedAt?: number;
  deleted?: boolean;
  forwardedFrom?: string;
  /** Tin hệ thống (thêm/rời nhóm…) — căn giữa */
  system?: boolean;
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  title?: string;
  participants: string[];
  lastMessage?: ChatMessage;
  unreadCount: number;
  muted?: boolean;
  /** epoch ms — tắt thông báo đến khi */
  mutedUntil?: number | null;
  pinned?: boolean;
  pinOrder?: number;
  updatedAt: number;
  peerUsername?: string;
  groupAvatar?: string;
  announcement?: string;
  admins?: string[];
  blocked?: boolean;
}


const CHAT_AVATAR_PREFIX = "opus_chat_avatar_";

function loadChatAvatar(username: string): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(CHAT_AVATAR_PREFIX + username.toLowerCase()) || "";
  } catch {
    return "";
  }
}

function saveChatAvatar(username: string, url: string) {
  if (typeof window === "undefined") return;
  try {
    const key = CHAT_AVATAR_PREFIX + username.toLowerCase();
    if (url) localStorage.setItem(key, url);
    else localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Meta chat lưu LocalStorage — không bị sync server ghi đè */
const CHAT_META_KEY = "opus_chat_local_meta_v1";

export interface ChatLocalMeta {
  deletedMessageIds: string[];
  hiddenMessageIds: string[];
  blockedUsers: string[];
  groupTitles: Record<string, string>;
  groupAnnouncements: Record<string, string>;
  groupMembers: Record<string, string[]>;
  /** username admin theo group id */
  groupAdmins: Record<string, string[]>;
  /** tin hệ thống theo conversationId */
  systemMessages: Record<string, ChatMessage[]>;
  pinned: Record<string, { pinned: boolean; pinOrder: number }>;
  muted: Record<string, { muted: boolean; mutedUntil?: number | null }>;
}

function emptyMeta(): ChatLocalMeta {
  return {
    deletedMessageIds: [],
    hiddenMessageIds: [],
    blockedUsers: [],
    groupTitles: {},
    groupAnnouncements: {},
    groupMembers: {},
    groupAdmins: {},
    systemMessages: {},
    pinned: {},
    muted: {},
  };
}

function loadMeta(): ChatLocalMeta {
  if (typeof window === "undefined") return emptyMeta();
  try {
    const raw = localStorage.getItem(CHAT_META_KEY);
    if (!raw) return emptyMeta();
    const parsed = JSON.parse(raw) as Partial<ChatLocalMeta>;
    return {
      ...emptyMeta(),
      ...parsed,
      deletedMessageIds: Array.isArray(parsed.deletedMessageIds)
        ? parsed.deletedMessageIds
        : [],
      hiddenMessageIds: Array.isArray(parsed.hiddenMessageIds)
        ? parsed.hiddenMessageIds
        : [],
      blockedUsers: Array.isArray(parsed.blockedUsers) ? parsed.blockedUsers : [],
      groupTitles: parsed.groupTitles || {},
      groupAnnouncements: parsed.groupAnnouncements || {},
      groupMembers: parsed.groupMembers || {},
      groupAdmins: parsed.groupAdmins || {},
      systemMessages: parsed.systemMessages || {},
      pinned: parsed.pinned || {},
      muted: parsed.muted || {},
    };
  } catch {
    return emptyMeta();
  }
}

function saveMeta(meta: ChatLocalMeta) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CHAT_META_KEY, JSON.stringify(meta));
  } catch {}
}

function patchMeta(patch: Partial<ChatLocalMeta> | ((m: ChatLocalMeta) => ChatLocalMeta)) {
  const cur = loadMeta();
  const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
  saveMeta(next);
  return next;
}

function applyMsgLocalFlags(list: ChatMessage[]): ChatMessage[] {
  const meta = loadMeta();
  const deleted = new Set(meta.deletedMessageIds);
  const hidden = new Set(meta.hiddenMessageIds);
  return list
    .filter((m) => !hidden.has(m.id))
    .map((m) =>
      deleted.has(m.id)
        ? { ...m, deleted: true, text: "", attachments: [] }
        : m
    );
}

function applyConversationMeta(c: Conversation): Conversation {
  const meta = loadMeta();
  const pin = meta.pinned[c.id];
  const mute = meta.muted[c.id];
  let next = { ...c };
  if (c.isGroup && meta.groupTitles[c.id]) {
    next.title = meta.groupTitles[c.id];
  }
  if (c.isGroup && meta.groupAnnouncements[c.id] !== undefined) {
    next.announcement = meta.groupAnnouncements[c.id];
  }
  if (c.isGroup && meta.groupMembers[c.id]?.length) {
    next.participants = Array.from(
      new Set([...(meta.groupMembers[c.id] || []), ...c.participants])
    );
  }
  if (c.isGroup && meta.groupAdmins[c.id]?.length) {
    next.admins = meta.groupAdmins[c.id].map((x) => x.toLowerCase());
  }
  if (pin) {
    next.pinned = pin.pinned;
    next.pinOrder = pin.pinOrder;
  }
  if (mute) {
    next.muted = mute.muted;
    next.mutedUntil = mute.mutedUntil ?? null;
  }
  if (
    !c.isGroup &&
    c.peerUsername &&
    meta.blockedUsers.includes(c.peerUsername.toLowerCase())
  ) {
    next.blocked = true;
  }
  return next;
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
  /** Avatar riêng Opus Chat — không ghi vào Opus Film */
  setChatAvatar: (dataUrl: string) => void;
  syncMyAvatarFromFilm: () => void;
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
  loadGroupThread: (groupId: string) => Promise<void>;
  sendMessage: (text: string, attachments?: ChatAttachment[]) => Promise<void>;
  toggleMute: (conversationId: string) => void;
  muteFor: (conversationId: string, hours: number | null) => void;
  togglePin: (conversationId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, text: string) => void;
  deleteMessage: (messageId: string, scope?: "me" | "everyone") => void;
  forwardMessage: (messageId: string, toConversationId: string) => Promise<void>;
  markConversationRead: (conversationId: string) => void;
  setGroupAnnouncement: (conversationId: string, text: string) => void;
  setGroupTitle: (conversationId: string, title: string) => void;
  addGroupMembers: (conversationId: string, memberIds: string[]) => void;
  leaveGroup: (conversationId: string) => void;
  removeGroupMember: (conversationId: string, memberId: string) => void;
  promoteAdmin: (conversationId: string, memberId: string) => void;
  demoteAdmin: (conversationId: string, memberId: string) => void;
  isGroupAdmin: (conversationId: string, userId?: string | null) => boolean;
  blockUser: (username: string) => void;
  unblockUser: (username: string) => void;
  blockedUsers: string[];
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
  const last = Number(user.lastSeen) || 0;
  if (user.status === "online" || (last > 0 && now - last < 90_000)) {
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

function mergeSystemMessages(convId: string, list: ChatMessage[]): ChatMessage[] {
  try {
    const meta = loadMeta();
    const sys = meta.systemMessages[convId] || [];
    if (!sys.length) return list;
    const seen = new Set(list.map((m) => m.id));
    const extra = sys.filter((m) => !seen.has(m.id) && m.system);
    return [...list, ...extra].sort((a, b) => a.timestamp - b.timestamp);
  } catch {
    return list;
  }
}

export const useChatStore = create<ChatState>()((set, get) => ({
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
      blockedUsers: [],

      setMe: (username) => {
        const me = username ? username.toLowerCase() : null;
        let blockedUsers: string[] = [];
        try {
          blockedUsers = loadMeta().blockedUsers || [];
        } catch {
          blockedUsers = [];
        }
        set({ me, blockedUsers });
        if (me) {
          const chatAv = loadChatAvatar(me);
          try {
            void import("@/lib/settings").then(({ useSettingsStore }) => {
              const profile = useSettingsStore.getState().profile;
              const name = (profile?.name || me).trim();
              // Ưu tiên avatar chat riêng; film chỉ là fallback
              const av =
                chatAv ||
                (get().users[me]?.avatar || "").trim() ||
                (profile?.avatar || "").trim() ||
                "";
              set((s) => ({
                users: {
                  ...s.users,
                  [me]: {
                    ...(s.users[me] || {}),
                    id: me,
                    name: name || s.users[me]?.name || me,
                    nickname: me,
                    avatar: av,
                    frame: profile?.avatarFrame || s.users[me]?.frame,
                    status: "online" as const,
                    lastSeen: Date.now(),
                    verified: !!profile?.verified,
                    uid: s.users[me]?.uid || profile?.uid,
                  },
                },
              }));
            });
          } catch {
            set((s) => ({
              users: {
                ...s.users,
                [me]: {
                  ...(s.users[me] || {}),
                  id: me,
                  name: s.users[me]?.name || me,
                  nickname: me,
                  avatar: chatAv || s.users[me]?.avatar || "",
                  status: "online" as const,
                  lastSeen: Date.now(),
                },
              },
            }));
          }
        }
      },
      /** Avatar chỉ cho Opus Chat — không đụng profile Film */
      setChatAvatar: (dataUrl) => {
        const me = get().me;
        if (!me) return;
        const url = (dataUrl || "").trim();
        saveChatAvatar(me, url);
        set((s) => ({
          users: {
            ...s.users,
            [me]: {
              ...(s.users[me] || {
                id: me,
                name: me,
                nickname: me,
                status: "online" as const,
                lastSeen: Date.now(),
              }),
              id: me,
              avatar: url,
            },
          },
        }));
        // Đồng bộ avatar lên server để bạn bè thấy ảnh thật
        if (url) {
          void fetch("/api/auth/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: { avatar: url } }),
          }).catch(() => {});
        }
      },
      /** Chỉ điền avatar Film nếu CHƯA có avatar chat riêng */
      syncMyAvatarFromFilm: () => {
        const me = get().me;
        if (!me) return;
        const chatAv = loadChatAvatar(me);
        if (chatAv) {
          set((s) => ({
            users: {
              ...s.users,
              [me]: {
                ...(s.users[me] || { id: me, nickname: me, status: "online" as const }),
                id: me,
                avatar: chatAv,
              },
            },
          }));
          return;
        }
        void import("@/lib/settings").then(({ useSettingsStore }) => {
          const profile = useSettingsStore.getState().profile;
          const av = (profile?.avatar || "").trim();
          const name = (profile?.name || me).trim();
          if (!av) return;
          set((s) => {
            if ((s.users[me]?.avatar || "").trim()) return s;
            return {
              users: {
                ...s.users,
                [me]: {
                  ...(s.users[me] || { id: me, nickname: me, status: "online" as const }),
                  id: me,
                  name: name || me,
                  nickname: me,
                  avatar: av,
                  status: "online" as const,
                  lastSeen: Date.now(),
                },
              },
            };
          });
        });
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
        let list = [...conversations].sort((a, b) => {
          if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
          if (a.pinned && b.pinned) return (b.pinOrder || 0) - (a.pinOrder || 0);
          return b.updatedAt - a.updatedAt;
        });
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

          let conversations = Array.from(convMap.values()).sort(
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

          try {
            const gr = await fetch("/api/chat/groups").then((r) => r.json());
            if (Array.isArray(gr.groups)) {
              for (const g of gr.groups) {
                const gid = String(g.id);
                const members = (g.members || []).map((x: string) =>
                  String(x).toLowerCase()
                );
                conversations = [
                  {
                    id: gid,
                    isGroup: true,
                    title: String(g.title || "Nhóm"),
                    participants: members,
                    unreadCount: 0,
                    updatedAt: Date.now(),
                    muted: false,
                  },
                  ...conversations.filter((c) => c.id !== gid),
                ];
              }
              conversations = conversations.sort(
                (a, b) => b.updatedAt - a.updatedAt
              );
            }
          } catch {}

          const meta = loadMeta();
          const conversationsWithMeta = conversations.map((c) =>
            applyConversationMeta(c)
          );
          set({
            users,
            friends: friendIds,
            conversations: conversationsWithMeta,
            blockedUsers: meta.blockedUsers,
            loading: false,
            synced: true,
            // Không bao giờ xóa activeId khi sync (tránh mất đoạn chat khi click/poll)
            activeId: prevActive || get().activeId,
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
          const meta = loadMeta();
          const peerBlocked =
            meta.blockedUsers.includes(peer.toLowerCase()) ||
            get().blockedUsers.includes(peer.toLowerCase());
          let finalList = mergeSystemMessages(id, applyMsgLocalFlags(list));
          if (peerBlocked) {
            // Ẩn tin đến từ người đã chặn (vẫn giữ tin mình gửi)
            finalList = finalList.filter((m) => m.senderId === me);
          }
          set((s) => ({
            messages: { ...s.messages, [id]: finalList },
            conversations: s.conversations.map((c) =>
              c.id === id
                ? {
                    ...c,
                    blocked: peerBlocked || c.blocked,
                    unreadCount: 0,
                    lastMessage:
                      finalList[finalList.length - 1] || c.lastMessage,
                    updatedAt:
                      finalList[finalList.length - 1]?.timestamp || c.updatedAt,
                  }
                : c
            ),
          }));
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Lỗi tải tin" });
        }
      },
      loadGroupThread: async (groupId) => {
        const me = get().me;
        if (!me || !groupId) return;
        try {
          const res = await fetch(
            `/api/chat/groups/messages?groupId=${encodeURIComponent(groupId)}`
          );
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Lỗi tải tin nhóm");
          const list = (data.messages || []).map(
            (m: {
              id: string;
              conversationId: string;
              senderId: string;
              text: string;
              timestamp: number;
              status: string;
              replyToId?: string;
              attachments?: ChatAttachment[];
            }) => ({
              id: m.id,
              conversationId: m.conversationId || groupId,
              senderId: m.senderId,
              text: m.text || "",
              timestamp: m.timestamp || Date.now(),
              status: (m.status as ChatMessage["status"]) || "delivered",
              replyToId: m.replyToId,
              attachments: m.attachments,
            })
          );
          const finalList = mergeSystemMessages(
            groupId,
            applyMsgLocalFlags(list)
          );
          set((s) => ({
            messages: { ...s.messages, [groupId]: finalList },
            conversations: s.conversations.map((c) =>
              c.id === groupId
                ? applyConversationMeta({
                    ...c,
                    unreadCount: 0,
                    lastMessage:
                      finalList[finalList.length - 1] || c.lastMessage,
                    updatedAt:
                      finalList[finalList.length - 1]?.timestamp || c.updatedAt,
                  })
                : c
            ),
          }));
        } catch (e: unknown) {
          set({ error: e instanceof Error ? e.message : "Lỗi tải tin nhóm" });
        }
      },


      sendMessage: async (text, attachments) => {
        const me = get().me;
        const { activeId, conversations, replyTo, blockedUsers } = get();
        if (!me || !activeId) return;
        const conv = conversations.find((c) => c.id === activeId);
        if (!conv) return;
        const isGroup = !!conv.isGroup;
        const peer = conv.peerUsername || conv.participants.find((p) => p !== me);
        if (!isGroup && !peer) return;
        if (!isGroup && peer) {
          const blocked =
            conv.blocked ||
            blockedUsers.includes(peer.toLowerCase()) ||
            loadMeta().blockedUsers.includes(peer.toLowerCase());
          if (blocked) {
            set({ error: "Bạn đã chặn người dùng này" });
            return;
          }
        }
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
          const res = await fetch(
            isGroup ? "/api/chat/groups/messages" : "/api/chat/messages",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                isGroup
                  ? {
                      groupId: activeId,
                      text: trimmed,
                      replyTo: replyTo?.id,
                      attachments: attachments || [],
                    }
                  : {
                      to: peer,
                      text: trimmed,
                      replyTo: replyTo?.id,
                      attachments: attachments || [],
                    }
              ),
            }
          );
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
            c.id === conversationId
              ? {
                  ...c,
                  muted: !c.muted,
                  mutedUntil: !c.muted ? null : c.mutedUntil,
                }
              : c
          ),
        }));
      },

      muteFor: (conversationId, hours) => {
        const until =
          hours === null ? null : Date.now() + hours * 60 * 60 * 1000;
        const muted = hours !== null;
        patchMeta((m) => ({
          ...m,
          muted: {
            ...m.muted,
            [conversationId]: { muted, mutedUntil: until },
          },
        }));
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  muted,
                  mutedUntil: until,
                }
              : c
          ),
        }));
      },

      togglePin: (conversationId) => {
        set((s) => {
          const target = s.conversations.find((c) => c.id === conversationId);
          const willPin = !target?.pinned;
          const maxOrder = s.conversations.reduce(
            (m, c) => Math.max(m, c.pinOrder || 0),
            0
          );
          const pinOrder = willPin ? maxOrder + 1 : 0;
          patchMeta((m) => ({
            ...m,
            pinned: {
              ...m.pinned,
              [conversationId]: { pinned: willPin, pinOrder },
            },
          }));
          return {
            conversations: s.conversations.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    pinned: willPin,
                    pinOrder,
                  }
                : c
            ),
          };
        });
      },

      editMessage: (messageId, text) => {
        const { activeId, me } = get();
        if (!activeId || !me) return;
        const t = text.trim();
        if (!t) return;
        set((s) => ({
          messages: {
            ...s.messages,
            [activeId]: (s.messages[activeId] || []).map((m) =>
              m.id === messageId && m.senderId === me
                ? { ...m, text: t, editedAt: Date.now() }
                : m
            ),
          },
        }));
      },

      deleteMessage: (messageId, scope = "everyone") => {
        const { activeId, me } = get();
        if (!activeId || !me) return;
        const list = get().messages[activeId] || [];
        const target = list.find((m) => m.id === messageId);
        if (!target) return;
        // Chỉ chủ tin mới thu hồi với mọi người
        if (scope === "everyone" && target.senderId !== me) {
          scope = "me";
        }
        if (scope === "me") {
          patchMeta((m) => ({
            ...m,
            hiddenMessageIds: m.hiddenMessageIds.includes(messageId)
              ? m.hiddenMessageIds
              : [...m.hiddenMessageIds, messageId],
          }));
          set((s) => ({
            messages: {
              ...s.messages,
              [activeId]: (s.messages[activeId] || []).filter(
                (m) => m.id !== messageId
              ),
            },
          }));
          return;
        }
        patchMeta((m) => ({
          ...m,
          deletedMessageIds: m.deletedMessageIds.includes(messageId)
            ? m.deletedMessageIds
            : [...m.deletedMessageIds, messageId],
        }));
        set((s) => ({
          messages: {
            ...s.messages,
            [activeId]: (s.messages[activeId] || []).map((m) =>
              m.id === messageId
                ? { ...m, deleted: true, text: "", attachments: [] }
                : m
            ),
          },
        }));
      },

      forwardMessage: async (messageId, toConversationId) => {
        const { activeId, me, messages, conversations } = get();
        if (!me || !activeId) return;
        const src = (messages[activeId] || []).find((m) => m.id === messageId);
        if (!src || src.deleted) return;
        const dest = conversations.find((c) => c.id === toConversationId);
        if (!dest) return;
        const prevActive = activeId;
        set({ activeId: toConversationId });
        await get().sendMessage(
          src.text ? `↪ ${src.text}` : "",
          src.attachments
        );
        set((s) => {
          const list = s.messages[toConversationId] || [];
          const last = list[list.length - 1];
          if (!last) return s;
          return {
            activeId: prevActive,
            messages: {
              ...s.messages,
              [toConversationId]: list.map((m) =>
                m.id === last.id
                  ? { ...m, forwardedFrom: src.senderId }
                  : m
              ),
            },
          };
        });
      },

      markConversationRead: (conversationId) => {
        const me = get().me;
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, unreadCount: 0 } : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: (s.messages[conversationId] || []).map((m) =>
              m.senderId !== me && m.status !== "read"
                ? { ...m, status: "read" as const }
                : m
            ),
          },
        }));
      },

      setGroupAnnouncement: (conversationId, text) => {
        const me = get().me;
        if (!me || !get().isGroupAdmin(conversationId, me)) return;
        const ann = text.trim().slice(0, 500);
        patchMeta((m) => ({
          ...m,
          groupAnnouncements: { ...m.groupAnnouncements, [conversationId]: ann },
        }));
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId && c.isGroup
              ? { ...c, announcement: ann }
              : c
          ),
        }));
      },

      setGroupTitle: (conversationId, title) => {
        const me = get().me;
        if (!me || !get().isGroupAdmin(conversationId, me)) return;
        const name = title.trim().slice(0, 80);
        if (!name) return;
        patchMeta((m) => ({
          ...m,
          groupTitles: { ...m.groupTitles, [conversationId]: name },
        }));
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId && c.isGroup ? { ...c, title: name } : c
          ),
        }));
      },

      addGroupMembers: (conversationId, memberIds) => {
        const me = get().me;
        if (!me) return;
        if (!get().isGroupAdmin(conversationId, me)) {
          set({ error: "Chỉ admin mới được thêm thành viên" });
          return;
        }
        const ids = memberIds.map((x) => x.toLowerCase()).filter(Boolean);
        if (!ids.length) return;
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv?.isGroup) return;

        const before = new Set(conv.participants.map((p) => p.toLowerCase()));
        const added = ids.filter((id) => !before.has(id));
        if (!added.length) return;

        const nextParticipants = Array.from(
          new Set([...conv.participants, ...added])
        );

        patchMeta((m) => ({
          ...m,
          groupMembers: { ...m.groupMembers, [conversationId]: nextParticipants },
        }));

        const actor =
          get().users[me]?.name || get().users[me]?.nickname || me;
        const names = added.map(
          (id) => get().users[id]?.name || get().users[id]?.nickname || id
        );
        const text =
          added.length === 1
            ? `${actor} đã thêm ${names[0]} vào nhóm`
            : `${actor} đã thêm ${names.join(", ")} vào nhóm`;

        const sysMsg: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          senderId: "system",
          text,
          timestamp: Date.now(),
          status: "read",
          system: true,
        };

        patchMeta((m) => ({
          ...m,
          systemMessages: {
            ...m.systemMessages,
            [conversationId]: [
              ...(m.systemMessages[conversationId] || []),
              sysMsg,
            ].slice(-200),
          },
        }));

        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId && c.isGroup
              ? {
                  ...c,
                  participants: nextParticipants,
                  lastMessage: sysMsg,
                  updatedAt: sysMsg.timestamp,
                }
              : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: [
              ...(s.messages[conversationId] || []),
              sysMsg,
            ],
          },
        }));
      },

      removeGroupMember: (conversationId, memberId) => {
        const me = get().me;
        if (!me) return;
        const id = memberId.toLowerCase();
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv?.isGroup) return;
        if (!conv.participants.includes(id)) return;
        if (id === me) {
          get().leaveGroup(conversationId);
          return;
        }
        if (!get().isGroupAdmin(conversationId, me)) {
          set({ error: "Chỉ admin mới được xóa thành viên" });
          return;
        }
        // Không cho xóa admin khác nếu không phải admin (đã check); có thể xóa admin khác

        const nextParticipants = conv.participants.filter(
          (p) => p.toLowerCase() !== id
        );
        patchMeta((m) => ({
          ...m,
          groupMembers: { ...m.groupMembers, [conversationId]: nextParticipants },
        }));
        const actor =
          get().users[me]?.name || get().users[me]?.nickname || me;
        const target =
          get().users[id]?.name || get().users[id]?.nickname || id;
        const sysMsg: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          senderId: "system",
          text: `${actor} đã xóa ${target} khỏi nhóm`,
          timestamp: Date.now(),
          status: "read",
          system: true,
        };
        patchMeta((m) => ({
          ...m,
          systemMessages: {
            ...m.systemMessages,
            [conversationId]: [
              ...(m.systemMessages[conversationId] || []),
              sysMsg,
            ].slice(-200),
          },
        }));
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId
              ? {
                  ...c,
                  participants: nextParticipants,
                  lastMessage: sysMsg,
                  updatedAt: sysMsg.timestamp,
                }
              : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: [
              ...(s.messages[conversationId] || []),
              sysMsg,
            ],
          },
        }));
      },

      leaveGroup: (conversationId) => {
        const me = get().me;
        if (!me) return;
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv?.isGroup) return;
        const name =
          get().users[me]?.name || get().users[me]?.nickname || me;
        const sysMsg: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          senderId: "system",
          text: `${name} đã rời nhóm`,
          timestamp: Date.now(),
          status: "read",
          system: true,
        };
        const nextParticipants = conv.participants.filter(
          (p) => p.toLowerCase() !== me
        );
        const curAdmins = (
          conv.admins ||
          loadMeta().groupAdmins[conversationId] ||
          []
        ).map((x) => x.toLowerCase());
        let nextAdmins = curAdmins.filter((x) => x !== me);
        if (nextParticipants.length && nextAdmins.length === 0) {
          nextAdmins = [nextParticipants[0].toLowerCase()];
        }
        patchMeta((m) => ({
          ...m,
          groupMembers: { ...m.groupMembers, [conversationId]: nextParticipants },
          groupAdmins: { ...m.groupAdmins, [conversationId]: nextAdmins },
          systemMessages: {
            ...m.systemMessages,
            [conversationId]: [
              ...(m.systemMessages[conversationId] || []),
              sysMsg,
            ].slice(-200),
          },
        }));
        set((s) => {
          const msgs = [...(s.messages[conversationId] || []), sysMsg];
          return {
            conversations: s.conversations
              .map((c) =>
                c.id === conversationId
                  ? {
                      ...c,
                      participants: nextParticipants,
                      lastMessage: sysMsg,
                      updatedAt: sysMsg.timestamp,
                    }
                  : c
              )
              .filter((c) => {
                // Ẩn nhóm khỏi list nếu mình đã rời
                if (c.id !== conversationId) return true;
                return false;
              }),
            messages: { ...s.messages, [conversationId]: msgs },
            activeId: s.activeId === conversationId ? null : s.activeId,
          };
        });
      },


      isGroupAdmin: (conversationId, userId) => {
        const uid = (userId || get().me || "").toLowerCase();
        if (!uid) return false;
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv?.isGroup) return false;
        const meta = loadMeta();
        const fromMeta = meta.groupAdmins[conversationId] || [];
        const admins = (conv.admins?.length ? conv.admins : fromMeta).map((x) =>
          x.toLowerCase()
        );
        if (admins.length === 0) {
          // Fallback: người đầu trong participants
          return conv.participants[0]?.toLowerCase() === uid;
        }
        return admins.includes(uid);
      },

      promoteAdmin: (conversationId, memberId) => {
        const me = get().me;
        if (!me || !get().isGroupAdmin(conversationId, me)) return;
        const id = memberId.toLowerCase();
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv?.isGroup || !conv.participants.includes(id)) return;
        const cur = (conv.admins || loadMeta().groupAdmins[conversationId] || []).map(
          (x) => x.toLowerCase()
        );
        if (cur.includes(id)) return;
        const next = [...cur, id];
        patchMeta((m) => ({
          ...m,
          groupAdmins: { ...m.groupAdmins, [conversationId]: next },
        }));
        const actor =
          get().users[me]?.name || get().users[me]?.nickname || me;
        const target =
          get().users[id]?.name || get().users[id]?.nickname || id;
        const sysMsg: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          senderId: "system",
          text: `${actor} đã bổ nhiệm ${target} làm admin`,
          timestamp: Date.now(),
          status: "read",
          system: true,
        };
        patchMeta((m) => ({
          ...m,
          systemMessages: {
            ...m.systemMessages,
            [conversationId]: [
              ...(m.systemMessages[conversationId] || []),
              sysMsg,
            ].slice(-200),
          },
        }));
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, admins: next, lastMessage: sysMsg, updatedAt: sysMsg.timestamp } : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: [...(s.messages[conversationId] || []), sysMsg],
          },
        }));
      },

      demoteAdmin: (conversationId, memberId) => {
        const me = get().me;
        if (!me || !get().isGroupAdmin(conversationId, me)) return;
        const id = memberId.toLowerCase();
        if (id === me) return; // không tự bỏ admin qua demote — dùng rời nhóm
        const conv = get().conversations.find((c) => c.id === conversationId);
        if (!conv?.isGroup) return;
        const cur = (conv.admins || loadMeta().groupAdmins[conversationId] || []).map(
          (x) => x.toLowerCase()
        );
        if (!cur.includes(id)) return;
        const next = cur.filter((x) => x !== id);
        if (next.length === 0) return; // giữ ít nhất 1 admin
        patchMeta((m) => ({
          ...m,
          groupAdmins: { ...m.groupAdmins, [conversationId]: next },
        }));
        const actor =
          get().users[me]?.name || get().users[me]?.nickname || me;
        const target =
          get().users[id]?.name || get().users[id]?.nickname || id;
        const sysMsg: ChatMessage = {
          id: `sys_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          conversationId,
          senderId: "system",
          text: `${actor} đã gỡ quyền admin của ${target}`,
          timestamp: Date.now(),
          status: "read",
          system: true,
        };
        patchMeta((m) => ({
          ...m,
          systemMessages: {
            ...m.systemMessages,
            [conversationId]: [
              ...(m.systemMessages[conversationId] || []),
              sysMsg,
            ].slice(-200),
          },
        }));
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.id === conversationId ? { ...c, admins: next, lastMessage: sysMsg, updatedAt: sysMsg.timestamp } : c
          ),
          messages: {
            ...s.messages,
            [conversationId]: [...(s.messages[conversationId] || []), sysMsg],
          },
        }));
      },

      blockUser: (username) => {
        const id = username.toLowerCase();
        patchMeta((m) => ({
          ...m,
          blockedUsers: m.blockedUsers.includes(id)
            ? m.blockedUsers
            : [...m.blockedUsers, id],
        }));
        set((s) => ({
          blockedUsers: s.blockedUsers.includes(id)
            ? s.blockedUsers
            : [...s.blockedUsers, id],
          conversations: s.conversations.map((c) =>
            !c.isGroup &&
            (c.peerUsername === id || c.participants.includes(id))
              ? { ...c, blocked: true }
              : c
          ),
        }));
      },

      unblockUser: (username) => {
        const id = username.toLowerCase();
        patchMeta((m) => ({
          ...m,
          blockedUsers: m.blockedUsers.filter((x) => x !== id),
        }));
        set((s) => ({
          blockedUsers: s.blockedUsers.filter((x) => x !== id),
          conversations: s.conversations.map((c) =>
            !c.isGroup &&
            (c.peerUsername === id || c.participants.includes(id))
              ? { ...c, blocked: false }
              : c
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

      createGroup: (title, memberIds) => {
        const me = get().me;
        if (!me) return "";
        const id = `local_g_${Date.now()}`;
        // optimistic local; bootstrap/API will replace id
        const members = Array.from(new Set([me, ...memberIds.map((x) => x.toLowerCase())]));
        const conv: Conversation = {
          id,
          isGroup: true,
          title: (title || "Nhóm mới").trim().slice(0, 80),
          participants: members,
          admins: [me],
          lastMessage: undefined,
          unreadCount: 0,
          updatedAt: Date.now(),
          muted: false,
        };
        const creatorName =
          get().users[me]?.name || get().users[me]?.nickname || me;
        const otherNames = members
          .filter((x) => x !== me)
          .map((x) => get().users[x]?.name || get().users[x]?.nickname || x);
        const sysCreate: ChatMessage = {
          id: `sys_${Date.now()}_c`,
          conversationId: id,
          senderId: "system",
          text: `${creatorName} đã tạo nhóm`,
          timestamp: Date.now(),
          status: "read",
          system: true,
        };
        const sysJoin: ChatMessage | null =
          otherNames.length > 0
            ? {
                id: `sys_${Date.now()}_j`,
                conversationId: id,
                senderId: "system",
                text:
                  otherNames.length === 1
                    ? `${creatorName} đã thêm ${otherNames[0]} vào nhóm`
                    : `${creatorName} đã thêm ${otherNames.join(", ")} vào nhóm`,
                timestamp: Date.now() + 1,
                status: "read",
                system: true,
              }
            : null;
        const initialSys = sysJoin ? [sysCreate, sysJoin] : [sysCreate];
        patchMeta((m) => ({
          ...m,
          groupTitles: { ...m.groupTitles, [id]: conv.title || "Nhóm mới" },
          groupMembers: { ...m.groupMembers, [id]: members },
          groupAdmins: { ...m.groupAdmins, [id]: [me] },
          systemMessages: {
            ...m.systemMessages,
            [id]: initialSys,
          },
        }));
        set((s) => ({
          conversations: [
            { ...conv, lastMessage: initialSys[initialSys.length - 1] },
            ...s.conversations.filter((c) => c.id !== id),
          ],
          activeId: id,
          messages: { ...s.messages, [id]: initialSys },
        }));
        void (async () => {
          try {
            const res = await fetch("/api/chat/groups", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ title: conv.title, members: memberIds }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Tạo nhóm thất bại");
            const gid = String(data.group.id);
            patchMeta((m) => {
              const titles = { ...m.groupTitles };
              const mems = { ...m.groupMembers };
              const ads = { ...m.groupAdmins };
              const sys = { ...m.systemMessages };
              if (titles[id]) {
                titles[gid] = titles[id];
                delete titles[id];
              }
              if (mems[id]) {
                mems[gid] = mems[id];
                delete mems[id];
              }
              if (ads[id]) {
                ads[gid] = ads[id];
                delete ads[id];
              }
              if (sys[id]) {
                sys[gid] = sys[id].map((x) => ({
                  ...x,
                  conversationId: gid,
                }));
                delete sys[id];
              }
              titles[gid] = data.group.title || titles[gid] || conv.title || "Nhóm";
              mems[gid] = data.group.members || members;
              ads[gid] = ads[gid] || [me];
              return {
                ...m,
                groupTitles: titles,
                groupMembers: mems,
                groupAdmins: ads,
                systemMessages: sys,
              };
            });
            set((s) => ({
              conversations: s.conversations.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      id: gid,
                      participants: data.group.members || members,
                      title: data.group.title || c.title,
                      admins: c.admins?.length ? c.admins : [me],
                    }
                  : c
              ),
              activeId: s.activeId === id ? gid : s.activeId,
              messages: {
                ...s.messages,
                [gid]: (s.messages[id] || []).map((x) => ({
                  ...x,
                  conversationId: gid,
                })),
              },
            }));
          } catch (e: unknown) {
            set({ error: e instanceof Error ? e.message : "Tạo nhóm thất bại" });
          }
        })();
        return id;
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
        const map = get().typingPeers || {};
        const at = map[peer.toLowerCase()];
        return !!(at && Date.now() - at < 6000);
      },
}));


export function formatChatTime(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86400000);
  const hhmm = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (dayDiff === 0) return hhmm;
  if (dayDiff === 1) return `Hôm qua ${hhmm}`;
  if (dayDiff < 7 && dayDiff > 1) {
    const wd = d.toLocaleDateString("vi-VN", { weekday: "short" });
    return `${wd} ${hhmm}`;
  }
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mo} ${hhmm}`;
}

/** Nhãn ngày cho separator trong luồng chat */
export function formatChatDayLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayDiff = Math.round((startToday - startThat) / 86400000);
  if (dayDiff === 0) return "Hôm nay";
  if (dayDiff === 1) return "Hôm qua";
  const dd = String(d.getDate()).padStart(2, "0");
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  if (yy === now.getFullYear()) return `${dd}-${mo}`;
  return `${dd}-${mo}-${yy}`;
}
