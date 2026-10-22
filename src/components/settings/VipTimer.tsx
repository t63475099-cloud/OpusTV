"use client";

/**
 * VIP timer: cập nhật số qua DOM ref, KHÔNG setState mỗi giây
 * → tránh re-render / đơ trình duyệt trên /cai-dat
 */

import { useEffect, useRef, memo } from "react";
import { Infinity, ShieldCheck } from "lucide-react";
import { useVipAccess } from "@/lib/vipAccess";

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

function splitRemain(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { days, hours, minutes, seconds };
}

export const VipTimer = memo(function VipTimer() {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);

  const statusRef = useRef<HTMLSpanElement>(null);
  const dRef = useRef<HTMLSpanElement>(null);
  const hRef = useRef<HTMLSpanElement>(null);
  const mRef = useRef<HTMLSpanElement>(null);
  const sRef = useRef<HTMLSpanElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const lifeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLifetime) {
      if (statusRef.current) statusRef.current.textContent = "VIP VĨNH VIỄN";
      if (gridRef.current) gridRef.current.style.display = "none";
      if (lifeRef.current) lifeRef.current.style.display = "flex";
      return;
    }

    if (lifeRef.current) lifeRef.current.style.display = "none";
    if (gridRef.current) gridRef.current.style.display = "grid";

    const paint = () => {
      const exp = useVipAccess.getState().vipExpiresAt;
      const life = useVipAccess.getState().isLifetime;
      if (life) return;
      const now = Date.now();
      const active = exp != null && exp > now;
      const rem = splitRemain(active && exp ? exp - now : 0);
      if (statusRef.current) {
        statusRef.current.textContent = active
          ? "ĐANG KÍCH HOẠT VIP"
          : "CHƯA KÍCH HOẠT VIP";
      }
      if (dRef.current) dRef.current.textContent = String(rem.days);
      if (hRef.current) hRef.current.textContent = pad2(rem.hours);
      if (mRef.current) mRef.current.textContent = pad2(rem.minutes);
      if (sRef.current) sRef.current.textContent = pad2(rem.seconds);
    };

    paint();
    const id = window.setInterval(paint, 1000);
    return () => window.clearInterval(id);
  }, [isLifetime, vipExpiresAt]);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/25 via-[#1a1b25] to-[#13141c] p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-indigo-300" strokeWidth={1.75} />
        <span ref={statusRef} className="text-sm font-semibold text-white">
          {isLifetime
            ? "VIP VĨNH VIỄN"
            : vipExpiresAt && vipExpiresAt > Date.now()
              ? "ĐANG KÍCH HOẠT VIP"
              : "CHƯA KÍCH HOẠT VIP"}
        </span>
      </div>

      <div
        ref={lifeRef}
        className="items-center gap-2 text-emerald-400"
        style={{ display: isLifetime ? "flex" : "none" }}
      >
        <Infinity className="h-5 w-5" strokeWidth={1.75} />
        <span className="text-sm font-medium">Không giới hạn thời gian</span>
      </div>

      <div
        ref={gridRef}
        className="grid grid-cols-4 gap-2"
        style={{ display: isLifetime ? "none" : "grid" }}
      >
        {(
          [
            [dRef, "NGÀY"],
            [hRef, "GIỜ"],
            [mRef, "PHÚT"],
            [sRef, "GIÂY"],
          ] as const
        ).map(([ref, label]) => (
          <div
            key={label}
            className="rounded-lg border border-white/10 bg-black/30 px-1 py-2 text-center"
          >
            <span
              ref={ref}
              className="block font-mono text-lg font-semibold tabular-nums text-white"
            >
              00
            </span>
            <span className="text-[10px] font-medium text-zinc-400">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
