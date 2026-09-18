"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const PHRASES = [
  "OPUS FILM",
  "OPUS MUSIC",
  "OPUS CODE",
  "OPUS CHAT",
  "OPUS PASS",
  "ECOSYSTEM",
];

/**
 * Infinite mid-ground ticker with accordion (push-pull) depth on each token.
 * Scroll velocity modulates wave amplitude — no absolute overlap with cards.
 */
export default function KineticMarquee({ className }: { className?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const vel = useRef(0);
  const lastY = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let x = 0;
    let raf = 0;
    let last = performance.now();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onScroll = () => {
      const y = window.scrollY;
      vel.current = Math.min(2.5, Math.abs(y - lastY.current) * 0.08);
      lastY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const tokens = () =>
      Array.from(track.querySelectorAll<HTMLElement>("[data-token]"));

    const tick = (now: number) => {
      const dt = Math.min(40, now - last) / 1000;
      last = now;
      if (!reduce) {
        x -= (38 + vel.current * 40) * dt;
        const half = track.scrollWidth / 2;
        if (x <= -half) x += half;
        track.style.transform = `translate3d(${x}px,0,0)`;

        const amp = 0.12 + vel.current * 0.08;
        const time = now * 0.002;
        tokens().forEach((el, i) => {
          const wave = Math.sin(time + i * 0.55);
          const scale = 1 + wave * amp;
          const op = 0.35 + (wave * 0.5 + 0.5) * 0.55;
          el.style.transform = `scale(${scale}) translateZ(0)`;
          el.style.opacity = String(op);
        });
        vel.current *= 0.92;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const row = [...PHRASES, ...PHRASES, ...PHRASES, ...PHRASES];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden py-3 select-none pointer-events-none",
        "border-y border-white/[0.06] bg-white/[0.02]",
        className
      )}
      aria-hidden
    >
      <div
        ref={trackRef}
        className="flex w-max gap-8 sm:gap-12 will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        {row.map((t, i) => (
          <span
            key={`${t}-${i}`}
            data-token
            className="shrink-0 text-2xl sm:text-4xl md:text-5xl font-bold tracking-[0.12em] uppercase text-white/80 will-change-transform"
            style={{ opacity: 0.5 }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
