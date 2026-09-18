"use client";

import { useEffect, useRef, useState, useCallback } from "react";

const SESSION_KEY = "opus-preloader-v1";

type Props = {
  oncePerSession?: boolean;
  /** Thời gian tối đa (ms) trước khi buộc đóng */
  maxWaitMs?: number;
  onComplete?: () => void;
};

/**
 * Thanh loading nhỏ giữa trang — luôn hoàn tất, không kẹt 96%.
 * Online/offline chỉ đổi nhãn; progress luôn chạy tới 100%.
 */
export default function OpusPreloader({
  oncePerSession = true,
  maxWaitMs = 2800,
  onComplete,
}: Props) {
  const [active, setActive] = useState(true);
  const [pct, setPct] = useState(0);
  const [label, setLabel] = useState("Đang tải");
  const [offline, setOffline] = useState(false);
  const done = useRef(false);
  const barRef = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    if (done.current) return;
    done.current = true;
    setPct(100);
    try {
      if (oncePerSession) sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* */
    }
    document.documentElement.classList.remove("opus-preloading");
    // fade out ngắn
    window.setTimeout(() => {
      setActive(false);
      onComplete?.();
    }, 220);
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
    let target = 12;
    let raf = 0;
    const started = performance.now();
    let domReady = document.readyState === "complete";
    let netTried = false;
    let netOk = typeof navigator !== "undefined" ? navigator.onLine !== false : true;

    const setOff = (v: boolean) => {
      if (!cancelled) setOffline(v);
    };

    const recompute = () => {
      const elapsed = performance.now() - started;
      const online = typeof navigator === "undefined" || navigator.onLine !== false;
      setOff(!online);

      if (!online) {
        // Offline: vẫn tăng đều, buộc xong sau maxWaitMs
        target = Math.min(100, 20 + (elapsed / maxWaitMs) * 80);
        if (!cancelled) setLabel("Không có mạng · vào app…");
      } else {
        let t = 15 + (elapsed / maxWaitMs) * 55;
        if (domReady) t += 20;
        if (netTried && netOk) t += 15;
        if (netTried && !netOk) t += 8;
        // Luôn chạm 100 khi hết thời gian
        if (elapsed >= maxWaitMs * 0.92) t = 100;
        target = Math.min(100, t);
        if (!cancelled) {
          if (elapsed < 400) setLabel("Đang tải");
          else if (!domReady) setLabel("Khởi tạo giao diện");
          else if (!netTried) setLabel("Kiểm tra kết nối");
          else setLabel("Sắp xong");
        }
      }
      if (elapsed >= maxWaitMs) target = 100;
    };

    const tick = () => {
      if (cancelled) return;
      recompute();
      // ease toward target — khi target=100 nhảy dứt điểm
      if (target >= 100) {
        current = Math.min(100, current + Math.max(2.5, (100 - current) * 0.25));
      } else {
        current += (target - current) * 0.14;
      }
      const show = Math.min(100, Math.round(current));
      setPct(show);
      if (barRef.current) {
        barRef.current.style.width = `${show}%`;
      }
      if (show >= 100) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const onReady = () => {
      if (document.readyState === "complete") domReady = true;
    };
    document.addEventListener("readystatechange", onReady);
    window.addEventListener("load", () => {
      domReady = true;
    });

    const probe = () => {
      netTried = true;
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        netOk = false;
        setOff(true);
        return;
      }
      const ctrl = new AbortController();
      const to = window.setTimeout(() => ctrl.abort(), 2000);
      fetch(`/favicon.ico?_=${Date.now()}`, {
        method: "HEAD",
        cache: "no-store",
        signal: ctrl.signal,
      })
        .then(() => {
          netOk = true;
          setOff(false);
        })
        .catch(() => {
          netOk = typeof navigator !== "undefined" ? navigator.onLine !== false : true;
        })
        .finally(() => clearTimeout(to));
    };
    probe();

    const onOnline = () => {
      setOff(false);
      probe();
    };
    const onOffline = () => {
      setOff(true);
      netOk = false;
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Hard failsafe — never stuck
    const hard = window.setTimeout(() => {
      current = 100;
      target = 100;
      finish();
    }, maxWaitMs + 400);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearTimeout(hard);
      document.removeEventListener("readystatechange", onReady);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.documentElement.classList.remove("opus-preloading");
    };
  }, [finish, maxWaitMs, oncePerSession, onComplete]);

  if (!active) return null;

  return (
    <div
      className="opus-preloader fixed inset-0 z-[9999] flex items-center justify-center bg-[#07070c]/92 backdrop-blur-sm px-6"
      style={{ willChange: "opacity" }}
      aria-busy="true"
      aria-live="polite"
    >
      <div className="w-full max-w-[220px] sm:max-w-[260px] flex flex-col items-center gap-3">
        <div className="w-full h-1 rounded-full bg-white/10 overflow-hidden">
          <div
            ref={barRef}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400"
            style={{
              width: "0%",
              willChange: "width",
              boxShadow: "0 0 12px rgba(168,85,247,0.55)",
              transition: "none",
            }}
          />
        </div>
        <div className="flex items-center justify-between w-full gap-3 text-[10px] sm:text-[11px] tracking-wide">
          <span className={`truncate ${offline ? "text-amber-300/90" : "text-zinc-500"}`}>
            {label}
          </span>
          <span className="tabular-nums text-zinc-400 shrink-0">{pct}%</span>
        </div>
      </div>
    </div>
  );
}
