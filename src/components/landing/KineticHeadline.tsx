"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const LAYER_A = [
  "OPUSTV",
  "CINEMA",
  "BEATS",
  "TERMINAL",
  "CHAT",
  "PASS",
  "FILM",
  "CODE",
];
const LAYER_B = [
  "NĂM VŨ TRỤ",
  "MỘT NỀN TẢNG",
  "OPUS FILM",
  "OPUS MUSIC",
  "OPUS CODE",
  "OPUS CHAT",
];

function Row({
  items,
  reverse,
  speed,
  className,
}: {
  items: string[];
  reverse?: boolean;
  speed: number;
  className?: string;
}) {
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let x = reverse ? -el.scrollWidth / 2 : 0;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(40, now - last) / 1000;
      last = now;
      x += (reverse ? speed : -speed) * dt * 40;
      const half = el.scrollWidth / 2;
      if (!reverse && x <= -half) x += half;
      if (reverse && x >= 0) x -= half;
      el.style.transform = `translate3d(${x}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reverse, speed]);

  const doubled = [...items, ...items, ...items, ...items];

  return (
    <div className={cn("overflow-hidden w-full select-none pointer-events-none", className)}>
      <div ref={track} className="flex whitespace-nowrap will-change-transform gap-8">
        {doubled.map((t, i) => (
          <span key={`${t}-${i}`} className="shrink-0 font-bold tracking-[0.2em] uppercase">
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Depth-layered kinetic marquee behind the main headline.
 * Layer 1 (far) slow + dim · Layer 2 mid · Layer 3 near reverse.
 */
export default function KineticHeadline({
  line1,
  line2,
}: {
  line1: string;
  line2: string;
}) {
  return (
    <div className="relative">
      {/* Far fog layer */}
      <div
        className="absolute inset-x-[-10%] -top-10 sm:-top-14 opacity-[0.12] blur-[1px]"
        style={{ transform: "translateZ(-80px)" }}
        aria-hidden
      >
        <Row items={LAYER_A} speed={0.55} className="text-3xl sm:text-5xl text-white/80" />
      </div>
      {/* Mid layer reverse */}
      <div
        className="absolute inset-x-[-5%] top-6 sm:top-10 opacity-[0.18]"
        aria-hidden
      >
        <Row
          items={LAYER_B}
          reverse
          speed={0.75}
          className="text-xl sm:text-3xl text-fuchsia-200/90"
        />
      </div>
      {/* Near accent */}
      <div className="absolute inset-x-0 -bottom-2 opacity-[0.14]" aria-hidden>
        <Row items={LAYER_A} speed={1.1} className="text-sm sm:text-base text-cyan-200/80" />
      </div>

      <h1 className="relative z-10 text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.08]">
        <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.55)]">{line1}</span>
        <br />
        <span className="bg-gradient-to-r from-rose-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(244,63,94,0.25)]">
          {line2}
        </span>
      </h1>
    </div>
  );
}
