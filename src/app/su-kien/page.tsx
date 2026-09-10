"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Flame,
  Coins,
  Gift,
  Check,
  Lock,
  Sparkles,
  ShoppingBag,
  Package,
  Disc3,
  Zap,
  Crown,
  Ticket,
} from "lucide-react";
import {
  useEventStore,
  DAILY_MISSIONS,
  CHECKIN_REWARDS,
  UNLOCK_COST,
  MISSION_REWARD,
  SHOP_ITEMS,
  SPIN_COST,
  SPIN_REWARDS,
  type MissionId,
} from "@/lib/eventCoins";
import RedeemCashPanel from "@/components/RedeemCashPanel";
import OpusPassPanel from "@/components/OpusPassPanel";
import { useOpusPassStore } from "@/lib/opusPass";
import { useNotifStore } from "@/lib/notifications";

type TabId = "missions" | "shop" | "inventory" | "pass";

const COMMUNITY_TICKER = [
  "@KiemThanh99 vừa đổi Khung viền Kim Cương",
  "@LanAnh xem xong nhiệm vụ nhận +1000 xu",
  "@OpusFan trúng +200 xu từ Vòng quay",
  "@MinhPhim trang bị huy hiệu Mọt Phim",
  "@StarNight đổi VIP OpusFilm 1 ngày",
  "@CodeWithMe mở Hộp quà bí ẩn",
];

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

        // Phóng to chữ Hello và căn giữa tuyệt đối canvas
        const scale = Math.min((cw * 0.92) / vw, (ch * 0.78) / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (cw - dw) / 2;
        const dy = (ch - dh) / 2;

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



const WHEEL_COLORS = [
  "#ef4444", "#f59e0b", "#22c55e", "#06b6d4",
  "#3b82f6", "#8b5cf6", "#ec4899", "#eab308",
];

function fmtRemain(ms: number) {
  if (ms <= 0) return "Hết hạn";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}n ${h}h ${m}p`;
  if (h > 0) return `${h}h ${m}p ${String(sec).padStart(2, "0")}s`;
  return `${m}p ${String(sec).padStart(2, "0")}s`;
}

function WheelFace({ labels, colors }: { labels: string[]; colors: string[] }) {
  const n = labels.length;
  const stops = labels
    .map((_, i) => {
      const a0 = (i / n) * 360;
      const a1 = ((i + 1) / n) * 360;
      return `${colors[i % colors.length]} ${a0}deg ${a1}deg`;
    })
    .join(", ");
  return (
    <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(from -90deg, ${stops})` }}>
      {/* divider lines */}
      {labels.map((_, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 w-[1px] h-1/2 origin-top bg-black/40"
          style={{ transform: `rotate(${(i / n) * 360 - 90}deg)` }}
        />
      ))}
      {/* labels */}
      {labels.map((lb, i) => {
        const mid = ((i + 0.5) / n) * 360 - 90;
        const rad = (mid * Math.PI) / 180;
        // place text outward from center
        const r = 34; // %
        const x = 50 + r * Math.cos(rad);
        const y = 50 + r * Math.sin(rad);
        return (
          <span
            key={i}
            className="absolute text-[9px] sm:text-[10px] md:text-[11px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] whitespace-nowrap pointer-events-none"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: `translate(-50%, -50%) rotate(${mid + 90}deg)`,
            }}
          >
            {lb}
          </span>
        );
      })}
      <div className="absolute inset-[28%] sm:inset-[30%] rounded-full bg-neutral-950/95 border border-white/20 shadow-inner" />
    </div>
  );
}

export default function SuKienPage() {
  const coins = useEventStore((s) => s.coins);
  const totalEarned = useEventStore((s) => s.totalEarned);
  const vipPoints = useEventStore((s) => s.vipPoints || 0);
  const missionProgress = useEventStore((s) => s.missionProgress);
  const missionClaimCount = useEventStore((s) => s.missionClaimCount);
  const inventory = useEventStore((s) => s.inventory);
  const liveFeed = useEventStore((s) => s.liveFeed);
  const equippedFrame = useEventStore((s) => s.equippedFrame);
  const equippedBadge = useEventStore((s) => s.equippedBadge);
  const boostExpiresAt = useEventStore((s) => s.boostExpiresAt);
  const vipExpiresAt = useEventStore((s) => s.vipExpiresAt);
  const claimCheckIn = useEventStore((s) => s.claimCheckIn);
  const getStreakStatus = useEventStore((s) => s.getStreakStatus);
  const claimMission = useEventStore((s) => s.claimMission);
  const ensureMissionDay = useEventStore((s) => s.ensureMissionDay);
  const addMissionProgress = useEventStore((s) => s.addMissionProgress);
  const dailyMissionSummary = useEventStore((s) => s.dailyMissionSummary);
  const buyShopItem = useEventStore((s) => s.buyShopItem);
  const equipItem = useEventStore((s) => s.equipItem);
  const activateItem = useEventStore((s) => s.activateItem);
  const luckySpin = useEventStore((s) => s.luckySpin);
  const openMysteryBox = useEventStore((s) => s.openMysteryBox);
  const addNotif = useNotifStore((s) => s.add);

  const [tab, setTab] = useState<TabId>("missions");
  const [toast, setToast] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [spinLabel, setSpinLabel] = useState<string | null>(null);
  const [burst, setBurst] = useState(false);
  const [prizeModal, setPrizeModal] = useState<{ label: string; message: string } | null>(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [status, setStatus] = useState({
    streakDay: 0,
    canClaim: true,
    missed: false,
    todayReward: 10,
    cycleDay: 1,
  });
  const [summary, setSummary] = useState({ done: 0, total: DAILY_MISSIONS.length, pct: 0 });

  useEffect(() => {
    try {
      ensureMissionDay();
      addMissionProgress("openEvent", 1);
      setStatus(getStreakStatus());
      setSummary(dailyMissionSummary());
    } catch (e) {
      console.error(e);
    }
  }, [addMissionProgress, dailyMissionSummary, ensureMissionDay, getStreakStatus]);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const tickerItems = useMemo(() => {
    const live = (liveFeed || []).map((x) => x.text);
    return [...live, ...COMMUNITY_TICKER].slice(0, 12);
  }, [liveFeed]);

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  const onCheckIn = () => {
    const r = claimCheckIn();
    flash(r.message);
    if (r.ok) {
      useOpusPassStore.getState().addXp(40);
      addNotif({ kind: "mission", title: "Điểm danh", body: r.message, href: "/su-kien" });
      setStatus(getStreakStatus());
    }
  };

  const onClaimMission = (id: MissionId, title: string) => {
    const r = claimMission(id);
    flash(r.message);
    if (r.ok) {
      useOpusPassStore.getState().addXp(60);
      addNotif({ kind: "mission", title: "Nhiệm vụ", body: `${title}: ${r.message}`, href: "/su-kien" });
      setSummary(dailyMissionSummary());
    }
  };

  const onBuy = (shopId: string) => {
    if (shopId.startsWith("pass_xp_")) {
      const r = useOpusPassStore.getState().buyXpPack(shopId);
      flash(r.message);
      if (r.ok) addNotif({ kind: "mission", title: "Pass XP", body: r.message, href: "/su-kien" });
      return;
    }
    const r = buyShopItem(shopId);
    flash(r.message);
    if (r.ok) addNotif({ kind: "mission", title: "Cửa hàng", body: r.message, href: "/su-kien" });
  };

  const onEquip = (id: string) => {
    const r = equipItem(id);
    flash(r.message);
  };

  const onActivate = (id: string) => {
    const r = activateItem(id);
    flash(r.message);
    if (r.ok) addNotif({ kind: "mission", title: "Kho đồ", body: r.message, href: "/su-kien" });
  };

  const onOpenBox = (id: string) => {
    const r = openMysteryBox(id);
    flash(r.message);
    if (r.ok) {
      setPrizeModal({ label: "Hộp quà", message: r.message });
      addNotif({ kind: "mission", title: "Hộp quà", body: r.message, href: "/su-kien" });
    }
  };

  const wheelLabels = SPIN_REWARDS.map((r) => r.label.replace("Hộp quà", "Hộp").replace("Thẻ 1 tập", "1 tập"));

  const onSpin = () => {
    if (spinning) return;
    const preview = luckySpin();
    if (!preview.ok) {
      flash(preview.message);
      return;
    }
    setSpinning(true);
    setBurst(false);
    setPrizeModal(null);
    // Align roughly to segment (equal slices)
    const n = SPIN_REWARDS.length;
    const idx = Math.max(0, SPIN_REWARDS.findIndex((x) => x.label === preview.label || x.id === (preview as { label?: string }).label));
    const seg = 360 / n;
    const targetMid = idx >= 0 ? idx * seg + seg / 2 : Math.random() * 360;
    const extra = 360 * 5 + (360 - (targetMid % 360));
    setSpinDeg((d) => d + extra);
    window.setTimeout(() => {
      setSpinning(false);
      setSpinLabel(preview.label || preview.message);
      setBurst(true);
      setPrizeModal({ label: preview.label || "Phần thưởng", message: preview.message });
      flash(preview.message);
      addNotif({ kind: "mission", title: "Vòng quay", body: preview.message, href: "/su-kien" });
      window.setTimeout(() => setBurst(false), 1600);
    }, 3200);
  };

  const boostOn = !!(boostExpiresAt && boostExpiresAt > Date.now());
  const vipOn = !!(vipExpiresAt && vipExpiresAt > Date.now());

  const tabs: { id: TabId; label: string; icon: typeof Flame }[] = [
    { id: "missions", label: "Điểm danh", icon: Flame },
    { id: "pass", label: "Opus Pass", icon: Ticket },
    { id: "shop", label: "Cửa hàng", icon: ShoppingBag },
    { id: "inventory", label: "Kho đồ", icon: Package },
  ];

  return (
    <div className="min-h-[100dvh] pt-[calc(var(--nav-h,3.5rem)+env(safe-area-inset-top,0px)+0.5rem)] pb-28 px-3 sm:px-4 md:px-6 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto relative">
      {/* Canvas + Hello giữ nguyên */}
      <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] max-h-[220px] rounded-2xl overflow-hidden mb-3 border border-white/10 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <EventCanvas />
        <AppleHello />
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      {/* Live ticker */}
      <div className="mb-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
          <div className="overflow-hidden flex-1">
            <div className="flex gap-8 whitespace-nowrap animate-[ticker_28s_linear_infinite] text-[11px] text-zinc-300">
              {tickerItems.concat(tickerItems).map((t, i) => (
                <span key={i}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Trang chủ
        </Link>
        <div className="flex items-center gap-2">
          {vipOn && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30 flex items-center gap-1 tabular-nums">
              <Crown className="w-3 h-3" /> VIP {fmtRemain((vipExpiresAt || 0) - nowTick)}
            </span>
          )}
          {boostOn && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30 flex items-center gap-1 tabular-nums">
              <Zap className="w-3 h-3" /> x2 {fmtRemain((boostExpiresAt || 0) - nowTick)}
            </span>
          )}
          <div className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 bg-amber-500/15 border border-amber-400/30 text-amber-200 text-sm font-semibold">
            <Coins className="w-4 h-4" />
            {coins}
          </div>
        </div>
      </div>

      {toast && (
        <div className="mb-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 backdrop-blur-md">
          {toast}
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 p-1 mb-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl">
        {tabs.map((t) => {
          const Icon = t.icon;
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative flex flex-col items-center gap-0.5 rounded-xl px-0.5 py-2 text-[9px] sm:text-[11px] transition-all duration-300 ${
                on
                  ? "bg-white/10 text-white shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className={`w-4 h-4 ${on ? "text-rose-400" : ""}`} />
              <span className="leading-tight text-center line-clamp-2">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Lucky Spin — luôn hiện phía trên nội dung tab */}
      
      {/* Lucky Spin */}
      <section className="rounded-2xl sm:rounded-3xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-3 sm:p-5 md:p-6 mb-4 relative overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            <Disc3 className={`w-4 h-4 sm:w-5 sm:h-5 text-rose-400 ${spinning ? "animate-spin" : ""}`} />
            Vòng quay may mắn
          </h2>
          <span className="text-[10px] sm:text-xs text-zinc-400 shrink-0">{SPIN_COST} xu / lượt</span>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
          <div className="relative w-[min(72vw,260px)] h-[min(72vw,260px)] sm:w-[280px] sm:h-[280px] md:w-[300px] md:h-[300px] shrink-0">
            <div
              className="absolute inset-0 rounded-full border-[3px] sm:border-4 border-white/25 shadow-[0_0_40px_rgba(244,63,94,0.3)] transition-transform duration-[3200ms] ease-out"
              style={{ transform: `rotate(${spinDeg}deg)` }}
            >
              <WheelFace labels={wheelLabels} colors={WHEEL_COLORS} />
            </div>
            <div className="absolute inset-[28%] sm:inset-[30%] rounded-full bg-neutral-950/95 border border-white/15 flex items-center justify-center text-center px-2 z-10 pointer-events-none">
              <span className="text-[10px] sm:text-xs text-zinc-200 leading-snug font-medium">
                {spinLabel || "Chúc may mắn"}
              </span>
            </div>
            {/* pointer */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 drop-shadow-lg">
              <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[16px] border-l-transparent border-r-transparent border-t-rose-400" />
            </div>
            {burst && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-30">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-amber-300 animate-ping"
                    style={{
                      transform: `rotate(${i * (360 / 14)}deg) translateY(-46%)`,
                      animationDuration: "0.9s",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 w-full min-w-0 space-y-3">
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Mỗi phần trên vòng là một phần thưởng riêng. Kim chỉ vào ô trúng.
            </p>
            <ul className="grid grid-cols-2 gap-1.5 text-[10px] sm:text-[11px] text-zinc-300">
              {SPIN_REWARDS.map((r, i) => (
                <li
                  key={r.id}
                  className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/20"
                    style={{ background: WHEEL_COLORS[i % WHEEL_COLORS.length] }}
                  />
                  <span className="truncate">{r.label}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              disabled={spinning || coins < SPIN_COST}
              onClick={onSpin}
              className="w-full rounded-xl py-2.5 sm:py-3 text-sm font-semibold bg-gradient-to-r from-rose-600 to-fuchsia-600 text-white disabled:opacity-40 bounce-press shadow-[0_0_24px_rgba(244,63,94,0.35)] transition-all duration-500"
            >
              {spinning ? "Đang quay…" : `Quay · ${SPIN_COST} xu`}
            </button>
          </div>
        </div>
      </section>

      {/* Prize modal liquid glass */}
      {prizeModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm transition-opacity duration-500"
          onClick={() => setPrizeModal(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/15 bg-white/[0.08] backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 text-center animate-[fadeUp_0.5s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400/30 to-rose-500/30 border border-white/20 flex items-center justify-center text-2xl">
              🎁
            </div>
            <p className="text-xs uppercase tracking-wider text-zinc-400 mb-1">Phần thưởng</p>
            <h3 className="text-xl font-bold text-white mb-2">{prizeModal.label}</h3>
            <p className="text-sm text-zinc-300 mb-5">{prizeModal.message}</p>
            <button
              type="button"
              onClick={() => setPrizeModal(null)}
              className="w-full rounded-xl py-2.5 text-sm font-semibold bg-white text-black transition-all duration-500 hover:scale-[1.02] active:scale-95"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
{tab === "missions" && (
        <>
          <section className="glass-panel p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-400" />
                Chuỗi {status.cycleDay}/7
              </h2>
              <span className="text-xs text-zinc-400">
                Chuỗi: <strong className="text-white">{status.streakDay}</strong>
              </span>
            </div>
            {status.missed && (
              <p className="text-[11px] text-rose-300/90 mb-2">Đã mất chuỗi — bắt đầu lại từ ngày 1.</p>
            )}
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {CHECKIN_REWARDS.map((rw, i) => {
                const day = i + 1;
                const done = status.streakDay >= day && !status.canClaim
                  ? true
                  : status.streakDay > i;
                const today = status.cycleDay === day;
                return (
                  <div
                    key={day}
                    className={`rounded-lg py-2 text-center border text-[10px] ${
                      done
                        ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-200"
                        : today
                          ? "bg-rose-500/15 border-rose-400/40 text-rose-100"
                          : "bg-white/5 border-white/10 text-zinc-500"
                    }`}
                  >
                    <div className="font-medium">D{day}</div>
                    <div>+{rw}</div>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!status.canClaim}
              onClick={onCheckIn}
              className="w-full rounded-xl py-2.5 text-sm font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-black disabled:opacity-40 bounce-press"
            >
              {status.canClaim ? `Nhận điểm danh +${status.todayReward} xu` : "Đã điểm danh hôm nay"}
            </button>
          </section>

          <section className="glass-panel p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-violet-400" />
                Nhiệm vụ ngày
              </h2>
              <span className="text-[11px] text-zinc-400">
                Đã nhận {summary.done} lần
              </span>
            </div>
            <ul className="space-y-2.5 max-h-[55vh] overflow-y-auto custom-scroll">
              {DAILY_MISSIONS.map((m) => {
                const claims = missionClaimCount?.[m.id] || 0;
                const cur = missionProgress?.[m.id] || 0;
                const inCycle =
                  cur % m.target === 0 && cur > 0 ? m.target : cur % m.target;
                const displayCur =
                  cur >= m.target
                    ? Math.min(m.target, inCycle || m.target)
                    : cur % m.target;
                const pct = Math.min(100, Math.round((displayCur / m.target) * 100));
                const canClaim = cur >= m.target;
                return (
                  <li
                    key={m.id}
                    className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium">{m.title}</p>
                        <p className="text-[11px] text-zinc-500">
                          {m.desc} · Đã nhận {claims} lần · Không giới hạn
                        </p>
                      </div>
                      <span className="text-xs text-amber-300 shrink-0 font-semibold">
                        +{MISSION_REWARD}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-2">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-zinc-500">
                        {fmtProgress(displayCur, m.target, m.unit)}
                      </span>
                      <button
                        type="button"
                        disabled={!canClaim}
                        onClick={() => onClaimMission(m.id, m.title)}
                        className="text-xs px-3 py-1 rounded-full font-medium disabled:opacity-40 bg-amber-500/20 text-amber-200 border border-amber-400/30 bounce-press"
                      >
                        {canClaim ? `Nhận +${MISSION_REWARD}` : "Đang làm"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <RedeemCashPanel />

          <section className="glass-panel p-4 text-sm text-zinc-400 space-y-2">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4" /> Dùng xu
            </h2>
            <p>
              1 tập: <strong className="text-amber-300">{UNLOCK_COST.episode} xu</strong> · Cả
              phim: <strong className="text-amber-300">{UNLOCK_COST.movie} xu</strong>
            </p>
            <p className="text-xs">
              Tổng đã kiếm: <span className="text-white">{totalEarned.toLocaleString("vi-VN")}</span> xu
            </p>
            <p className="text-xs">
              Điểm VIP: <span className="text-amber-300">{vipPoints.toLocaleString("vi-VN")}</span> (đổi xu trong Cửa hàng để tăng)
            </p>
          </section>
        </>
      )}

      {tab === "pass" && (
        <OpusPassPanel
          onFlash={flash}
          onNotif={(title, body) => addNotif({ kind: "mission", title, body, href: "/su-kien" })}
        />
      )}

      {tab === "shop" && (
        <section className="space-y-3">
          <p className="text-xs text-zinc-400 px-1">
            Đổi xu lấy vật phẩm ảo. Vật phẩm vào <strong className="text-zinc-200">Kho đồ</strong> để trang bị hoặc kích hoạt.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SHOP_ITEMS.map((item) => {
              const can = coins >= item.cost;
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] flex flex-col"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-2xl leading-none">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white leading-tight">{item.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <span className="text-amber-300 text-sm font-semibold inline-flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5" />
                      {item.cost}
                    </span>
                    <button
                      type="button"
                      disabled={!can}
                      onClick={() => onBuy(item.id)}
                      className="text-xs px-3 py-1.5 rounded-full font-medium disabled:opacity-40 bg-rose-600/90 hover:bg-rose-500 text-white bounce-press"
                    >
                      Đổi ngay
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {tab === "inventory" && (
        <section className="space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-3 text-xs text-zinc-400 space-y-2 transition-all duration-500">
            <div className="flex flex-wrap gap-2">
              <span>
                Khung:{" "}
                <strong className="text-zinc-200">{equippedFrame || "Chưa trang bị"}</strong>
              </span>
              <span className="text-zinc-600">·</span>
              <span>
                Huy hiệu:{" "}
                <strong className="text-zinc-200">{equippedBadge || "Chưa trang bị"}</strong>
              </span>
            </div>
            {(boostOn || vipOn) && (
              <div className="flex flex-wrap gap-2 pt-1 border-t border-white/10">
                {boostOn && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-violet-500/15 border border-violet-400/30 text-violet-200 tabular-nums">
                    <Zap className="w-3 h-3" /> x2 còn {fmtRemain((boostExpiresAt || 0) - nowTick)}
                  </span>
                )}
                {vipOn && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 bg-amber-500/15 border border-amber-400/30 text-amber-200 tabular-nums">
                    <Crown className="w-3 h-3" /> VIP còn {fmtRemain((vipExpiresAt || 0) - nowTick)}
                  </span>
                )}
              </div>
            )}
          </div>
          {(inventory || []).length === 0 ? (
            <div className="glass-panel p-8 text-center text-sm text-zinc-500">
              Kho trống. Hãy đổi quà ở Cửa hàng hoặc quay Vòng quay.
            </div>
          ) : (
            <ul className="space-y-2">
              {(inventory || []).map((it) => {
                const isEquip = it.kind === "frame" || it.kind === "badge";
                const isAct =
                  it.kind === "boost" || it.kind === "vip" || it.kind === "unlock";
                return (
                  <li
                    key={it.id}
                    className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 flex items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-white font-medium truncate">{it.name}</p>
                      <p className="text-[11px] text-zinc-500">
                        x{it.qty}
                        {it.meta ? ` · ${it.meta}` : ""}
                      </p>
                    </div>
                    {it.kind === "mystery" && (
                      <button
                        type="button"
                        onClick={() => onOpenBox(it.id)}
                        className="text-xs px-3 py-1.5 rounded-full bg-amber-500/25 text-amber-100 border border-amber-400/40 bounce-press font-semibold"
                      >
                        Mở
                      </button>
                    )}
                    {isEquip && (
                      <button
                        type="button"
                        onClick={() => onEquip(it.id)}
                        className="text-xs px-3 py-1.5 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30 bounce-press"
                      >
                        Trang bị
                      </button>
                    )}
                    {isAct && (
                      <button
                        type="button"
                        onClick={() => onActivate(it.id)}
                        className="text-xs px-3 py-1.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-400/30 bounce-press"
                      >
                        Kích hoạt
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      <style jsx global>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
