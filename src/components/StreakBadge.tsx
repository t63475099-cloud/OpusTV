"use client";

import { useEffect, useRef, useState } from "react";
import { Flame, Trophy, CheckCircle2 } from "lucide-react";
import { useStreakStore } from "@/lib/streak";

/** Particle tĩnha quanh nút lửa */
function StreakParticles({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="streak-particles pointer-events-none absolute inset-0" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <span key={i} className={`streak-spark streak-spark--${i + 1}`} />
      ))}
    </span>
  );
}

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

  useEffect(() => {
    const unsub = useStreakStore.subscribe(() => setInfo(status()));
    return unsub;
  }, [status]);

  const days =
    info.litToday || info.current > 0
      ? Math.max(info.current, info.litToday ? info.current : 0)
      : 0;
  const lit = info.litToday || days > 0;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          setInfo(status());
          setOpen((v) => !v);
        }}
        className={`streak-btn relative p-2 rounded-full transition ${
          lit ? "streak-btn--lit" : "hover:bg-white/10 text-zinc-200"
        }`}
        aria-label="Chuỗi xem phim"
        title="Chuỗi xem phim"
      >
        {/* Quầng sáng */}
        {lit && <span className="streak-aura" aria-hidden />}
        {lit && <span className="streak-aura streak-aura--delay" aria-hidden />}
        <StreakParticles active={lit} />
        <Flame
          className={`relative z-10 w-5 h-5 transition-colors ${
            lit
              ? "text-orange-300 fill-orange-500/60 streak-flame-icon"
              : "text-zinc-400"
          }`}
        />
        {days > 0 && (
          <span className="streak-count absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center z-20">
            {days > 99 ? "99+" : days}
          </span>
        )}
      </button>

      {open && (
        <div className="streak-panel absolute right-0 top-full mt-2 w-[min(92vw,300px)] rounded-2xl z-[60] overflow-hidden">
          {/* Viền phát sáng */}
          <span className="streak-panel-glow" aria-hidden />

          <div className="relative z-10 bg-[#12121a]/95 backdrop-blur-xl">
            <div className="px-3.5 py-3 border-b border-orange-500/15 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="streak-icon-wrap relative w-9 h-9 rounded-full flex items-center justify-center shrink-0">
                  <span className="streak-icon-aura" aria-hidden />
                  <Flame className="relative z-10 w-4 h-4 text-orange-300 fill-orange-500/60 streak-flame-icon" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                    Chuỗi xem phim
                    {lit && <span className="streak-dot" aria-hidden />}
                  </p>
                  <p className="text-[11px] text-zinc-400">Duy trì thói quen xem phim</p>
                </div>
              </div>
              <span className="streak-days-pill shrink-0 text-xs font-bold text-orange-200 px-2.5 py-0.5 rounded-full">
                {info.current > 0 ? `${info.current} ngày` : "0 ngày"}
              </span>
            </div>

            {/* Chuỗi mắt xích phát sáng */}
            <div className="px-3.5 py-3 border-b border-white/5">
              <div className="streak-chain" aria-hidden>
                {Array.from({ length: Math.min(7, Math.max(3, info.current || 1)) }).map(
                  (_, i) => (
                    <span
                      key={i}
                      className={`streak-link ${i < (info.current || 0) || info.litToday ? "streak-link--on" : ""}`}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    />
                  )
                )}
              </div>
            </div>

            <div className="px-3.5 py-2.5 flex items-center justify-between text-sm border-b border-white/5">
              <span className="flex items-center gap-1.5 text-zinc-300">
                <Trophy className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                Kỷ lục cao nhất:
              </span>
              <span className="text-white font-medium">
                {info.best > 0 ? `${info.best} ngày liên tục` : "—"}
              </span>
            </div>

            <div className="px-3.5 py-3 relative overflow-hidden">
              {info.litToday ? (
                <div className="streak-status-ok relative rounded-xl px-3 py-2.5 overflow-hidden">
                  <span className="streak-status-particles" aria-hidden>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <span key={i} className={`streak-ember streak-ember--${i + 1}`} />
                    ))}
                  </span>
                  <p className="relative z-10 text-sm font-medium text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Đã thắp lửa hôm nay!
                  </p>
                  <p className="relative z-10 text-xs text-emerald-200/70 mt-1 leading-relaxed">
                    Bạn đã giữ vững chuỗi. Hãy quay lại xem vào ngày mai để nối tiếp chuỗi nhé!
                  </p>
                </div>
              ) : (
                <div className="streak-status-wait relative rounded-xl px-3 py-2.5 overflow-hidden">
                  <p className="text-sm font-medium text-orange-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 streak-flame-icon" />
                    Chưa thắp lửa hôm nay
                  </p>
                  <p className="text-xs text-orange-200/70 mt-1 leading-relaxed">
                    Xem phim ít nhất vài phút để duy trì chuỗi xem của bạn.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
