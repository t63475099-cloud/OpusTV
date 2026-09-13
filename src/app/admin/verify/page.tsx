"use client";

import { useCallback, useState } from "react";
import {
  BadgeCheck,
  Loader2,
  RefreshCw,
  Shield,
  Check,
  X,
  Flame,
  Send,
  Coins,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { BAN_DURATIONS, VIOLATION_LABELS, type ViolationKind } from "@/lib/moderation";

type Tab = "verify" | "streak" | "coins" | "mod";

type VerifyItem = {
  id: number;
  username: string;
  full_name: string;
  field: string;
  social_link: string;
  verified: number;
  created_at: string;
};

type StreakReq = {
  id: number;
  username: string;
  days: number;
  reason: string;
  created_at: string;
};

export default function AdminVerifyPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("verify");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [items, setItems] = useState<VerifyItem[]>([]);
  const [streakPending, setStreakPending] = useState<StreakReq[]>([]);
  const [streakRecent, setStreakRecent] = useState<{ id: number; username: string; days: number; created_at: string }[]>([]);
  const [coinRecent, setCoinRecent] = useState<{ id: number; username: string; amount: number; created_at: string }[]>([]);
  const [alerts, setAlerts] = useState<Record<string, unknown>[]>([]);
  const [bans, setBans] = useState<Record<string, unknown>[]>([]);

  const [grantUser, setGrantUser] = useState("");
  const [grantDays, setGrantDays] = useState("7");
  const [coinUser, setCoinUser] = useState("");
  const [coinAmt, setCoinAmt] = useState("100");
  const [banUser, setBanUser] = useState("");
  const [banLevel, setBanLevel] = useState("1");
  const [banReason, setBanReason] = useState("");
  const [approveDays, setApproveDays] = useState<Record<number, string>>({});

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret.trim(),
    }),
    [secret]
  );

  const loadAll = async () => {
    setBusy(true);
    setErr("");
    try {
      const [v, s, c, m] = await Promise.all([
        fetch("/api/admin/verify", { headers: headers() }),
        fetch("/api/admin/streak", { headers: headers() }),
        fetch("/api/admin/coins", { headers: headers() }),
        fetch("/api/admin/moderation", { headers: headers() }),
      ]);
      const vd = await v.json();
      if (!v.ok || !vd.ok) {
        setErr(vd.error || "Unauthorized");
        setUnlocked(false);
        return;
      }
      setUnlocked(true);
      setItems(vd.items || []);
      const sd = await s.json();
      if (sd.ok) {
        setStreakPending(sd.pending || []);
        setStreakRecent(sd.recent || []);
      }
      const cd = await c.json();
      if (cd.ok) setCoinRecent(cd.recent || []);
      const md = await m.json();
      if (md.ok) {
        setAlerts(md.alerts || []);
        setBans(md.bans || []);
      }
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const post = async (url: string, body: object, okMsg: string) => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) setErr(data.error || "Thất bại");
      else {
        setMsg(okMsg);
        await loadAll();
      }
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const tabs: { id: Tab; label: string; icon: typeof Shield; count?: number }[] = [
    { id: "verify", label: "Tích xanh", icon: BadgeCheck, count: items.length },
    { id: "streak", label: "Chuỗi", icon: Flame, count: streakPending.length },
    { id: "coins", label: "Cấp xu", icon: Coins },
    { id: "mod", label: "Giám sát", icon: AlertTriangle, count: alerts.length },
  ];

  return (
    <div className="min-h-[100dvh] text-zinc-100 relative overflow-hidden">
      {/* Canvas orbs */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[-10%] left-[10%] w-[40vw] h-[40vw] max-w-xl rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[5%] w-[45vw] h-[45vw] max-w-2xl rounded-full bg-rose-600/15 blur-[130px]" />
        <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[#07070c]/80" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 relative">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-300" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Admin OpusFilm</h1>
            <p className="text-xs text-zinc-500">
              Tích xanh · Chuỗi · Xu · Giám sát & khóa tài khoản
            </p>
          </div>
        </div>

        {!unlocked ? (
          <div className="rounded-3xl border border-white/15 bg-white/[0.06] backdrop-blur-xl p-6 space-y-4 max-w-md shadow-2xl transition-all duration-500">
            <label className="text-xs text-zinc-400 block">Mã quản trị</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-sky-500 transition duration-500"
              placeholder="VERIFY_ADMIN_SECRET"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={busy || !secret.trim()}
              onClick={() => void loadAll()}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition duration-500"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Đăng nhập admin
            </button>
            {err && <p className="text-sm text-amber-400">{err}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1 p-1 rounded-2xl bg-white/5 border border-white/10 backdrop-blur">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition duration-500 inline-flex items-center gap-1.5 ${
                        tab === t.id
                          ? "bg-white/15 text-white shadow"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {t.label}
                      {typeof t.count === "number" ? ` (${t.count})` : ""}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => void loadAll()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition duration-500"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            </div>

            {msg && (
              <p className="text-sm text-emerald-400 transition duration-500">{msg}</p>
            )}
            {err && <p className="text-sm text-amber-400">{err}</p>}

            {/* VERIFY */}
            {tab === "verify" && (
              <div className="space-y-3">
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-8 text-center rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur">
                    Không có yêu cầu pending
                  </p>
                ) : (
                  items.map((it) => (
                    <div
                      key={it.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-xl p-4 space-y-2 transition duration-500"
                    >
                      <p className="font-semibold text-white">@{it.username}</p>
                      <p className="text-sm text-zinc-300">{it.full_name}</p>
                      <p className="text-xs text-zinc-500">{it.field}</p>
                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void post(
                              "/api/admin/verify",
                              { id: it.id, action: "approve" },
                              `Đã cấp tích xanh #${it.id}`
                            )
                          }
                          className="px-3 py-1.5 rounded-full bg-sky-600 text-xs font-semibold"
                        >
                          <Check className="w-3.5 h-3.5 inline mr-1" />
                          Cấp tích xanh
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            void post(
                              "/api/admin/verify",
                              { id: it.id, action: "reject" },
                              `Đã từ chối #${it.id}`
                            )
                          }
                          className="px-3 py-1.5 rounded-full bg-white/10 text-xs"
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* STREAK */}
            {tab === "streak" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-orange-500/25 bg-orange-500/10 backdrop-blur-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-orange-100 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Cấp chuỗi trực tiếp
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={grantUser}
                      onChange={(e) => setGrantUser(e.target.value)}
                      placeholder="username"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      value={grantDays}
                      onChange={(e) => setGrantDays(e.target.value)}
                      className="w-full sm:w-28 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void post(
                          "/api/admin/streak",
                          {
                            action: "grant",
                            username: grantUser.trim(),
                            days: Math.floor(Number(grantDays) || 0),
                          },
                          `Đã cấp ${grantDays} ngày chuỗi`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-orange-600 text-sm font-semibold"
                    >
                      Cấp
                    </button>
                  </div>
                </div>
                {streakPending.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur p-4 space-y-2"
                  >
                    <p className="font-semibold">@{it.username}</p>
                    <p className="text-sm text-orange-200">Yêu cầu {it.days} ngày</p>
                    <p className="text-xs text-zinc-400">{it.reason}</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        value={approveDays[it.id] ?? String(it.days)}
                        onChange={(e) =>
                          setApproveDays((s) => ({ ...s, [it.id]: e.target.value }))
                        }
                        className="w-24 px-2 py-1 rounded-lg bg-black/40 border border-white/10 text-xs"
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void post(
                            "/api/admin/streak",
                            {
                              action: "approve",
                              id: it.id,
                              days: Math.floor(
                                Number(approveDays[it.id] ?? it.days) || it.days
                              ),
                            },
                            `Duyệt chuỗi #${it.id}`
                          )
                        }
                        className="px-3 py-1.5 rounded-full bg-orange-600 text-xs font-semibold"
                      >
                        Duyệt
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void post(
                            "/api/admin/streak",
                            { action: "reject", id: it.id },
                            `Từ chối #${it.id}`
                          )
                        }
                        className="px-3 py-1.5 rounded-full bg-white/10 text-xs"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COINS */}
            {tab === "coins" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-amber-100 flex items-center gap-2">
                    <Coins className="w-4 h-4" /> Cấp xu Sự kiện
                  </p>
                  <p className="text-xs text-zinc-400">
                    Chỉ cần username + số xu. User reload sẽ nhận xu tự động.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={coinUser}
                      onChange={(e) => setCoinUser(e.target.value)}
                      placeholder="username"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                    />
                    <input
                      type="number"
                      min={1}
                      value={coinAmt}
                      onChange={(e) => setCoinAmt(e.target.value)}
                      placeholder="Số xu"
                      className="w-full sm:w-32 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void post(
                          "/api/admin/coins",
                          {
                            username: coinUser.trim(),
                            amount: Math.floor(Number(coinAmt) || 0),
                          },
                          `Đã cấp ${coinAmt} xu`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-amber-600 text-sm font-semibold inline-flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Gửi xu
                    </button>
                  </div>
                </div>
                <ul className="text-xs text-zinc-400 space-y-1">
                  {coinRecent.map((g) => (
                    <li key={g.id}>
                      #{g.id} · @{g.username} · +{g.amount} xu ·{" "}
                      {new Date(g.created_at).toLocaleString("vi-VN")}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* MODERATION */}
            {tab === "mod" && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 backdrop-blur-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-rose-100 flex items-center gap-2">
                    <Ban className="w-4 h-4" /> Khóa tài khoản
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={banUser}
                      onChange={(e) => setBanUser(e.target.value)}
                      placeholder="username"
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                    />
                    <select
                      value={banLevel}
                      onChange={(e) => setBanLevel(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                    >
                      {BAN_DURATIONS.map((b) => (
                        <option key={b.level} value={b.level}>
                          Lần {b.level}: {b.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Lý do khóa"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void post(
                          "/api/admin/moderation",
                          {
                            action: "ban",
                            username: banUser.trim(),
                            level: Number(banLevel),
                            reason: banReason,
                            kind: "other",
                          },
                          `Đã khóa @${banUser}`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-rose-600 text-sm font-semibold"
                    >
                      Khóa
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void post(
                          "/api/admin/moderation",
                          {
                            action: "warn",
                            username: banUser.trim(),
                            reason: banReason || "Cảnh báo chuẩn mực",
                          },
                          `Đã cảnh báo @${banUser}`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-amber-600/80 text-sm font-semibold"
                    >
                      Cảnh báo
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void post(
                          "/api/admin/moderation",
                          { action: "unban", username: banUser.trim() },
                          `Đã mở khóa @${banUser}`
                        )
                      }
                      className="px-4 py-2 rounded-xl bg-white/10 text-sm"
                    >
                      Mở khóa
                    </button>
                  </div>
                </div>

                <p className="text-sm text-zinc-400">
                  Cảnh báo tự động từ web ({alerts.length})
                </p>
                {alerts.length === 0 ? (
                  <p className="text-xs text-zinc-500 py-4 text-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    Không có alert mở
                  </p>
                ) : (
                  alerts.map((a) => (
                    <div
                      key={String(a.id)}
                      className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur p-3 text-xs space-y-1"
                    >
                      <p className="text-white font-medium">
                        @{String(a.username || "khách")} ·{" "}
                        {VIOLATION_LABELS[a.kind as ViolationKind] ||
                          String(a.kind)}
                        {a.severity ? (
                          <span className="ml-2 text-[10px] uppercase text-amber-300">
                            {String(a.severity)}
                          </span>
                        ) : null}
                        {a.risk_score ? (
                          <span className="ml-1 text-[10px] text-rose-300">
                            risk {String(a.risk_score)}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-zinc-400 break-words">{String(a.detail || "")}</p>
                      <p className="text-zinc-600">
                        {String(a.path || "")} · {String(a.ip || "")}
                      </p>
                      <button
                        type="button"
                        className="text-sky-400 mt-1"
                        onClick={() =>
                          void post(
                            "/api/admin/moderation",
                            { action: "close_alert", id: a.id },
                            "Đã đóng alert"
                          )
                        }
                      >
                        Đóng
                      </button>
                    </div>
                  ))
                )}

                {bans.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Lịch sử khóa</p>
                    <ul className="text-xs text-zinc-400 space-y-1">
                      {bans.slice(0, 15).map((b) => (
                        <li key={String(b.id)}>
                          @{String(b.username)} · level {String(b.level)} ·{" "}
                          {String(b.reason || "")}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
