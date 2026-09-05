"use client";

import { useEffect, useRef, useState } from "react";
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

/** Chuông gọi đơn giản (Web Audio) — không dùng nhạc bản quyền */
function useRingtone(active: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      try {
        void ctxRef.current?.close();
      } catch {}
      ctxRef.current = null;
      return;
    }

    let stopped = false;
    const ring = () => {
      if (stopped) return;
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        if (!ctxRef.current || ctxRef.current.state === "closed") {
          ctxRef.current = new Ctx();
        }
        const ctx = ctxRef.current;
        if (ctx.state === "suspended") void ctx.resume();
        const now = ctx.currentTime;
        // 2 tone giống kiểu chuông điện thoại (không copy Zalo/Messenger)
        for (const [i, freq] of [880, 988].entries()) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + i * 0.18);
          osc.stop(now + 0.4 + i * 0.18);
        }
      } catch {
        /* autoplay policy */
      }
    };

    ring();
    timerRef.current = window.setInterval(ring, 2200);
    return () => {
      stopped = true;
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      try {
        void ctxRef.current?.close();
      } catch {}
      ctxRef.current = null;
    };
  }, [active]);
}

export default function IncomingCallBanner() {
  const me = useChatStore((s) => s.me);
  const getUser = useChatStore((s) => s.getUser);
  const [incoming, setIncoming] = useState<IncomingRow | null>(null);
  const [accepting, setAccepting] = useState(false);

  useRingtone(!!incoming && !accepting);

  useEffect(() => {
    if (!me) return;
    const tick = async () => {
      try {
        const r = await fetch("/api/chat/call?incoming=1");
        if (!r.ok) return;
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
    <div
      className="fixed top-[max(0.75rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 z-[200] w-[min(94vw,400px)]"
      data-incoming-call
    >
      <div className="rounded-2xl bg-[#16181c]/95 backdrop-blur-xl border border-emerald-500/30 shadow-2xl shadow-black/50 px-4 py-3 flex items-center gap-3 animate-pulse">
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
          onClick={() => setAccepting(true)}
          className="p-3 rounded-full bg-emerald-500 text-white shrink-0"
          title="Nghe"
        >
          {mode === "video" ? <Video className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
