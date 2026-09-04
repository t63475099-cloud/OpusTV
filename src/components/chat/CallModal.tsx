"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [sec, setSec] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) return;
    setSec(0);
    const t = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open || mode !== "video" || camOff) {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      return;
    }
    let active = true;
    navigator.mediaDevices
      ?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (!active) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [open, mode, camOff]);

  if (!open) return null;

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[220] bg-neutral-950 flex flex-col">
      <div className="flex-1 relative flex items-center justify-center">
        {mode === "video" && !camOff ? (
          <video ref={videoRef} muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <ChatAvatar user={peer} size="lg" showStatus={false} />
            <p className="text-white text-xl font-semibold">{peer?.name || "Cuộc gọi"}</p>
            <p className="text-zinc-400 text-sm">
              {mode === "video" ? "Đang gọi video..." : "Đang gọi thoại..."} · {mm}:{ss}
            </p>
          </div>
        )}
        {mode === "video" && !camOff && (
          <div className="absolute top-6 left-0 right-0 text-center">
            <p className="text-white font-medium drop-shadow">{peer?.name}</p>
            <p className="text-white/70 text-sm">
              {mm}:{ss}
            </p>
          </div>
        )}
      </div>
      <div className="pb-10 pt-4 flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => setMuted((v) => !v)}
          className={`p-4 rounded-full ${muted ? "bg-white text-black" : "bg-white/15 text-white"}`}
        >
          {muted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        {mode === "video" && (
          <button
            type="button"
            onClick={() => setCamOff((v) => !v)}
            className={`p-4 rounded-full ${camOff ? "bg-white text-black" : "bg-white/15 text-white"}`}
          >
            {camOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </button>
        )}
        <button type="button" onClick={onClose} className="p-4 rounded-full bg-red-600 text-white">
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
