"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AdminAccount, AdminRole, SystemStats, VerifyRequestItem } from "@/lib/adminEngine";
import type { KeyTier, LicenseKeyRecord } from "@/lib/keyEngine";

type TabId = "ACCOUNTS" | "KEY-BOARD" | "VERIFY" | "SYSTEM";
type ThemeMode = "dark" | "light";

const TABS: { id: TabId; label: string }[] = [
  { id: "ACCOUNTS", label: "Tài khoản" },
  { id: "KEY-BOARD", label: "Key-board" },
  { id: "VERIFY", label: "Xác minh" },
  { id: "SYSTEM", label: "Hệ thống & AI" },
];

const SECRET_STORAGE = "opus_admin_secret";
const THEME_STORAGE = "opus_admin_theme";

function useTheme(): [ThemeMode, (t: ThemeMode) => void] {
  const [theme, setThemeState] = useState<ThemeMode>("dark");
  useEffect(() => {
    try {
      const t = localStorage.getItem(THEME_STORAGE) as ThemeMode | null;
      if (t === "light" || t === "dark") setThemeState(t);
    } catch {
      /* */
    }
  }, []);
  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    try {
      localStorage.setItem(THEME_STORAGE, t);
    } catch {
      /* */
    }
  };
  return [theme, setTheme];
}

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string, theme: ThemeMode) {
  const map: Record<string, string> = {
    active: theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-700",
    banned: theme === "dark" ? "bg-rose-500/20 text-rose-300" : "bg-rose-100 text-rose-700",
    used: theme === "dark" ? "bg-zinc-500/20 text-zinc-300" : "bg-zinc-200 text-zinc-700",
    revoked: theme === "dark" ? "bg-amber-500/20 text-amber-300" : "bg-amber-100 text-amber-800",
    expired: theme === "dark" ? "bg-zinc-600/30 text-zinc-400" : "bg-zinc-100 text-zinc-500",
    pending: theme === "dark" ? "bg-sky-500/20 text-sky-300" : "bg-sky-100 text-sky-700",
  };
  return map[status] || (theme === "dark" ? "bg-zinc-700 text-zinc-300" : "bg-zinc-100 text-zinc-600");
}

export default function BoardHomePage() {
  const [theme, setTheme] = useTheme();
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState("");
  const [tab, setTab] = useState<TabId>("ACCOUNTS");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);

  // Data
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [keys, setKeys] = useState<LicenseKeyRecord[]>([]);
  const [verifyItems, setVerifyItems] = useState<VerifyRequestItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [accountQ, setAccountQ] = useState("");
  const [keyTier, setKeyTier] = useState<"ALL" | KeyTier>("ALL");

  // Forms
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: "",
    role: "User" as AdminRole,
    expiresDays: "",
  });
  const [keyForm, setKeyForm] = useState({
    tier: "24H" as KeyTier,
    count: 5,
    customPrefix: "VP",
    note: "",
  });
  const [confirmText, setConfirmText] = useState("");
  const [modal, setModal] = useState<{
    type:
      | "delete_account"
      | "delete_key"
      | "delete_verify"
      | "reset_pw"
      | "ban"
      | "grant_coins"
      | null;
    payload?: Record<string, unknown>;
  }>({ type: null });
  const [resetPw, setResetPw] = useState("");
  const [banReason, setBanReason] = useState("Vi phạm nội quy");
  const [grantAmount, setGrantAmount] = useState("1000");
  const [grantNote, setGrantNote] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = useCallback((msg: string, type: "ok" | "err" | "info" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    }),
    [secret]
  );

  // Restore secret
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SECRET_STORAGE) || "";
      if (s) {
        setSecret(s);
        // try unlock silently
        void (async () => {
          try {
            const res = await fetch("/api/admin/board-home?section=stats", {
              headers: { "x-admin-secret": s },
            });
            if (res.ok) {
              setUnlocked(true);
              document.cookie = `opus_admin_gate=${encodeURIComponent(s)}; path=/; max-age=28800; SameSite=Lax`;
            }
          } catch {
            /* */
          }
        })();
      }
    } catch {
      /* */
    }
  }, []);

  const unlock = async () => {
    setGateError("");
    if (!secret.trim()) {
      setGateError("Nhập mã quản trị");
      return;
    }
    try {
      const res = await fetch("/api/admin/board-home?section=stats", {
        headers: { "x-admin-secret": secret.trim() },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setGateError(data.error || "Sai mã quản trị");
        return;
      }
      setUnlocked(true);
      try {
        sessionStorage.setItem(SECRET_STORAGE, secret.trim());
      } catch {
        /* */
      }
      document.cookie = `opus_admin_gate=${encodeURIComponent(secret.trim())}; path=/; max-age=28800; SameSite=Lax`;
      setStats(data.stats || null);
    } catch {
      setGateError("Không kết nối được server");
    }
  };

  const lock = () => {
    setUnlocked(false);
    setSecret("");
    try {
      sessionStorage.removeItem(SECRET_STORAGE);
    } catch {
      /* */
    }
    document.cookie = "opus_admin_gate=; path=/; max-age=0";
  };

  const loadSection = useCallback(
    async (section: TabId) => {
      if (!unlocked || !secret) return;
      setLoading(true);
      try {
        if (section === "ACCOUNTS") {
          const res = await fetch(
            `/api/admin/board-home?section=accounts&q=${encodeURIComponent(accountQ)}`,
            { headers }
          );
          const data = await res.json();
          if (data.ok) setAccounts(data.accounts || []);
          else showToast(data.error || "Lỗi tải tài khoản", "err");
        } else if (section === "KEY-BOARD") {
          const res = await fetch(
            `/api/admin/board-home?section=keys&tier=${keyTier}&limit=120`,
            { headers }
          );
          const data = await res.json();
          if (data.ok) setKeys(data.keys || []);
          else showToast(data.error || "Lỗi tải keys", "err");
        } else if (section === "VERIFY") {
          const res = await fetch(`/api/admin/board-home?section=verify`, { headers });
          const data = await res.json();
          if (data.ok) setVerifyItems(data.items || []);
          else showToast(data.error || "Lỗi tải verify", "err");
        } else {
          const res = await fetch(`/api/admin/board-home?section=stats`, { headers });
          const data = await res.json();
          if (data.ok) setStats(data.stats || null);
          else showToast(data.error || "Lỗi stats", "err");
        }
      } catch {
        showToast("Lỗi mạng", "err");
      } finally {
        setLoading(false);
      }
    },
    [unlocked, secret, headers, accountQ, keyTier, showToast]
  );

  useEffect(() => {
    if (!unlocked) return;
    void loadSection(tab);
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => void loadSection(tab), 20000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [unlocked, tab, loadSection]);

  const mutate = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/board-home", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        showToast(data.error || "Thao tác thất bại", "err");
        return null;
      }
      showToast(data.message || "Thành công", "ok");
      await loadSection(tab);
      return data;
    } catch {
      showToast("Lỗi mạng", "err");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Đã copy", "info");
    } catch {
      showToast("Copy thất bại", "err");
    }
  };

  // ── Theme classes ──
  const isDark = theme === "dark";
  const bg = isDark ? "bg-zinc-950 text-zinc-100" : "bg-zinc-50 text-zinc-900";
  const card = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200";
  const input = isDark
    ? "bg-zinc-900 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
    : "bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const border = isDark ? "border-zinc-800" : "border-zinc-200";
  const hoverRow = isDark ? "hover:bg-zinc-800/60" : "hover:bg-zinc-100";

  // ── Gate ──
  if (!unlocked) {
    return (
      <div className={`h-screen flex items-center justify-center ${bg} p-4`}>
        <div className={`w-full max-w-sm rounded-2xl border ${card} p-6 shadow-xl`}>
          <h1 className="text-lg font-semibold tracking-tight">Master Admin Console</h1>
          <p className={`mt-1 text-sm ${muted}`}>Nhập mã quản trị để mở bảng điều khiển</p>
          <input
            type="password"
            autoFocus
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void unlock()}
            placeholder="x-admin-secret"
            className={`mt-4 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${input}`}
          />
          {gateError && <p className="mt-2 text-sm text-rose-500">{gateError}</p>}
          <button
            type="button"
            onClick={() => void unlock()}
            className="mt-4 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-500"
          >
            Mở khóa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${bg}`}>
      {/* Header */}
      <header className={`shrink-0 border-b ${border} px-4 py-3 flex items-center gap-3`}>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold tracking-tight truncate">Board Home · Master Admin</h1>
          <p className={`text-xs ${muted}`}>
            {stats
              ? `${stats.users} user · ${stats.keysActive}/${stats.keysTotal} key · ${stats.pendingVerify} verify`
              : "Đang đồng bộ…"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className={`rounded-lg border px-2.5 py-1.5 text-xs ${border} ${muted}`}
        >
          {isDark ? "Light" : "Dark"}
        </button>
        <button
          type="button"
          onClick={() => void loadSection(tab)}
          className={`rounded-lg border px-2.5 py-1.5 text-xs ${border} ${muted}`}
        >
          {loading ? "…" : "Refresh"}
        </button>
        <button
          type="button"
          onClick={lock}
          className="rounded-lg bg-rose-600/90 px-2.5 py-1.5 text-xs text-white"
        >
          Lock
        </button>
      </header>

      {/* Tabs */}
      <nav className={`shrink-0 flex gap-1 px-3 pt-2 border-b ${border}`}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? "border-violet-500 text-violet-400"
                : `border-transparent ${muted} hover:text-inherit`
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* Body — only active tab */}
      <main className="flex-1 min-h-0 overflow-hidden px-3 py-3">
        {tab === "ACCOUNTS" && (
          <div className="h-full flex flex-col gap-3 min-h-0">
            {/* Create form */}
            <div className={`shrink-0 rounded-xl border ${card} p-3`}>
              <p className="text-xs font-medium mb-2">Tạo tài khoản</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <input
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser((s) => ({ ...s, username: e.target.value }))}
                />
                <input
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((s) => ({ ...s, email: e.target.value }))}
                />
                <input
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  placeholder="Mật khẩu"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser((s) => ({ ...s, password: e.target.value }))}
                />
                <select
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((s) => ({ ...s, role: e.target.value as AdminRole }))
                  }
                >
                  <option value="User">User</option>
                  <option value="VIP">VIP</option>
                  <option value="Admin">Admin</option>
                </select>
                <input
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  placeholder="Hạn (ngày)"
                  value={newUser.expiresDays}
                  onChange={(e) => setNewUser((s) => ({ ...s, expiresDays: e.target.value }))}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const data = await mutate({
                      action: "create_account",
                      username: newUser.username,
                      email: newUser.email,
                      password: newUser.password,
                      role: newUser.role,
                      expiresDays: newUser.expiresDays ? Number(newUser.expiresDays) : undefined,
                    });
                    if (data?.ok) {
                      setNewUser({
                        username: "",
                        email: "",
                        password: "",
                        role: "User",
                        expiresDays: "",
                      });
                      if (data.recoveryPin) {
                        showToast(`PIN khôi phục: ${data.recoveryPin}`, "info");
                      }
                    }
                  }}
                  className="rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
                >
                  Tạo
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="shrink-0 flex gap-2">
              <input
                className={`flex-1 rounded-lg border px-3 py-1.5 text-sm ${input}`}
                placeholder="Tìm username / UID / email…"
                value={accountQ}
                onChange={(e) => setAccountQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void loadSection("ACCOUNTS")}
              />
              <button
                type="button"
                onClick={() => void loadSection("ACCOUNTS")}
                className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
              >
                Lọc
              </button>
            </div>

            {/* Table */}
            <div className={`flex-1 min-h-0 rounded-xl border ${card} overflow-hidden`}>
              <div className="overflow-y-auto max-h-[calc(100vh-230px)]">
                <table className="w-full text-sm">
                  <thead className={`sticky top-0 z-10 ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}>
                    <tr className={`text-left text-xs ${muted}`}>
                      <th className="px-3 py-2 font-medium">Username</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Trạng thái</th>
                      <th className="px-3 py-2 font-medium">Ngày tạo</th>
                      <th className="px-3 py-2 font-medium text-right">Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accounts.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`px-3 py-8 text-center ${muted}`}>
                          {loading ? "Đang tải…" : "Không có tài khoản"}
                        </td>
                      </tr>
                    )}
                    {accounts.map((a) => (
                      <tr key={a.id} className={`border-t ${border} ${hoverRow}`}>
                        <td className="px-3 py-2">
                          <div className="font-medium">{a.username}</div>
                          <div className={`text-[11px] ${muted}`}>
                            UID {a.uid || "—"} {a.verified ? "· ✓" : ""}
                          </div>
                        </td>
                        <td className="px-3 py-2">{a.role}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] ${statusBadge(a.status, theme)}`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-xs ${muted}`}>{fmtDate(a.createdAt)}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-md bg-amber-500/90 px-2 py-1 text-[11px] text-zinc-950 font-medium"
                              onClick={() =>
                                setModal({
                                  type: "grant_coins",
                                  payload: {
                                    id: a.id,
                                    username: a.username,
                                    uid: a.uid,
                                  },
                                })
                              }
                            >
                              Cấp xu
                            </button>
                            <button
                              type="button"
                              className={`rounded-md px-2 py-1 text-[11px] text-white ${
                                a.verified ? "bg-sky-700/90" : "bg-sky-500/90"
                              }`}
                              onClick={() =>
                                void mutate({
                                  action: "set_verified",
                                  id: a.id,
                                  username: a.username,
                                  verified: !a.verified,
                                })
                              }
                            >
                              {a.verified ? "Gỡ tick" : "Tick xanh"}
                            </button>
                            <button
                              type="button"
                              className={`rounded-md border px-2 py-1 text-[11px] ${border}`}
                              onClick={() =>
                                setModal({
                                  type: "reset_pw",
                                  payload: { id: a.id, username: a.username },
                                })
                              }
                            >
                              Đổi MK
                            </button>
                            {a.status === "banned" ? (
                              <button
                                type="button"
                                className="rounded-md bg-emerald-600/90 px-2 py-1 text-[11px] text-white"
                                onClick={() =>
                                  void mutate({ action: "unban", username: a.username })
                                }
                              >
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="rounded-md bg-amber-600/90 px-2 py-1 text-[11px] text-white"
                                onClick={() =>
                                  setModal({
                                    type: "ban",
                                    payload: { username: a.username },
                                  })
                                }
                              >
                                Khóa
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-md bg-rose-600/90 px-2 py-1 text-[11px] text-white"
                              onClick={() =>
                                setModal({
                                  type: "delete_account",
                                  payload: { id: a.id, username: a.username },
                                })
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "KEY-BOARD" && (
          <div className="h-full flex flex-col gap-3 min-h-0">
            <div className={`shrink-0 rounded-xl border ${card} p-3`}>
              <p className="text-xs font-medium mb-2">Cấp phát key</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                <select
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  value={keyForm.tier}
                  onChange={(e) =>
                    setKeyForm((s) => ({ ...s, tier: e.target.value as KeyTier }))
                  }
                >
                  <option value="24H">24H-XXX-XXXXXXX</option>
                  <option value="12H">12H-XXX-XXXXXXX</option>
                  <option value="CUSTOM">XX-XXX-XXXXXXX</option>
                </select>
                {keyForm.tier === "CUSTOM" && (
                  <input
                    className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                    placeholder="Prefix (VP)"
                    maxLength={2}
                    value={keyForm.customPrefix}
                    onChange={(e) =>
                      setKeyForm((s) => ({ ...s, customPrefix: e.target.value.toUpperCase() }))
                    }
                  />
                )}
                <input
                  type="number"
                  min={1}
                  max={50}
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  value={keyForm.count}
                  onChange={(e) =>
                    setKeyForm((s) => ({ ...s, count: Math.min(50, Math.max(1, Number(e.target.value) || 1)) }))
                  }
                />
                <input
                  className={`rounded-lg border px-2 py-1.5 text-sm ${input}`}
                  placeholder="Ghi chú"
                  value={keyForm.note}
                  onChange={(e) => setKeyForm((s) => ({ ...s, note: e.target.value }))}
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    const data = await mutate({
                      action: "generate_keys",
                      tier: keyForm.tier,
                      count: keyForm.count,
                      customPrefix: keyForm.customPrefix,
                      note: keyForm.note,
                    });
                    if (data?.codes?.length) {
                      showToast(`Đã tạo ${data.codes.length} key`, "ok");
                    }
                  }}
                  className="rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 disabled:opacity-50"
                >
                  Sinh key
                </button>
              </div>
            </div>

            <div className="shrink-0 flex gap-1 flex-wrap">
              {(["ALL", "24H", "12H", "CUSTOM"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setKeyTier(t);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs border ${
                    keyTier === t
                      ? "border-violet-500 text-violet-400"
                      : `${border} ${muted}`
                  }`}
                >
                  {t === "ALL" ? "Tất cả" : t}
                </button>
              ))}
            </div>

            <div className={`flex-1 min-h-0 rounded-xl border ${card} overflow-hidden`}>
              <div className="overflow-y-auto max-h-[calc(100vh-230px)]">
                <table className="w-full text-sm">
                  <thead className={`sticky top-0 z-10 ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}>
                    <tr className={`text-left text-xs ${muted}`}>
                      <th className="px-3 py-2 font-medium">Key</th>
                      <th className="px-3 py-2 font-medium">Tier</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Used by</th>
                      <th className="px-3 py-2 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keys.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`px-3 py-8 text-center ${muted}`}>
                          {loading ? "Đang tải…" : "Chưa có key"}
                        </td>
                      </tr>
                    )}
                    {keys.map((k) => (
                      <tr key={k.id} className={`border-t ${border} ${hoverRow}`}>
                        <td className="px-3 py-2 font-mono text-xs">
                          <button
                            type="button"
                            title="Copy"
                            onClick={() => void copyText(k.keyCode)}
                            className="hover:text-violet-400"
                          >
                            {k.keyCode}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-xs">{k.tier}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded-md px-1.5 py-0.5 text-[11px] ${statusBadge(k.status, theme)}`}
                          >
                            {k.status}
                          </span>
                        </td>
                        <td className={`px-3 py-2 text-xs ${muted}`}>{k.usedBy || "—"}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              className={`rounded-md border px-2 py-1 text-[11px] ${border}`}
                              onClick={() => void copyText(k.keyCode)}
                            >
                              Copy
                            </button>
                            {k.status === "revoked" ? (
                              <button
                                type="button"
                                className="rounded-md bg-emerald-600/90 px-2 py-1 text-[11px] text-white"
                                onClick={() =>
                                  void mutate({ action: "unrevoke_key", code: k.keyCode })
                                }
                              >
                                Mở lại
                              </button>
                            ) : k.status === "active" ? (
                              <button
                                type="button"
                                className="rounded-md bg-amber-600/90 px-2 py-1 text-[11px] text-white"
                                onClick={() =>
                                  void mutate({ action: "revoke_key", code: k.keyCode })
                                }
                              >
                                Thu hồi
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="rounded-md bg-rose-600/90 px-2 py-1 text-[11px] text-white"
                              onClick={() =>
                                setModal({
                                  type: "delete_key",
                                  payload: { id: k.id, code: k.keyCode },
                                })
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "VERIFY" && (
          <div className="h-full flex flex-col gap-3 min-h-0">
            <div className={`flex-1 min-h-0 rounded-xl border ${card} overflow-hidden`}>
              <div className="overflow-y-auto max-h-[calc(100vh-230px)]">
                <table className="w-full text-sm">
                  <thead className={`sticky top-0 z-10 ${isDark ? "bg-zinc-900" : "bg-zinc-100"}`}>
                    <tr className={`text-left text-xs ${muted}`}>
                      <th className="px-3 py-2 font-medium">User</th>
                      <th className="px-3 py-2 font-medium">Họ tên</th>
                      <th className="px-3 py-2 font-medium">Lĩnh vực</th>
                      <th className="px-3 py-2 font-medium">Link</th>
                      <th className="px-3 py-2 font-medium text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {verifyItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className={`px-3 py-8 text-center ${muted}`}>
                          {loading ? "Đang tải…" : "Không có yêu cầu pending"}
                        </td>
                      </tr>
                    )}
                    {verifyItems.map((v) => (
                      <tr key={v.id} className={`border-t ${border} ${hoverRow}`}>
                        <td className="px-3 py-2">
                          <div className="font-medium">{v.username}</div>
                          <div className={`text-[11px] ${muted}`}>{fmtDate(v.createdAt)}</div>
                        </td>
                        <td className="px-3 py-2">{v.fullName}</td>
                        <td className="px-3 py-2 text-xs">{v.field}</td>
                        <td className={`px-3 py-2 text-xs max-w-[140px] truncate ${muted}`}>
                          {v.socialLink || "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-md bg-emerald-600/90 px-2 py-1 text-[11px] text-white"
                              onClick={() =>
                                void mutate({ action: "approve_verify", id: v.id })
                              }
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              className="rounded-md bg-amber-600/90 px-2 py-1 text-[11px] text-white"
                              onClick={() =>
                                void mutate({ action: "reject_verify", id: v.id })
                              }
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              className="rounded-md bg-rose-600/90 px-2 py-1 text-[11px] text-white"
                              onClick={() =>
                                setModal({ type: "delete_verify", payload: { id: v.id } })
                              }
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === "SYSTEM" && (
          <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)] space-y-3">
            <div className={`rounded-xl border ${card} p-4`}>
              <p className="text-sm font-medium mb-3">Thống kê hệ thống</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {[
                  ["Users", stats?.users],
                  ["Keys active", stats?.keysActive],
                  ["Keys total", stats?.keysTotal],
                  ["Verify pending", stats?.pendingVerify],
                  ["Bans active", stats?.bansActive],
                  ["Sessions", stats?.sessions],
                ].map(([label, val]) => (
                  <div key={String(label)} className={`rounded-lg border ${border} p-3`}>
                    <div className={`text-xs ${muted}`}>{label}</div>
                    <div className="text-lg font-semibold tabular-nums">{val ?? "—"}</div>
                  </div>
                ))}
              </div>
              <p className={`mt-2 text-[11px] ${muted}`}>
                Server: {stats?.serverTime ? fmtDate(stats.serverTime) : "—"}
              </p>
            </div>

            <div className={`rounded-xl border ${card} p-4 space-y-3`}>
              <p className="text-sm font-medium">Dọn dẹp nội dung AI</p>
              <p className={`text-xs ${muted}`}>
                Mỗi thao tác yêu cầu gõ <code className="font-mono">CONFIRM</code> trước khi xóa vĩnh viễn.
              </p>
              <input
                className={`w-full max-w-xs rounded-lg border px-3 py-1.5 text-sm font-mono ${input}`}
                placeholder="Gõ CONFIRM"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  disabled={loading || confirmText !== "CONFIRM"}
                  onClick={async () => {
                    await mutate({ action: "purge_ai_metadata", confirm: confirmText });
                    setConfirmText("");
                  }}
                  className="rounded-lg bg-rose-700/90 px-3 py-2 text-sm text-white disabled:opacity-40"
                >
                  Quét & Xóa Tóm Tắt / Metadata AI
                </button>
                <button
                  type="button"
                  disabled={loading || confirmText !== "CONFIRM"}
                  onClick={async () => {
                    await mutate({ action: "purge_ai_cache", confirm: confirmText });
                    setConfirmText("");
                  }}
                  className="rounded-lg bg-amber-700/90 px-3 py-2 text-sm text-white disabled:opacity-40"
                >
                  Xóa Cache / Lịch sử AI
                </button>
                <button
                  type="button"
                  disabled={loading || confirmText !== "CONFIRM"}
                  onClick={async () => {
                    await mutate({ action: "clean_orphans", confirm: confirmText });
                    setConfirmText("");
                  }}
                  className="rounded-lg bg-zinc-700 px-3 py-2 text-sm text-white disabled:opacity-40"
                >
                  Dọn mục rác / bản ghi cô lập
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className={`w-full max-w-sm rounded-2xl border ${card} p-5 shadow-2xl`}>
            {modal.type === "delete_account" && (
              <>
                <h3 className="font-semibold">Xóa tài khoản vĩnh viễn?</h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  {String(modal.payload?.username)} — không thể hoàn tác.
                </p>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
                    onClick={() => setModal({ type: null })}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white"
                    onClick={async () => {
                      await mutate({
                        action: "delete_account",
                        id: modal.payload?.id,
                        username: modal.payload?.username,
                      });
                      setModal({ type: null });
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </>
            )}
            {modal.type === "delete_key" && (
              <>
                <h3 className="font-semibold">Xóa key?</h3>
                <p className={`mt-1 text-sm font-mono ${muted}`}>{String(modal.payload?.code)}</p>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
                    onClick={() => setModal({ type: null })}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white"
                    onClick={async () => {
                      await mutate({
                        action: "delete_key",
                        id: modal.payload?.id,
                        code: modal.payload?.code,
                      });
                      setModal({ type: null });
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </>
            )}
            {modal.type === "delete_verify" && (
              <>
                <h3 className="font-semibold">Xóa yêu cầu xác minh?</h3>
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
                    onClick={() => setModal({ type: null })}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm text-white"
                    onClick={async () => {
                      await mutate({ action: "delete_verify", id: modal.payload?.id });
                      setModal({ type: null });
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </>
            )}
            {modal.type === "reset_pw" && (
              <>
                <h3 className="font-semibold">Đổi mật khẩu</h3>
                <p className={`mt-1 text-sm ${muted}`}>{String(modal.payload?.username)}</p>
                <input
                  type="password"
                  className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
                  placeholder="Mật khẩu mới (≥8)"
                  value={resetPw}
                  onChange={(e) => setResetPw(e.target.value)}
                />
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
                    onClick={() => {
                      setModal({ type: null });
                      setResetPw("");
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white"
                    onClick={async () => {
                      await mutate({
                        action: "reset_password",
                        id: modal.payload?.id,
                        username: modal.payload?.username,
                        password: resetPw,
                      });
                      setModal({ type: null });
                      setResetPw("");
                    }}
                  >
                    Lưu
                  </button>
                </div>
              </>
            )}
            {modal.type === "ban" && (
              <>
                <h3 className="font-semibold">Khóa tài khoản</h3>
                <p className={`mt-1 text-sm ${muted}`}>{String(modal.payload?.username)}</p>
                <input
                  className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
                  placeholder="Lý do"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                />
                <div className="mt-4 flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
                    onClick={() => setModal({ type: null })}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-amber-700 px-3 py-1.5 text-sm text-white"
                    onClick={async () => {
                      await mutate({
                        action: "ban",
                        username: modal.payload?.username,
                        reason: banReason,
                        permanent: false,
                        hours: 24,
                      });
                      setModal({ type: null });
                    }}
                  >
                    Khóa 24h
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white"
                    onClick={async () => {
                      await mutate({
                        action: "ban",
                        username: modal.payload?.username,
                        reason: banReason,
                        permanent: true,
                      });
                      setModal({ type: null });
                    }}
                  >
                    Khóa vĩnh viễn
                  </button>
                </div>
              </>
            )}
            {modal.type === "grant_coins" && (
              <>
                <h3 className="font-semibold">Cấp xu</h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  {String(modal.payload?.username)}
                  {modal.payload?.uid ? ` · UID ${String(modal.payload.uid)}` : ""}
                </p>
                <input
                  type="number"
                  min={1}
                  className={`mt-3 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
                  placeholder="Số xu"
                  value={grantAmount}
                  onChange={(e) => setGrantAmount(e.target.value)}
                />
                <input
                  className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm ${input}`}
                  placeholder="Ghi chú (tuỳ chọn)"
                  value={grantNote}
                  onChange={(e) => setGrantNote(e.target.value)}
                />
                <div className="mt-4 flex gap-2 justify-end">
                  <button
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
                    onClick={() => {
                      setModal({ type: null });
                      setGrantNote("");
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-zinc-950"
                    onClick={async () => {
                      await mutate({
                        action: "grant_coins",
                        username: modal.payload?.username,
                        uid: modal.payload?.uid,
                        amount: Number(grantAmount),
                        note: grantNote || "Admin cấp xu",
                      });
                      setModal({ type: null });
                      setGrantNote("");
                    }}
                  >
                    Cấp xu
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 rounded-xl px-4 py-2 text-sm shadow-lg ${
            toast.type === "ok"
              ? "bg-emerald-600 text-white"
              : toast.type === "err"
                ? "bg-rose-600 text-white"
                : "bg-zinc-800 text-zinc-100"
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}
