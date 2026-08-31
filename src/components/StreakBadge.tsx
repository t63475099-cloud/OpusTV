"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Trophy, CheckCircle2 } from "lucide-react";
import { useStreakStore } from "@/lib/streak";

export default function StreakBadge() {
  const status = useStreakStore((s) => s.status);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState({ current: 0, best: 0, litToday: false });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInfo(status());
  }, [status, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Refresh khi store đổi
  useEffect(() => {
    const unsub = useStreakStore.subscribe(() => setInfo(status()));
    return unsub;
  }, [status]);

  const days = info.litToday || info.current > 0 ? Math.max(info.current, info.litToday ? info.current : 0) : 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setInfo(status());
          setOpen((v) => !v);
        }}
        className="relative p-2 rounded-full hover:bg-white/10 text-zinc-200 transition"
        aria-label="Chuỗi xem phim"
        title="Chuỗi xem phim"
      >
        <Flame
          className={`w-5 h-5 ${
            info.litToday ? "text-orange-400 fill-orange-500/40" : "text-zinc-400"
          }`}
        />
        {days > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center">
            {days > 99 ? "99+" : days}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(92vw,300px)] rounded-2xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl z-[60] overflow-hidden">
          <div className="px-3.5 py-3 border-b border-white/10 flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-500/50" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">Chuỗi xem phim</p>
                <p className="text-[11px] text-zinc-400">Duy trì thói quen xem phim</p>
              </div>
            </div>
            <span className="shrink-0 text-xs font-bold text-orange-300 bg-orange-500/15 border border-orange-500/30 px-2 py-0.5 rounded-full">
              {info.current > 0 ? `${info.current} ngày` : "0 ngày"}
            </span>
          </div>

          <div className="px-3.5 py-2.5 flex items-center justify-between text-sm border-b border-white/5">
            <span className="flex items-center gap-1.5 text-zinc-300">
              <Trophy className="w-4 h-4 text-amber-400" />
              Kỷ lục cao nhất:
            </span>
            <span className="text-white font-medium">
              {info.best > 0 ? `${info.best} ngày liên tục` : "—"}
            </span>
          </div>

          <div className="px-3.5 py-3">
            {info.litToday ? (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/25 px-3 py-2.5">
                <p className="text-sm font-medium text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã thắp lửa hôm nay!
                </p>
                <p className="text-xs text-emerald-200/70 mt-1 leading-relaxed">
                  Bạn đã giữ vững chuỗi. Hãy quay lại xem vào ngày mai để nối tiếp chuỗi nhé!
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-orange-500/10 border border-orange-500/25 px-3 py-2.5">
                <p className="text-sm font-medium text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Chưa thắp lửa hôm nay
                </p>
                <p className="text-xs text-orange-200/70 mt-1 leading-relaxed">
                  Xem phim ít nhất vài phút để duy trì chuỗi xem của bạn.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
