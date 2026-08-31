"use client";

import React, { useEffect, useState } from "react";
import { Flame, Sparkles, Trophy, Calendar, CheckCircle2 } from "lucide-react";
import { getStreakData, getLocalDateString, StreakData } from "@/lib/streak";

export default function StreakBadge() {
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    bestStreak: 0,
    lastWatchDate: null,
    updatedAt: 0,
  });
  const [showPopup, setShowPopup] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setStreak(getStreakData());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<StreakData>;
      if (customEvent.detail) {
        setStreak(customEvent.detail);
      } else {
        setStreak(getStreakData());
      }
    };

    window.addEventListener("streak-updated", handleUpdate);
    return () => window.removeEventListener("streak-updated", handleUpdate);
  }, []);

  if (!mounted) return null;

  const today = getLocalDateString();
  const isActiveToday = streak.lastWatchDate === today && streak.currentStreak > 0;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setShowPopup((prev) => !prev)}
        type="button"
        title="Chuỗi xem mỗi ngày"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
          isActiveToday
            ? "bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-red-500/20 border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.35)] hover:scale-105"
            : streak.currentStreak > 0
            ? "bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse hover:bg-amber-500/20"
            : "bg-neutral-800/80 border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-600"
        }`}
      >
        <Flame
          className={`w-4 h-4 transition-transform duration-300 ${
            isActiveToday
              ? "text-orange-500 fill-orange-500 scale-110"
              : streak.currentStreak > 0
              ? "text-amber-400 fill-amber-400/40"
              : "text-neutral-500"
          }`}
        />
        <span>{streak.currentStreak}</span>
      </button>

      {showPopup && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]"
            onClick={() => setShowPopup(false)}
          />
          <div className="absolute right-0 mt-2 w-72 p-4 rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl z-50 text-sm backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
                </div>
                <div>
                  <h4 className="font-semibold text-white leading-tight">Chuỗi xem phim</h4>
                  <p className="text-[11px] text-neutral-400">Duy trì thói quen xem phim</p>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 font-bold">
                {streak.currentStreak} ngày
              </span>
            </div>

            {/* Thống kê & Trạng thái */}
            <div className="mt-3.5 space-y-3 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/50 border border-white/5">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <Trophy className="w-4 h-4 text-yellow-500" /> Kỷ lục cao nhất:
                </span>
                <span className="font-bold text-white">{streak.bestStreak} ngày liên tục</span>
              </div>

              <div
                className={`p-3 rounded-xl border ${
                  isActiveToday
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-300"
                }`}
              >
                {isActiveToday ? (
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-300">Đã thắp lửa hôm nay!</p>
                      <p className="text-[11px] text-emerald-400/80 mt-0.5">
                        Bạn đã giữ vững chuỗi. Hãy quay lại xem vào ngày mai để nối tiếp chuỗi nhé!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-200">Chưa thắp lửa hôm nay</p>
                      <p className="text-[11px] text-amber-300/80 mt-0.5">
                        Hãy mở và xem một tập phim bất kỳ hôm nay để chuỗi không bị tắt.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
