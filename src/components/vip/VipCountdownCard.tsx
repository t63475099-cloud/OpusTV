"use client";

import { useEffect, useState } from "react";
import { Clock, Infinity, ShieldCheck } from "lucide-react";
import { formatVipRemaining } from "@/lib/vipCatalog";
import { useVipAccess } from "@/lib/vipAccess";

export function VipCountdownCard({
  onActivate,
}: {
  onActivate?: () => void;
}) {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const active = isLifetime || (vipExpiresAt != null && vipExpiresAt > now);
  const rem = formatVipRemaining(active && vipExpiresAt ? vipExpiresAt - now : 0);
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="rounded-xl border-2 border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <span className="text-sm font-semibold text-foreground">
          {isLifetime
            ? "THỜI HẠN VIP: VĨNH VIỄN (KHÔNG GIỚI HẠN)"
            : active
              ? "ĐANG KÍCH HOẠT VIP"
              : "CHƯA KÍCH HOẠT VIP"}
        </span>
      </div>

      {isLifetime ? (
        <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Infinity className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-sm font-medium">Không giới hạn thời gian</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(
            [
              [rem.days, "NGÀY"],
              [rem.hours, "GIỜ"],
              [rem.minutes, "PHÚT"],
              [rem.seconds, "GIÂY"],
            ] as const
          ).map(([v, label]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-300 bg-white px-1 py-2 text-center dark:border-slate-600 dark:bg-slate-950"
            >
              <div className="font-mono text-lg font-semibold tabular-nums text-foreground">
                {pad(v)}
              </div>
              <div className="text-[10px] font-medium text-foreground-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {!active && !isLifetime ? (
        <button
          type="button"
          onClick={onActivate}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
        >
          <Clock className="h-4 w-4" strokeWidth={1.75} />
          Gia hạn / Kích hoạt ngay
        </button>
      ) : null}
    </div>
  );
}
