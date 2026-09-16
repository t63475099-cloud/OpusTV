"use client";

import { useEffect, useRef } from "react";

/** Nền ambient metaball — 60fps, tự hủy khi unmount */
export default function LandingCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.75);
    const t0 = performance.now();

    type Orb = { x: number; y: number; r: number; vx: number; vy: number; h: number };
    const orbs: Orb[] = [
      { x: 0.2, y: 0.25, r: 0.32, vx: 0.00012, vy: 0.00009, h: 350 },
      { x: 0.75, y: 0.3, r: 0.36, vx: -0.0001, vy: 0.00011, h: 265 },
      { x: 0.45, y: 0.7, r: 0.34, vx: 0.00008, vy: -0.00013, h: 200 },
      { x: 0.85, y: 0.75, r: 0.26, vx: -0.00009, vy: -0.00007, h: 25 },
      { x: 0.12, y: 0.65, r: 0.22, vx: 0.00011, vy: 0.00006, h: 160 },
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
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#070709";
      ctx.fillRect(0, 0, w, h);

      for (const o of orbs) {
        o.x += o.vx + Math.sin(t * 0.35 + o.h) * 0.00004;
        o.y += o.vy + Math.cos(t * 0.28 + o.h) * 0.00004;
        if (o.x < -0.15 || o.x > 1.15) o.vx *= -1;
        if (o.y < -0.15 || o.y > 1.15) o.vy *= -1;

        const px = o.x * w;
        const py = o.y * h;
        const pr = Math.max(w, h) * o.r;
        const hue = (o.h + t * 12) % 360;
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, `hsla(${hue}, 72%, 52%, 0.42)`);
        g.addColorStop(0.45, `hsla(${(hue + 30) % 360}, 60%, 40%, 0.12)`);
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
      className="pointer-events-none fixed inset-0 -z-10 opacity-50 blur-[100px] sm:opacity-40 sm:blur-[120px]"
      aria-hidden
    />
  );
}
