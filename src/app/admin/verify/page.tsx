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
} from "lucide-react";

type VerifyItem = {
  id: number;
  user_id: number;
  full_name: string;
  field: string;
  social_link: string;
  status: string;
  username: string;
  verified: number;
  created_at: string;
};

type StreakReq = {
  id: number;
  user_id: number;
  username: string;
  days: number;
  reason: string;
  status: string;
  created_at: string;
};

type StreakGrant = {
  id: number;
  username: string;
  days: number;
  created_at: string;
};

type Tab = "verify" | "streak";

export default function AdminVerifyPage() {
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [tab, setTab] = useState<Tab>("verify");
  const [items, setItems] = useState<VerifyItem[]>([]);
  const [streakPending, setStreakPending] = useState<StreakReq[]>([]);
  const [streakRecent, setStreakRecent] = useState<StreakGrant[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [grantUser, setGrantUser] = useState("");
  const [grantDays, setGrantDays] = useState("7");
  const [approveDays, setApproveDays] = useState<Record<number, string>>({});

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret.trim(),
    }),
    [secret]
  );

  const loadVerify = async () => {
    const res = await fetch("/api/admin/verify", { headers: headers() });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setErr(data.error || "Không tải được tích xanh");
      setUnlocked(false);
      return false;
    }
    setItems(data.items || []);
    return true;
  };

  const loadStreak = async () => {
    const res = await fetch("/api/admin/streak", { headers: headers() });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setErr(data.error || "Không tải được đơn chuỗi");
      return false;
    }
    setStreakPending(data.pending || []);
    setStreakRecent(data.recent || []);
    return true;
  };

  const load = async () => {
    setBusy(true);
    setErr("");
    try {
      const okV = await loadVerify();
      if (!okV) return;
      setUnlocked(true);
      await loadStreak();
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const actVerify = async (id: number, action: "approve" | "reject") => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (!data.ok) setErr(data.error || "Thất bại");
      else {
        setMsg(action === "approve" ? `Đã cấp tích xanh #${id}` : `Đã từ chối #${id}`);
        await loadVerify();
      }
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const actStreak = async (
    action: "approve" | "reject" | "grant",
    opts: { id?: number; username?: string; days?: number }
  ) => {
    setBusy(true);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/admin/streak", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ action, ...opts }),
      });
      const data = await res.json();
      if (!data.ok) setErr(data.error || "Thất bại");
      else {
        if (action === "grant") {
          setMsg(`Đã cấp ${opts.days} ngày chuỗi cho @${opts.username}`);
          setGrantUser("");
        } else if (action === "approve") {
          setMsg(`Đã duyệt đơn #${opts.id} — cấp ${opts.days} ngày chuỗi`);
        } else {
          setMsg(`Đã từ chối đơn #${opts.id}`);
        }
        await loadStreak();
      }
    } catch {
      setErr("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#07070c] text-zinc-100">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-400/30 flex items-center justify-center">
            <Shield className="w-6 h-6 text-sky-400" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">Admin · Duyệt & Chuỗi</h1>
            <p className="text-xs text-zinc-500">
              Tích xanh + cấp lại chuỗi khi mất do bảo trì. Cần VERIFY_ADMIN_SECRET.
            </p>
          </div>
        </div>

        {!unlocked ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 max-w-md">
            <label className="text-xs text-zinc-400 block">Mã quản trị</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-sky-500"
              placeholder="VERIFY_ADMIN_SECRET"
              autoComplete="off"
            />
            <button
              type="button"
              disabled={busy || !secret.trim()}
              onClick={() => void load()}
              className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Đăng nhập admin
            </button>
            {err && <p className="text-sm text-amber-400">{err}</p>}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  type="button"
                  onClick={() => setTab("verify")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tab === "verify" ? "bg-sky-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="w-3.5 h-3.5" /> Tích xanh ({items.length})
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("streak")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    tab === "streak" ? "bg-orange-600 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> Chuỗi ({streakPending.length})
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => void load()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? "animate-spin" : ""}`} />
                Làm mới
              </button>
            </div>

            {msg && <p className="text-sm text-emerald-400">{msg}</p>}
            {err && <p className="text-sm text-amber-400">{err}</p>}

            {tab === "verify" && (
              <>
                {items.length === 0 ? (
                  <p className="text-sm text-zinc-500 py-8 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                    Không có yêu cầu pending
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((it) => (
                      <li
                        key={it.id}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-white flex items-center gap-1.5">
                            @{it.username}
                            {Number(it.verified) === 1 && (
                              <BadgeCheck className="w-4 h-4 text-sky-400" />
                            )}
                          </p>
                          <p className="text-sm text-zinc-300 mt-0.5">{it.full_name}</p>
                          <p className="text-xs text-zinc-500 mt-1">
                            {it.field}
                            {it.social_link ? (
                              <>
                                {" · "}
                                <a
                                  href={it.social_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-400 hover:underline break-all"
                                >
                                  {it.social_link}
                                </a>
                              </>
                            ) : null}
                          </p>
                          <p className="text-[10px] text-zinc-600 mt-1">
                            #{it.id} · {new Date(it.created_at).toLocaleString("vi-VN")}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void actVerify(it.id, "approve")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Cấp tích xanh
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void actVerify(it.id, "reject")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-zinc-300 disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Từ chối
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}

            {tab === "streak" && (
              <div className="space-y-6">
                {/* Cấp trực tiếp */}
                <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
                  <p className="text-sm font-semibold text-orange-200 flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Cấp chuỗi trực tiếp
                  </p>
                  <p className="text-xs text-zinc-500">
                    Nhập username + số ngày chuỗi (1 trở lên). User đăng nhập lại / reload sẽ thấy chuỗi trên trang chủ.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      value={grantUser}
                      onChange={(e) => setGrantUser(e.target.value)}
                      placeholder="username"
                      className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-orange-500"
                    />
                    <input
                      type="number"
                      min={1}
                      value={grantDays}
                      onChange={(e) => setGrantDays(e.target.value)}
                      placeholder="Số ngày"
                      className="w-full sm:w-28 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm outline-none focus:border-orange-500"
                    />
                    <button
                      type="button"
                      disabled={busy || !grantUser.trim() || Number(grantDays) < 1}
                      onClick={() =>
                        void actStreak("grant", {
                          username: grantUser.trim(),
                          days: Math.floor(Number(grantDays) || 0),
                        })
                      }
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Cấp
                    </button>
                  </div>
                </div>

                {/* Đơn khiếu nại */}
                <div>
                  <p className="text-sm text-zinc-400 mb-2">
                    Đơn khiếu nại chờ duyệt ({streakPending.length})
                  </p>
                  {streakPending.length === 0 ? (
                    <p className="text-sm text-zinc-500 py-6 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
                      Không có đơn chuỗi pending
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {streakPending.map((it) => (
                        <li
                          key={it.id}
                          className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2"
                        >
                          <p className="font-semibold text-white">@{it.username}</p>
                          <p className="text-sm text-orange-200">
                            Yêu cầu khôi phục: <strong>{it.days}</strong> ngày chuỗi
                          </p>
                          {it.reason ? (
                            <p className="text-xs text-zinc-400 whitespace-pre-wrap">{it.reason}</p>
                          ) : null}
                          <p className="text-[10px] text-zinc-600">
                            #{it.id} · {new Date(it.created_at).toLocaleString("vi-VN")}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <input
                              type="number"
                              min={1}
                              value={approveDays[it.id] ?? String(it.days)}
                              onChange={(e) =>
                                setApproveDays((s) => ({ ...s, [it.id]: e.target.value }))
                              }
                              className="w-24 px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-xs"
                              title="Số ngày cấp"
                            />
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void actStreak("approve", {
                                  id: it.id,
                                  days: Math.floor(
                                    Number(approveDays[it.id] ?? it.days) || it.days
                                  ),
                                })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-600 hover:bg-orange-500 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Duyệt & cấp chuỗi
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void actStreak("reject", { id: it.id })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-xs text-zinc-300 disabled:opacity-50"
                            >
                              <X className="w-3.5 h-3.5" />
                              Từ chối
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {streakRecent.length > 0 && (
                  <div>
                    <p className="text-xs text-zinc-500 mb-2">Đã cấp gần đây</p>
                    <ul className="space-y-1 text-xs text-zinc-400">
                      {streakRecent.map((g) => (
                        <li key={g.id}>
                          #{g.id} · @{g.username} · {g.days} ngày ·{" "}
                          {new Date(g.created_at).toLocaleString("vi-VN")}
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
