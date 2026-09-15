"use client";

import { useEffect, useRef } from "react";
import GlassCard from "./GlassCard";

/** Biểu đồ cột hoạt động tuần (mock + số liệu admin) */
export default function ActivityMatrix({
  series = [12, 18, 9, 22, 15, 28, 20],
  labels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
}: {
  series?: number[];
  labels?: string[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 320;
    const h = 160;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...series, 1);
    const pad = 28;
    const gap = 8;
    const barW = (w - pad * 2 - gap * (series.length - 1)) / series.length;

    // grid
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const y = pad + ((h - pad * 2) * i) / 3;
      ctx.beginPath();
      ctx.moveTo(pad, y);
      ctx.lineTo(w - pad, y);
      ctx.stroke();
    }

    series.forEach((v, i) => {
      const bh = ((h - pad * 2) * v) / max;
      const x = pad + i * (barW + gap);
      const y = h - pad - bh;
      const grd = ctx.createLinearGradient(x, y, x, h - pad);
      grd.addColorStop(0, "rgba(56,189,248,0.85)");
      grd.addColorStop(1, "rgba(139,92,246,0.35)");
      ctx.fillStyle = grd;
      // rounded bar
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + barW, y, x + barW, y + bh, r);
      ctx.arcTo(x + barW, h - pad, x, h - pad, r);
      ctx.arcTo(x, h - pad, x, y, r);
      ctx.arcTo(x, y, x + barW, y, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(161,161,170,0.9)";
      ctx.font = "10px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(labels[i] || "", x + barW / 2, h - 10);
    });
  }, [series, labels]);

  return (
    <GlassCard className="p-5" hover={false}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Hoạt động 7 ngày</h3>
        <span className="text-[10px] text-zinc-500">Người dùng / phiên (ước lượng)</span>
      </div>
      <canvas ref={ref} className="w-full h-40" />
      <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-zinc-500">
        <span className="inline-flex items-center gap-1">
          <i className="w-2 h-2 rounded-full bg-sky-400" /> Phim
        </span>
        <span className="inline-flex items-center gap-1">
          <i className="w-2 h-2 rounded-full bg-violet-400" /> Chat / Code / Nhạc
        </span>
      </div>
    </GlassCard>
  );
}
