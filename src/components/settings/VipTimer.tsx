"use client";

import { useEffect, useState, memo } from "react";
import { useVipAccess } from "@/lib/vipAccess";

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function splitRemain(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * Bộ đếm VIP an toàn hydration:
 * - Chỉ hiện số sau khi client mount
 * - useEffect deps [] + clearInterval khi unmount
 * - Không setState mỗi giây (chỉ cập nhật local state đã mount)
 */
export const VipTimer = memo(function VipTimer() {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);

  const [isMounted, setIsMounted] = useState(false);
  const [rem, setRem] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const tick = () => {
      const life = useVipAccess.getState().isLifetime;
      const exp = useVipAccess.getState().vipExpiresAt;
      if (life) {
        setActive(true);
        setRem({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const now = Date.now();
      const isActive = exp != null && exp > now;
      setActive(isActive);
      setRem(splitRemain(isActive && exp ? exp - now : 0));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isMounted, isLifetime, vipExpiresAt]);

  const statusLabel = !isMounted
    ? "…"
    : isLifetime
      ? "VIP VĨNH VIỄN"
      : active
        ? "ĐANG KÍCH HOẠT VIP"
        : "CHƯA KÍCH HOẠT VIP";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#1a1b25] p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-indigo-300"
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
        <span className="text-sm font-semibold text-white">{statusLabel}</span>
      </div>

      {isMounted && isLifetime ? (
        <p className="text-sm font-medium text-emerald-400">Không giới hạn thời gian</p>
      ) : (
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              [isMounted ? String(rem.days) : "00", "NGÀY"],
              [isMounted ? pad2(rem.hours) : "00", "GIỜ"],
              [isMounted ? pad2(rem.minutes) : "00", "PHÚT"],
              [isMounted ? pad2(rem.seconds) : "00", "GIÂY"],
            ] as const
          ).map(([val, label]) => (
            <div
              key={label}
              className="rounded-lg border border-white/10 bg-black/30 px-1 py-2 text-center"
            >
              <span className="block font-mono text-lg font-semibold tabular-nums text-white">
                {val}
              </span>
              <span className="text-[10px] font-medium text-zinc-400">{label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
