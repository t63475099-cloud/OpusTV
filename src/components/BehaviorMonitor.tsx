"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  extractCoins,
  extractStreak,
  isSensitiveKey,
  readJsonLS,
  scoreSeverity,
  SENSITIVE_LS_KEYS,
  type BehaviorSeverity,
} from "@/lib/behaviorGuard";

/**
 * Giám sát hành vi nâng cao (client):
 * - DevTools / F12
 * - Nhảy xu / chuỗi bất thường
 * - Ghi đè localStorage nhạy cảm
 * - Click / gọi API quá dày (nghi automation)
 * - debugger / headless heuristic
 * Chỉ gửi alert cho admin — không tự khóa.
 */
export default function BehaviorMonitor() {
  const path = usePathname();
  const router = useRouter();
  const sent = useRef<Set<string>>(new Set());
  const lastCoin = useRef<number | null>(null);
  const lastStreak = useRef<number | null>(null);
  const clickTimes = useRef<number[]>([]);
  const apiTimes = useRef<number[]>([]);
  const riskScore = useRef(0);

  useEffect(() => {
    if (path?.startsWith("/bi-khoa") || path?.startsWith("/admin")) return;

    let cancelled = false;

    const report = (
      kind: string,
      detail: string,
      severity?: BehaviorSeverity,
      meta?: Record<string, unknown>
    ) => {
      const sev = severity || scoreSeverity(kind);
      const key = `${kind}:${sev}:${detail.slice(0, 48)}`;
      if (sent.current.has(key)) return;
      sent.current.add(key);
      if (sent.current.size > 40) {
        sent.current = new Set([...sent.current].slice(-20));
      }
      const add =
        sev === "critical" ? 25 : sev === "high" ? 12 : sev === "medium" ? 5 : 2;
      riskScore.current = Math.min(100, riskScore.current + add);

      try {
        void fetch("/api/moderation/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            kind,
            detail: detail.slice(0, 800),
            path: path || "/",
            severity: sev,
            riskScore: riskScore.current,
            meta: {
              ...meta,
              ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "",
              ts: Date.now(),
            },
          }),
        });
      } catch {
        /* ignore */
      }

      if (riskScore.current >= 80) {
        try {
          void fetch("/api/moderation/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              kind: "other",
              detail: `Điểm rủi ro cao (${riskScore.current}/100) — cần admin xem xét`,
              path: path || "/",
              severity: "critical",
              riskScore: riskScore.current,
            }),
          });
        } catch {
          /* */
        }
      }
    };

    // --- Ban redirect ---
    (async () => {
      try {
        const res = await fetch("/api/ban/status", { credentials: "include" });
        const data = await res.json();
        if (!cancelled && data?.banned) router.replace("/bi-khoa");
      } catch {
        /* */
      }
    })();

    // --- DevTools open (size + console trap) ---
    const onResize = () => {
      try {
        const gap = window.outerWidth - window.innerWidth;
        const gapH = window.outerHeight - window.innerHeight;
        if (gap > 180 || gapH > 180) {
          report("console_tamper", "DevTools có thể đang mở (lệch kích thước cửa sổ)", "medium");
        }
      } catch {
        /* */
      }
    };

    try {
      const c = window.console;
      if (c && typeof c.log === "function") {
        const orig = c.log.bind(c);
        // light probe: toString of native functions
        if (!Function.prototype.toString.call(c.log).includes("[native code]")) {
          report("console_tamper", "console.log bị ghi đè (không còn native)", "high");
        }
        void orig;
      }
    } catch {
      /* */
    }

    // --- Storage integrity ---
    const pollStorage = () => {
      try {
        const coinStore = readJsonLS("opusfilm-event-coins");
        const coins = extractCoins(coinStore);
        if (lastCoin.current != null) {
          const jump = coins - lastCoin.current;
          if (jump >= 5000) {
            report(
              "coin_bug",
              `Xu tăng bất thường: ${lastCoin.current} → ${coins} (+${jump})`,
              scoreSeverity("coin_bug", jump),
              { from: lastCoin.current, to: coins, jump }
            );
          }
        }
        lastCoin.current = coins;

        const streakStore =
          readJsonLS("opusfilm-watch-streak") ||
          readJsonLS("opusfilm-event-coins");
        const streak = extractStreak(streakStore);
        if (lastStreak.current != null) {
          const sj = streak - lastStreak.current;
          if (sj >= 30) {
            report(
              "storage_tamper",
              `Chuỗi tăng bất thường: ${lastStreak.current} → ${streak}`,
              "high",
              { from: lastStreak.current, to: streak }
            );
          }
        }
        lastStreak.current = streak;
      } catch {
        /* */
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key || !isSensitiveKey(e.key)) return;
      report(
        "storage_tamper",
        `localStorage bị sửa từ tab khác: ${e.key}`,
        "high",
        { key: e.key }
      );
    };

    // Wrap localStorage.setItem for sensitive keys (same tab)
    let unhookLs: (() => void) | undefined;
    try {
      const proto = Storage.prototype;
      const rawSet = proto.setItem;
      proto.setItem = function (key: string, value: string) {
        try {
          if (isSensitiveKey(key)) {
            if (key.includes("event-coins")) {
              const prev = extractCoins(readJsonLS(key));
              let next = prev;
              try {
                const p = JSON.parse(value);
                next = extractCoins(p);
              } catch {
                /* */
              }
              const jump = next - prev;
              if (prev > 0 && jump >= 5000) {
                report(
                  "coin_bug",
                  `setItem xu: ${prev} → ${next} (+${jump})`,
                  scoreSeverity("coin_bug", jump),
                  { key, jump }
                );
              }
            }
          }
        } catch {
          /* */
        }
        return rawSet.call(this, key, value);
      };
      unhookLs = () => {
        proto.setItem = rawSet;
      };
    } catch {
      /* */
    }

    // --- Keyboard DevTools ---
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && ["I", "J", "C", "K"].includes(e.key)) ||
        (e.metaKey && e.altKey && ["I", "J", "C"].includes(e.key))
      ) {
        report("console_tamper", `Phím DevTools: ${e.key}`, "medium");
      }
    };

    // --- Rapid click / automation ---
    const onClick = () => {
      const now = Date.now();
      clickTimes.current = clickTimes.current.filter((t) => now - t < 2000);
      clickTimes.current.push(now);
      if (clickTimes.current.length >= 25) {
        report(
          "automation",
          `Click quá dày: ${clickTimes.current.length} lần / 2s`,
          "medium",
          { clicks: clickTimes.current.length }
        );
        clickTimes.current = [];
      }
    };

    // --- fetch hook: API spam ---
    let unhookFetch: (() => void) | undefined;
    try {
      const rawFetch = window.fetch.bind(window);
      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        try {
          const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
          if (url.includes("/api/")) {
            const now = Date.now();
            apiTimes.current = apiTimes.current.filter((t) => now - t < 3000);
            apiTimes.current.push(now);
            if (apiTimes.current.length >= 40) {
              report(
                "automation",
                `Gọi API quá dày: ${apiTimes.current.length} / 3s`,
                "high",
                { count: apiTimes.current.length, sample: url.slice(0, 80) }
              );
              apiTimes.current = [];
            }
            if (
              url.includes("streak/request") ||
              url.includes("verify") ||
              url.includes("redeem")
            ) {
              // mark path only; false complaint is admin-side
            }
          }
        } catch {
          /* */
        }
        return rawFetch(input, init);
      };
      unhookFetch = () => {
        window.fetch = rawFetch;
      };
    } catch {
      /* */
    }

    // --- Headless / webdriver ---
    try {
      const nav = navigator as Navigator & { webdriver?: boolean };
      if (nav.webdriver) {
        report("third_party", "navigator.webdriver = true (có thể bot/automation)", "high");
      }
      if ((navigator.plugins?.length || 0) === 0 && /Headless/i.test(navigator.userAgent)) {
        report("third_party", "UA HeadlessChrome / không có plugins", "high");
      }
    } catch {
      /* */
    }

    // --- debugger timing probe (cheap) ---
    try {
      const t0 = performance.now();
      // eslint-disable-next-line no-debugger
      // intentional empty — timing only
      const t1 = performance.now();
      if (t1 - t0 > 100) {
        report("console_tamper", "Độ trễ bất thường (có thể đang debug)", "low");
      }
    } catch {
      /* */
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick, true);
    window.addEventListener("storage", onStorage);
    const t = window.setInterval(pollStorage, 5000);
    onResize();
    pollStorage();
    // warm sensitive keys list (touch for integrity)
    void SENSITIVE_LS_KEYS;

    return () => {
      cancelled = true;
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("storage", onStorage);
      window.clearInterval(t);
      unhookLs?.();
      unhookFetch?.();
    };
  }, [path, router]);

  return null;
}
