"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Flame, Trophy, CheckCircle2 } from "lucide-react";
import { useStreakStore } from "@/lib/streak";

export default function StreakBadge() {
  const status = useStreakStore((s) => s.status);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState({
    current: 0,
    best: 0,
    litToday: false,
    lastActive: null as string | null,
  });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setInfo(status());
    } catch {}
  }, [status, open]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    try {
      const unsub = useStreakStore.subscribe(() => {
        try {
          setInfo(status());
        } catch {}
      });
      return unsub;
    } catch {
      return;
    }
  }, [status]);

  const days = info.current > 0 ? info.current : 0;
  const lit = info.litToday || days > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          try {
            setInfo(status());
          } catch {}
          setOpen((v) => !v);
        }}
        className={`relative p-2 rounded-full transition ${
          lit ? "text-orange-300 hover:bg-orange-500/15" : "text-zinc-400 hover:bg-white/10"
        }`}
        aria-label="Chuỗi xem phim"
        title="Chuỗi xem phim"
      >
        <Flame
          className={`w-5 h-5 ${lit ? "fill-orange-500/50 text-orange-300" : ""}`}
        />
        {days > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-orange-500 text-[10px] font-bold text-white flex items-center justify-center">
            {days > 99 ? "99+" : days}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-white/10 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl z-[130] overflow-hidden">
          <div className="px-3.5 py-3 border-b border-white/10">
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-300" />
              Chuỗi xem phim
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">Xem mỗi ngày để giữ lửa</p>
          </div>
          <div className="px-3.5 py-3 flex gap-3">
            <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
              <p className="text-[10px] text-zinc-500">Hiện tại</p>
              <p className="text-lg font-bold text-orange-300">{info.current}</p>
            </div>
            <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
              <p className="text-[10px] text-zinc-500 flex items-center justify-center gap-1">
                <Trophy className="w-3 h-3" /> Kỷ lục
              </p>
              <p className="text-lg font-bold text-amber-300">{info.best}</p>
            </div>
          </div>
          <div className="px-3.5 pb-3">
            {info.litToday ? (
              <div className="rounded-xl px-3 py-2.5 bg-emerald-500/10 border border-emerald-400/20">
                <p className="text-sm font-medium text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Đã thắp lửa hôm nay
                </p>
              </div>
            ) : (
              <div className="rounded-xl px-3 py-2.5 bg-orange-500/10 border border-orange-400/20">
                <p className="text-sm font-medium text-orange-300 flex items-center gap-1.5">
                  <Flame className="w-4 h-4" />
                  Chưa thắp lửa hôm nay
                </p>
                <p className="text-xs text-orange-200/70 mt-1">Xem phim vài phút để duy trì chuỗi.</p>
              </div>
            )}
            <Link
              href="/su-kien"
              onClick={() => setOpen(false)}
              className="mt-2 block text-center text-xs text-amber-300 hover:underline py-1"
            >
              Mở Sự kiện điểm danh →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
