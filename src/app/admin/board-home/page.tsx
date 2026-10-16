"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Activity, BadgeCheck, Clapperboard, Cpu, Gift, KeyRound, Lock, Moon, Radio, RefreshCw, ShieldAlert, Sun, Users } from "lucide-react";
import type { AdminAccount, SystemStats, VerifyRequestItem } from "@/lib/adminEngine";
import type { LicenseKeyRecord, KeyTier } from "@/lib/keyEngine";
import { AccountTab } from "@/components/admin/board/AccountTab";
import { MovieCmsTab } from "@/components/admin/board/MovieCmsTab";
import { KeyBoardTab } from "@/components/admin/board/KeyBoardTab";
import { VerifyTab } from "@/components/admin/board/VerifyTab";
import { GiftcodeTab } from "@/components/admin/board/GiftcodeTab";
import { ModerationTab } from "@/components/admin/board/ModerationTab";
import { SystemAiTab } from "@/components/admin/board/SystemAiTab";
import type { BoardTheme } from "@/components/admin/board/adminUi";
import { boardTokens, btn } from "@/components/admin/board/adminUi";

type TabId =
  | "ACCOUNTS"
  | "MOVIES"
  | "KEY-BOARD"
  | "VERIFY"
  | "GIFTCODE"
  | "MODERATION"
  | "SYSTEM";

const TABS: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: "ACCOUNTS", label: "Tài khoản", icon: Users },
  { id: "MOVIES", label: "Phim & Tập", icon: Clapperboard },
  { id: "KEY-BOARD", label: "Key-board", icon: KeyRound },
  { id: "VERIFY", label: "Xác minh", icon: BadgeCheck },
  { id: "GIFTCODE", label: "Giftcode & Sự kiện", icon: Gift },
  { id: "MODERATION", label: "Báo lỗi & Kiểm duyệt", icon: ShieldAlert },
  { id: "SYSTEM", label: "Hệ thống & AI", icon: Cpu },
];

const SECRET_STORAGE = "opus_admin_secret";
const THEME_STORAGE = "opus_admin_theme";

export default function BoardHomePage() {
  const [theme, setTheme] = useState<BoardTheme>("dark");
  const [secret, setSecret] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [gateError, setGateError] = useState("");
  const [tab, setTab] = useState<TabId>("ACCOUNTS");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "info" } | null>(null);
  const [refreshSpin, setRefreshSpin] = useState(false);

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [keys, setKeys] = useState<LicenseKeyRecord[]>([]);
  const [verifyItems, setVerifyItems] = useState<VerifyRequestItem[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [accountQ, setAccountQ] = useState("");

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = boardTokens(theme);

  useEffect(() => {
    try {
      const th = localStorage.getItem(THEME_STORAGE) as BoardTheme | null;
      if (th === "light" || th === "dark") setTheme(th);
    } catch {
      /* */
    }
  }, []);

  const setThemePersist = (th: BoardTheme) => {
    setTheme(th);
    try {
      localStorage.setItem(THEME_STORAGE, th);
    } catch {
      /* */
    }
  };

  const showToast = (msg: string, type: "ok" | "err" | "info" = "info") => {
    setToast({ msg, type });
    window.setTimeout(() => setToast(null), 3200);
  };

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      "x-admin-secret": secret,
    }),
    [secret]
  );

  const unlock = async () => {
    setGateError("");
    const s = secret.trim();
    if (!s) {
      setGateError("Nhập mã quản trị");
      return;
    }
    try {
      // 1) Chỉ kiểm tra secret — không đụng DB
      const authRes = await fetch("/api/admin/board-home?section=auth", {
        headers: { "x-admin-secret": s },
      });
      const authData = await authRes.json().catch(() => ({}));
      if (authRes.status === 401 || authData.ok === false) {
        setGateError(authData.error || "Mã quản trị không đúng");
        return;
      }
      if (!authRes.ok) {
        setGateError(
          authData.error ||
            `Không mở được cổng admin (${authRes.status})`
        );
        return;
      }

      setSecret(s);
      setUnlocked(true);
      try {
        sessionStorage.setItem(SECRET_STORAGE, s);
      } catch {
        /* */
      }

      // 2) Stats tùy chọn — nếu Neon hết quota vẫn vào được UI
      try {
        const res = await fetch("/api/admin/board-home?section=stats", {
          headers: { "x-admin-secret": s },
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.stats) setStats(data.stats);
        else if (!res.ok && data.error) {
          setGateError(
            data.error.includes("Neon") || data.error.includes("quota")
              ? data.error
              : ""
          );
        }
      } catch {
        /* stats optional */
      }
    } catch {
      setGateError("Không kết nối được máy chủ");
    }
  };

  const lockScreen = () => {
    setUnlocked(false);
    try {
      sessionStorage.removeItem(SECRET_STORAGE);
    } catch {
      /* */
    }
  };

  useEffect(() => {
    try {
      const s = sessionStorage.getItem(SECRET_STORAGE) || "";
      if (s) {
        setSecret(s);
        void (async () => {
          const authRes = await fetch("/api/admin/board-home?section=auth", {
            headers: { "x-admin-secret": s },
          });
          if (authRes.ok) {
            setUnlocked(true);
            try {
              const res = await fetch("/api/admin/board-home?section=stats", {
                headers: { "x-admin-secret": s },
              });
              const data = await res.json().catch(() => ({}));
              if (res.ok && data.stats) setStats(data.stats);
            } catch {
              /* */
            }
          }
        })();
      }
    } catch {
      /* */
    }
  }, []);

  const loadSection = useCallback(
    async (section: TabId) => {
      if (!secret) return;
      setLoading(true);
      try {
        if (section === "ACCOUNTS" || section === "SYSTEM") {
          const res = await fetch(
            `/api/admin/board-home?section=accounts&q=${encodeURIComponent(accountQ)}`,
            { headers: headers() }
          );
          const data = await res.json().catch(() => ({}));
          if (data.ok) setAccounts(data.accounts || []);
        }
        if (section === "KEY-BOARD") {
          const res = await fetch(`/api/admin/board-home?section=keys&tier=ALL&limit=120`, {
            headers: headers(),
          });
          const data = await res.json().catch(() => ({}));
          if (data.ok) setKeys(data.keys || []);
        }
        if (section === "VERIFY") {
          const res = await fetch(`/api/admin/board-home?section=verify`, {
            headers: headers(),
          });
          const data = await res.json().catch(() => ({}));
          if (data.ok) setVerifyItems(data.items || data.requests || []);
        }
        const st = await fetch(`/api/admin/board-home?section=stats`, {
          headers: headers(),
        });
        const stData = await st.json().catch(() => ({}));
        if (stData.ok && stData.stats) setStats(stData.stats);
      } catch {
        showToast("Lỗi tải dữ liệu", "err");
      } finally {
        setLoading(false);
      }
    },
    [secret, headers, accountQ]
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

  const runAction = async (
    body: Record<string, unknown>,
    opts?: { silent?: boolean }
  ) => {
    const action = String(body.action || "");
    const isList = action.startsWith("list_") || action === "stats";
    const silent = opts?.silent ?? isList;
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/admin/board-home", {
        method: "POST",
        headers: headers(),
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const errMsg =
          data.error ||
          data.message ||
          (res.status === 500 ? "Lỗi máy chủ (500)" : `Thao tác thất bại (${res.status})`);
        if (!silent) showToast(errMsg, "err");
        return { ok: false, error: errMsg, ...data };
      }
      if (!silent) {
        showToast(data.message || "Thành công", "ok");
        await loadSection(tab);
      }
      return data;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Lỗi mạng";
      if (!silent) showToast(errMsg, "err");
      return { ok: false, error: errMsg };
    } finally {
      if (!silent) setLoading(false);
    }
  };

  if (!unlocked) {
    return (
      <div className={`flex h-screen items-center justify-center p-4 ${t.page}`}>
        <div className={`w-full max-w-sm rounded-2xl border p-6 shadow-xl ${t.surface}`}>
          <h1 className="text-lg font-semibold tracking-tight">OpusFilm · Master Board</h1>
          <p className={`mt-1 text-sm ${t.muted}`}>Nhập mã quản trị để mở bảng điều khiển</p>
          <input
            type="password"
            autoFocus
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void unlock()}
            placeholder="x-admin-secret"
            className={`mt-4 w-full rounded-xl border px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-violet-500/40 ${t.input}`}
          />
          {gateError ? <p className="mt-2 text-sm text-rose-500">{gateError}</p> : null}
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
    <div className={`min-h-screen ${t.page}`}>
      {/* Executive topbar */}
      <header className={`sticky top-0 z-40 border-b ${t.border} ${t.surface}`}>
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold tracking-tight sm:text-lg">
                OpusFilm · Master Board
              </h1>
              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${t.border} ${t.muted}`}>
                v1.17
              </span>
            </div>
            <p className={`mt-0.5 text-xs ${t.muted}`}>
              {stats?.users ?? "—"} tài khoản
              {" · "}
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <Radio className="h-3.5 w-3.5" strokeWidth={1.75} />
                {stats?.sessions ?? "—"} online
              </span>
              {" · "}
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <Activity className="h-3.5 w-3.5" strokeWidth={1.75} />
                treo máy
              </span>
              {" · "}
              {stats?.keysActive ?? 0}/{stats?.keysTotal ?? 0} API key
              {" · "}
              {stats?.pendingVerify ?? 0} chờ duyệt
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`${btn.compact} ${btn.ghost}`}
              onClick={() => setThemePersist(theme === "dark" ? "light" : "dark")}
              aria-label="Đổi theme"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.ghost}`}
              onClick={() => {
                setRefreshSpin(true);
                void loadSection(tab).finally(() => {
                  window.setTimeout(() => setRefreshSpin(false), 400);
                });
              }}
              aria-label="Làm mới"
            >
              <RefreshCw className={`h-4 w-4 ${refreshSpin ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              className={`${btn.compact} ${btn.ghost}`}
              onClick={lockScreen}
              aria-label="Khóa màn hình"
            >
              <Lock className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Segmented tabs */}
        <div className="mx-auto max-w-[1600px] overflow-x-auto px-4 pb-3">
          <div className={`inline-flex min-w-min gap-1 rounded-lg border p-1 ${t.border}`}>
            {TABS.map((x) => {
              const Icon = x.icon;
              return (
              <button
                key={x.id}
                type="button"
                onClick={() => setTab(x.id)}
                className={`${btn.compact} inline-flex items-center gap-1.5 whitespace-nowrap ${
                  tab === x.id ? btn.primary : t.tabIdle
                }`}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {x.label}
              </button>
            );})}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4 pb-16">
        {tab === "ACCOUNTS" && (
          <AccountTab
            theme={theme}
            accounts={accounts}
            loading={loading}
            onRefresh={() => void loadSection("ACCOUNTS")}
            onAction={runAction}
          />
        )}
        {tab === "MOVIES" && <MovieCmsTab theme={theme} />}
        {tab === "KEY-BOARD" && (
          <KeyBoardTab
            theme={theme}
            keys={keys}
            loading={loading}
            onAction={runAction}
            onRefresh={() => void loadSection("KEY-BOARD")}
          />
        )}
        {tab === "VERIFY" && (
          <VerifyTab
            theme={theme}
            items={verifyItems}
            loading={loading}
            onAction={runAction}
          />
        )}
        {tab === "GIFTCODE" && <GiftcodeTab theme={theme} onAction={runAction} />}
        {tab === "MODERATION" && (
          <ModerationTab theme={theme} adminSecret={secret} />
        )}
        {tab === "SYSTEM" && (
          <SystemAiTab theme={theme} adminSecret={secret} onAction={runAction} />
        )}
      </main>

      {toast ? (
        <div
          className={`fixed bottom-4 right-4 z-[90] max-w-sm rounded-lg border px-3 py-2 text-sm shadow-xl ${
            toast.type === "err"
              ? "border-rose-600 bg-rose-600 text-white"
              : toast.type === "ok"
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-700 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100"
          }`}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}
