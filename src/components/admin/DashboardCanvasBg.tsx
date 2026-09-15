"use client";

import { useEffect, useRef } from "react";

/** Nền ambient giống trang chủ — hue trôi chậm + orbs */
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
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const t0 = performance.now();
    const orbs = [
      { x: 0.18, y: 0.22, r: 0.35, s: 0.22, hue: 350 },
      { x: 0.78, y: 0.28, r: 0.4, s: 0.18, hue: 265 },
      { x: 0.45, y: 0.75, r: 0.38, s: 0.2, hue: 200 },
      { x: 0.88, y: 0.72, r: 0.28, s: 0.15, hue: 25 },
    ];

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      const base = (t * 3.2) % 360;
      ctx.clearRect(0, 0, w, h);
      const bg = ctx.createLinearGradient(0, 0, w, h);
      bg.addColorStop(0, `hsla(${base}, 28%, 6%, 1)`);
      bg.addColorStop(0.45, `hsla(${(base + 35) % 360}, 22%, 5%, 1)`);
      bg.addColorStop(1, `hsla(${(base + 70) % 360}, 26%, 6%, 1)`);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      for (const o of orbs) {
        const px = (o.x + Math.sin(t * o.s) * 0.04) * w;
        const py = (o.y + Math.cos(t * o.s * 0.9) * 0.05) * h;
        const pr = Math.max(w, h) * o.r;
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, `hsla(${(o.hue + t * 8) % 360}, 70%, 48%, 0.28)`);
        g.addColorStop(0.55, `hsla(${(o.hue + 20) % 360}, 55%, 35%, 0.08)`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
    />
  );
}
