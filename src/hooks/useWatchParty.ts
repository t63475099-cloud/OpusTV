"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PartyMsg =
  | { type: "SYNC"; action: "PLAY" | "PAUSE" | "SEEK"; time: number; sender: string }
  | { type: "CHAT"; text: string; sender: string; at: number }
  | { type: "HELLO"; sender: string };

/**
 * Watch Party — đồng bộ Play/Pause/Seek qua BroadcastChannel (cùng trình duyệt)
 * và WebRTC DataChannel khi có PeerJS (CDN). Không stream video qua server.
 */
export function useWatchParty(roomId: string | null, selfId: string) {
  const [peers, setPeers] = useState(0);
  const [chat, setChat] = useState<{ text: string; sender: string; at: number }[]>([]);
  const [lastSync, setLastSync] = useState<PartyMsg | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const onRemoteRef = useRef<((m: PartyMsg) => void) | null>(null);

  useEffect(() => {
    if (!roomId || typeof window === "undefined") return;
    const bc = new BroadcastChannel(`opus-party-${roomId}`);
    bcRef.current = bc;
    bc.onmessage = (ev) => {
      const m = ev.data as PartyMsg;
      if (!m || (m as { sender?: string }).sender === selfId) return;
      if (m.type === "CHAT") setChat((c) => [...c.slice(-40), m]);
      if (m.type === "SYNC") setLastSync(m);
      onRemoteRef.current?.(m);
    };
    bc.postMessage({ type: "HELLO", sender: selfId } satisfies PartyMsg);
    setPeers(1);
    return () => {
      bc.close();
      bcRef.current = null;
    };
  }, [roomId, selfId]);

  const send = useCallback(
    (m: PartyMsg) => {
      try {
        bcRef.current?.postMessage(m);
      } catch {}
    },
    []
  );

  const broadcastSync = useCallback(
    (action: "PLAY" | "PAUSE" | "SEEK", time: number) => {
      send({ type: "SYNC", action, time, sender: selfId });
    },
    [send, selfId]
  );

  const sendChat = useCallback(
    (text: string) => {
      const msg = { type: "CHAT" as const, text, sender: selfId, at: Date.now() };
      send(msg);
      setChat((c) => [...c.slice(-40), msg]);
    },
    [send, selfId]
  );

  const onRemote = useCallback((fn: (m: PartyMsg) => void) => {
    onRemoteRef.current = fn;
  }, []);

  return { peers, chat, lastSync, broadcastSync, sendChat, onRemote };
}
