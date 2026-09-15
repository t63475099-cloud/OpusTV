"use client";

import { Shield, Coins, Flame, BadgeCheck } from "lucide-react";
import GlassCard from "./GlassCard";

type Props = {
  adminLabel?: string;
  users: number;
  verified: number;
  coinsGranted?: number;
  streakPending?: number;
};

export default function AdminIdentityCard({
  adminLabel = "Quản trị viên",
  users,
  verified,
  coinsGranted = 0,
  streakPending = 0,
}: Props) {
  const xpPct = Math.min(100, Math.round((verified / Math.max(users, 1)) * 100));

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500/40 via-sky-500/30 to-rose-500/40 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#121218] flex items-center justify-center border border-white/10">
              <Shield className="w-7 h-7 text-sky-300" />
            </div>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-400 border-2 border-[#0a0a0c]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white truncate">{adminLabel}</h2>
            <BadgeCheck className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">Bảng điều khiển OpusFilm</p>
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-zinc-500 mb-1">
              <span>Tỷ lệ tích xanh</span>
              <span className="text-zinc-300">{xpPct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
                style={{ width: `${xpPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-black/30 border border-white/5 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-white tabular-nums">{users}</p>
          <p className="text-[10px] text-zinc-500">Tài khoản</p>
        </div>
        <div className="rounded-2xl bg-black/30 border border-white/5 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-amber-300 tabular-nums flex items-center justify-center gap-1">
            <Coins className="w-3.5 h-3.5" />
            {coinsGranted}
          </p>
          <p className="text-[10px] text-zinc-500">Lần cấp xu</p>
        </div>
        <div className="rounded-2xl bg-black/30 border border-white/5 px-3 py-2.5 text-center">
          <p className="text-lg font-bold text-orange-300 tabular-nums flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {streakPending}
          </p>
          <p className="text-[10px] text-zinc-500">Đơn chuỗi</p>
        </div>
      </div>
    </GlassCard>
  );
}
