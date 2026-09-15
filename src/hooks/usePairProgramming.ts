"use client";

/**
 * Pair programming — BroadcastChannel (cùng trình duyệt) + PeerJS CDN (máy khác).
 * Không cần server duy trì kết nối.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { CollabPeer, CursorPosition, PeerMessage } from "@/types/codeCollab";

const PEER_CDN = "https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js";
const COLORS = ["#f43f5e", "#a855f7", "#38bdf8", "#fbbf24", "#34d399", "#fb7185"];

function roomChannel(roomId: string) {
  return `opus-code-room:${roomId}`;
}

function genRoomId() {
  return `opus-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;
}

function genColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

type PeerLike = {
  id: string;
  destroy: () => void;
  on: (ev: string, fn: (...args: unknown[]) => void) => void;
  connect: (id: string) => DataConn;
};

type DataConn = {
  open: boolean;
  peer: string;
  send: (data: unknown) => void;
  on: (ev: string, fn: (...args: unknown[]) => void) => void;
  close: () => void;
};

declare global {
  interface Window {
    Peer?: new (id?: string, opts?: { debug?: number }) => PeerLike;
  }
}

async function loadPeerJs(): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.Peer) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = PEER_CDN;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Không tải được PeerJS"));
    document.head.appendChild(s);
  });
}

export interface PairProgrammingApi {
  roomId: string | null;
  myPeerId: string | null;
  peers: CollabPeer[];
  connected: boolean;
  pingMs: number | null;
  readOnly: boolean;
  remoteCode: string | null;
  remoteCursor: (CursorPosition & { name: string; color: string }) | null;
  status: "idle" | "hosting" | "joining" | "connected" | "error";
  error: string | null;
  createRoom: (name: string) => Promise<string>;
  joinRoom: (roomId: string, name: string) => Promise<void>;
  leaveRoom: () => void;
  broadcastCode: (content: string) => void;
  broadcastCursor: (cursor: CursorPosition) => void;
  setReadOnlyGuest: (v: boolean) => void;
  inviteUrl: string | null;
}

export function usePairProgramming(
  onRemoteCode?: (content: string) => void
): PairProgrammingApi {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [myPeerId, setMyPeerId] = useState<string | null>(null);
  const [peers, setPeers] = useState<CollabPeer[]>([]);
  const [connected, setConnected] = useState(false);
  const [pingMs, setPingMs] = useState<number | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [remoteCode, setRemoteCode] = useState<string | null>(null);
  const [remoteCursor, setRemoteCursor] = useState<
    (CursorPosition & { name: string; color: string }) | null
  >(null);
  const [status, setStatus] = useState<PairProgrammingApi["status"]>("idle");
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<PeerLike | null>(null);
  const connsRef = useRef<Map<string, DataConn>>(new Map());
  const bcRef = useRef<BroadcastChannel | null>(null);
  const revRef = useRef(0);
  const applyingRemote = useRef(false);
  const lastSentRef = useRef<string>("");
  const myIdRef = useRef<string>("");
  const nameRef = useRef("Guest");
  const colorRef = useRef(COLORS[0]);
  const onRemoteCodeRef = useRef(onRemoteCode);
  onRemoteCodeRef.current = onRemoteCode;

  const sendAll = useCallback((msg: PeerMessage) => {
    const raw = JSON.stringify(msg);
    connsRef.current.forEach((c) => {
      try {
        if (c.open) c.send(msg);
      } catch {
        /* */
      }
    });
    try {
      bcRef.current?.postMessage(msg);
    } catch {
      /* */
    }
    void raw;
  }, []);

  const handleMessage = useCallback(
    (msg: PeerMessage, fromId?: string) => {
      if (!msg || typeof msg !== "object") return;
      switch (msg.type) {
        case "hello": {
          const peer: CollabPeer = {
            peerId: fromId || msg.name,
            name: msg.name,
            color: msg.color,
            avatar: msg.avatar,
            lastSeen: Date.now(),
          };
          setPeers((prev) => {
            const i = prev.findIndex((p) => p.peerId === peer.peerId);
            if (i >= 0) {
              const next = [...prev];
              next[i] = { ...next[i], ...peer };
              return next;
            }
            return [...prev, peer];
          });
          setConnected(true);
          setStatus("connected");
          break;
        }
        case "code": {
          // Bỏ qua echo của chính mình (BroadcastChannel gửi cho cả tab hiện tại)
          if (msg.fromId && myIdRef.current && msg.fromId === myIdRef.current) break;
          if (msg.content === lastSentRef.current) break;
          if (msg.rev <= revRef.current && msg.fromId !== "force") break;
          if (msg.rev > revRef.current) revRef.current = msg.rev;
          applyingRemote.current = true;
          setRemoteCode(msg.content);
          onRemoteCodeRef.current?.(msg.content);
          queueMicrotask(() => {
            applyingRemote.current = false;
          });
          break;
        }
        case "cursor": {
          setRemoteCursor({
            ...msg.cursor,
            name: "Bạn",
            color: genColor(fromId || "x"),
          });
          setPeers((prev) =>
            prev.map((p) =>
              p.peerId === fromId
                ? { ...p, cursor: msg.cursor, lastSeen: Date.now() }
                : p
            )
          );
          break;
        }
        case "ping":
          sendAll({ type: "pong", t: msg.t });
          break;
        case "pong":
          setPingMs(Math.max(0, Date.now() - msg.t));
          break;
        case "meta":
          if (typeof msg.readOnlyGuest === "boolean") {
            setReadOnly(!!msg.readOnlyGuest);
          }
          break;
        default:
          break;
      }
    },
    [sendAll]
  );

  const wireConn = useCallback(
    (conn: DataConn) => {
      connsRef.current.set(conn.peer, conn);
      conn.on("data", (data: unknown) => {
        try {
          const msg =
            typeof data === "string" ? (JSON.parse(data) as PeerMessage) : (data as PeerMessage);
          handleMessage(msg, conn.peer);
        } catch {
          /* */
        }
      });
      conn.on("open", () => {
        setConnected(true);
        setStatus("connected");
        sendAll({
          type: "hello",
          name: nameRef.current,
          color: colorRef.current,
        });
      });
      conn.on("close", () => {
        connsRef.current.delete(conn.peer);
        setPeers((prev) => prev.filter((p) => p.peerId !== conn.peer));
        if (connsRef.current.size === 0) setConnected(false);
      });
    },
    [handleMessage, sendAll]
  );

  const setupBroadcast = useCallback(
    (rid: string) => {
      try {
        bcRef.current?.close();
      } catch {
        /* */
      }
      const bc = new BroadcastChannel(roomChannel(rid));
      bc.onmessage = (ev) => {
        handleMessage(ev.data as PeerMessage, "local-peer");
      };
      bcRef.current = bc;
    },
    [handleMessage]
  );

  const leaveRoom = useCallback(() => {
    connsRef.current.forEach((c) => {
      try {
        c.close();
      } catch {
        /* */
      }
    });
    connsRef.current.clear();
    try {
      peerRef.current?.destroy();
    } catch {
      /* */
    }
    peerRef.current = null;
    try {
      bcRef.current?.close();
    } catch {
      /* */
    }
    bcRef.current = null;
    setRoomId(null);
    setMyPeerId(null);
    setPeers([]);
    setConnected(false);
    setPingMs(null);
    setRemoteCursor(null);
    setRemoteCode(null);
    setStatus("idle");
    setError(null);
    setReadOnly(false);
  }, []);

  const createRoom = useCallback(
    async (name: string) => {
      leaveRoom();
      const rid = genRoomId();
      nameRef.current = name || "Host";
      colorRef.current = genColor(name + rid);
      setStatus("hosting");
      setRoomId(rid);
      myIdRef.current = rid;
      setupBroadcast(rid);

      try {
        await loadPeerJs();
        const PeerCtor = window.Peer!;
        const peer = new PeerCtor(rid, { debug: 0 });
        peerRef.current = peer;
        await new Promise<void>((resolve, reject) => {
          peer.on("open", () => resolve());
          peer.on("error", (e: unknown) =>
            reject(e instanceof Error ? e : new Error(String(e)))
          );
          setTimeout(() => resolve(), 2500);
        });
        setMyPeerId(peer.id || rid);
        myIdRef.current = peer.id || rid;
        peer.on("connection", (conn: unknown) => {
          wireConn(conn as DataConn);
        });
        setStatus("connected");
      } catch (e) {
        // vẫn dùng BroadcastChannel
        setMyPeerId(rid);
        myIdRef.current = rid;
        setStatus("connected");
        setError(
          e instanceof Error
            ? `${e.message} — vẫn đồng bộ được trên cùng trình duyệt`
            : "PeerJS lỗi — dùng chế độ cùng trình duyệt"
        );
      }
      return rid;
    },
    [leaveRoom, setupBroadcast, wireConn]
  );

  const joinRoom = useCallback(
    async (rid: string, name: string) => {
      leaveRoom();
      const clean = rid.replace(/^.*room=/, "").trim();
      if (!clean) {
        setError("Thiếu mã phòng");
        setStatus("error");
        return;
      }
      nameRef.current = name || "Guest";
      colorRef.current = genColor(name + clean);
      setStatus("joining");
      setRoomId(clean);
      myIdRef.current = myIdRef.current || `guest-${Date.now().toString(36)}`;
      setupBroadcast(clean);

      // chào qua BroadcastChannel ngay
      sendAll({
        type: "hello",
        name: nameRef.current,
        color: colorRef.current,
      });

      try {
        await loadPeerJs();
        const PeerCtor = window.Peer!;
        const peer = new PeerCtor(undefined, { debug: 0 });
        peerRef.current = peer;
        await new Promise<void>((resolve) => {
          peer.on("open", () => resolve());
          setTimeout(() => resolve(), 2500);
        });
        setMyPeerId(peer.id);
        myIdRef.current = peer.id;
        const conn = peer.connect(clean);
        wireConn(conn);
        setStatus("connected");
      } catch (e) {
        const gid = `guest-${Date.now().toString(36)}`;
        setMyPeerId(gid);
        myIdRef.current = gid;
        setStatus("connected");
        setConnected(true);
        setError(
          e instanceof Error
            ? `${e.message} — đồng bộ tab cùng trình duyệt`
            : "Chỉ đồng bộ cùng trình duyệt"
        );
      }
    },
    [leaveRoom, setupBroadcast, sendAll, wireConn]
  );

  const broadcastCode = useCallback(
    (content: string) => {
      if (applyingRemote.current) return;
      if (readOnly) return;
      if (content === lastSentRef.current) return;
      lastSentRef.current = content;
      revRef.current += 1;
      sendAll({
        type: "code",
        content,
        rev: revRef.current,
        fromId: myIdRef.current || "local",
      });
    },
    [readOnly, sendAll]
  );

  const broadcastCursor = useCallback(
    (cursor: CursorPosition) => {
      sendAll({ type: "cursor", cursor });
    },
    [sendAll]
  );

  const setReadOnlyGuest = useCallback(
    (v: boolean) => {
      setReadOnly(v);
      sendAll({ type: "meta", readOnlyGuest: v });
    },
    [sendAll]
  );

  // ping interval
  useEffect(() => {
    if (!roomId) return;
    const t = setInterval(() => {
      sendAll({ type: "ping", t: Date.now() });
    }, 4000);
    return () => clearInterval(t);
  }, [roomId, sendAll]);

  useEffect(() => () => leaveRoom(), [leaveRoom]);

  const inviteUrl =
    typeof window !== "undefined" && roomId
      ? `${window.location.origin}/code?room=${encodeURIComponent(roomId)}`
      : roomId
        ? `/code?room=${roomId}`
        : null;

  return {
    roomId,
    myPeerId,
    peers,
    connected,
    pingMs,
    readOnly,
    remoteCode,
    remoteCursor,
    status,
    error,
    createRoom,
    joinRoom,
    leaveRoom,
    broadcastCode,
    broadcastCursor,
    setReadOnlyGuest,
    inviteUrl,
  };
}

export { genRoomId };
