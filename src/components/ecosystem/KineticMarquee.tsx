"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const ITEMS = [
  "OPUS FILM",
  "OPUS MUSIC",
  "OPUS CODE",
  "OPUS CHAT",
  "OPUS PASS",
  "CLOUD TERMINAL",
];

type Props = { className?: string };

/**
 * Infinite horizontal marquee with sin-wave Z depth (scale + opacity).
 * Scroll velocity slightly speeds the track.
 */
export default function KineticMarquee({ className }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0);
  const velocity = useRef(0.35);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    let lastScroll = window.scrollY;
    let lastT = performance.now();

    const onScroll = () => {
      const now = performance.now();
      const dy = Math.abs(window.scrollY - lastScroll);
      const dt = Math.max(16, now - lastT);
      const v = Math.min(1.8, dy / dt);
      velocity.current = 0.35 + v * 1.2;
      lastScroll = window.scrollY;
      lastT = now;
    };

    const tick = () => {
      offset.current -= velocity.current;
      const half = track.scrollWidth / 2;
      if (half > 0 && Math.abs(offset.current) >= half) {
        offset.current += half;
      }
      track.style.transform = `translate3d(${offset.current}px,0,0)`;

      const spans = track.querySelectorAll<HTMLElement>("[data-marquee-item]");
      const mid = window.innerWidth / 2;
      spans.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const dist = Math.abs(cx - mid) / mid;
        const depth = 1 - Math.min(1, dist);
        const scale = 0.82 + depth * 0.28;
        const opacity = 0.28 + depth * 0.72;
        el.style.transform = `scale(${scale}) translateZ(${depth * 24}px)`;
        el.style.opacity = String(opacity);
        el.style.filter = depth > 0.55 ? "brightness(1.15)" : "brightness(0.85)";
      });

      // damp velocity back to base
      velocity.current += (0.35 - velocity.current) * 0.04;
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const row = [...ITEMS, ...ITEMS, ...ITEMS, ...ITEMS];

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden py-3 select-none",
        "border-y border-white/[0.06] bg-black/20 backdrop-blur-md",
        className
      )}
      style={{ perspective: "600px" }}
      aria-hidden
    >
      <div
        ref={trackRef}
        className="flex w-max items-center gap-8 sm:gap-12 will-change-transform"
        style={{ transformStyle: "preserve-3d" }}
      >
        {row.map((text, i) => (
          <span
            key={`${text}-${i}`}
            data-marquee-item
            className="shrink-0 text-sm sm:text-base md:text-lg font-semibold tracking-[0.18em] text-white whitespace-nowrap transition-[filter] duration-300"
          >
            {text}
            <span className="mx-4 sm:mx-6 text-zinc-600">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
