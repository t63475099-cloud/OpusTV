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
import { useNotifStore } from "@/lib/notifications";

/** Nền canvas giữ nguyên phong cách hạt sáng */
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
    const particles = Array.from({ length: 32 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 1 + Math.random() * 2.8,
      vx: (Math.random() - 0.5) * 0.00022,
      vy: -0.00012 - Math.random() * 0.0003,
      a: 0.25 + Math.random() * 0.55,
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
      g.addColorStop(0, `hsla(${150 + t * 6}, 40%, 10%, 0.95)`);
      g.addColorStop(0.45, `hsla(${280 + t * 5}, 35%, 9%, 0.92)`);
      g.addColorStop(1, `hsla(${220 + t * 4}, 45%, 10%, 0.95)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const cx = w * (0.2 + i * 0.3 + 0.04 * Math.sin(t * 0.35 + i));
        const cy = h * (0.35 + 0.15 * Math.cos(t * 0.3 + i));
        const r = Math.min(w, h) * (0.18 + 0.04 * Math.sin(t + i));
        const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        rg.addColorStop(0, `hsla(${40 + i * 50}, 80%, 50%, 0.16)`);
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
        ctx.fillStyle = `rgba(255,210,130,${p.a * (0.55 + 0.45 * Math.sin(t * 2 + p.x * 8))})`;
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
      className="absolute inset-0 w-full h-full rounded-2xl pointer-events-none"
      aria-hidden
    />
  );
}

/** Hello Apple: chroma-key bỏ nền trắng, nét chữ sáng, căn giữa, lặp mãi */
function AppleHello() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const out = canvasRef.current;
    if (!out) return;

    const video = document.createElement("video");
    videoRef.current = video;
    video.src = "/hello-apple.mp4";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.preload = "auto";
    video.crossOrigin = "anonymous";

    let raf = 0;
    let running = true;
    const tmp = document.createElement("canvas");
    const tctx = tmp.getContext("2d", { willReadFrequently: true });
    const octx = out.getContext("2d");
    if (!tctx || !octx) return;

    const draw = () => {
      if (!running) return;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (vw > 0 && vh > 0 && !video.paused) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cw = out.clientWidth || 320;
        const ch = out.clientHeight || 180;
        if (out.width !== Math.floor(cw * dpr) || out.height !== Math.floor(ch * dpr)) {
          out.width = Math.floor(cw * dpr);
          out.height = Math.floor(ch * dpr);
        }
        octx.setTransform(dpr, 0, 0, dpr, 0, 0);
        octx.clearRect(0, 0, cw, ch);

        // Căn giữa vùng nền trên (nửa trên card)
        const zoneH = ch * 0.48;
        const scale = Math.min((cw * 0.7) / vw, (zoneH * 0.85) / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (cw - dw) / 2;
        const dy = Math.max(4, (zoneH - dh) / 2);

        tmp.width = Math.max(1, Math.floor(dw * dpr));
        tmp.height = Math.max(1, Math.floor(dh * dpr));
        tctx.setTransform(1, 0, 0, 1, 0, 0);
        tctx.clearRect(0, 0, tmp.width, tmp.height);
        tctx.drawImage(video, 0, 0, tmp.width, tmp.height);

        const img = tctx.getImageData(0, 0, tmp.width, tmp.height);
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];
          const avg = (r + g + b) / 3;
          // Nền trắng / gần trắng → trong suốt
          if (avg > 235 || (r > 230 && g > 230 && b > 230)) {
            d[i + 3] = 0;
          } else {
            // Nét đen → trắng sáng để hiện trên canvas tối
            const strength = Math.min(1, (1 - avg / 255) * 1.5);
            d[i] = 255;
            d[i + 1] = 255;
            d[i + 2] = 255;
            d[i + 3] = Math.floor(255 * strength);
          }
        }
        tctx.putImageData(img, 0, 0);
        octx.drawImage(tmp, dx, dy, dw, dh);
      }
      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      video.play().catch(() => {});
      raf = requestAnimationFrame(draw);
    };
    video.addEventListener("loadeddata", start);
    video.load();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      video.pause();
      video.removeAttribute("src");
      video.load();
      videoRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="apple-hello-canvas"
      aria-hidden
    />
  );
}

function fmtProgress(cur: number, target: number, unit: "sec" | "count") {
  const c = Math.max(0, cur);
  if (unit === "sec") {
    return `${Math.min(Math.floor(c / 60), Math.floor(target / 60))}/${Math.floor(target / 60)} phút`;
  }
  return `${Math.min(c, target)}/${target}`;
}

function pushMissionNotif(title: string, body: string) {
  try {
    useNotifStore.getState().add({
      kind: "mission",
      title,
      body,
      href: "/su-kien",
    });
  } catch {}
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
  const [summary, setSummary] = useState({
    done: 0,
    total: DAILY_MISSIONS.length * MISSION_MAX_CLAIMS,
    pct: 0,
  });

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

  function onClaimMission(id: MissionId, title: string) {
    const r = claimMission(id);
    setSummary(dailyMissionSummary());
    flash(r.message);
    if (r.ok) {
      pushMissionNotif(`Hoàn thành: ${title}`, r.message);
    }
  }

  function onCheckIn() {
    const r = claimCheckIn();
    setStatus(getStreakStatus());
    flash(r.message);
    if (r.ok) {
      pushMissionNotif("Điểm danh 7 ngày", r.message);
    }
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
          <p className="text-xs text-zinc-500">Nhiệm vụ · Xu · Thông báo</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-border-live text-amber-300 text-sm font-semibold">
          <Coins className="w-4 h-4" />
          {coins}
        </div>
      </div>

      {toast && (
        <div className="mb-3 text-center text-sm text-amber-100 bg-amber-500/20 border border-amber-400/30 rounded-xl py-2 backdrop-blur-md bounce-in relative z-10">
          {toast}
        </div>
      )}

      <section className="relative overflow-hidden rounded-2xl mb-4 glass-border-live min-h-[200px]">
        <EventCanvas />
        <AppleHello />
        <div className="relative z-10 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-600 flex items-center justify-center shadow-lg shadow-orange-600/40">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold drop-shadow">
                Chuỗi {status.streakDay > 0 ? status.streakDay : 0} ngày
              </p>
              <p className="text-xs text-white/75">
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
                  className={`rounded-xl py-2 text-center border text-[10px] ${
                    done
                      ? "bg-orange-500/30 border-orange-300/50 text-orange-100"
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
            onClick={onCheckIn}
            className="w-full py-3 rounded-xl font-semibold text-sm transition bounce-press disabled:opacity-40 bg-gradient-to-r from-orange-500 via-rose-500 to-fuchsia-600 text-white shadow-lg shadow-rose-900/40"
          >
            {status.canClaim ? `Điểm danh · +${status.todayReward} xu` : "Đã nhận hôm nay"}
          </button>
        </div>
      </section>

      <section className="glass-panel p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-white">
            Nhiệm vụ ({DAILY_MISSIONS.length}) · +{MISSION_REWARD} xu/lần
          </h2>
          <span className="text-xs text-zinc-400">
            {summary.done}/{summary.total}
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-white/10 overflow-hidden mb-4">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-rose-500 to-violet-500 transition-all duration-700"
            style={{ width: `${summary.pct}%` }}
          />
        </div>

        <ul className="space-y-2.5 max-h-[55vh] overflow-y-auto custom-scroll">
          {DAILY_MISSIONS.map((m) => {
            const cur = (missionProgress && missionProgress[m.id]) || 0;
            const claims = (missionClaimCount && missionClaimCount[m.id]) || 0;
            const maxed = claims >= MISSION_MAX_CLAIMS;
            const inCycle = maxed ? m.target : cur % m.target === 0 && cur > 0 ? m.target : cur % m.target;
            const displayCur = maxed ? m.target : cur >= m.target ? Math.min(m.target, inCycle || m.target) : cur % m.target;
            const pct = Math.min(100, Math.round((displayCur / m.target) * 100));
            const canClaim = !maxed && cur >= m.target;
            return (
              <li
                key={m.id}
                className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm text-white font-medium">{m.title}</p>
                    <p className="text-[11px] text-zinc-500">
                      {m.desc} · {claims}/{MISSION_MAX_CLAIMS} lần
                    </p>
                  </div>
                  <span className="text-xs text-amber-300 shrink-0 font-semibold">
                    +{MISSION_REWARD}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-sky-400 to-violet-500 rounded-full transition-all"
                    style={{ width: `${maxed ? 100 : pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">
                    {maxed
                      ? "Hết lượt hôm nay"
                      : fmtProgress(displayCur, m.target, m.unit)}
                  </span>
                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => onClaimMission(m.id, m.title)}
                    className="text-xs px-3 py-1 rounded-full font-medium disabled:opacity-40 bg-amber-500/20 text-amber-200 border border-amber-400/30 bounce-press"
                  >
                    {maxed ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> Max
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
          1 tập: <strong className="text-amber-300">{UNLOCK_COST.episode} xu</strong> · Cả
          phim: <strong className="text-amber-300">{UNLOCK_COST.movie} xu</strong>
        </p>
        <p className="text-xs">
          Tổng đã kiếm: <span className="text-white">{totalEarned}</span> xu · Thông báo
          hiện ở chuông &amp;{" "}
          <Link href="/hop-thu" className="text-sky-400 hover:underline">
            Hòm thư
          </Link>
        </p>
      </section>
    </div>
  );
}
