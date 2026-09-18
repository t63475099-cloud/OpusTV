"use client";

import { useEffect, useRef } from "react";

/**
 * Organic aurora mesh — HyperOS-inspired radial blobs + pointer reactive rim.
 */
export default function BackgroundMesh() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0.5, y: 0.4 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let t = 0;

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

    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX / Math.max(1, w);
      pointer.current.y = e.clientY / Math.max(1, h);
    };

    const blobs = [
      { c: [0, 240, 255], r: 0.38, ox: 0.2, oy: 0.25, sp: 0.31 },
      { c: [121, 40, 202], r: 0.42, ox: 0.75, oy: 0.35, sp: 0.22 },
      { c: [255, 0, 85], r: 0.32, ox: 0.45, oy: 0.7, sp: 0.27 },
      { c: [7, 7, 9], r: 0.5, ox: 0.55, oy: 0.15, sp: 0.18 },
    ];

    const draw = () => {
      t += 0.0045;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#070709";
      ctx.fillRect(0, 0, w, h);

      const px = pointer.current.x;
      const py = pointer.current.y;

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        const nx = b.ox + Math.sin(t * b.sp + i * 1.7) * 0.12 + (px - 0.5) * 0.06;
        const ny = b.oy + Math.cos(t * b.sp * 0.9 + i) * 0.1 + (py - 0.5) * 0.05;
        const radius = Math.max(w, h) * b.r;
        const g = ctx.createRadialGradient(
          nx * w,
          ny * h,
          0,
          nx * w,
          ny * h,
          radius
        );
        const [r, gch, bl] = b.c;
        g.addColorStop(0, `rgba(${r},${gch},${bl},0.55)`);
        g.addColorStop(0.45, `rgba(${r},${gch},${bl},0.18)`);
        g.addColorStop(1, "rgba(7,7,9,0)");
        ctx.globalCompositeOperation = i === 3 ? "source-over" : "lighter";
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(nx * w, ny * h, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 -z-10"
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-80"
        style={{
          backdropFilter: "blur(80px) saturate(180%)",
          WebkitBackdropFilter: "blur(80px) saturate(180%)",
        }}
        aria-hidden
      />
    </>
  );
}
