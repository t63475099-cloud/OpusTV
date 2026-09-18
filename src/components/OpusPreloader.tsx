"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Conn = {
  downlink?: number;
  rtt?: number;
  effectiveType?: string;
  saveData?: boolean;
};

function readConn(): Conn {
  if (typeof navigator === "undefined") return {};
  return (navigator as Navigator & { connection?: Conn }).connection || {};
}

/** Ước lượng thời gian loader (ms) theo băng thông / RTT thực tế */
export function estimateLoadMs(): { ms: number; label: string; offline: boolean } {
  const online = typeof navigator === "undefined" || navigator.onLine !== false;
  if (!online) {
    return { ms: 900, label: "Ngoại tuyến", offline: true };
  }
  const c = readConn();
  const dl = c.downlink ?? 4;
  const rtt = c.rtt ?? 100;
  const type = (c.effectiveType || "").toLowerCase();

  // Base from downlink (Mbps)
  let ms = 2200;
  if (dl >= 20) ms = 480;
  else if (dl >= 10) ms = 700;
  else if (dl >= 5) ms = 1100;
  else if (dl >= 2) ms = 1600;
  else if (dl >= 1) ms = 2200;
  else ms = 3000;

  // RTT penalty
  if (rtt > 300) ms += 600;
  else if (rtt > 150) ms += 300;
  else if (rtt > 80) ms += 120;

  if (type === "slow-2g" || type === "2g") ms = Math.max(ms, 3200);
  if (type === "3g") ms = Math.max(ms, 2000);
  if (c.saveData) ms = Math.min(ms + 400, 4000);

  ms = Math.min(4200, Math.max(400, ms));

  const label =
    dl >= 10
      ? `${dl.toFixed(1)} Mbps · nhanh`
      : dl >= 2
        ? `${dl.toFixed(1)} Mbps`
        : type
          ? type.toUpperCase()
          : "Đang đo mạng";

  return { ms, label, offline: false };
}

type Props = {
  /** Chỉ hiện full-screen lần đầu phiên (vẫn có loader nhẹ khi đổi trang) */
  oncePerSession?: boolean;
};

/**
 * Loader toàn app:
 * - Lần đầu: full-screen iOS style, thời lượng theo mạng
 * - Mỗi lần đổi route/mảng: overlay nhẹ, thời lượng theo mạng hiện tại
 */
export default function OpusPreloader({ oncePerSession = true }: Props) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"boot" | "nav" | "off">("boot");
  const [pct, setPct] = useState(0);
  const [netLabel, setNetLabel] = useState("");
  const [offline, setOffline] = useState(false);
  const bootDone = useRef(false);
  const firstPath = useRef<string | null>(null);
  const animRef = useRef(0);
  const runId = useRef(0);

  const stopAnim = () => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = 0;
  };

  const runProgress = useCallback((durationMs: number, onDone: () => void) => {
    stopAnim();
    const id = ++runId.current;
    const start = performance.now();
    let current = 0;

    const tick = () => {
      if (id !== runId.current) return;
      const elapsed = performance.now() - start;
      const target = Math.min(100, (elapsed / durationMs) * 100);
      current += (target - current) * 0.22;
      if (elapsed >= durationMs) current = 100;
      setPct(Math.round(current));
      if (current >= 99.5) {
        setPct(100);
        onDone();
        return;
      }
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  // Boot loader
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      if (oncePerSession && sessionStorage.getItem("opus-preloader-v3") === "1") {
        bootDone.current = true;
        setMode("off");
        return;
      }
    } catch {
      /* */
    }

    document.documentElement.classList.add("opus-preloading");
    const { ms, label, offline: off } = estimateLoadMs();
    setNetLabel(label);
    setOffline(off);
    setMode("boot");
    setPct(0);

    const probe = () => {
      const t0 = performance.now();
      fetch(`/favicon.ico?_=${Date.now()}`, { method: "HEAD", cache: "no-store" })
        .then(() => {
          const rtt = performance.now() - t0;
          if (rtt > 800) setNetLabel((n) => n + ` · RTT ${Math.round(rtt)}ms`);
        })
        .catch(() => {
          /* keep estimate */
        });
    };
    probe();

    runProgress(ms, () => {
      bootDone.current = true;
      try {
        if (oncePerSession) sessionStorage.setItem("opus-preloader-v3", "1");
      } catch {
        /* */
      }
      document.documentElement.classList.remove("opus-preloading");
      setMode("off");
    });

    const hard = window.setTimeout(() => {
      bootDone.current = true;
      document.documentElement.classList.remove("opus-preloading");
      setMode("off");
    }, ms + 600);

    return () => {
      stopAnim();
      clearTimeout(hard);
      document.documentElement.classList.remove("opus-preloading");
    };
  }, [oncePerSession, runProgress]);

  // Navigation loader — every pathname change after boot
  useEffect(() => {
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    if (pathname === firstPath.current && !bootDone.current) return;
    if (pathname === firstPath.current) {
      firstPath.current = pathname;
    }
    // skip if same as last tracked during boot only
    if (!bootDone.current) {
      firstPath.current = pathname;
      return;
    }

    const { ms, label, offline: off } = estimateLoadMs();
    // Nav overlay shorter than boot (50–70%)
    const navMs = Math.min(2800, Math.max(280, Math.round(ms * 0.55)));
    setNetLabel(label);
    setOffline(off);
    setMode("nav");
    setPct(0);

    runProgress(navMs, () => setMode("off"));

    return () => stopAnim();
  }, [pathname, runProgress]);

  // Online/offline label refresh
  useEffect(() => {
    const sync = () => {
      const { label, offline: off } = estimateLoadMs();
      setOffline(off);
      setNetLabel(label);
    };
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (mode === "off") return null;

  const isBoot = mode === "boot";

  return (
    <div
      className={
        isBoot
          ? "fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-xl"
          : "fixed inset-0 z-[9990] flex items-center justify-center bg-black/45 backdrop-blur-md pointer-events-none"
      }
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3 px-6">
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
        <p className="text-[13px] text-white/75 font-medium">
          {offline ? "Ngoại tuyến · vào app…" : isBoot ? "Đang tải…" : "Đang chuyển…"}
        </p>
        <div className="w-32 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-white/85"
            style={{ width: `${pct}%`, transition: "width 0.12s linear" }}
          />
        </div>
        <p className="text-[10px] text-white/40 tabular-nums max-w-[220px] text-center truncate">
          {pct}% · {netLabel || "—"}
        </p>
      </div>
    </div>
  );
}
