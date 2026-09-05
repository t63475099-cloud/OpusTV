"use client";

import { useEffect, useRef } from "react";

/** Nền canvas nhẹ — orbs + noise mesh cho Opus Chat */
export default function ChatCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 2);
    const t0 = performance.now();

    const orbs = [
      { x: 0.15, y: 0.2, r: 0.28, h: 350, s: 0.12 },
      { x: 0.85, y: 0.35, r: 0.22, h: 250, s: 0.1 },
      { x: 0.5, y: 0.85, r: 0.3, h: 200, s: 0.08 },
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
    resize();
    window.addEventListener("resize", resize);

    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#07070c";
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < orbs.length; i++) {
        const o = orbs[i];
        const cx = w * (o.x + 0.04 * Math.sin(t * 0.35 + i * 1.7));
        const cy = h * (o.y + 0.05 * Math.cos(t * 0.28 + i));
        const rad = Math.min(w, h) * o.r;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
        const hue = (o.h + t * 8) % 360;
        g.addColorStop(0, `hsla(${hue}, 75%, 55%, ${o.s})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      // soft vignette
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
      vg.addColorStop(0, "transparent");
      vg.addColorStop(1, "rgba(0,0,0,0.35)");
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    };
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
