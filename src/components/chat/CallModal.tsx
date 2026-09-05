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
  const [phase, setPhase] = useState<"idle" | "connected" | "denied">("idle");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      setPhase("idle");
      setSec(0);
      setErr(null);
      return;
    }
    setCamOff(mode === "audio");
  }, [open, mode]);

  useEffect(() => {
    if (!open || phase !== "connected") return;
    const id = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, phase]);

  const startMedia = async () => {
    setErr(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setErr("Trình duyệt không hỗ trợ");
        setPhase("denied");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === "video",
      });
      streamRef.current = stream;
      if (localVideoRef.current && mode === "video") {
        localVideoRef.current.srcObject = stream;
        await localVideoRef.current.play().catch(() => {});
      }
      setPhase("connected");
    } catch {
      setErr("Không lấy được micro/camera");
      setPhase("denied");
    }
  };

  const hangup = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    onClose();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    streamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !next;
    });
  };

  const toggleCam = () => {
    const next = !camOff;
    setCamOff(next);
    streamRef.current?.getVideoTracks().forEach((tr) => {
      tr.enabled = !next;
    });
  };

  if (!open) return null;

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#16181c] border border-[#2a2d34] p-6 text-center">
        <ChatAvatar user={peer} size="lg" />
        <p className="mt-3 text-white font-semibold">{peer?.name || "Đang gọi"}</p>
        <p className="text-sm text-zinc-500 mt-1">
          {phase === "connected"
            ? `${mode === "video" ? "Video" : "Thoại"} · ${mm}:${ss}`
            : mode === "video"
              ? "Gọi video"
              : "Gọi thoại"}
        </p>
        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

        {mode === "video" && phase === "connected" && (
          <video
            ref={localVideoRef}
            muted
            playsInline
            className={`mt-4 w-full rounded-xl bg-black aspect-video ${camOff ? "opacity-30" : ""}`}
          />
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          {phase === "idle" && (
            <button
              type="button"
              onClick={() => void startMedia()}
              className="px-5 py-2.5 rounded-full bg-[#0068ff] text-white text-sm font-semibold"
            >
              {mode === "video" ? "Bật camera & gọi" : "Bật micro & gọi"}
            </button>
          )}
          {phase === "connected" && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className="p-3 rounded-full bg-[#2a2e36] text-white"
              >
                {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {mode === "video" && (
                <button
                  type="button"
                  onClick={toggleCam}
                  className="p-3 rounded-full bg-[#2a2e36] text-white"
                >
                  {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={hangup}
            className="p-3 rounded-full bg-red-600 text-white"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
        {phase === "idle" && (
          <p className="text-[11px] text-zinc-600 mt-3">Mô phỏng gọi — cần cho phép micro/camera</p>
        )}
      </div>
    </div>
  );
}
