"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";
import CallModal from "./CallModal";
import { startCallSound } from "@/lib/callSounds";
import { postCallLog } from "@/lib/callLog";

interface IncomingRow {
  id: string;
  from_user: string;
  mode: string;
  offer_sdp: string;
}

export default function IncomingCallBanner() {
  const username = useAccountStore((s) => s.username);
  const me = useChatStore((s) => s.me);
  const setMe = useChatStore((s) => s.setMe);
  const getUser = useChatStore((s) => s.getUser);
  const [incoming, setIncoming] = useState<IncomingRow | null>(null);
  const [accepting, setAccepting] = useState(false);
  const acceptedRef = useRef<IncomingRow | null>(null);

  useEffect(() => {
    if (username) setMe(username);
  }, [username, setMe]);

  useEffect(() => {
    if (!incoming || accepting) return;
    const stop = startCallSound("callee-ring");
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification("Cuộc gọi đến — Opus Chat", {
          body: `${incoming.from_user} đang gọi bạn`,
          tag: `call-${incoming.id}`,
        });
        setTimeout(() => n.close(), 8000);
      } else if (typeof Notification !== "undefined" && Notification.permission === "default") {
        void Notification.requestPermission();
      }
    } catch {
      /* */
    }
    return () => stop();
  }, [incoming, accepting]);

  useEffect(() => {
    if (!username && !me) return;
    const tick = async () => {
      try {
        const r = await fetch("/api/chat/call?incoming=1", { cache: "no-store" });
        if (!r.ok) return;
        const j = await r.json();
        const list = (j.incoming || []) as IncomingRow[];
        if (accepting || acceptedRef.current) return;
        if (list.length) {
          setIncoming((prev) => {
            if (prev?.id === list[0].id) return prev;
            return list[0];
          });
        } else {
          setIncoming(null);
        }
      } catch {
        /* */
      }
    };
    void tick();
    const id = window.setInterval(() => void tick(), 1200);
    const onVis = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [username, me, accepting]);

  const reject = async () => {
    if (!incoming) return;
    const from = incoming.from_user;
    const mode = incoming.mode === "video" ? "video" : "audio";
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", id: incoming.id }),
      });
    } catch {
      /* */
    }
    void postCallLog(from, mode, "rejected", 0);
    acceptedRef.current = null;
    setIncoming(null);
    setAccepting(false);
  };

  const onAccept = () => {
    if (!incoming?.offer_sdp) return;
    acceptedRef.current = { ...incoming };
    setAccepting(true);
  };

  const active = accepting ? acceptedRef.current || incoming : incoming;
  if (!active && !accepting) return null;

  const peerId = active?.from_user || "";
  const peer = peerId ? getUser(peerId) : null;
  const peerUser = peer || {
    id: peerId,
    name: peerId,
    nickname: peerId,
    avatar: "",
    status: "online" as const,
  };
  const mode = active?.mode === "video" ? "video" : "audio";

  if (accepting && active?.offer_sdp) {
    return (
      <CallModal
        open
        mode={mode}
        peer={peerUser}
        role="callee"
        existingCallId={active.id}
        existingOfferSdp={active.offer_sdp}
        onClose={() => {
          acceptedRef.current = null;
          setAccepting(false);
          setIncoming(null);
        }}
      />
    );
  }

  if (!active) return null;

  return (
    <div
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[200] w-[min(94vw,400px)]"
      data-incoming-call
    >
      <div className="rounded-2xl bg-[#16181c]/95 backdrop-blur-xl border border-emerald-500/40 shadow-2xl px-4 py-3 flex items-center gap-3">
        <ChatAvatar user={peerUser} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {peerUser.name || peerId}
          </p>
          <p className="text-xs text-emerald-400">
            {mode === "video" ? "Cuộc gọi video đến…" : "Cuộc gọi thoại đến…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reject()}
          className="p-3 rounded-full bg-red-600 text-white shrink-0"
          title="Từ chối"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={onAccept}
          className="p-3 rounded-full bg-emerald-500 text-white shrink-0"
          title="Nghe"
        >
          {mode === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
