"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Coins,
  Gift,
  Check,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  useEventStore,
  DAILY_MISSIONS,
  CHECKIN_REWARDS,
  UNLOCK_COST,
  MISSION_REWARD,
  MISSION_MAX_CLAIMS,
  type MissionId,
} from "@/lib/eventCoins";

function EventCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const particles = Array.from({ length: 28 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.5,
      vx: (Math.random() - 0.5) * 0.00025,
      vy: -0.00015 - Math.random() * 0.00035,
      a: 0.2 + Math.random() * 0.5,
    }));
    const resize = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const t0 = performance.now();
    const draw = (now: number) => {
      const t = (now - t0) / 1000;
      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsla(${18 + t * 8}, 70%, 12%, 0.9)`);
      g.addColorStop(0.5, `hsla(${280 + t * 6}, 50%, 10%, 0.85)`);
      g.addColorStop(1, `hsla(${200 + t * 5}, 55%, 11%, 0.9)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.25 + i * 0.28 + 0.05 * Math.sin(t * 0.4 + i));
        const cy = h * (0.3 + 0.2 * Math.cos(t * 0.35 + i));
        const r = Math.min(w, h) * (0.2 + 0.05 * Math.sin(t + i));
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, `hsla(${30 + i * 40}, 90%, 55%, 0.18)`);
        rg.addColorStop(1, "transparent");
        ctx.fillStyle = rg;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -0.05) {
          p.y = 1.05;
          p.x = Math.random();
        }
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,200,120,${p.a * (0.6 + 0.4 * Math.sin(t * 2 + p.x * 10))})`;
        ctx.arc(p.x * w, p.y * h, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);
  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none opacity-90"
      aria-hidden
    />
  );
}

function fmtProgress(id: MissionId, cur: number, target: number, unit: "sec" | "count") {
  if (unit === "sec") {
    return `${Math.min(Math.floor(cur / 60), Math.floor(target / 60))}/${Math.floor(target / 60)} phút`;
  }
  return `${Math.min(cur, target)}/${target}`;
}

export default function SuKienPage() {
  const coins = useEventStore((s) => s.coins);
  const totalEarned = useEventStore((s) => s.totalEarned);
  const claimCheckIn = useEventStore((s) => s.claimCheckIn);
  const getStreakStatus = useEventStore((s) => s.getStreakStatus);
  const ensureMissionDay = useEventStore((s) => s.ensureMissionDay);
  const addMissionProgress = useEventStore((s) => s.addMissionProgress);
  const missionProgress = useEventStore((s) => s.missionProgress);
  const missionClaimCount = useEventStore((s) => s.missionClaimCount);
  const claimMission = useEventStore((s) => s.claimMission);
  const dailyMissionSummary = useEventStore((s) => s.dailyMissionSummary);
  const streakDay = useEventStore((s) => s.streakDay);
  const lastCheckIn = useEventStore((s) => s.lastCheckIn);

  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const [status, setStatus] = useState({
    streakDay: 0,
    canClaim: true,
    missed: false,
    todayReward: 10,
    cycleDay: 1,
  });
  const [summary, setSummary] = useState({ done: 0, total: DAILY_MISSIONS.length, pct: 0 });

  // Chỉ chạy 1 lần khi vào trang — tránh vòng lặp vô hạn
  useEffect(() => {
    try {
      ensureMissionDay();
      addMissionProgress("openEvent", 1);
      setStatus(getStreakStatus());
      setSummary(dailyMissionSummary());
    } catch (e) {
      console.error(e);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      setStatus(getStreakStatus());
      setSummary(dailyMissionSummary());
    } catch {}
  }, [missionProgress, missionClaimCount, streakDay, lastCheckIn, coins, getStreakStatus, dailyMissionSummary]);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  if (!ready) {
    return (
      <div className="min-h-[50vh] pt-20 text-center text-zinc-500 text-sm">
        Đang tải sự kiện…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] pt-14 pb-28 px-3 sm:px-4 max-w-lg mx-auto relative">
      <div className="flex items-center gap-3 py-3 relative z-10">
        <Link href="/" className="p-2 rounded-full hover:bg-white/10 text-zinc-300 bounce-press">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Sự kiện 7 ngày
          </h1>
          <p className="text-xs text-zinc-500">Nhiều nhiệm vụ · Nhận xu dễ hơn</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-border-live text-amber-300 text-sm font-semibold bounce-in">
          <Coins className="w-4 h-4" />
          {coins}
        </div>
      </div>

      {toast && (
        <div className="mb-3 text-center text-sm text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-xl py-2 backdrop-blur-md bounce-in relative z-10">
          {toast}
        </div>
      )}

      {/* Check-in with canvas */}
      <section className="relative overflow-hidden rounded-2xl mb-4 glass-border-live bounce-in">
        <EventCanvas />
        <div className="relative z-10 p-4 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-600/40 animate-pulse">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold drop-shadow">
                Chuỗi {status.streakDay > 0 ? status.streakDay : 0} ngày
              </p>
              <p className="text-xs text-white/70">
                {status.canClaim
                  ? `Nhận ${status.todayReward} xu hôm nay`
                  : "Đã điểm danh hôm nay"}
                {status.missed ? " · Đã reset" : ""}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-4">
            {CHECKIN_REWARDS.map((reward, i) => {
              const day = i + 1;
              const done = streakDay >= day && !!lastCheckIn;
              const isToday = status.cycleDay === day && status.canClaim;
              return (
                <div
                  key={day}
                  className={`rounded-xl py-2 text-center border text-[10px] transition duration-300 ${
                    done
                      ? "bg-orange-500/30 border-orange-300/50 text-orange-100 scale-105"
                      : isToday
                      ? "bg-white/15 border-amber-300/60 text-white ring-1 ring-amber-300/50"
                      : "bg-black/25 border-white/15 text-zinc-400"
                  }`}
                >
                  <Gift className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  <div className="font-semibold">N{day}</div>
                  <div>{reward}</div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!status.canClaim}
            onClick={() => {
              const r = claimCheckIn();
              setStatus(getStreakStatus());
              flash(r.message);
            }}
            className="w-full py-3 rounded-xl font-semibold text-sm transition bounce-press disabled:opacity-40 bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-900/40"
          >
            {status.canClaim ? `Điểm danh · +${status.todayReward} xu` : "Đã nhận hôm nay"}
          </button>
        </div>
      </section>

      {/* Missions */}
      <section className="glass-panel p-4 mb-4 bounce-in" style={{ animationDelay: "0.08s" }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">Nhiệm vụ ngày ({DAILY_MISSIONS.length})</h2>
          <span className="text-xs text-zinc-400">
            {summary.done}/{summary.total}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 transition-all duration-700 ease-out"
            style={{ width: `${summary.pct}%` }}
          />
        </div>

        <ul className="space-y-2.5 max-h-[55vh] overflow-y-auto pr-0.5 custom-scroll">
          {DAILY_MISSIONS.map((m, idx) => {
            const cur = (missionProgress && missionProgress[m.id]) || 0;
            const claims = (missionClaimCount && missionClaimCount[m.id]) || 0;
            const maxed = claims >= MISSION_MAX_CLAIMS;
            const pct = Math.min(100, Math.round((cur / m.target) * 100));
            const canClaim = !maxed && cur >= m.target;
            return (
              <li
                key={m.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 bounce-in"
                style={{ animationDelay: `${0.04 * idx}s` }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium">{m.title}</p>
                    <p className="text-[11px] text-zinc-500">
                      {m.desc} · Lần {claims}/{MISSION_MAX_CLAIMS}
                    </p>
                  </div>
                  <span className="text-xs text-amber-300 shrink-0 font-semibold">
                    +{MISSION_REWARD}/lần
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-violet-500 rounded-full transition-all duration-500"
                    style={{ width: `${maxed ? 100 : pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    {maxed
                      ? "Đã hết lượt hôm nay"
                      : fmtProgress(m.id, cur % m.target || (cur >= m.target ? m.target : cur), m.target, m.unit)}
                  </span>
                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => {
                      const r = claimMission(m.id);
                      setSummary(dailyMissionSummary());
                      flash(r.message);
                    }}
                    className="text-xs px-3 py-1 rounded-full font-medium disabled:opacity-40 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 bounce-press"
                  >
                    {maxed ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Max 10
                      </span>
                    ) : canClaim ? (
                      `Nhận +${MISSION_REWARD}`
                    ) : (
                      "Đang làm"
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="glass-panel p-4 text-sm text-zinc-400 space-y-2">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lock className="w-4 h-4" /> Dùng xu
        </h2>
        <p>
          1 tập: <strong className="text-amber-300">{UNLOCK_COST.episode} xu</strong> · Cả phim:{" "}
          <strong className="text-amber-300">{UNLOCK_COST.movie} xu</strong>
        </p>
        <p className="text-xs">Tổng đã kiếm: <span className="text-white">{totalEarned}</span> xu</p>
      </section>
    </div>
  );
}
