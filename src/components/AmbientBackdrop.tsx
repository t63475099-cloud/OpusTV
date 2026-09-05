"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/** Nền gradient — tắt hoàn toàn trên Opus Chat để tránh crash renderer */
export default function AmbientBackdrop() {
  const pathname = usePathname();
  const ref = useRef<HTMLCanvasElement>(null);
  const isChat = pathname?.startsWith("/tin-nhan");

  useEffect(() => {
    if (isChat) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1, 1.5);
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
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [isChat]);

  if (isChat) return null;
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10"
      aria-hidden
    />
  );
}
