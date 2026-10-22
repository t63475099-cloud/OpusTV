"use client";

/**
 * VIP timer + Lucianlabs #100 folding flip digits.
 * isMounted tránh hydration mismatch; clearInterval khi unmount.
 */

import { useEffect, useState, memo } from "react";
import { FlipCountdown } from "@/components/vip/FlipCountdown";
import { formatVipRemaining } from "@/lib/vipCatalog";
import { useVipAccess } from "@/lib/vipAccess";

export const VipTimer = memo(function VipTimer() {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);

  const [isMounted, setIsMounted] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    if (isLifetime) return;

    const tick = () => setNow(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isMounted, isLifetime, vipExpiresAt]);

  const active =
    isLifetime || (vipExpiresAt != null && vipExpiresAt > now);
  const rem = formatVipRemaining(
    active && vipExpiresAt && !isLifetime
      ? Math.max(0, vipExpiresAt - now)
      : 0
  );

  const statusLabel = !isMounted
    ? "…"
    : isLifetime
      ? "VIP VĨNH VIỄN"
      : active
        ? "ĐANG KÍCH HOẠT VIP"
        : "CHƯA KÍCH HOẠT VIP";

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 ui-border-contrast">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-primary"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span className="text-sm font-semibold text-foreground">{statusLabel}</span>
      </div>

      {isMounted && isLifetime ? (
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Không giới hạn thời gian
        </p>
      ) : (
        <FlipCountdown
          days={isMounted ? rem.days : 0}
          hours={isMounted ? rem.hours : 0}
          minutes={isMounted ? rem.minutes : 0}
          seconds={isMounted ? rem.seconds : 0}
          active={isMounted && active && !isLifetime}
        />
      )}
    </div>
  );
});
