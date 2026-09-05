"use client";

import { useEffect, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useChatStore } from "@/lib/chatStore";
import ChatAvatar from "./ChatAvatar";
import CallModal from "./CallModal";

interface IncomingRow {
  id: string;
  from_user: string;
  mode: string;
  offer_sdp: string;
}

export default function IncomingCallBanner() {
  const me = useChatStore((s) => s.me);
  const getUser = useChatStore((s) => s.getUser);
  const [incoming, setIncoming] = useState<IncomingRow | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!me) return;
    const tick = async () => {
      try {
        const r = await fetch("/api/chat/call?incoming=1");
        const j = await r.json();
        const list = (j.incoming || []) as IncomingRow[];
        if (list.length && !accepting) {
          setIncoming(list[0]);
        } else if (!list.length && !accepting) {
          setIncoming(null);
        }
      } catch {
        /* ignore */
      }
    };
    tick();
    const id = window.setInterval(tick, 2000);
    return () => window.clearInterval(id);
  }, [me, accepting]);

  const reject = async () => {
    if (!incoming) return;
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", id: incoming.id }),
      });
    } catch {}
    setIncoming(null);
  };

  const accept = () => {
    if (!incoming) return;
    setAccepting(true);
  };

  if (!incoming && !accepting) return null;

  const peerId = incoming?.from_user || "";
  const peer = peerId ? getUser(peerId) : null;
  const peerUser = peer || {
    id: peerId,
    name: peerId,
    nickname: peerId,
    avatar: "",
    status: "online" as const,
  };
  const mode = incoming?.mode === "video" ? "video" : "audio";

  if (accepting && incoming) {
    return (
      <CallModal
        open
        mode={mode}
        peer={peerUser}
        role="callee"
        existingCallId={incoming.id}
        existingOfferSdp={incoming.offer_sdp}
        onClose={() => {
          setAccepting(false);
          setIncoming(null);
        }}
      />
    );
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[95] w-[min(92vw,380px)]">
      <div className="rounded-2xl bg-[#16181c] border border-[#2a2d34] shadow-2xl px-4 py-3 flex items-center gap-3">
        <ChatAvatar user={peerUser} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">
            {peerUser.name || peerId}
          </p>
          <p className="text-xs text-zinc-400">
            {mode === "video" ? "Cuộc gọi video đến…" : "Cuộc gọi thoại đến…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void reject()}
          className="p-2.5 rounded-full bg-red-600 text-white"
          title="Từ chối"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={accept}
          className="p-2.5 rounded-full bg-emerald-500 text-white"
          title="Nghe"
        >
          {mode === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
