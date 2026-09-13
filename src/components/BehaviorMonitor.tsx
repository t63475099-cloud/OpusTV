"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Giám sát hành vi đáng ngờ phía client và gửi cảnh báo về admin.
 * Không tự khóa — admin quyết định sau khi xem alert.
 */
export default function BehaviorMonitor() {
  const path = usePathname();
  const router = useRouter();
  const sent = useRef<Set<string>>(new Set());
  const lastCoin = useRef<number | null>(null);

  useEffect(() => {
    if (path?.startsWith("/bi-khoa") || path?.startsWith("/admin")) return;

    let cancelled = false;

    const report = (kind: string, detail: string) => {
      const key = `${kind}:${detail.slice(0, 40)}`;
      if (sent.current.has(key)) return;
      sent.current.add(key);
      if (sent.current.size > 30) {
        const arr = [...sent.current];
        sent.current = new Set(arr.slice(-15));
      }
      try {
        void fetch("/api/moderation/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            kind,
            detail,
            path: path || "/",
          }),
        });
      } catch {
        /* ignore */
      }
    };

    // Ban status check
    (async () => {
      try {
        const res = await fetch("/api/ban/status", { credentials: "include" });
        const data = await res.json();
        if (cancelled) return;
        if (data?.banned) {
          router.replace("/bi-khoa");
        }
      } catch {
        /* ignore */
      }
    })();

    // DevTools / console heuristic (resize threshold)
    const onResize = () => {
      try {
        const gap = window.outerWidth - window.innerWidth;
        const gapH = window.outerHeight - window.innerHeight;
        if (gap > 160 || gapH > 160) {
          report("console_tamper", "Phát hiện cửa sổ DevTools có thể đang mở");
        }
      } catch {
        /* */
      }
    };

    // localStorage coin jump detection
    const pollStorage = () => {
      try {
        const raw = localStorage.getItem("opusfilm-event-coins");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const coins = Number(parsed?.state?.coins ?? parsed?.coins ?? 0);
        if (lastCoin.current != null && coins - lastCoin.current > 5000) {
          report(
            "coin_bug",
            `Xu tăng bất thường: ${lastCoin.current} → ${coins}`
          );
        }
        lastCoin.current = coins;
      } catch {
        /* */
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F12" || (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C"))) {
        report("console_tamper", `Phím tắt DevTools: ${e.key}`);
      }
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    const t = window.setInterval(pollStorage, 8000);
    onResize();
    pollStorage();

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.clearInterval(t);
    };
  }, [path, router]);

  return null;
}
