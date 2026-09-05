"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff } from "lucide-react";
import ChatAvatar from "./ChatAvatar";
import type { ChatUser } from "@/lib/chatStore";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

type Phase = "starting" | "ringing" | "connecting" | "connected" | "ended" | "denied";

export default function CallModal({
  open,
  mode,
  peer,
  onClose,
  role = "caller",
  existingCallId,
  existingOfferSdp,
}: {
  open: boolean;
  mode: "audio" | "video";
  peer?: ChatUser | null;
  onClose: () => void;
  role?: "caller" | "callee";
  existingCallId?: string | null;
  existingOfferSdp?: string | null;
}) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const seenIceRef = useRef<Set<string>>(new Set());
  const pollRef = useRef<number | null>(null);

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [sec, setSec] = useState(0);
  const [phase, setPhase] = useState<Phase>("starting");
  const [err, setErr] = useState<string | null>(null);

  const cleanup = useCallback(async (notifyEnd: boolean) => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    try {
      pcRef.current?.getSenders().forEach((s) => {
        try {
          s.track?.stop();
        } catch {}
      });
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    if (notifyEnd && callIdRef.current) {
      try {
        await fetch("/api/chat/call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "end", id: callIdRef.current }),
        });
      } catch {}
    }
    callIdRef.current = null;
    seenIceRef.current = new Set();
  }, []);

  const pushIce = useCallback(async (candidate: RTCIceCandidate) => {
    const id = callIdRef.current;
    if (!id) return;
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ice",
          id,
          candidate: candidate.toJSON(),
        }),
      });
    } catch {}
  }, []);

  const applyRemoteIce = useCallback(async (list: unknown) => {
    const pc = pcRef.current;
    if (!pc || !Array.isArray(list)) return;
    for (const c of list) {
      const key = JSON.stringify(c);
      if (seenIceRef.current.has(key)) continue;
      seenIceRef.current.add(key);
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c as RTCIceCandidateInit));
      } catch {
        /* ignore order errors */
      }
    }
  }, []);

  useEffect(() => {
    if (!open) {
      void cleanup(false);
      setPhase("starting");
      setSec(0);
      setErr(null);
      setMuted(false);
      setCamOff(mode === "audio");
      return;
    }

    let cancelled = false;

    const start = async () => {
      setPhase("starting");
      setErr(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErr("Trình duyệt không hỗ trợ WebRTC");
          setPhase("denied");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === "video",
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current && mode === "video") {
          localVideoRef.current.srcObject = stream;
          await localVideoRef.current.play().catch(() => {});
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (ev) => {
          if (ev.candidate) void pushIce(ev.candidate);
        };
        pc.onconnectionstatechange = () => {
          const st = pc.connectionState;
          if (st === "connected") setPhase("connected");
          if (st === "failed" || st === "disconnected") {
            setErr("Mất kết nối");
          }
          if (st === "closed") setPhase("ended");
        };
        pc.ontrack = (ev) => {
          const [remote] = ev.streams;
          if (remoteVideoRef.current && remote) {
            remoteVideoRef.current.srcObject = remote;
            void remoteVideoRef.current.play().catch(() => {});
          }
          setPhase("connected");
        };

        if (role === "caller") {
          if (!peer?.id) {
            setErr("Không có người nhận");
            setPhase("ended");
            return;
          }
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: mode === "video",
          });
          await pc.setLocalDescription(offer);
          const id = `call_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
          callIdRef.current = id;
          const res = await fetch("/api/chat/call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "offer",
              id,
              to: peer.id,
              mode,
              offerSdp: offer.sdp,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Không tạo được cuộc gọi");
          setPhase("ringing");

          pollRef.current = window.setInterval(async () => {
            try {
              const r = await fetch(`/api/chat/call?id=${encodeURIComponent(id)}`);
              const j = await r.json();
              const call = j.call;
              if (!call) return;
              if (call.status === "rejected" || call.status === "ended") {
                setPhase("ended");
                setErr(call.status === "rejected" ? "Đối phương từ chối" : "Cuộc gọi kết thúc");
                void cleanup(false);
                return;
              }
              if (call.answer_sdp && pc.signalingState !== "stable") {
                await pc.setRemoteDescription({
                  type: "answer",
                  sdp: String(call.answer_sdp),
                });
                setPhase("connecting");
              }
              await applyRemoteIce(call.callee_ice);
            } catch {
              /* ignore poll errors */
            }
          }, 1200);
        } else {
          // callee
          const id = existingCallId || "";
          const offerSdp = existingOfferSdp || "";
          if (!id || !offerSdp) {
            setErr("Thiếu thông tin cuộc gọi");
            setPhase("ended");
            return;
          }
          callIdRef.current = id;
          await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          const res = await fetch("/api/chat/call", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "answer",
              id,
              answerSdp: answer.sdp,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Không nhận cuộc gọi");
          setPhase("connecting");

          pollRef.current = window.setInterval(async () => {
            try {
              const r = await fetch(`/api/chat/call?id=${encodeURIComponent(id)}`);
              const j = await r.json();
              const call = j.call;
              if (!call) return;
              if (call.status === "ended") {
                setPhase("ended");
                void cleanup(false);
                return;
              }
              await applyRemoteIce(call.caller_ice);
            } catch {}
          }, 1200);
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Không thể bắt đầu cuộc gọi");
        setPhase("denied");
      }
    };

    void start();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, role, peer?.id, existingCallId]);

  useEffect(() => {
    if (!open || phase !== "connected") return;
    const id = window.setInterval(() => setSec((s) => s + 1), 1000);
    return () => window.clearInterval(id);
  }, [open, phase]);

  const hangup = async () => {
    await cleanup(true);
    setPhase("ended");
    onClose();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStreamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !next;
    });
  };

  const toggleCam = () => {
    const next = !camOff;
    setCamOff(next);
    localStreamRef.current?.getVideoTracks().forEach((tr) => {
      tr.enabled = !next;
    });
  };

  if (!open) return null;

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  const statusText =
    phase === "starting"
      ? "Đang mở micro/camera…"
      : phase === "ringing"
        ? "Đang đổ chuông…"
        : phase === "connecting"
          ? "Đang kết nối…"
          : phase === "connected"
            ? `${mode === "video" ? "Video" : "Thoại"} · ${mm}:${ss}`
            : phase === "denied"
              ? "Không truy cập được thiết bị"
              : "Đã kết thúc";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/85 p-4">
      <div className="w-full max-w-md rounded-2xl bg-[#16181c] border border-[#2a2d34] p-5 text-center shadow-2xl">
        <div className="flex justify-center mb-2">
          <ChatAvatar user={peer} size="lg" />
        </div>
        <p className="text-white font-semibold text-lg">{peer?.name || "Cuộc gọi"}</p>
        <p className="text-sm text-zinc-400 mt-1">{statusText}</p>
        {err && <p className="text-xs text-red-400 mt-2">{err}</p>}

        {mode === "video" && (
          <div className="mt-4 relative aspect-video rounded-xl overflow-hidden bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute bottom-2 right-2 w-28 aspect-video object-cover rounded-lg border border-white/20 bg-black ${
                camOff ? "opacity-40" : ""
              }`}
            />
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          {(phase === "connected" || phase === "connecting" || phase === "ringing") && (
            <>
              <button
                type="button"
                onClick={toggleMute}
                className="p-3 rounded-full bg-[#2a2e36] text-white hover:bg-[#353a44]"
                title={muted ? "Bật mic" : "Tắt mic"}
              >
                {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
              {mode === "video" && (
                <button
                  type="button"
                  onClick={toggleCam}
                  className="p-3 rounded-full bg-[#2a2e36] text-white hover:bg-[#353a44]"
                  title={camOff ? "Bật camera" : "Tắt camera"}
                >
                  {camOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}
            </>
          )}
          <button
            type="button"
            onClick={() => void hangup()}
            className="p-3 rounded-full bg-red-600 text-white hover:bg-red-500"
            title="Kết thúc"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-zinc-600 mt-4">
          Gọi thật qua WebRTC · Cần cho phép micro{mode === "video" ? "/camera" : ""} · Hai bên phải online
        </p>
      </div>
    </div>
  );
}
