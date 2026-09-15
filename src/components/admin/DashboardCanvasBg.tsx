"use client";

import { useEffect, useRef } from "react";

type Blob = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  c: string;
};

/** Nền canvas gradient blobs chuyển động chậm */
export default function DashboardCanvasBg() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const blobs: Blob[] = [
      { x: 0.2, y: 0.3, r: 0.28, vx: 0.00015, vy: 0.00012, c: "rgba(139,92,246,0.45)" },
      { x: 0.75, y: 0.25, r: 0.32, vx: -0.00012, vy: 0.0001, c: "rgba(244,63,94,0.35)" },
      { x: 0.5, y: 0.7, r: 0.3, vx: 0.0001, vy: -0.00014, c: "rgba(56,189,248,0.32)" },
      { x: 0.15, y: 0.75, r: 0.22, vx: 0.00008, vy: -0.00009, c: "rgba(234,179,8,0.2)" },
    ];

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#0a0a0c";
      ctx.fillRect(0, 0, w, h);
      for (const b of blobs) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x < -0.1 || b.x > 1.1) b.vx *= -1;
        if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;
        const gx = b.x * w;
        const gy = b.y * h;
        const gr = Math.max(w, h) * b.r;
        const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        g.addColorStop(0, b.c);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 opacity-60 blur-[100px]"
      aria-hidden
    />
  );
}
