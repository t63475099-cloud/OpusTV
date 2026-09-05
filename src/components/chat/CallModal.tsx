"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Video,
  VideoOff,
  Settings,
} from "lucide-react";
import type { ChatUser } from "@/lib/chatStore";
import { startCallSound, stopSharedAudio } from "@/lib/callSounds";
import { postCallLog } from "@/lib/callLog";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

type Phase = "starting" | "ringing" | "connecting" | "connected" | "ended" | "denied";

function avatarUrl(peer?: ChatUser | null) {
  const a = peer?.avatar || "";
  if (a.startsWith("http") || a.startsWith("data:")) return a;
  return "";
}

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
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef<string | null>(null);
  const seenIceRef = useRef<Set<string>>(new Set());
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSetRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const soundStopRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>("starting");
  const secRef = useRef(0);

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [sec, setSec] = useState(0);
  const [phase, setPhase] = useState<Phase>("starting");
  const [err, setErr] = useState<string | null>(null);

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const stopSound = useCallback(() => {
    soundStopRef.current?.();
    soundStopRef.current = null;
  }, []);

  const cleanup = useCallback(
    async (notifyEnd: boolean) => {
      stopSound();
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
      try {
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
      pendingIceRef.current = [];
      remoteSetRef.current = false;
    },
    [stopSound]
  );

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

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !remoteSetRef.current) return;
    const pending = pendingIceRef.current;
    pendingIceRef.current = [];
    for (const c of pending) {
      const key = JSON.stringify(c);
      if (seenIceRef.current.has(key)) continue;
      seenIceRef.current.add(key);
      try {
        await pc.addIceCandidate(c);
      } catch {}
    }
  }, []);

  const applyRemoteIce = useCallback(async (list: unknown) => {
    const pc = pcRef.current;
    if (!pc || !Array.isArray(list)) return;
    for (const c of list) {
      const init = c as RTCIceCandidateInit;
      const key = JSON.stringify(init);
      if (seenIceRef.current.has(key)) continue;
      if (!remoteSetRef.current) {
        pendingIceRef.current.push(init);
        continue;
      }
      seenIceRef.current.add(key);
      try {
        await pc.addIceCandidate(init);
      } catch {}
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      void remoteAudioRef.current.play().catch(() => {});
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      void remoteVideoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (!open) {
      void cleanup(false);
      setPhaseBoth("starting");
      setSec(0);
      secRef.current = 0;
      setErr(null);
      setMuted(false);
      setCamOff(mode === "audio");
      return;
    }

    let cancelled = false;

    const start = async () => {
      setPhaseBoth("starting");
      setErr(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setErr("Trình duyệt không hỗ trợ cuộc gọi");
          setPhaseBoth("denied");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
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
          if (st === "connected") {
            setPhaseBoth("connected");
            stopSound();
          }
          if (st === "failed") setErr("Kết nối thất bại — thử lại");
          if (st === "closed") setPhaseBoth("ended");
        };
        pc.ontrack = (ev) => {
          const remote = ev.streams[0];
          if (remote) attachRemoteStream(remote);
          else if (ev.track) attachRemoteStream(new MediaStream([ev.track]));
          setPhaseBoth("connected");
          stopSound();
        };

        if (role === "caller") {
          if (!peer?.id) {
            setErr("Không có người nhận");
            setPhaseBoth("ended");
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
          setPhaseBoth("ringing");
          stopSound();
          soundStopRef.current = startCallSound("caller-wait");

          pollRef.current = window.setInterval(async () => {
            try {
              const r = await fetch(`/api/chat/call?id=${encodeURIComponent(id)}`);
              const j = await r.json();
              const call = j.call;
              if (!call) return;
              if (call.status === "rejected" || call.status === "ended") {
                setPhaseBoth("ended");
                setErr(call.status === "rejected" ? "Đối phương từ chối" : "Cuộc gọi kết thúc");
                void cleanup(false);
                if (call.status === "rejected" && peer?.id) {
                  void postCallLog(peer.id, mode, "missed", 0);
                }
                return;
              }
              if (call.answer_sdp && !remoteSetRef.current) {
                await pc.setRemoteDescription({
                  type: "answer",
                  sdp: String(call.answer_sdp),
                });
                remoteSetRef.current = true;
                await flushPendingIce();
                setPhaseBoth("connecting");
              }
              await applyRemoteIce(call.callee_ice);
            } catch {}
          }, 800);
        } else {
          const id = existingCallId || "";
          const offerSdp = existingOfferSdp || "";
          if (!id || !offerSdp) {
            setErr("Thiếu thông tin cuộc gọi");
            setPhaseBoth("ended");
            return;
          }
          callIdRef.current = id;
          await pc.setRemoteDescription({ type: "offer", sdp: offerSdp });
          remoteSetRef.current = true;
          await flushPendingIce();
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
          setPhaseBoth("connecting");

          pollRef.current = window.setInterval(async () => {
            try {
              const r = await fetch(`/api/chat/call?id=${encodeURIComponent(id)}`);
              const j = await r.json();
              const call = j.call;
              if (!call) return;
              if (call.status === "ended") {
                setPhaseBoth("ended");
                void cleanup(false);
                return;
              }
              await applyRemoteIce(call.caller_ice);
            } catch {}
          }, 800);
        }
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Không thể bắt đầu cuộc gọi");
        setPhaseBoth("denied");
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
    const id = window.setInterval(() => {
      setSec((s) => {
        const n = s + 1;
        secRef.current = n;
        return n;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [open, phase]);

  const hangup = async () => {
    const peerId = peer?.id;
    const wasConnected = phaseRef.current === "connected";
    const wasRinging =
      phaseRef.current === "ringing" ||
      phaseRef.current === "starting" ||
      phaseRef.current === "connecting";
    const duration = wasConnected ? secRef.current : 0;
    await cleanup(true);
    stopSharedAudio();
    setPhaseBoth("ended");
    if (peerId) {
      if (wasConnected) void postCallLog(peerId, mode, "ended", duration);
      else if (role === "caller" && wasRinging) void postCallLog(peerId, mode, "cancelled", 0);
      else if (role === "callee") void postCallLog(peerId, mode, "rejected", 0);
    }
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
      ? "Đang kết nối…"
      : phase === "ringing"
        ? "Đang đổ chuông ..."
        : phase === "connecting"
          ? "Đang kết nối…"
          : phase === "connected"
            ? `${mm}:${ss}`
            : phase === "denied"
              ? "Không truy cập được thiết bị"
              : "Đã kết thúc";

  const bg = avatarUrl(peer);
  const initial = (peer?.name || peer?.id || "?").slice(0, 1).toUpperCase();

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black text-white">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {/* Nền blur kiểu Zalo */}
      <div className="absolute inset-0 overflow-hidden">
        {bg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bg} alt="" className="w-full h-full object-cover scale-110 blur-2xl opacity-60" />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-zinc-800 to-black" />
        )}
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* Video remote full khi đã nối (video call) */}
      {mode === "video" && phase === "connected" && (
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-[1]"
        />
      )}
      {mode === "video" && (
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`absolute z-[5] rounded-xl object-cover border border-white/20 bg-black ${
            phase === "connected"
              ? "bottom-28 right-4 w-28 aspect-[3/4]"
              : "opacity-0 pointer-events-none"
          } ${camOff ? "opacity-30" : ""}`}
        />
      )}

      {/* Nội dung giữa */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {!(mode === "video" && phase === "connected") && (
          <>
            <div className="w-28 h-28 rounded-full overflow-hidden ring-2 ring-white/30 shadow-2xl bg-[#2a2e36] flex items-center justify-center">
              {bg ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bg} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-semibold text-white">{initial}</span>
              )}
            </div>
            <p className="mt-5 text-xl font-semibold drop-shadow">
              {peer?.name || peer?.id || "Cuộc gọi"}
            </p>
          </>
        )}
        {mode === "video" && phase === "connected" && (
          <p className="absolute top-10 left-0 right-0 text-center text-lg font-medium drop-shadow">
            {peer?.name || peer?.id}
          </p>
        )}
        <p className="mt-2 text-sm text-white/80 drop-shadow">{statusText}</p>
        {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
      </div>

      {/* Thanh điều khiển dưới kiểu Zalo */}
      <div
        className="relative z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 px-8"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}
      >
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <button
            type="button"
            onClick={toggleCam}
            disabled={mode !== "video"}
            className={`flex flex-col items-center gap-1 ${
              mode !== "video" ? "opacity-30" : ""
            }`}
          >
            <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center backdrop-blur">
              {camOff || mode !== "video" ? (
                <VideoOff className="w-5 h-5" />
              ) : (
                <Video className="w-5 h-5" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => void hangup()}
            className="w-16 h-16 rounded-full bg-[#e11d48] hover:bg-[#f43f5e] flex items-center justify-center shadow-lg shadow-rose-900/40"
            title="Kết thúc"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          <button type="button" onClick={toggleMute} className="flex flex-col items-center gap-1">
            <span className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center backdrop-blur">
              {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </span>
          </button>
        </div>
        <div className="flex justify-end mt-2 pr-2">
          <span className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center opacity-60">
            <Settings className="w-4 h-4" />
          </span>
        </div>
      </div>
    </div>
  );
}
