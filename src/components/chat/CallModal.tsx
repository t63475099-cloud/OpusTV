"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Phone } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import type { ChatUser } from "@/lib/chatStore";

export default function CallModal({
  open,
  mode,
  peer,
  onClose,
}: {
  open: boolean;
  mode: "audio" | "video";
  peer?: ChatUser | null;
  onClose: () => void;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [sec, setSec] = useState(0);
  const [phase, setPhase] = useState<"request" | "ringing" | "connected" | "denied">("request");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      return;
    }
    setSec(0);
    setPhase("request");
    setErr(null);
    setMuted(false);
    setCamOff(mode === "audio");

    let active = true;
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErr("Trình duyệt không hỗ trợ gọi media");
          setPhase("denied");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video",
        });
        if (!active) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (localVideoRef.current && mode === "video") {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(() => {});
        }
        setPhase("ringing");
        // Mô phỏng đổ chuông → kết nối (WebRTC peer cần signaling riêng)
        window.setTimeout(() => {
          if (active) setPhase("connected");
        }, 1800);
      } catch {
        setErr("Không mở được micro/camera — kiểm tra quyền trình duyệt");
        setPhase("denied");
      }
    };
    void start();

    const t = window.setInterval(() => {
      setSec((s) => s + 1);
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(t);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [open, mode]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((tr) => {
      tr.enabled = !muted;
    });
  }, [muted]);

  useEffect(() => {
    const stream = streamRef.current;
    if (!stream || mode !== "video") return;
    stream.getVideoTracks().forEach((tr) => {
      tr.enabled = !camOff;
    });
  }, [camOff, mode]);

  if (!open) return null;

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const statusText =
    phase === "request"
      ? "Đang mở micro/camera…"
      : phase === "ringing"
        ? "Đang đổ chuông…"
        : phase === "connected"
          ? `${mm}:${ss}`
          : err || "Không thể gọi";

  return (
    <div className="fixed inset-0 z-[220] bg-gradient-to-b from-neutral-900 via-neutral-950 to-black flex flex-col animate-[fadeIn_0.25s_ease]">
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-rose-600/30 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-indigo-600/25 blur-[80px]" />
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center gap-5 px-6">
        {mode === "video" && !camOff && phase !== "denied" ? (
          <video
            ref={localVideoRef}
            muted
            playsInline
            autoPlay
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        ) : null}

        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="relative">
            {(phase === "ringing" || phase === "request") && (
              <span className="absolute inset-0 rounded-full ring-4 ring-emerald-400/40 animate-ping" />
            )}
            <ChatAvatar user={peer} size="lg" showStatus={false} />
          </div>
          <p className="text-white text-2xl font-semibold drop-shadow">{peer?.name || "Cuộc gọi"}</p>
          <p className="text-zinc-300 text-sm flex items-center gap-2">
            <Phone className="w-4 h-4" />
            {mode === "video" ? "Gọi video" : "Gọi thoại"} · {statusText}
          </p>
          {err && <p className="text-amber-300 text-xs text-center max-w-xs">{err}</p>}
          {phase === "connected" && (
            <p className="text-[11px] text-zinc-500 max-w-xs text-center">
              Đã bật micro{mode === "video" ? "/camera" : ""} trên máy bạn. Kết nối 2 chiều WebRTC sẽ bổ sung khi có signaling server.
            </p>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center gap-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-4">
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white active:scale-95"
          aria-label={muted ? "Bật mic" : "Tắt mic"}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        {mode === "video" && (
          <button
            type="button"
            onClick={() => setCamOff((v) => !v)}
            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white active:scale-95"
            aria-label={camOff ? "Bật camera" : "Tắt camera"}
          >
            {camOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/40 active:scale-95"
          aria-label="Kết thúc"
        >
          <PhoneOff className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
