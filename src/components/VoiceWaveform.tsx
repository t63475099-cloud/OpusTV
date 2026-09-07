"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface VoiceWaveformProps {
  active: boolean;
  className?: string;
  height?: number;
  stream?: MediaStream | null;
}

export default function VoiceWaveform({
  active,
  className,
  height = 72,
  stream: externalStream = null,
}: VoiceWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const audioRef = useRef<{
    ctx: AudioContext;
    analyser: AnalyserNode;
    source: MediaStreamAudioSourceNode;
    ownStream: boolean;
    stream: MediaStream;
  } | null>(null);
  const smoothRef = useRef(0.15);

  useEffect(() => {
    let cancelled = false;

    const stopAudio = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      const a = audioRef.current;
      if (a) {
        try {
          a.source.disconnect();
          a.analyser.disconnect();
          if (a.ownStream) a.stream.getTracks().forEach((t) => t.stop());
          void a.ctx.close();
        } catch {
          /* ignore */
        }
        audioRef.current = null;
      }
    };

    const bindStream = async (stream: MediaStream, own: boolean) => {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch {
          /* ignore */
        }
      }
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.72;
      source.connect(analyser);
      audioRef.current = { ctx, analyser, source, ownStream: own, stream };
    };

    const start = async () => {
      stopAudio();
      if (!active || cancelled) return;
      try {
        if (externalStream && externalStream.active) {
          await bindStream(externalStream, false);
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        await bindStream(stream, true);
      } catch {
        audioRef.current = null;
      }
    };

    void start();
    return () => {
      cancelled = true;
      stopAudio();
    };
  }, [active, externalStream]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !active) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const levels = new Float32Array(128);

    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let t = 0;
    const ribbons = [
      { hue: 300, amp: 1.0, phase: 0, speed: 1.1, thick: 2.2 },
      { hue: 180, amp: 0.85, phase: 1.2, speed: 0.9, thick: 2.0 },
      { hue: 260, amp: 0.7, phase: 2.4, speed: 1.3, thick: 1.6 },
      { hue: 200, amp: 0.55, phase: 0.6, speed: 0.75, thick: 1.4 },
    ];

    const draw = () => {
      t += 0.016;
      ctx.clearRect(0, 0, w, h);

      let energy = 0.12;
      const a = audioRef.current;
      if (a) {
        a.analyser.getFloatFrequencyData(levels as any);
        let sum = 0;
        for (let i = 2; i < 48; i++) {
          const v = (levels[i] + 100) / 70;
          sum += Math.max(0, Math.min(1, v));
        }
        energy = Math.max(0.08, Math.min(1, sum / 28));
      } else {
        energy = 0.12 + 0.06 * Math.sin(t * 2.2);
      }
      smoothRef.current += (energy - smoothRef.current) * 0.18;
      const e = smoothRef.current;
      const mid = h * 0.5;

      const baseGrad = ctx.createLinearGradient(0, 0, w, 0);
      baseGrad.addColorStop(0, "rgba(0,255,255,0)");
      baseGrad.addColorStop(0.2, "rgba(0,255,255,0.35)");
      baseGrad.addColorStop(0.5, "rgba(255,0,200,0.45)");
      baseGrad.addColorStop(0.8, "rgba(0,255,220,0.35)");
      baseGrad.addColorStop(1, "rgba(0,255,255,0)");
      ctx.strokeStyle = baseGrad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, mid);
      ctx.lineTo(w, mid);
      ctx.stroke();

      for (const rib of ribbons) {
        const amp = (8 + e * 28) * rib.amp;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const nx = x / w;
          const wave =
            Math.sin(nx * Math.PI * 4 + t * rib.speed * 3 + rib.phase) *
              amp *
              (0.35 + 0.65 * Math.sin(nx * Math.PI)) +
            Math.sin(nx * Math.PI * 7 + t * rib.speed * 2.1 + rib.phase * 1.4) *
              amp *
              0.35 *
              e;
          const y = mid + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, `hsla(${rib.hue}, 100%, 60%, 0)`);
        g.addColorStop(0.25, `hsla(${rib.hue}, 100%, 62%, ${0.35 + e * 0.45})`);
        g.addColorStop(0.5, `hsla(${(rib.hue + 40) % 360}, 100%, 65%, ${0.5 + e * 0.4})`);
        g.addColorStop(0.75, `hsla(${rib.hue}, 100%, 60%, ${0.35 + e * 0.45})`);
        g.addColorStop(1, `hsla(${rib.hue}, 100%, 60%, 0)`);
        ctx.strokeStyle = g;
        ctx.lineWidth = rib.thick + e * 1.5;
        ctx.lineCap = "round";
        ctx.shadowColor = `hsla(${rib.hue}, 100%, 60%, 0.55)`;
        ctx.shadowBlur = 12 + e * 18;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [active]);

  if (!active) return null;

  return (
    <div
      className={cn(
        "pointer-events-none flex w-full items-center justify-center overflow-hidden",
        className
      )}
      aria-hidden
    >
      <canvas ref={canvasRef} className="block w-full max-w-md" style={{ height }} />
    </div>
  );
}
