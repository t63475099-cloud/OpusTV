"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SESSION_KEY = "opus-preloader-v3";

type Props = {
  oncePerSession?: boolean;
  maxWaitMs?: number;
  onComplete?: () => void;
};

/**
 * iOS-style centered loader — thin ring + label, always completes.
 */
export default function OpusPreloader({
  oncePerSession = true,
  maxWaitMs = 2400,
  onComplete,
}: Props) {
  const [active, setActive] = useState(true);
  const [pct, setPct] = useState(0);
  const done = useRef(false);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setPct(100);
    try {
      if (oncePerSession) sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* */
    }
    window.setTimeout(() => {
      setActive(false);
      document.documentElement.classList.remove("opus-preloading");
      onComplete?.();
    }, 280);
  }, [onComplete, oncePerSession]);

  useEffect(() => {
    try {
      if (oncePerSession && sessionStorage.getItem(SESSION_KEY) === "1") {
        setActive(false);
        onComplete?.();
        return;
      }
    } catch {
      /* */
    }

    document.documentElement.classList.add("opus-preloading");
    done.current = false;
    let cancelled = false;
    let current = 0;
    const start = performance.now();
    let raf = 0;

    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - start;
      const target = Math.min(100, (elapsed / maxWaitMs) * 100);
      current += (target - current) * 0.18;
      if (elapsed >= maxWaitMs) current = 100;
      setPct(Math.round(current));
      if (current >= 99.5) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onLoad = () => {
      /* accelerate slightly when DOM ready */
    };
    window.addEventListener("load", onLoad);
    const hard = window.setTimeout(finish, maxWaitMs + 400);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(hard);
      window.removeEventListener("load", onLoad);
      document.documentElement.classList.remove("opus-preloading");
    };
  }, [finish, maxWaitMs, oncePerSession, onComplete]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-xl"
      style={{ transition: "opacity 0.28s ease" }}
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4">
        {/* iOS activity-style spinner */}
        <div className="relative w-10 h-10">
          <svg className="w-10 h-10 animate-spin" viewBox="0 0 40 40" fill="none">
            <circle
              cx="20"
              cy="20"
              r="16"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="3"
            />
            <path
              d="M36 20a16 16 0 0 0-16-16"
              stroke="rgba(255,255,255,0.92)"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <p className="text-[13px] text-white/70 font-medium tracking-wide">
          Đang tải…
        </p>
        <div className="w-28 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/80"
            style={{
              width: `${pct}%`,
              transition: "width 0.15s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
