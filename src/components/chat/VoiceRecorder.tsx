"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Send, Trash2 } from "lucide-react";
import type { ChatAttachment } from "@/lib/chatStore";

function uid() {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export default function VoiceRecorder({
  onSend,
}: {
  onSend: (att: ChatAttachment) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [secs, setSecs] = useState(0);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearInterval(timer.current);
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      try {
        mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
      } catch {}
    };
  }, [blobUrl]);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunks.current, { type: mr.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        const reader = new FileReader();
        reader.onload = () => setDataUrl(String(reader.result || ""));
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.current = mr;
      mr.start();
      setRecording(true);
      setSecs(0);
      timer.current = window.setInterval(() => setSecs((s) => s + 1), 1000);
    } catch {
      alert("Không truy cập được micro");
    }
  }

  function stop() {
    if (timer.current) window.clearInterval(timer.current);
    mediaRef.current?.stop();
    setRecording(false);
  }

  function discard() {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    setDataUrl(null);
    setSecs(0);
  }

  function send() {
    if (!dataUrl) return;
    onSend({
      id: uid(),
      type: "audio",
      url: dataUrl,
      name: `voice-${Date.now()}.webm`,
      duration: secs,
      mime: "audio/webm",
    });
    discard();
  }

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  if (blobUrl) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800">
        <audio src={blobUrl} controls className="h-8 max-w-[140px]" />
        <span className="text-[11px] text-zinc-400 tabular-nums">
          {mm}:{ss}
        </span>
        <button type="button" onClick={discard} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400">
          <Trash2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={send} className="p-1.5 rounded-full bg-rose-600 text-white">
          <Send className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (recording) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30">
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-xs text-rose-300 tabular-nums">
          {mm}:{ss}
        </span>
        <button type="button" onClick={stop} className="p-1.5 rounded-full bg-rose-600 text-white">
          <Square className="w-3.5 h-3.5 fill-white" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void start()}
      className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
      title="Ghi âm"
    >
      <Mic className="w-5 h-5" />
    </button>
  );
}
