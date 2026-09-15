"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Shield,
  ExternalLink,
  Users,
  BadgeCheck,
  Ban,
  Bell,
  Coins,
  Flame,
} from "lucide-react";
import DashboardCanvasBg from "@/components/admin/DashboardCanvasBg";
import AdminIdentityCard from "@/components/admin/AdminIdentityCard";
import HubResumeCards from "@/components/admin/HubResumeCards";
import SocialPulseCard, {
  type PulseItem,
} from "@/components/admin/SocialPulseCard";
import ActivityMatrix from "@/components/admin/ActivityMatrix";
import GlassCard from "@/components/admin/GlassCard";

type Stats = Record<string, number>;

const STAT_META: {
  k: string;
  label: string;
  icon: typeof Users;
  accent: string;
}[] = [
  { k: "users", label: "Người dùng", icon: Users, accent: "text-white" },
  { k: "verified", label: "Tích xanh", icon: BadgeCheck, accent: "text-sky-300" },
  { k: "bans", label: "Đang khóa", icon: Ban, accent: "text-rose-300" },
  { k: "alerts", label: "Cảnh báo mở", icon: Bell, accent: "text-amber-300" },
  { k: "coinGrants", label: "Lần cấp xu", icon: Coins, accent: "text-yellow-300" },
  { k: "streakGrants", label: "Đơn chuỗi", icon: Flame, accent: "text-orange-300" },
];

export default function AdminDashboardPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [pulse, setPulse] = useState<PulseItem[]>([]);
  const [series, setSeries] = useState([14, 19, 11, 24, 17, 30, 22]);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret.trim(),
    }),
    [secret]
  );

  const load = useCallback(async () => {
    if (!secret.trim()) return;
    setBusy(true);
    setErr("");
    try {
      const [st, mod, ap, rp, us] = await Promise.all([
        fetch("/api/admin/stats", { headers: headers() }),
        fetch("/api/admin/moderation", { headers: headers() }),
        fetch("/api/ban/appeal", { headers: headers() }),
        fetch("/api/report-stream", { headers: headers() }),
        fetch("/api/admin/users", { headers: headers() }),
      ]);
      const stData = await st.json().catch(() => ({}));
      const usData = await us.json().catch(() => ({}));

      if (us.ok && usData.ok) setUnlocked(true);
      else if (st.ok && stData.ok) setUnlocked(true);
      else if (mod.ok) setUnlocked(true);
      else {
        setErr(stData.error || usData.error || "Sai mã hoặc không tải được");
        setUnlocked(false);
        return;
      }

      if (stData?.stats) setStats(stData.stats);
      else if (usData?.total != null) {
        setStats({
          users: Number(usData.total) || 0,
          verified: 0,
          bans: 0,
          alerts: 0,
          coinGrants: 0,
          streakGrants: 0,
        });
      }

      const items: PulseItem[] = [];
      const md = await mod.json().catch(() => ({}));
      if (md.ok && Array.isArray(md.alerts)) {
        for (const a of md.alerts.slice(0, 4)) {
          items.push({
            id: `a-${a.id}`,
            title: `@${a.username || "user"} · cảnh báo`,
            detail: String(a.detail || a.kind || ""),
            time: a.created_at
              ? new Date(String(a.created_at)).toLocaleString("vi-VN")
              : undefined,
            kind: "alert",
            unread: String(a.status || "open") === "open",
          });
        }
      }
      const apd = await ap.json().catch(() => ({}));
      if (apd.ok && Array.isArray(apd.appeals)) {
        for (const a of apd.appeals
          .filter((x: { status: string }) => x.status === "pending")
          .slice(0, 3)) {
          items.push({
            id: `p-${a.id}`,
            title: `Khiếu nại · @${a.username}`,
            detail: String(a.message || "").slice(0, 120),
            kind: "appeal",
            unread: true,
          });
        }
      }
      const rpd = await rp.json().catch(() => ({}));
      if (rpd.ok && Array.isArray(rpd.reports)) {
        for (const r of rpd.reports.slice(0, 3)) {
          items.push({
            id: `r-${r.id}`,
            title: `Báo lỗi · ${r.slug}`,
            detail: String(r.note || r.episode || ""),
            kind: "report",
          });
        }
      }
      setPulse(items);

      const base = Number(usData?.total || stData?.stats?.users || 20);
      setSeries([
        Math.max(3, Math.round(base * 0.4 + Math.random() * 8)),
        Math.max(3, Math.round(base * 0.5 + Math.random() * 8)),
        Math.max(3, Math.round(base * 0.35 + Math.random() * 6)),
        Math.max(3, Math.round(base * 0.6 + Math.random() * 10)),
        Math.max(3, Math.round(base * 0.45 + Math.random() * 7)),
        Math.max(3, Math.round(base * 0.7 + Math.random() * 12)),
        Math.max(3, Math.round(base * 0.55 + Math.random() * 9)),
      ]);
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  }, [headers, secret]);

  useEffect(() => {
    try {
      const s = sessionStorage.getItem("opus_admin_secret");
      if (s) setSecret(s);
    } catch {
      /* */
    }
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [unlocked, load]);

  const statCards = useMemo(() => {
    const s = stats || {};
    return STAT_META.map((m) => ({ ...m, v: s[m.k] }));
  }, [stats]);

  return (
    <div className="min-h-[100dvh] text-zinc-100 relative overflow-x-hidden">
      <DashboardCanvasBg />

      {/* Hero banner kiểu trang chủ */}
      <div className="relative">
        <div className="absolute inset-0 h-[280px] sm:h-[320px] overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-700/40 via-fuchsia-900/25 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(244,63,94,0.35),transparent_50%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07070a] via-[#07070a]/50 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-8 sm:pt-10 pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-rose-900/40 border border-white/10">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-zinc-300/90 mt-0.5">
                  Tổng quan vận hành OpusFilm
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/verify"
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-full border border-white/15 bg-black/30 backdrop-blur hover:bg-white/10 transition-all duration-500"
              >
                <Shield className="w-3.5 h-3.5 text-rose-300" />
                Verify
                <ExternalLink className="w-3 h-3 opacity-50" />
              </Link>
              {unlocked && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void load()}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition-all duration-500 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`}
                  />
                  Làm mới
                </button>
              )}
            </div>
          </div>

          {!unlocked ? (
            <GlassCard
              className="max-w-md mx-auto p-6 sm:p-8 space-y-4"
              hover={false}
              accent="rose"
            >
              <div className="text-center mb-2">
                <Shield className="w-10 h-10 text-rose-300 mx-auto mb-2" />
                <h2 className="text-lg font-semibold text-white">Đăng nhập quản trị</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Nhập mã VERIFY_ADMIN_SECRET
                </p>
              </div>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-rose-500/50 transition-all duration-500"
                placeholder="Mã quản trị"
                autoComplete="off"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && secret.trim()) {
                    try {
                      sessionStorage.setItem(
                        "opus_admin_secret",
                        secret.trim()
                      );
                    } catch {
                      /* */
                    }
                    void load();
                  }
                }}
              />
              <button
                type="button"
                disabled={busy || !secret.trim()}
                onClick={() => {
                  try {
                    sessionStorage.setItem("opus_admin_secret", secret.trim());
                  } catch {
                    /* */
                  }
                  void load();
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-500 shadow-lg shadow-rose-900/30"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Vào Dashboard
              </button>
              {err && <p className="text-sm text-amber-400 text-center">{err}</p>}
            </GlassCard>
          ) : (
            <div className="space-y-6 sm:space-y-8 pb-16">
              {err && (
                <p className="text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2">
                  {err}
                </p>
              )}

              {/* Identity + Pulse */}
              <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-4 sm:gap-5">
                <AdminIdentityCard
                  users={stats?.users ?? 0}
                  verified={stats?.verified ?? 0}
                  coinsGranted={stats?.coinGrants ?? 0}
                  streakPending={stats?.streakGrants ?? 0}
                />
                <SocialPulseCard items={pulse} />
              </div>

              {/* Stats row — giống hàng poster */}
              <section>
                <h3 className="text-sm font-semibold text-white mb-3 px-0.5 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-rose-500" />
                  Chỉ số nhanh
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {statCards.map((c) => {
                    const Icon = c.icon;
                    return (
                      <GlassCard key={c.k} className="p-3.5 sm:p-4 text-center group">
                        <Icon
                          className={`w-4 h-4 mx-auto mb-2 opacity-70 ${c.accent}`}
                        />
                        <p
                          className={`text-2xl font-bold tabular-nums ${c.accent}`}
                        >
                          {c.v ?? "—"}
                        </p>
                        <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                          {c.label}
                        </p>
                      </GlassCard>
                    );
                  })}
                </div>
              </section>

              {/* Hubs */}
              <section>
                <h3 className="text-sm font-semibold text-white mb-3 px-0.5 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-fuchsia-500" />
                  Trung tâm truy cập nhanh
                </h3>
                <HubResumeCards />
              </section>

              <section>
                <h3 className="text-sm font-semibold text-white mb-3 px-0.5 flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-sky-500" />
                  Biểu đồ
                </h3>
                <ActivityMatrix series={series} />
              </section>

              <p className="text-center text-[11px] text-zinc-600 pt-2">
                Tự làm mới mỗi 15 giây ·{" "}
                <Link
                  href="/admin/verify"
                  className="text-zinc-400 hover:text-rose-300 transition-colors"
                >
                  sang trang Verify
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
