"use client";

import { Shield, Coins, Flame, BadgeCheck, Sparkles } from "lucide-react";
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
    <GlassCard className="p-0" hover={false} accent="rose">
      {/* Hero strip như banner trang chủ */}
      <div className="relative h-28 sm:h-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-600/50 via-fuchsia-700/30 to-violet-800/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(251,113,133,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,18,22,0.95)] via-[rgba(18,18,22,0.4)] to-transparent" />
        <div className="absolute bottom-3 left-5 right-5 flex items-end gap-4">
          <div className="relative shrink-0">
            <div className="w-[4.5rem] h-[4.5rem] rounded-2xl bg-gradient-to-br from-rose-400 via-fuchsia-500 to-violet-600 p-[2px] shadow-lg shadow-rose-900/40">
              <div className="w-full h-full rounded-2xl bg-[#121216] flex items-center justify-center">
                <Shield className="w-8 h-8 text-rose-200" />
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-[#121216]" />
          </div>
          <div className="min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white truncate drop-shadow">
                {adminLabel}
              </h2>
              <BadgeCheck className="w-5 h-5 text-sky-400 shrink-0" />
            </div>
            <p className="text-xs text-zinc-300/90 flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Bảng điều khiển OpusFilm
            </p>
          </div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-3 space-y-4">
        <div>
          <div className="flex justify-between text-[11px] mb-1.5">
            <span className="text-zinc-400">Tỷ lệ tích xanh</span>
            <span className="text-rose-300 font-medium tabular-nums">{xpPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-500 via-fuchsia-500 to-violet-500 transition-all duration-500"
              style={{ width: `${xpPct}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Tài khoản", v: users, color: "text-white" },
            {
              label: "Cấp xu",
              v: coinsGranted,
              color: "text-amber-300",
              icon: Coins,
            },
            {
              label: "Đơn chuỗi",
              v: streakPending,
              color: "text-orange-300",
              icon: Flame,
            },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl bg-black/35 border border-white/[0.06] px-2.5 py-3 text-center"
            >
              <p
                className={`text-xl font-bold tabular-nums ${c.color} flex items-center justify-center gap-1`}
              >
                {c.icon ? <c.icon className="w-4 h-4 opacity-80" /> : null}
                {c.v}
              </p>
              <p className="text-[10px] text-zinc-500 mt-1">{c.label}</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
