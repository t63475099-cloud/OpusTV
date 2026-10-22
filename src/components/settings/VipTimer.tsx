"use client";

/* Isolated VIP countdown — only this subtree re-renders every second */

import { useEffect, useState, memo } from "react";
import { Infinity, ShieldCheck } from "lucide-react";
import { FlipCountdown } from "@/components/vip/FlipCountdown";
import { formatVipRemaining } from "@/lib/vipCatalog";
import { useVipAccess } from "@/lib/vipAccess";

function useVipTick(enabled: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [enabled]);
  return now;
}

/** Chỉ hiển thị đồng hồ — không chứa form nhập Key */
export const VipTimer = memo(function VipTimer() {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);
  const needTick = !isLifetime && vipExpiresAt != null;
  const now = useVipTick(!!needTick);

  const active =
    isLifetime || (vipExpiresAt != null && vipExpiresAt > now);
  const rem = formatVipRemaining(
    active && vipExpiresAt ? Math.max(0, vipExpiresAt - now) : 0
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-[#1a1b25] to-[#13141c] p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-indigo-300" strokeWidth={1.75} />
        <span className="text-sm font-semibold text-white">
          {isLifetime
            ? "VIP VĨNH VIỄN"
            : active
              ? "ĐANG KÍCH HOẠT VIP"
              : "CHƯA KÍCH HOẠT VIP"}
        </span>
      </div>

      {isLifetime ? (
        <div className="flex items-center gap-2 text-emerald-400">
          <Infinity className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-sm font-medium">Không giới hạn thời gian</span>
        </div>
      ) : (
        <FlipCountdown
          days={rem.days}
          hours={rem.hours}
          minutes={rem.minutes}
          seconds={rem.seconds}
          active={active}
        />
      )}
    </div>
  );
});
