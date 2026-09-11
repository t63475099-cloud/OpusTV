"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  ShieldOff,
  RefreshCw,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { cn } from "@/lib/utils";

type SessionItem = {
  id: number;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
  deviceName?: string;
  platform?: string;
  userAgent?: string;
};

function formatVi(iso: string) {
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

function DeviceIcon({ name, platform }: { name?: string; platform?: string }) {
  const t = `${name || ""} ${platform || ""}`.toLowerCase();
  if (/iphone|android|mobile|phone/.test(t)) {
    return <Smartphone className="h-4 w-4" />;
  }
  if (/ipad|tablet/.test(t)) {
    return <Tablet className="h-4 w-4" />;
  }
  return <Monitor className="h-4 w-4" />;
}

export default function SessionManager() {
  const username = useAccountStore((s) => s.username);
  const logout = useAccountStore((s) => s.logout);
  const [list, setList] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | "others" | "all" | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!username) {
      setList([]);
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch("/api/auth/sessions");
      const data = await res.json();
      if (!data.ok) {
        setErr(data.error || "Không tải được phiên");
        setList([]);
      } else {
        setList(Array.isArray(data.sessions) ? data.sessions : []);
      }
    } catch {
      setErr("Mạng lỗi");
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch("/api/auth/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  };

  const onRevoke = async (id: number, isCurrent: boolean) => {
    if (isCurrent) {
      if (!window.confirm("Đăng xuất phiên hiện tại trên máy này?")) return;
    } else {
      if (!window.confirm("Đăng xuất phiên trên thiết bị kia?")) return;
    }
    setBusyId(id);
    setErr("");
    setMsg("");
    try {
      const data = await post({ action: "revoke", sessionId: id });
      if (!data.ok) {
        setErr(data.error || "Không thu hồi được");
      } else if (data.loggedOut) {
        await logout();
        window.location.href = "/tai-khoan";
        return;
      } else {
        setMsg("Đã đăng xuất thiết bị đó");
        await load();
      }
    } catch {
      setErr("Mạng lỗi");
    } finally {
      setBusyId(null);
    }
  };

  const onRevokeOthers = async () => {
    if (!window.confirm("Đăng xuất tất cả thiết bị khác? Máy này vẫn giữ đăng nhập.")) return;
    setBusyId("others");
    setErr("");
    setMsg("");
    try {
      const data = await post({ action: "revoke_others" });
      if (!data.ok) setErr(data.error || "Lỗi");
      else {
        setMsg("Đã đăng xuất các thiết bị khác");
        await load();
      }
    } catch {
      setErr("Mạng lỗi");
    } finally {
      setBusyId(null);
    }
  };

  const onRevokeAll = async () => {
    if (!window.confirm("Đăng xuất mọi thiết bị (kể cả máy này)?")) return;
    setBusyId("all");
    setErr("");
    try {
      const data = await post({ action: "revoke_all" });
      if (!data.ok) setErr(data.error || "Lỗi");
      else {
        await logout();
        window.location.href = "/tai-khoan";
      }
    } catch {
      setErr("Mạng lỗi");
    } finally {
      setBusyId(null);
    }
  };

  if (!username) {
    return (
      <p className="text-sm text-zinc-500">Đăng nhập để xem và quản lý phiên làm việc.</p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-white">Phiên đăng nhập</h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Tên thiết bị lấy từ hệ thống · đăng xuất từ xa được
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Làm mới"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {err && <p className="text-xs text-rose-400">{err}</p>}
      {msg && <p className="text-xs text-emerald-400">{msg}</p>}

      {loading && !list.length ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : list.length === 0 ? (
        <p className="text-sm text-zinc-500 py-2">Không có phiên nào.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((s) => {
            const title =
              (s.deviceName && s.deviceName.trim()) ||
              (s.platform && s.platform.trim()) ||
              "Thiết bị không xác định";
            return (
              <li
                key={s.id}
                className={cn(
                  "flex items-start gap-3 rounded-2xl border px-3 py-2.5 transition",
                  s.isCurrent
                    ? "border-sky-500/40 bg-sky-500/10"
                    : "border-white/10 bg-white/[0.04]"
                )}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-zinc-200 mt-0.5">
                  <DeviceIcon name={s.deviceName} platform={s.platform} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-white font-medium leading-snug break-words">
                    {title}
                    {s.isCurrent && (
                      <span className="ml-2 text-[10px] font-normal text-sky-300 whitespace-nowrap">
                        Đang dùng
                      </span>
                    )}
                  </p>
                  {s.platform && s.deviceName && !String(s.deviceName).includes(s.platform) && (
                    <p className="text-[11px] text-zinc-400 mt-0.5">{s.platform}</p>
                  )}
                  <p className="text-[11px] text-zinc-500 tabular-nums mt-0.5">
                    Đăng nhập: {formatVi(s.createdAt)}
                  </p>
                  <p className="text-[10px] text-zinc-600 tabular-nums">
                    Hết hạn: {formatVi(s.expiresAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busyId === s.id}
                  onClick={() => void onRevoke(s.id, s.isCurrent)}
                  className="p-2 rounded-xl text-zinc-400 hover:text-rose-300 hover:bg-rose-500/15 transition disabled:opacity-50 shrink-0"
                  title="Đăng xuất phiên này"
                >
                  {busyId === s.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          disabled={busyId !== null || list.filter((s) => !s.isCurrent).length === 0}
          onClick={() => void onRevokeOthers()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-white/10 bg-white/[0.06] text-zinc-200 hover:bg-white/10 transition disabled:opacity-40"
        >
          {busyId === "others" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <ShieldOff className="h-3.5 w-3.5" />
          )}
          Đăng xuất thiết bị khác
        </button>
        <button
          type="button"
          disabled={busyId !== null || list.length === 0}
          onClick={() => void onRevokeAll()}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20 transition disabled:opacity-40"
        >
          {busyId === "all" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
          Đăng xuất mọi nơi
        </button>
      </div>
    </div>
  );
}
