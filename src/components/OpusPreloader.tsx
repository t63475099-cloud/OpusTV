"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";

const SESSION_KEY = "opus-preloader-v1";

type Props = {
  /** Mỗi phiên trình duyệt chỉ hiện 1 lần (mặc định true) */
  oncePerSession?: boolean;
  /** Timeout tối đa khi online (ms) */
  maxWaitMs?: number;
  onComplete?: () => void;
};

function isOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

/**
 * Preloader theo thời gian thực:
 * - Online: tiến trình bám document ready + network probe
 * - Offline: hiện trạng thái mất mạng, chờ online hoặc vào app sau timeout ngắn
 */
export default function OpusPreloader({
  oncePerSession = true,
  maxWaitMs = 12000,
  onComplete,
}: Props) {
  const [active, setActive] = useState(true);
  const [offline, setOffline] = useState(false);

  const root = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGCircleElement>(null);
  const countEl = useRef<HTMLSpanElement>(null);
  const labelEl = useRef<HTMLSpanElement>(null);
  const curtainL = useRef<HTMLDivElement>(null);
  const curtainR = useRef<HTMLDivElement>(null);
  const core = useRef<HTMLDivElement>(null);

  const progress = useRef(0);
  const done = useRef(false);
  const circumference = 2 * Math.PI * 54;

  const paint = useCallback((pct: number, label?: string) => {
    const n = Math.max(0, Math.min(100, Math.round(pct)));
    progress.current = n;
    if (countEl.current) countEl.current.textContent = String(n).padStart(2, "0");
    if (ring.current) {
      ring.current.style.strokeDashoffset = `${circumference * (1 - n / 100)}`;
    }
    if (label && labelEl.current) labelEl.current.textContent = label;
  }, [circumference]);

  const runOutro = useCallback(() => {
    if (done.current) return;
    done.current = true;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const complete = () => {
      try {
        if (oncePerSession) sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* */
      }
      document.documentElement.classList.remove("opus-preloading");
      onComplete?.();
      setActive(false);
    };

    if (reduce || !root.current) {
      complete();
      return;
    }

    const outro = gsap.timeline({
      defaults: { ease: "power4.inOut" },
      onComplete: complete,
    });

    if (core.current) {
      outro.to(core.current, { scale: 6, opacity: 0, duration: 0.65, ease: "power3.in" }, 0);
    }
    outro.to(
      root.current,
      { clipPath: "circle(150% at 50% 50%)", duration: 0.8 },
      0
    );
    if (curtainL.current) {
      outro.to(curtainL.current, { yPercent: -105, duration: 0.7 }, 0.1);
    }
    if (curtainR.current) {
      outro.to(curtainR.current, { yPercent: -105, duration: 0.7 }, 0.18);
    }
    outro.to(root.current, { opacity: 0, duration: 0.3 }, 0.5);
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
    if (ring.current) {
      ring.current.style.strokeDasharray = `${circumference}`;
      ring.current.style.strokeDashoffset = `${circumference}`;
    }

    let cancelled = false;
    let raf = 0;
    let target = 0;
    const started = performance.now();
    let networkOk = false;
    let domOk = false;
    let offlineMode = !isOnline();
    setOffline(offlineMode);

    const labelsOnline = [
      "CHECKING NETWORK",
      "INITIALIZING STREAM",
      "CONNECTING CORE",
      "SYNCING MODULES",
      "ALMOST READY",
    ];
    const labelsOffline = [
      "NO CONNECTION",
      "WAITING FOR NETWORK",
      "RETRYING…",
      "OPENING OFFLINE MODE",
    ];

    const pickLabel = (pct: number) => {
      if (offlineMode) {
        const i = Math.min(
          labelsOffline.length - 1,
          Math.floor((pct / 100) * labelsOffline.length)
        );
        return labelsOffline[i];
      }
      const i = Math.min(
        labelsOnline.length - 1,
        Math.floor((pct / 100) * labelsOnline.length)
      );
      return labelsOnline[i];
    };

    const tick = () => {
      if (cancelled) return;
      // lerp display progress toward target
      const cur = progress.current;
      const next = cur + (target - cur) * 0.12;
      const pct = target >= 100 && next > 99.2 ? 100 : next;
      paint(pct, pickLabel(pct));
      if (pct >= 100) {
        runOutro();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const recomputeTarget = () => {
      const elapsed = performance.now() - started;
      if (offlineMode) {
        // Offline: lên ~70% rồi chờ mạng; sau 4s cho vào app offline
        if (elapsed > 4000) {
          target = 100;
        } else {
          target = Math.min(70, 15 + elapsed / 50);
        }
        return;
      }
      // Online weighted progress
      let t = 8;
      if (document.readyState === "interactive") t += 25;
      if (document.readyState === "complete" || domOk) t += 30;
      if (networkOk) t += 35;
      // time soft-cap so never stuck forever
      t += Math.min(20, elapsed / 400);
      if (domOk && networkOk) t = 100;
      if (elapsed >= maxWaitMs) t = 100;
      target = Math.min(100, t);
    };

    const onReadyState = () => {
      if (document.readyState === "complete") domOk = true;
      recomputeTarget();
    };
    onReadyState();
    document.addEventListener("readystatechange", onReadyState);
    window.addEventListener("load", () => {
      domOk = true;
      recomputeTarget();
    });

    // Network probe (real online check, not only navigator.onLine)
    const probe = async () => {
      if (!isOnline()) {
        offlineMode = true;
        setOffline(true);
        networkOk = false;
        recomputeTarget();
        return;
      }
      offlineMode = false;
      setOffline(false);
      try {
        const ctrl = new AbortController();
        const to = setTimeout(() => ctrl.abort(), 3500);
        // cache-bust ping — cùng origin, nhẹ
        await fetch(`/favicon.ico?_=${Date.now()}`, {
          method: "HEAD",
          cache: "no-store",
          signal: ctrl.signal,
        });
        clearTimeout(to);
        networkOk = true;
      } catch {
        // Có navigator.onLine nhưng request fail → coi như mạng yếu
        networkOk = isOnline();
      }
      recomputeTarget();
    };

    void probe();
    const probeIv = setInterval(() => {
      if (!done.current) void probe();
    }, 2000);

    const onOnline = () => {
      offlineMode = false;
      setOffline(false);
      if (labelEl.current) labelEl.current.textContent = "NETWORK RESTORED";
      void probe();
      recomputeTarget();
    };
    const onOffline = () => {
      offlineMode = true;
      setOffline(true);
      networkOk = false;
      if (labelEl.current) labelEl.current.textContent = "NO CONNECTION";
      recomputeTarget();
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    const safety = setTimeout(() => {
      target = 100;
      recomputeTarget();
    }, maxWaitMs + 500);

    // pulse dots
    if (core.current) {
      gsap.to(core.current.querySelectorAll("[data-pulse]"), {
        opacity: 0.3,
        scale: 1.2,
        duration: 0.75,
        yoyo: true,
        repeat: -1,
        stagger: 0.1,
        ease: "sine.inOut",
      });
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(probeIv);
      clearTimeout(safety);
      document.removeEventListener("readystatechange", onReadyState);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.documentElement.classList.remove("opus-preloading");
    };
  }, [circumference, maxWaitMs, oncePerSession, onComplete, paint, runOutro]);

  if (!active) return null;

  return (
    <div
      ref={root}
      className="opus-preloader fixed inset-0 z-[9999] flex items-center justify-center bg-[#07070c]"
      style={{
        clipPath: "circle(100% at 50% 50%)",
        willChange: "clip-path, opacity",
      }}
      aria-busy="true"
      aria-live="polite"
    >
      <div
        ref={curtainL}
        className="absolute inset-y-0 left-0 w-1/2 bg-[#0a0a12]"
        style={{ willChange: "transform" }}
      />
      <div
        ref={curtainR}
        className="absolute inset-y-0 right-0 w-1/2 bg-[#0a0a12]"
        style={{ willChange: "transform" }}
      />

      <div
        ref={core}
        className="relative z-10 flex flex-col items-center gap-5 px-8 py-10 rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-2xl shadow-[0_0_60px_rgba(139,92,246,0.15)]"
        style={{ willChange: "transform, opacity" }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {Array.from({ length: 12 }).map((_, i) => (
            <span
              key={i}
              data-pulse
              className="absolute w-1 h-1 rounded-full bg-violet-400/80"
              style={{
                left: `${12 + (i * 7) % 76}%`,
                top: `${20 + (i * 13) % 60}%`,
                boxShadow: "0 0 8px rgba(167,139,250,0.8)",
                willChange: "transform, opacity",
              }}
            />
          ))}
        </div>

        <div className="relative w-[120px] h-[120px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" aria-hidden>
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="3"
            />
            <circle
              ref={ring}
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke={offline ? "url(#opusRingOff)" : "url(#opusRingGrad)"}
              strokeWidth="3.5"
              strokeLinecap="round"
              style={{
                filter: offline
                  ? "drop-shadow(0 0 6px rgba(251,146,60,0.8))"
                  : "drop-shadow(0 0 6px rgba(168,85,247,0.85))",
                willChange: "stroke-dashoffset",
              }}
            />
            <defs>
              <linearGradient id="opusRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="opusRingOff" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold tabular-nums tracking-tight text-white">
              <span ref={countEl}>00</span>
              <span className="text-sm text-zinc-400 font-medium">%</span>
            </span>
          </div>
        </div>

        <span
          ref={labelEl}
          className="text-[10px] sm:text-[11px] font-medium tracking-[0.18em] text-zinc-400 uppercase min-h-[1.2em] text-center px-2"
        >
          CHECKING NETWORK
        </span>

        {offline && (
          <p className="text-[11px] text-amber-200/90 text-center max-w-[220px] leading-snug">
            Không có mạng — sẽ vào app khi có kết nối hoặc sau vài giây.
          </p>
        )}
      </div>
    </div>
  );
}
