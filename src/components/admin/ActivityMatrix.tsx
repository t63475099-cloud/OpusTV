"use client";

import { useEffect, useRef } from "react";
import GlassCard from "./GlassCard";

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
    const w = canvas.clientWidth || 360;
    const h = 180;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const max = Math.max(...series, 1);
    const padX = 20;
    const padY = 24;
    const gap = 10;
    const barW = (w - padX * 2 - gap * (series.length - 1)) / series.length;

    for (let i = 0; i < 4; i++) {
      const y = padY + ((h - padY * 2) * i) / 3;
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.stroke();
    }

    series.forEach((v, i) => {
      const bh = ((h - padY * 2) * v) / max;
      const x = padX + i * (barW + gap);
      const y = h - padY - bh;
      const grd = ctx.createLinearGradient(x, y, x, h - padY);
      grd.addColorStop(0, "rgba(244,63,94,0.95)");
      grd.addColorStop(0.55, "rgba(168,85,247,0.65)");
      grd.addColorStop(1, "rgba(56,189,248,0.25)");
      ctx.fillStyle = grd;
      const r = 8;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + barW, y, x + barW, y + bh, r);
      ctx.arcTo(x + barW, h - padY, x, h - padY, r);
      ctx.arcTo(x, h - padY, x, y, r);
      ctx.arcTo(x, y, x + barW, y, r);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(161,161,170,0.95)";
      ctx.font = "600 11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(labels[i] || "", x + barW / 2, h - 8);
    });
  }, [series, labels]);

  return (
    <GlassCard className="p-5 sm:p-6" hover={false} accent="sky">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Hoạt động 7 ngày</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Phiên / người dùng (ước lượng theo tài khoản)
          </p>
        </div>
        <div className="flex gap-3 text-[10px] text-zinc-500">
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Phim
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-violet-400" /> Chat · Code · Nhạc
          </span>
        </div>
      </div>
      <canvas ref={ref} className="w-full h-[180px]" />
    </GlassCard>
  );
}
