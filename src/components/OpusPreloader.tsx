"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Conn = { downlink?: number; rtt?: number; effectiveType?: string; saveData?: boolean };

function readConn(): Conn {
  if (typeof navigator === "undefined") return {};
  return (navigator as Navigator & { connection?: Conn }).connection || {};
}

function estimateLoadMs(): number {
  const online = typeof navigator === "undefined" || navigator.onLine !== false;
  if (!online) return 900;
  const c = readConn();
  const dl = c.downlink ?? 4;
  const rtt = c.rtt ?? 100;
  const type = (c.effectiveType || "").toLowerCase();
  let ms = 1800;
  if (dl >= 20) ms = 450;
  else if (dl >= 10) ms = 650;
  else if (dl >= 5) ms = 1000;
  else if (dl >= 2) ms = 1500;
  else if (dl >= 1) ms = 2100;
  else ms = 2800;
  if (rtt > 300) ms += 500;
  else if (rtt > 150) ms += 250;
  if (type === "slow-2g" || type === "2g") ms = Math.max(ms, 3000);
  if (type === "3g") ms = Math.max(ms, 1900);
  if (c.saveData) ms += 300;
  return Math.min(4000, Math.max(380, ms));
}

/** Three bouncing blue dots — center, blurs whole UI while loading */
export default function OpusPreloader({ oncePerSession = true }: { oncePerSession?: boolean }) {
  const pathname = usePathname();
  const [mode, setMode] = useState<"boot" | "nav" | "off">("boot");
  const bootDone = useRef(false);
  const firstPath = useRef<string | null>(null);
  const timerRef = useRef(0);

  const finish = useCallback((to: "off") => {
    setMode(to);
    document.documentElement.classList.remove("opus-preloading");
  }, []);

  const startLoad = useCallback(
    (kind: "boot" | "nav") => {
      const ms = kind === "nav" ? Math.round(estimateLoadMs() * 0.55) : estimateLoadMs();
      setMode(kind);
      document.documentElement.classList.add("opus-preloading");
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        if (kind === "boot") {
          bootDone.current = true;
          try {
            if (oncePerSession) sessionStorage.setItem("opus-preloader-v4", "1");
          } catch {
            /* */
          }
        }
        finish("off");
      }, ms);
    },
    [finish, oncePerSession]
  );

  useEffect(() => {
    try {
      if (oncePerSession && sessionStorage.getItem("opus-preloader-v4") === "1") {
        bootDone.current = true;
        setMode("off");
        return;
      }
    } catch {
      /* */
    }
    startLoad("boot");
    return () => window.clearTimeout(timerRef.current);
  }, [oncePerSession, startLoad]);

  useEffect(() => {
    if (firstPath.current === null) {
      firstPath.current = pathname;
      return;
    }
    if (!bootDone.current) {
      firstPath.current = pathname;
      return;
    }
    startLoad("nav");
    return () => window.clearTimeout(timerRef.current);
  }, [pathname, startLoad]);

  if (mode === "off") return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 backdrop-blur-md"
      aria-busy="true"
      aria-label="Đang tải"
    >
      <div className="flex items-center gap-3" role="status">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="opus-dot-bounce block w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#3B82F6]"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <style jsx global>{`
        @keyframes opus-dot-bounce {
          0%,
          80%,
          100% {
            transform: translateY(0) scale(0.92);
            opacity: 0.55;
          }
          40% {
            transform: translateY(-10px) scale(1);
            opacity: 1;
          }
        }
        .opus-dot-bounce {
          animation: opus-dot-bounce 0.9s ease-in-out infinite;
          will-change: transform, opacity;
        }
      `}</style>
    </div>
  );
}
