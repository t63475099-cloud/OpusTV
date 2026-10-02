"use client";

import React, { useEffect, useState } from "react";
import { useAccountRealtime } from "@/hooks/useAccountRealtime";
import type { UserSessionInfo } from "@/lib/session/types";

type Theme = "dark" | "light";

function deviceIcon(type: UserSessionInfo["deviceType"]) {
  if (type === "mobile") return "📱";
  if (type === "tablet") return "📲";
  if (type === "desktop") return "💻";
  return "🖥️";
}

function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export interface SecurityDevicesCardProps {
  /** Username đã đăng nhập — bật realtime */
  username?: string | null;
  theme?: Theme;
  className?: string;
  onForceLogout?: (msg: string) => void;
}

export function SecurityDevicesCard({
  username,
  theme = "dark",
  className = "",
  onForceLogout,
}: SecurityDevicesCardProps) {
  const enabled = !!username;
  const {
    status,
    snapshot,
    devices,
    stateVersion,
    flash,
    refreshDevices,
    revokeSession,
    revokeOthers,
  } = useAccountRealtime({
    enabled,
    onForceLogout: (msg) => {
      onForceLogout?.(msg);
    },
  });

  const [busy, setBusy] = useState<number | "others" | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (enabled) void refreshDevices();
  }, [enabled, refreshDevices]);

  const isDark = theme === "dark";
  const card = isDark
    ? "bg-zinc-900 border-zinc-800 text-zinc-100"
    : "bg-white border-zinc-200 text-zinc-900";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const border = isDark ? "border-zinc-800" : "border-zinc-200";

  if (!enabled) {
    return (
      <div className={`rounded-2xl border p-4 ${card} ${className}`}>
        <p className={`text-sm ${muted}`}>Đăng nhập để xem thiết bị đang hoạt động.</p>
      </div>
    );
  }

  const vipLeft = (() => {
    if (!snapshot?.vipExpiresAt) return null;
    const ms = new Date(snapshot.vipExpiresAt).getTime() - Date.now();
    if (ms <= 0) return "Hết hạn";
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  })();

  return (
    <div className={`rounded-2xl border ${card} ${className}`}>
      {/* Live balance panel */}
      <div
        className={`border-b ${border} px-4 py-3 transition-colors duration-300 ${
          flash ? (isDark ? "bg-violet-500/15" : "bg-violet-100") : ""
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold">Trạng thái tài khoản</p>
            <p className={`text-[11px] ${muted}`}>
              SSE: {status} · v{stateVersion}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] ${
              status === "live"
                ? "bg-emerald-500/15 text-emerald-400"
                : "bg-amber-500/15 text-amber-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                status === "live" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            {status === "live" ? "Đồng bộ" : status}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className={`rounded-xl border ${border} px-2 py-2`}>
            <div className={`text-[10px] ${muted}`}>Xu</div>
            <div className="text-sm font-semibold tabular-nums">
              {snapshot ? snapshot.coins.toLocaleString("vi-VN") : "—"}
            </div>
          </div>
          <div className={`rounded-xl border ${border} px-2 py-2`}>
            <div className={`text-[10px] ${muted}`}>VIP</div>
            <div className="text-sm font-semibold">{vipLeft ?? "—"}</div>
          </div>
          <div className={`rounded-xl border ${border} px-2 py-2`}>
            <div className={`text-[10px] ${muted}`}>Key</div>
            <div className="text-sm font-semibold">{snapshot?.keyTierActive || "—"}</div>
          </div>
        </div>
      </div>

      {/* Devices */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-sm font-semibold">Thiết bị đang đăng nhập</p>
          <button
            type="button"
            onClick={() => void refreshDevices()}
            className={`text-[11px] ${muted} hover:underline`}
          >
            Làm mới
          </button>
        </div>

        <ul className="space-y-2 max-h-[min(40vh,320px)] overflow-y-auto">
          {devices.length === 0 && (
            <li className={`text-sm py-4 text-center ${muted}`}>Không có phiên nào</li>
          )}
          {devices.map((d) => (
            <li
              key={d.sessionId}
              className={`flex items-start gap-3 rounded-xl border ${border} px-3 py-2.5`}
            >
              <span className="text-lg leading-none mt-0.5">{deviceIcon(d.deviceType)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{d.deviceName}</span>
                  {d.isCurrentDevice && (
                    <span className="rounded-md bg-violet-500/20 px-1.5 py-0.5 text-[10px] text-violet-300">
                      Thiết bị này
                    </span>
                  )}
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] ${
                      d.online ? "text-emerald-400" : muted
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        d.online ? "bg-emerald-400" : "bg-zinc-500"
                      }`}
                    />
                    {d.online ? "Online" : "Offline"}
                  </span>
                </div>
                <p className={`text-[11px] ${muted} truncate`}>
                  {d.browser} · {d.os}
                  {d.ipAddress ? ` · ${d.ipAddress}` : ""}
                </p>
                <p className={`text-[10px] ${muted}`}>Hoạt động: {fmtTime(d.lastActiveAt)}</p>
              </div>
              {!d.isCurrentDevice && (
                <button
                  type="button"
                  disabled={busy === d.sessionId}
                  onClick={async () => {
                    setBusy(d.sessionId);
                    const ok = await revokeSession(d.sessionId);
                    setBusy(null);
                    setToast(ok ? "Đã đăng xuất thiết bị" : "Thất bại");
                    setTimeout(() => setToast(""), 2000);
                  }}
                  className="shrink-0 rounded-lg bg-rose-600/90 px-2 py-1 text-[11px] text-white disabled:opacity-50"
                >
                  {busy === d.sessionId ? "…" : "Đăng xuất"}
                </button>
              )}
            </li>
          ))}
        </ul>

        <button
          type="button"
          disabled={busy === "others" || devices.filter((d) => !d.isCurrentDevice).length === 0}
          onClick={async () => {
            setBusy("others");
            const ok = await revokeOthers();
            setBusy(null);
            setToast(ok ? "Đã đăng xuất các thiết bị khác" : "Thất bại");
            setTimeout(() => setToast(""), 2000);
          }}
          className={`mt-3 w-full rounded-xl border ${border} py-2 text-sm font-medium hover:bg-zinc-800/40 disabled:opacity-40`}
        >
          {busy === "others" ? "Đang xử lý…" : "Đăng xuất tất cả thiết bị khác"}
        </button>

        {toast && (
          <p className="mt-2 text-center text-xs text-emerald-400">{toast}</p>
        )}
      </div>
    </div>
  );
}

export default SecurityDevicesCard;
