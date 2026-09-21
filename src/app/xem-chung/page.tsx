"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Send, Copy } from "lucide-react";
import { useWatchParty } from "@/hooks/useWatchParty";
import { useAccountStore } from "@/lib/account";

function PartyInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const room = sp.get("room") || "";
  const slug = sp.get("slug") || "";
  const username = useAccountStore((s) => s.username) || "guest";
  const selfId = useMemo(() => username.toLowerCase(), [username]);
  const { chat, broadcastSync, sendChat, onRemote, lastSync } = useWatchParty(
    room || null,
    selfId
  );
  const [text, setText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const applying = useRef(false);

  useEffect(() => {
    onRemote((m) => {
      if (m.type !== "SYNC") return;
      const v = videoRef.current;
      if (!v) return;
      applying.current = true;
      try {
        if (Math.abs(v.currentTime - m.time) > 0.8) v.currentTime = m.time;
        if (m.action === "PLAY") v.play().catch(() => {});
        if (m.action === "PAUSE") v.pause();
      } finally {
        setTimeout(() => {
          applying.current = false;
        }, 400);
      }
    });
  }, [onRemote]);

  useEffect(() => {
    if (!lastSync) return;
  }, [lastSync]);

  const onPlay = () => {
    if (applying.current) return;
    const v = videoRef.current;
    if (v) broadcastSync("PLAY", v.currentTime);
  };
  const onPause = () => {
    if (applying.current) return;
    const v = videoRef.current;
    if (v) broadcastSync("PAUSE", v.currentTime);
  };
  const onSeeked = () => {
    if (applying.current) return;
    const v = videoRef.current;
    if (v) broadcastSync("SEEK", v.currentTime);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Đã copy link phòng");
    } catch {}
  };

  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 pb-28">
        <Users className="w-10 h-10 text-rose-400" />
        <p className="text-white font-semibold">Xem chung (Watch Party)</p>
        <p className="text-sm text-zinc-400 text-center max-w-sm">
          Mở từ trang phim với tham số room, hoặc tạo phòng mới.
        </p>
        <button
          type="button"
          className="px-4 py-2 rounded-full bg-rose-600 text-white text-sm"
          onClick={() => {
            const id = `party-${Math.random().toString(36).slice(2, 8)}`;
            router.push(`/xem-chung?room=${id}${slug ? `&slug=${slug}` : ""}`);
          }}
        >
          Tạo phòng
        </button>
        <Link href="/home" className="text-sm text-zinc-400 underline">
          Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 px-3 sm:px-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-2 py-3">
        <div className="flex items-center gap-2 text-sm text-white">
          <Users className="w-4 h-4 text-rose-400" />
          Phòng {room}
        </div>
        <button
          type="button"
          onClick={copyLink}
          className="flex items-center gap-1 text-xs text-zinc-300 px-3 py-1.5 rounded-full border border-white/15 bg-white/5"
        >
          <Copy className="w-3.5 h-3.5" /> Copy link
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 bg-black aspect-video mb-3">
        {/* Demo: dùng poster / embed slug nếu có — đồng bộ P2P không đẩy video qua server */}
        <video
          ref={videoRef}
          className="w-full h-full bg-black"
          controls
          playsInline
          onPlay={onPlay}
          onPause={onPause}
          onSeeked={onSeeked}
        >
          <source src="" />
        </video>
        <p className="text-[11px] text-zinc-500 p-2">
          Mở cùng link trên hai thiết bị/tab để đồng bộ play · pause · tua. Gắn link m3u8 từ trang phim khi xem thật.
          {slug ? ` · slug: ${slug}` : ""}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3 flex flex-col max-h-56">
        <div className="flex-1 overflow-y-auto space-y-1.5 text-sm mb-2">
          {chat.length === 0 && (
            <p className="text-zinc-500 text-xs">Chat trong phòng…</p>
          )}
          {chat.map((c, i) => (
            <div key={i} className="text-zinc-200">
              <span className="text-rose-400 text-xs font-medium">{c.sender}</span>{" "}
              {c.text}
            </div>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!text.trim()) return;
            sendChat(text.trim());
            setText("");
          }}
        >
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Nhắn trong phòng…"
            className="flex-1 rounded-full bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none"
          />
          <button type="submit" className="p-2 rounded-full bg-rose-600 text-white">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function XemChungPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-zinc-500 text-sm">Đang tải…</div>}>
      <PartyInner />
    </Suspense>
  );
}
