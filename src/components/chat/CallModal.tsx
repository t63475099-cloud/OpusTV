"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Video, VideoOff, Settings } from "lucide-react";
import type { ChatUser } from "@/lib/chatStore";
import { startCallSound } from "@/lib/callSounds";
import { postCallLog } from "@/lib/callLog";

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:80?transport=tcp",
      "turn:openrelay.metered.ca:443",
      "turns:openrelay.metered.ca:443",
    ],
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

function normalizeIceList(raw: unknown): RTCIceCandidateInit[] {
  if (!raw) return [];
  let list: unknown = raw;
  if (typeof raw === "string") {
    try {
      list = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(list)) return [];
  return list.filter((c) => c && typeof c === "object") as RTCIceCandidateInit[];
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
  const localIceBufRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const answerAppliedRef = useRef(false);
  const connectedRef = useRef(false);
  const pollRef = useRef<number | null>(null);
  const soundStopRef = useRef<(() => void) | null>(null);
  const phaseRef = useRef<Phase>("starting");
  const secRef = useRef(0);

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(mode === "audio");
  const [sec, setSec] = useState(0);
  const [phase, setPhase] = useState<Phase>("starting");
  const [err, setErr] = useState<string | null>(null);

  const setPhaseBoth = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const markConnected = useCallback(() => {
    if (connectedRef.current) return;
    connectedRef.current = true;
    phaseRef.current = "connected";
    setPhase("connected");
    soundStopRef.current?.();
    soundStopRef.current = null;
  }, []);

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
      } catch {
        /* */
      }
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
        } catch {
          /* */
        }
      }
      callIdRef.current = null;
      seenIceRef.current = new Set();
      pendingIceRef.current = [];
      localIceBufRef.current = [];
      remoteDescSetRef.current = false;
      answerAppliedRef.current = false;
      connectedRef.current = false;
    },
    [stopSound]
  );

  const pushIce = useCallback(async (init: RTCIceCandidateInit) => {
    const id = callIdRef.current;
    if (!id || !init?.candidate) return;
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ice", id, candidate: init }),
      });
    } catch {
      /* */
    }
  }, []);

  const flushPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !remoteDescSetRef.current) return;
    const pending = [...pendingIceRef.current];
    pendingIceRef.current = [];
    for (const c of pending) {
      const key = JSON.stringify(c);
      if (seenIceRef.current.has(key)) continue;
      seenIceRef.current.add(key);
      try {
        await pc.addIceCandidate(c);
      } catch {
        /* */
      }
    }
  }, []);

  const applyRemoteIce = useCallback(async (list: unknown) => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const init of normalizeIceList(list)) {
      const key = JSON.stringify(init);
      if (seenIceRef.current.has(key)) continue;
      if (!remoteDescSetRef.current) {
        pendingIceRef.current.push(init);
        continue;
      }
      seenIceRef.current.add(key);
      try {
        await pc.addIceCandidate(init);
      } catch {
        /* */
      }
    }
  }, []);

  /** Gửi lại toàn bộ ICE local (sau khi có remote description) */
  const resendLocalIce = useCallback(async () => {
    for (const c of localIceBufRef.current) {
      await pushIce(c);
    }
  }, [pushIce]);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = false;
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
      connectedRef.current = false;
      remoteDescSetRef.current = false;
      answerAppliedRef.current = false;
      seenIceRef.current = new Set();
      pendingIceRef.current = [];
      localIceBufRef.current = [];

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
          video:
            mode === "video"
              ? { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }
              : false,
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

        const pc = new RTCPeerConnection({
          iceServers: ICE_SERVERS,
          iceCandidatePoolSize: 16,
        });
        pcRef.current = pc;

        // sendrecv rõ ràng — tránh một chiều
        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          pc.addTransceiver(audioTrack, { direction: "sendrecv" });
        } else {
          pc.addTransceiver("audio", { direction: "sendrecv" });
        }
        if (mode === "video") {
          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            pc.addTransceiver(videoTrack, { direction: "sendrecv" });
          } else {
            pc.addTransceiver("video", { direction: "sendrecv" });
          }
        }

        pc.onicecandidate = (ev) => {
          if (!ev.candidate) return;
          const init = ev.candidate.toJSON();
          localIceBufRef.current.push(init);
          void pushIce(init);
        };

        const onMaybeConnected = () => {
          const cs = pc.connectionState;
          const ics = pc.iceConnectionState;
          if (cs === "connected" || ics === "connected" || ics === "completed") {
            markConnected();
          }
          if (cs === "failed" || ics === "failed") {
            setErr("Kết nối thất bại — thử lại hoặc đổi mạng");
          }
          if (cs === "closed") setPhaseBoth("ended");
        };

        pc.onconnectionstatechange = onMaybeConnected;
        pc.oniceconnectionstatechange = onMaybeConnected;

        pc.ontrack = (ev) => {
          const remote = ev.streams[0] || new MediaStream([ev.track]);
          attachRemoteStream(remote);
          markConnected();
        };

        const pollCall = (id: string) => {
          if (pollRef.current) window.clearInterval(pollRef.current);

          const tick = async () => {
            if (cancelled || !pcRef.current) return;
            try {
              const r = await fetch(`/api/chat/call?id=${encodeURIComponent(id)}`, {
                cache: "no-store",
              });
              const j = await r.json();
              const call = j.call as Record<string, unknown> | null;
              if (!call) return;

              const status = String(call.status || "");
              if (status === "rejected" || status === "ended") {
                setPhaseBoth("ended");
                setErr(status === "rejected" ? "Đối phương từ chối" : "Cuộc gọi kết thúc");
                void cleanup(false);
                if (status === "rejected" && peer?.id) {
                  void postCallLog(peer.id, mode, "missed", 0);
                }
                return;
              }

              if (role === "caller") {
                const answerSdp = call.answer_sdp ? String(call.answer_sdp) : "";
                if (
                  answerSdp &&
                  !answerAppliedRef.current &&
                  pcRef.current.signalingState !== "closed"
                ) {
                  try {
                    await pcRef.current.setRemoteDescription({
                      type: "answer",
                      sdp: answerSdp,
                    });
                    answerAppliedRef.current = true;
                    remoteDescSetRef.current = true;
                    await flushPendingIce();
                    await resendLocalIce();
                    if (phaseRef.current !== "connected") {
                      setPhaseBoth("connecting");
                      stopSound();
                    }
                  } catch (e) {
                    console.warn("[call] answer SDP", e);
                  }
                }
                await applyRemoteIce(call.callee_ice);
              } else {
                await applyRemoteIce(call.caller_ice);
              }
              onMaybeConnected();
            } catch {
              /* */
            }
          };

          void tick();
          pollRef.current = window.setInterval(() => void tick(), 350);
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
          pollCall(id);
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
          remoteDescSetRef.current = true;
          await flushPendingIce();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          // Gửi ICE đã có + sẽ gửi tiếp qua onicecandidate
          await resendLocalIce();
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
          pollCall(id);
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
  }, [open, mode, role, existingCallId, existingOfferSdp, peer?.id]);

  useEffect(() => {
    if (phase !== "connected") return;
    secRef.current = 0;
    setSec(0);
    const t = window.setInterval(() => {
      secRef.current += 1;
      setSec(secRef.current);
    }, 1000);
    return () => window.clearInterval(t);
  }, [phase]);

  const hangup = async () => {
    const duration = secRef.current;
    const wasConnected = connectedRef.current || phaseRef.current === "connected";
    const peerId = peer?.id;
    await cleanup(true);
    setPhaseBoth("ended");
    if (peerId) {
      void postCallLog(
        peerId,
        mode,
        wasConnected ? "ended" : role === "caller" ? "cancelled" : "ended",
        wasConnected ? duration : 0
      );
    }
    window.setTimeout(() => onClose(), 400);
  };

  const toggleMute = () => {
    const s = localStreamRef.current;
    if (!s) return;
    s.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMuted((m) => !m);
  };

  const toggleCam = () => {
    if (mode !== "video") return;
    const s = localStreamRef.current;
    if (!s) return;
    s.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOff((c) => !c);
  };

  if (!open) return null;

  const statusText =
    phase === "starting"
      ? "Đang chuẩn bị…"
      : phase === "ringing"
        ? "Đang đổ chuông…"
        : phase === "connecting"
          ? "Đang kết nối…"
          : phase === "connected"
            ? `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
            : phase === "denied"
              ? "Không có quyền micro/camera"
              : "Đã kết thúc";

  const bg = avatarUrl(peer);
  const initial = (peer?.name || peer?.id || "?").slice(0, 1).toUpperCase();

  return (
    <div className="fixed inset-0 z-[220] flex flex-col bg-black text-white">
      <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

      {bg && (
        <div
          className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
          style={{ backgroundImage: `url(${bg})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black" />

      {mode === "video" && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              phase === "connected" ? "opacity-100" : "opacity-0"
            }`}
          />
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute right-3 bottom-28 w-28 h-40 sm:w-36 sm:h-52 object-cover rounded-xl border border-white/20 shadow-lg z-10 bg-black/40"
          />
        </>
      )}

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {(mode === "audio" || phase !== "connected") && (
          <>
            <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl bg-zinc-800 flex items-center justify-center">
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
        {err && <p className="mt-2 text-xs text-red-300 text-center max-w-xs">{err}</p>}
      </div>

      <div
        className="relative z-10 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 px-8"
        style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.75))" }}
      >
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <button
            type="button"
            onClick={toggleCam}
            disabled={mode !== "video"}
            className={`flex flex-col items-center gap-1 ${mode !== "video" ? "opacity-30" : ""}`}
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
