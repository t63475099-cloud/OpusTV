"use client";

import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  onInspect?: () => void;
};

/**
 * DOM glass card with 3D tilt (quaternion-style lerp via CSS transform).
 * Micro-interaction: click expands inspect ring.
 */
export default function TiltGlassCard({ children, className, onInspect }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [inspect, setInspect] = useState(false);
  const rot = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  const tick = () => {
    const el = ref.current;
    if (!el) return;
    rot.current.x += (target.current.x - rot.current.x) * 0.12;
    rot.current.y += (target.current.y - rot.current.y) * 0.12;
    el.style.transform = `perspective(900px) rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg) scale(${inspect ? 1.03 : 1})`;
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-3xl border border-white/[0.1] bg-white/[0.04] backdrop-blur-2xl",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.16)] shadow-2xl shadow-black/50",
        "transition-shadow duration-500 will-change-transform",
        inspect && "ring-1 ring-rose-400/50 shadow-[0_0_40px_rgba(244,63,94,0.25)]",
        className
      )}
      onMouseEnter={() => {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(tick);
      }}
      onMouseLeave={() => {
        target.current = { x: 0, y: 0 };
      }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        target.current.y = px * 12;
        target.current.x = -py * 10;
      }}
      onClick={() => {
        setInspect((v) => !v);
        onInspect?.();
      }}
    >
      {/* HUD inspection lines */}
      {inspect && (
        <div className="pointer-events-none absolute inset-3 border border-dashed border-cyan-400/30 rounded-2xl">
          <span className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-300/80" />
          <span className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-300/80" />
          <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-cyan-300/80" />
          <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-300/80" />
        </div>
      )}
      {children}
    </div>
  );
}
