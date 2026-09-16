"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Light parallax on scroll — apply to dashboard mock / section banners */
export default function ParallaxBanner({
  children,
  className,
  strength = 24,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const mid = r.top + r.height / 2 - window.innerHeight / 2;
      const y = Math.max(-strength, Math.min(strength, -mid * 0.06));
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [strength]);

  return (
    <div
      ref={ref}
      className={cn("will-change-transform transition-transform duration-500 ease-out", className)}
    >
      {children}
    </div>
  );
}
