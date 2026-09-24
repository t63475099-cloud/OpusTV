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
  formatCoins,
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
  const [summary, setSummary] = useState({
    done: 0,
    total: DAILY_MISSIONS.length,
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
      try {
        useOpusPassStore.getState().addXp(40);
      } catch {
        /* */
      }
      addNotif({ kind: "mission", title: "Điểm danh", body: r.message, href: "/su-kien" });
      setStatus(getStreakStatus());
    }
  };

  const onClaimMission = (id: MissionId, title: string) => {
    const r = claimMission(id);
    flash(r.message);
    if (r.ok) {
      try {
        useOpusPassStore.getState().addXp(60);
      } catch {
        /* */
      }
      addNotif({
        kind: "mission",
        title: "Nhiệm vụ",
        body: `${title}: ${r.message}`,
        href: "/su-kien",
      });
      setSummary(dailyMissionSummary());
    }
  };

  const onBuy = (shopId: string) => {
    if (shopId.startsWith("pass_xp_")) {
      try {
        const r = useOpusPassStore.getState().buyXpPack(shopId);
        flash(r.message);
        if (r.ok)
          addNotif({ kind: "mission", title: "Pass XP", body: r.message, href: "/su-kien" });
      } catch (e) {
        flash("Không mua được gói Pass");
      }
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

  const wheelLabels = SPIN_REWARDS.map((r) =>
    r.label.replace("Hộp quà", "Hộp").replace("Thẻ 1 tập", "1 tập")
  );

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
    const n = SPIN_REWARDS.length || 8;
    const extra = 360 * 5 + Math.floor(Math.random() * 360);
    setSpinDeg((d) => d + extra);
    window.setTimeout(() => {
      setSpinning(false);
      setSpinLabel(preview.label || preview.message);
      setBurst(true);
      setPrizeModal({
        label: preview.label || "Phần thưởng",
        message: preview.message,
      });
      flash(preview.message);
      addNotif({ kind: "mission", title: "Vòng quay", body: preview.message, href: "/su-kien" });
      window.setTimeout(() => setBurst(false), 1600);
    }, 2800);
  };

  const tabs: { id: TabId; label: string; icon: typeof Flame }[] = [
    { id: "missions", label: "Nhiệm vụ", icon: Flame },
    { id: "shop", label: "Cửa hàng", icon: ShoppingBag },
    { id: "inventory", label: "Kho đồ", icon: Package },
    { id: "pass", label: "Pass", icon: Crown },
  ];

  return (
    <div
      data-event-ui="social-v2"
      className="min-h-[100dvh] bg-black text-white"
      style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom, 0px))" }}
    >
      <div className="mx-auto w-full max-w-lg sm:max-w-xl lg:max-w-2xl">
        <header
          className="sticky top-0 z-30 flex items-center gap-2 border-b border-[#1a1a1a] bg-black/95 px-3 backdrop-blur-md"
          style={{
            paddingTop: "max(0.5rem, env(safe-area-inset-top))",
            paddingBottom: "0.5rem",
          }}
        >
          <Link
            href="/home"
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-white/10"
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold">Sự kiện</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-[#1c1c1e] px-3 py-1.5">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-semibold tabular-nums">
              {formatCoins(coins)}
            </span>
          </div>
        </header>

        <section className="px-4 pb-3 pt-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-[#27272a] bg-[#121212] px-2 py-3">
              <p className="text-lg font-bold tabular-nums">
                {formatCoins(coins)}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Xu hiện có</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#121212] px-2 py-3">
              <p className="text-lg font-bold tabular-nums">{status.streakDay}</p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Chuỗi ngày</p>
            </div>
            <div className="rounded-2xl border border-[#27272a] bg-[#121212] px-2 py-3">
              <p className="text-lg font-bold tabular-nums">
                {summary.done}/{summary.total}
              </p>
              <p className="mt-0.5 text-[11px] text-zinc-500">Nhiệm vụ</p>
            </div>
          </div>

          {(boostExpiresAt > nowTick || vipExpiresAt > nowTick) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {boostExpiresAt > nowTick && (
                <span className="rounded-full bg-[#1c1c1e] px-2.5 py-1 text-[11px] text-zinc-300">
                  x2 xu · còn {fmtRemain(boostExpiresAt - nowTick)}
                </span>
              )}
              {vipExpiresAt > nowTick && (
                <span className="rounded-full bg-[#1c1c1e] px-2.5 py-1 text-[11px] text-zinc-300">
                  VIP · còn {fmtRemain(vipExpiresAt - nowTick)}
                </span>
              )}
            </div>
          )}

          <div className="mt-3 overflow-hidden rounded-xl border border-[#27272a] bg-[#121212]">
            <div
              className="flex whitespace-nowrap py-2 text-[11px] text-zinc-400"
              style={{ animation: "event-ticker 28s linear infinite" }}
            >
              {[...tickerItems, ...tickerItems].map((tx, i) => (
                <span key={i} className="mx-4 shrink-0">
                  {tx}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="sticky top-12 z-20 border-b border-[#1a1a1a] bg-black/95 backdrop-blur-md">
          <div className="flex">
            {tabs.map((item) => {
              const on = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative flex-1 py-3 text-center text-sm font-semibold transition-colors ${
                    on ? "text-white" : "text-zinc-500"
                  }`}
                >
                  {item.label}
                  {on ? (
                    <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-white" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-4 px-3 py-4 sm:px-4">
          <section className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <Disc3 className="h-4 w-4 text-amber-400" />
                Vòng quay
              </h2>
              <span className="text-xs text-zinc-500">{SPIN_COST} xu / lượt</span>
            </div>
            <div className="relative mx-auto mb-3 h-52 w-52">
              <div
                className="absolute inset-0 rounded-full border border-[#3f3f46] transition-transform duration-[2800ms] ease-out"
                style={{ transform: `rotate(${spinDeg}deg)` }}
              >
                <WheelFace
                  labels={wheelLabels}
                  colors={[
                    "#1c1c1e",
                    "#27272a",
                    "#1c1c1e",
                    "#27272a",
                    "#1c1c1e",
                    "#27272a",
                    "#1c1c1e",
                    "#27272a",
                  ]}
                />
              </div>
              <div className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
                <div className="h-0 w-0 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-amber-400" />
              </div>
              {burst ? (
                <div className="pointer-events-none absolute inset-0 animate-pulse rounded-full bg-amber-400/10" />
              ) : null}
            </div>
            <button
              type="button"
              disabled={spinning || coins < SPIN_COST}
              onClick={onSpin}
              className="h-11 w-full rounded-xl bg-[#0084ff] text-sm font-semibold disabled:opacity-40"
            >
              {spinning ? "Đang quay…" : spinLabel ? `Kết quả: ${spinLabel}` : "Quay ngay"}
            </button>
          </section>

          {tab === "missions" && (
            <>
              <section className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold">
                    <Flame className="h-4 w-4 text-orange-400" />
                    Điểm danh {status.cycleDay}/7
                  </h2>
                  <span className="text-xs text-zinc-500">
                    Chuỗi <strong className="text-white">{status.streakDay}</strong>
                  </span>
                </div>
                {status.missed ? (
                  <p className="mb-2 text-[11px] text-rose-400">
                    Đã mất chuỗi — bắt đầu lại từ ngày 1.
                  </p>
                ) : null}
                <div className="mb-3 grid grid-cols-7 gap-1.5">
                  {CHECKIN_REWARDS.map((rw, i) => {
                    const day = i + 1;
                    const done = status.streakDay > i;
                    const today = status.cycleDay === day;
                    return (
                      <div
                        key={day}
                        className={`rounded-lg border py-2 text-center text-[10px] ${
                          done
                            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                            : today
                              ? "border-[#0084ff]/50 bg-[#0084ff]/15 text-white"
                              : "border-[#27272a] bg-[#0a0a0a] text-zinc-500"
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
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-sm font-semibold text-black disabled:opacity-40"
                >
                  {status.canClaim
                    ? `Nhận +${status.todayReward} xu`
                    : "Đã điểm danh hôm nay"}
                </button>
              </section>

              <section className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">Nhiệm vụ ngày</h2>
                  <span className="text-xs text-zinc-500">{summary.pct}%</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-[#0084ff] transition-all duration-500"
                    style={{ width: `${summary.pct}%` }}
                  />
                </div>
                <ul className="space-y-2">
                  {DAILY_MISSIONS.map((m) => {
                    const prog = missionProgress?.[m.id] ?? 0;
                    const claimed = missionClaimCount?.[m.id] ?? 0;
                    const max = m.maxClaims ?? 10;
                    const doneEnough = prog >= m.target;
                    const canClaim = doneEnough && claimed < max;
                    return (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{m.title}</p>
                          <p className="text-[11px] text-zinc-500">
                            {fmtProgress(prog, m.target, m.unit)} · {MISSION_REWARD} xu
                            {claimed > 0 ? ` · đã nhận ${claimed}/${max}` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          disabled={!canClaim}
                          onClick={() => onClaimMission(m.id, m.title)}
                          className="h-9 shrink-0 rounded-lg bg-[#0084ff] px-3 text-xs font-semibold disabled:bg-[#1c1c1e] disabled:text-zinc-500"
                        >
                          {claimed >= max ? "Xong" : canClaim ? "Nhận" : "Chưa đủ"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <section className="rounded-2xl border border-[#27272a] bg-[#121212] p-4">
                <h2 className="mb-2 text-sm font-semibold">Đổi xu lấy tiền</h2>
                <RedeemCashPanel />
              </section>
            </>
          )}

          {tab === "pass" && (
            <section className="rounded-2xl border border-[#27272a] bg-[#121212] p-3 sm:p-4">
              <OpusPassPanel />
            </section>
          )}

          {tab === "shop" && (
            <section className="space-y-2">
              <p className="px-1 text-xs text-zinc-500">
                Mở khóa khoảng {formatCoins(UNLOCK_COST)} xu / lần
              </p>
              {SHOP_ITEMS.map((item) => {
                const afford = coins >= item.cost;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#27272a] bg-[#121212] p-3"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1c1c1e]">
                      <Gift className="h-5 w-5 text-zinc-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="line-clamp-2 text-[11px] text-zinc-500">{item.desc}</p>
                      <p className="mt-0.5 text-xs font-semibold tabular-nums text-amber-400">
                        {item.cost.toLocaleString("vi-VN")} xu
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={!afford}
                      onClick={() => onBuy(item.id)}
                      className="h-9 shrink-0 rounded-lg bg-[#0084ff] px-3 text-xs font-semibold disabled:opacity-40"
                    >
                      Đổi
                    </button>
                  </div>
                );
              })}
            </section>
          )}

          {tab === "inventory" && (
            <section className="space-y-2">
              {(equippedFrame || equippedBadge) && (
                <div className="mb-1 flex flex-wrap gap-2">
                  {equippedFrame ? (
                    <span className="rounded-full bg-[#1c1c1e] px-2.5 py-1 text-[11px] text-zinc-300">
                      Khung đang dùng
                    </span>
                  ) : null}
                  {equippedBadge ? (
                    <span className="rounded-full bg-[#1c1c1e] px-2.5 py-1 text-[11px] text-zinc-300">
                      Huy hiệu đang dùng
                    </span>
                  ) : null}
                </div>
              )}
              {!(inventory || []).length ? (
                <div className="rounded-2xl border border-[#27272a] bg-[#121212] p-8 text-center text-sm text-zinc-500">
                  Kho đồ trống. Đổi quà ở Cửa hàng hoặc quay Vòng quay.
                </div>
              ) : (
                (inventory || []).map((it) => {
                  const isEquip = it.kind === "frame" || it.kind === "badge";
                  const isAct =
                    it.kind === "boost" || it.kind === "vip" || it.kind === "unlock";
                  return (
                    <div
                      key={it.id}
                      className="flex items-center gap-3 rounded-2xl border border-[#27272a] bg-[#121212] p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{it.name}</p>
                        <p className="text-[11px] text-zinc-500">
                          x{it.qty}
                          {it.meta ? ` · ${it.meta}` : ""}
                        </p>
                      </div>
                      {it.kind === "mystery" ? (
                        <button
                          type="button"
                          onClick={() => onOpenBox(it.id)}
                          className="h-9 rounded-lg bg-amber-500/20 px-3 text-xs font-semibold text-amber-200"
                        >
                          Mở
                        </button>
                      ) : null}
                      {isEquip ? (
                        <button
                          type="button"
                          onClick={() => onEquip(it.id)}
                          className="h-9 rounded-lg bg-[#1c1c1e] px-3 text-xs font-semibold"
                        >
                          Trang bị
                        </button>
                      ) : null}
                      {isAct ? (
                        <button
                          type="button"
                          onClick={() => onActivate(it.id)}
                          className="h-9 rounded-lg bg-[#0084ff]/20 px-3 text-xs font-semibold text-sky-300"
                        >
                          Kích hoạt
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
            </section>
          )}
        </div>
      </div>

      {toast ? (
        <div
          role="status"
          className="fixed left-1/2 z-[200] max-w-[90vw] -translate-x-1/2 rounded-full border border-[#27272a] bg-[#1c1c1e] px-4 py-2.5 text-sm font-medium shadow-2xl"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))" }}
        >
          {toast}
        </div>
      ) : null}

      {prizeModal ? (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-[#27272a] bg-[#121212] p-5 text-center">
            <Sparkles className="mx-auto mb-2 h-8 w-8 text-amber-400" />
            <h3 className="mb-2 text-lg font-bold">{prizeModal.label}</h3>
            <p className="mb-5 text-sm text-zinc-400">{prizeModal.message}</p>
            <button
              type="button"
              onClick={() => setPrizeModal(null)}
              className="h-11 w-full rounded-xl bg-[#0084ff] text-sm font-semibold"
            >
              Đóng
            </button>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes event-ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
