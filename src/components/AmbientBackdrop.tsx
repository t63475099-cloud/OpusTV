"use client";

import { useEffect, useRef } from "react";

/** Nền gradient chuyển màu theo thời gian + đốm sáng mờ */
export default function AmbientBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const t0 = performance.now();

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
      const hue = (t * 4) % 360;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsla(${hue}, 35%, 8%, 1)`);
      g.addColorStop(0.5, `hsla(${(hue + 40) % 360}, 30%, 6%, 1)`);
      g.addColorStop(1, `hsla(${(hue + 80) % 360}, 28%, 7%, 1)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 4; i++) {
        const cx = w * (0.2 + 0.2 * i + 0.05 * Math.sin(t * 0.3 + i));
        const cy = h * (0.25 + 0.15 * Math.cos(t * 0.25 + i * 1.2));
        const r = Math.min(w, h) * (0.22 + 0.04 * Math.sin(t * 0.4 + i));
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, `hsla(${(hue + i * 50) % 360}, 70%, 45%, 0.14)`);
        rg.addColorStop(1, "transparent");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
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
      className="pointer-events-none fixed inset-0 -z-10 opacity-90"
      aria-hidden
    />
  );
}
