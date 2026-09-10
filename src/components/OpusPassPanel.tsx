"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Crown,
  Gift,
  Lock,
  Sparkles,
  Ticket,
  Zap,
  Clock,
  Coins,
} from "lucide-react";
import {
  PASS_MAX_LEVEL,
  PASS_XP_PACKS,
  PREMIUM_PASS_COST,
  formatRemain,
  formatSeasonDate,
  levelFromXp,
  xpProgress,
  useOpusPassStore,
  type PassReward,
  type PassTier,
} from "@/lib/opusPass";

function RewardChip({
  reward,
  locked,
  claimed,
  premium,
}: {
  reward: PassReward;
  locked: boolean;
  claimed: boolean;
  premium?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-2xl border transition-all duration-300 ${
        claimed
          ? "border-emerald-400/40 bg-emerald-500/10 opacity-80"
          : locked
            ? "border-white/10 bg-white/[0.03] opacity-50"
            : premium
              ? "border-amber-400/40 bg-gradient-to-b from-amber-500/20 to-rose-500/10 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
              : "border-sky-400/30 bg-sky-500/10"
      }`}
    >
      <span className="text-xl sm:text-2xl leading-none">{reward.icon}</span>
      <span className="mt-1 text-[9px] sm:text-[10px] text-center text-zinc-200 px-1 leading-tight line-clamp-2">
        {reward.label}
      </span>
      {claimed && (
        <span className="absolute -top-1 -right-1 text-[9px] px-1 rounded bg-emerald-500 text-white font-bold">
          ✓
        </span>
      )}
      {locked && !claimed && (
        <Lock className="absolute top-1 right-1 w-3 h-3 text-zinc-500" />
      )}
    </div>
  );
}

export default function OpusPassPanel({
  onFlash,
  onNotif,
}: {
  onFlash: (msg: string) => void;
  onNotif: (title: string, body: string) => void;
}) {
  const ensureSeason = useOpusPassStore((s) => s.ensureSeason);
  const season = useOpusPassStore((s) => s.season);
  const xp = useOpusPassStore((s) => s.xp);
  const premium = useOpusPassStore((s) => s.premium);
  const claimedFree = useOpusPassStore((s) => s.claimedFree);
  const claimedPremium = useOpusPassStore((s) => s.claimedPremium);
  const buyPremium = useOpusPassStore((s) => s.buyPremium);
  const buyXpPack = useOpusPassStore((s) => s.buyXpPack);
  const claimTier = useOpusPassStore((s) => s.claimTier);
  const claimAll = useOpusPassStore((s) => s.claimAll);
  const getSeasonEndAt = useOpusPassStore((s) => s.getSeasonEndAt);
  const getTiers = useOpusPassStore((s) => s.getTiers);

  const [burst, setBurst] = useState(false);
  const [now, setNow] = useState(Date.now());
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureSeason();
  }, [ensureSeason]);

  useEffect(() => {
    const id = window.setInterval(() => {
      ensureSeason();
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(id);
  }, [ensureSeason]);

  const tiers: PassTier[] = useMemo(() => getTiers(), [getTiers, season]);
  const endAt = useMemo(() => getSeasonEndAt(), [getSeasonEndAt, season, now]);
  const remain = Math.max(0, endAt - now);
  const seasonPct = Math.min(100, Math.max(0, ((now - (endAt - 45 * 86400000)) / (45 * 86400000)) * 100));

  const prog = useMemo(() => xpProgress(xp, tiers), [xp, tiers]);
  const level = prog.level;

  const claimable = useMemo(() => {
    let n = 0;
    for (let lv = 1; lv <= level; lv++) {
      if (!claimedFree.includes(lv)) n++;
      if (premium && !claimedPremium.includes(lv)) n++;
    }
    return n;
  }, [level, claimedFree, claimedPremium, premium]);

  const onBuyPremium = () => {
    const r = buyPremium();
    onFlash(r.message);
    if (r.ok) {
      setBurst(true);
      onNotif("Opus Pass", r.message);
      window.setTimeout(() => setBurst(false), 1800);
    }
  };

  const onBuyXp = (packId: string) => {
    const r = buyXpPack(packId);
    onFlash(r.message);
    if (r.ok) onNotif("Pass XP", r.message);
  };

  const onClaim = (lv: number, track: "free" | "premium") => {
    const r = claimTier(lv, track);
    onFlash(r.message);
    if (r.ok) onNotif("Opus Pass", r.message);
  };

  const onClaimAll = () => {
    const r = claimAll();
    onFlash(r.message);
    if (r.ok) {
      setBurst(true);
      onNotif("Opus Pass", r.message);
      window.setTimeout(() => setBurst(false), 1600);
    }
  };

  const scrollToLevel = () => {
    const el = trackRef.current?.querySelector(`[data-pass-lv="${Math.max(1, level)}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <section className="space-y-4 relative">
      {burst && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-2xl">
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className="absolute w-2 h-2 rounded-full animate-ping"
              style={{
                left: `${10 + (i * 5) % 80}%`,
                top: `${15 + (i * 7) % 60}%`,
                background: i % 2 ? "#fbbf24" : "#f43f5e",
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-violet-400/25 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-rose-500/10 backdrop-blur-xl p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-violet-300" />
            <div>
              <p className="text-sm font-bold text-white">Opus Season {season}</p>
              <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                Mùa mới bắt đầu sau:{" "}
                <strong className="text-amber-200">{formatSeasonDate(endAt)}</strong>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wide">Kết thúc mùa</p>
            <p className="text-xs font-semibold text-violet-200 tabular-nums">{formatRemain(remain)}</p>
          </div>
        </div>
        <div className="mt-2.5 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-rose-400"
            style={{ width: `${Math.min(100, Math.max(0, seasonPct))}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-500 mt-1.5">
          Mỗi mùa 45 ngày · Hết mùa tự reset Pass XP, Premium và chuỗi thưởng mới
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs uppercase tracking-wider text-amber-300/90 font-semibold flex items-center gap-1.5">
              <Ticket className="w-3.5 h-3.5" /> Opus Pass · S{season}
            </p>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Cấp {level}
              <span className="text-zinc-500 text-sm font-medium"> / {PASS_MAX_LEVEL}</span>
            </h2>
            <p className="text-[11px] text-zinc-400 mt-1">
              XP: {xp.toLocaleString("vi-VN")}
              {level < PASS_MAX_LEVEL && (
                <> · Còn {Math.max(0, prog.nextNeed - xp).toLocaleString("vi-VN")} XP → C{level + 1}</>
              )}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {premium ? (
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-100 border border-amber-400/40">
                <Crown className="w-3.5 h-3.5" /> Premium S{season}
              </span>
            ) : (
              <button
                type="button"
                onClick={onBuyPremium}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg active:scale-95 transition"
              >
                <Crown className="w-3.5 h-3.5" /> Mở Premium · {PREMIUM_PASS_COST} xu
              </button>
            )}
            <button
              type="button"
              onClick={onClaimAll}
              disabled={claimable === 0}
              className="text-xs px-3 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 text-emerald-100 disabled:opacity-40 active:scale-95 transition"
            >
              Nhận tất cả {claimable > 0 ? `(${claimable})` : ""}
            </button>
          </div>
        </div>

        <div className="mt-3 h-2.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out bg-gradient-to-r from-sky-400 via-violet-500 to-rose-500"
            style={{ width: `${prog.pct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
          <button type="button" onClick={scrollToLevel} className="text-sky-300 hover:text-sky-200">
            Tới cấp hiện tại
          </button>
          <span>Free + Premium · 150 mốc</span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-3">
        <p className="text-xs font-semibold text-white flex items-center gap-1.5 mb-2">
          <Coins className="w-3.5 h-3.5 text-amber-300" /> Mua Pass XP bằng xu
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PASS_XP_PACKS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onBuyXp(p.id)}
              className="rounded-xl border border-white/10 bg-white/[0.05] hover:bg-white/10 active:scale-95 transition p-2.5 text-left"
            >
              <p className="text-[11px] text-amber-200 font-semibold">+{p.xp} XP</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{p.cost} xu</p>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-zinc-500 mt-2">Cũng có trong tab Cửa hàng đổi quà</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden">
        <div className="px-3 py-2 border-b border-white/10 flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-sky-400" /> Free
          </span>
          <span className="inline-flex items-center gap-1">
            <Crown className="w-3 h-3 text-amber-400" /> Premium
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Zap className="w-3 h-3 text-violet-400" /> Vuốt ngang
          </span>
        </div>

        <div
          ref={trackRef}
          className="opus-pass-scroll overflow-x-auto overscroll-x-contain pb-3 pt-3 px-3 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-3 min-w-max pr-4">
            {tiers.map((tier) => {
              const reached = level >= tier.level;
              const freeClaimed = claimedFree.includes(tier.level);
              const premClaimed = claimedPremium.includes(tier.level);
              const freeLocked = !reached;
              const premLocked = !reached || !premium;

              return (
                <div
                  key={tier.level}
                  data-pass-lv={tier.level}
                  className="snap-start flex flex-col items-center gap-2 w-[80px] sm:w-[88px]"
                >
                  <span
                    className={`text-[10px] font-bold tabular-nums px-2 py-0.5 rounded-full ${
                      tier.level === level
                        ? "bg-rose-500/30 text-rose-100 border border-rose-400/40"
                        : reached
                          ? "bg-white/10 text-zinc-300"
                          : "bg-white/5 text-zinc-500"
                    }`}
                  >
                    C{tier.level}
                  </span>

                  <button
                    type="button"
                    disabled={freeLocked || freeClaimed}
                    onClick={() => onClaim(tier.level, "free")}
                    className="disabled:cursor-default active:scale-95 transition"
                    title={tier.free.label}
                  >
                    <RewardChip reward={tier.free} locked={freeLocked} claimed={freeClaimed} />
                  </button>

                  <button
                    type="button"
                    disabled={premLocked || premClaimed}
                    onClick={() => onClaim(tier.level, "premium")}
                    className="disabled:cursor-default active:scale-95 transition"
                    title={tier.premium.label}
                  >
                    <RewardChip
                      reward={tier.premium}
                      locked={premLocked}
                      claimed={premClaimed}
                      premium
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 leading-relaxed px-1">
        Kiếm Pass XP khi điểm danh, nhận nhiệm vụ, hoặc mua bằng xu. Hết mùa (45 ngày) tự sang{" "}
        <strong className="text-zinc-300">Opus Season {season + 1}</strong> với chuỗi thưởng mới.
      </p>
      <div className="flex items-center gap-2 text-[11px] text-zinc-400 px-1">
        <Gift className="w-3.5 h-3.5 text-amber-300" />
        <span>
          Cấp: <strong className="text-white">{levelFromXp(xp, tiers)}</strong> · Free đã nhận:{" "}
          {claimedFree.length}/{PASS_MAX_LEVEL}
        </span>
      </div>
    </section>
  );
}
