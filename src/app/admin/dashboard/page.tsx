"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Shield,
  ExternalLink,
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
      if (!st.ok && stData.error === "Unauthorized") {
        setUnlocked(false);
        setErr("Sai mã quản trị");
        return;
      }
      // stats route may 401 - also try users
      const usData = await us.json().catch(() => ({}));
      if (us.ok && usData.ok) {
        setUnlocked(true);
      } else if (st.ok && stData.ok) {
        setUnlocked(true);
      } else if (mod.ok) {
        setUnlocked(true);
      } else {
        setErr(stData.error || usData.error || "Không tải được dữ liệu");
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
        for (const a of md.alerts.slice(0, 3)) {
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
        for (const a of apd.appeals.filter((x: { status: string }) => x.status === "pending").slice(0, 2)) {
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
        for (const r of rpd.reports.slice(0, 2)) {
          items.push({
            id: `r-${r.id}`,
            title: `Báo lỗi · ${r.slug}`,
            detail: String(r.note || r.episode || ""),
            kind: "report",
          });
        }
      }
      setPulse(items);

      // series mock from totals
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
    if (unlocked) {
      const t = setInterval(() => void load(), 15000);
      return () => clearInterval(t);
    }
  }, [unlocked, load]);

  const statCards = useMemo(() => {
    const s = stats || {};
    return [
      { k: "users", label: "Người dùng", v: s.users },
      { k: "verified", label: "Tích xanh", v: s.verified },
      { k: "bans", label: "Đang khóa", v: s.bans },
      { k: "alerts", label: "Cảnh báo mở", v: s.alerts },
      { k: "coinGrants", label: "Lần cấp xu", v: s.coinGrants },
      { k: "streakGrants", label: "Đơn chuỗi", v: s.streakGrants },
    ];
  }, [stats]);

  return (
    <div className="min-h-[100dvh] text-zinc-100 relative overflow-x-hidden bg-[#0a0a0c]">
      <DashboardCanvasBg />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10 pb-16">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 backdrop-blur flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]">
              <LayoutDashboard className="w-5 h-5 text-sky-300" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Admin Dashboard
              </h1>
              <p className="text-xs text-zinc-500">Tổng quan vận hành OpusFilm</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/verify"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-500"
            >
              <Shield className="w-3.5 h-3.5" />
              Verify
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Link>
            {unlocked && (
              <button
                type="button"
                disabled={busy}
                onClick={() => void load()}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-2 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-500 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            )}
          </div>
        </div>

        {!unlocked ? (
          <GlassCard className="max-w-md mx-auto p-6 space-y-4" hover={false}>
            <label className="text-xs text-zinc-400 block">Mã quản trị</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-sky-500/50 transition-all duration-500"
              placeholder="VERIFY_ADMIN_SECRET"
              autoComplete="off"
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
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all duration-500"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Vào Dashboard
            </button>
            {err && <p className="text-sm text-amber-400">{err}</p>}
          </GlassCard>
        ) : (
          <div className="space-y-5 sm:space-y-6">
            {err && <p className="text-sm text-amber-400">{err}</p>}

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-4 sm:gap-5">
              <AdminIdentityCard
                users={stats?.users ?? 0}
                verified={stats?.verified ?? 0}
                coinsGranted={stats?.coinGrants ?? 0}
                streakPending={stats?.streakGrants ?? 0}
              />
              <SocialPulseCard items={pulse} />
            </div>

            {/* Stat pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {statCards.map((c) => (
                <GlassCard
                  key={c.k}
                  className="p-3 sm:p-4 text-center"
                >
                  <p className="text-xl sm:text-2xl font-bold text-white tabular-nums">
                    {c.v ?? "—"}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 mt-1">
                    {c.label}
                  </p>
                </GlassCard>
              ))}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white mb-3 px-0.5">
                Trung tâm truy cập nhanh
              </h3>
              <HubResumeCards />
            </div>

            <ActivityMatrix series={series} />

            <p className="text-center text-[10px] text-zinc-600 pt-2">
              Tự làm mới mỗi 15 giây ·{" "}
              <Link href="/admin/verify" className="text-zinc-500 hover:text-sky-400">
                sang trang Verify
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
