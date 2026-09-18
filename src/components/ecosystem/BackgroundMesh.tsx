"use client";

import { useEffect, useRef } from "react";

/**
 * Organic mesh / aurora backdrop — HyperOS-inspired, CSS + canvas noise, 60fps budget.
 */
export default function BackgroundMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(1.5, window.devicePixelRatio || 1);
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = "100%";
      c.style.height = "100%";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const blobs = [
      { x: 0.2, y: 0.25, r: 0.35, color: [0, 200, 255], phase: 0 },
      { x: 0.75, y: 0.3, r: 0.32, color: [168, 85, 247], phase: 1.2 },
      { x: 0.5, y: 0.75, r: 0.4, color: [236, 72, 153], phase: 2.4 },
      { x: 0.15, y: 0.7, r: 0.28, color: [56, 189, 248], phase: 3.1 },
    ];

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      t += reduce ? 0.004 : 0.008;
      for (const b of blobs) {
        const ox = Math.sin(t * 0.7 + b.phase) * 0.08;
        const oy = Math.cos(t * 0.55 + b.phase * 1.3) * 0.07;
        const x = (b.x + ox) * w;
        const y = (b.y + oy) * h;
        const radius = b.r * Math.min(w, h) * (1 + Math.sin(t + b.phase) * 0.08);
        const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const [r, gch, bl] = b.color;
        g.addColorStop(0, `rgba(${r},${gch},${bl},0.28)`);
        g.addColorStop(0.45, `rgba(${r},${gch},${bl},0.08)`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(165deg, #07070c 0%, #0a0e18 40%, #0b1220 100%)",
        }}
      />
      <canvas ref={canvasRef} className="absolute inset-0 opacity-90" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backdropFilter: "blur(80px) saturate(180%)",
          WebkitBackdropFilter: "blur(80px) saturate(180%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />
    </div>
  );
}
