"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { FeatureFlags, SystemAuditLog, SystemConfig } from "@/lib/system/types";
import { DEFAULT_FLAGS } from "@/lib/system/types";

type Theme = "dark" | "light";

interface Props {
  secret: string;
  theme: Theme;
}

export function SystemControlTab({ secret, theme }: Props) {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [maintMsg, setMaintMsg] = useState("");
  const [untilHours, setUntilHours] = useState("2");
  const [panicText, setPanicText] = useState("");
  const [flags, setFlags] = useState<FeatureFlags>({ ...DEFAULT_FLAGS });

  const isDark = theme === "dark";
  const card = isDark ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200";
  const input = isDark
    ? "bg-zinc-950 border-zinc-700 text-zinc-100"
    : "bg-white border-zinc-300 text-zinc-900";
  const muted = isDark ? "text-zinc-400" : "text-zinc-500";
  const border = isDark ? "border-zinc-800" : "border-zinc-200";

  const headers = {
    "Content-Type": "application/json",
    "x-admin-secret": secret,
  };

  const flash = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system?limit=40", { headers });
      const data = await res.json();
      if (data.ok) {
        setConfig(data.config);
        setFlags(data.config?.featureFlags || DEFAULT_FLAGS);
        setMaintMsg(data.config?.maintenanceMessage || "");
        setLogs(data.logs || []);
      } else flash(data.error || "Lỗi tải");
    } catch {
      flash("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [secret]);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/system", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...body, adminId: "board-home" }),
      });
      const data = await res.json();
      if (!data.ok) {
        flash(data.error || "Thất bại");
        return null;
      }
      if (data.config) {
        setConfig(data.config);
        setFlags(data.config.featureFlags || DEFAULT_FLAGS);
      }
      flash(data.message || "OK");
      await load();
      return data;
    } catch {
      flash("Lỗi mạng");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const downloadSnapshot = async () => {
    try {
      const res = await fetch("/api/admin/system/snapshot", { headers });
      if (!res.ok) {
        flash("Không tải được snapshot");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `opus-snapshot-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      flash("Đã tải snapshot");
    } catch {
      flash("Lỗi tải snapshot");
    }
  };

  return (
    <div className="h-full overflow-y-auto max-h-[calc(100vh-160px)] space-y-3 pr-1">
      {/* Maintenance */}
      <div className={`rounded-xl border ${card} p-4 space-y-3`}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Bảo trì</p>
          <span
            className={`text-[11px] px-2 py-0.5 rounded-full ${
              config?.maintenanceMode
                ? "bg-amber-500/20 text-amber-300"
                : "bg-emerald-500/20 text-emerald-300"
            }`}
          >
            {config?.maintenanceMode ? "ĐANG BẢO TRÌ" : "Đang mở"}
          </span>
        </div>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm ${input}`}
          placeholder="Thông báo bảo trì"
          value={maintMsg}
          onChange={(e) => setMaintMsg(e.target.value)}
        />
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="number"
            min={1}
            className={`w-24 rounded-lg border px-2 py-1.5 text-sm ${input}`}
            value={untilHours}
            onChange={(e) => setUntilHours(e.target.value)}
            title="Giờ hẹn"
          />
          <span className={`text-xs ${muted}`}>giờ</span>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              const data = await post({
                action: "set_maintenance",
                enabled: true,
                message: maintMsg,
                untilHours: Number(untilHours) || 2,
              });
              if (data?.ok) {
                document.cookie =
                  "opus_maint_mode=1; path=/; max-age=86400; SameSite=Lax";
                try {
                  new BroadcastChannel("opus_system_sync").postMessage({
                    kind: "maintenance",
                    on: true,
                  });
                } catch {
                  /* */
                }
              }
            }}
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white"
          >
            Bật bảo trì
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={async () => {
              const data = await post({
                action: "set_maintenance",
                enabled: false,
                message: "",
              });
              if (data?.ok) {
                document.cookie =
                  "opus_maint_mode=; path=/; max-age=0; SameSite=Lax";
                try {
                  new BroadcastChannel("opus_system_sync").postMessage({
                    kind: "maintenance",
                    on: false,
                  });
                } catch {
                  /* */
                }
              }
            }}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white"
          >
            Tắt bảo trì
          </button>
        </div>
      </div>

      {/* Panic */}
      <div className={`rounded-xl border border-rose-900/50 ${card} p-4 space-y-3`}>
        <p className="text-sm font-medium text-rose-400">Panic / Lockdown</p>
        <p className={`text-xs ${muted}`}>
          Đóng băng giao dịch (quay, điểm danh, cấp xu…). Gõ{" "}
          <code className="font-mono">EMERGENCY_LOCKDOWN</code>
        </p>
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm font-mono ${input}`}
          placeholder="EMERGENCY_LOCKDOWN"
          value={panicText}
          onChange={(e) => setPanicText(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || panicText !== "EMERGENCY_LOCKDOWN"}
            onClick={() =>
              void post({ action: "panic_on", confirm: panicText }).then(() =>
                setPanicText("")
              )
            }
            className="rounded-lg bg-rose-700 px-3 py-2 text-sm text-white disabled:opacity-40"
          >
            Bật lockdown
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void post({ action: "panic_off" })}
            className="rounded-lg border border-rose-800 px-3 py-2 text-sm text-rose-300"
          >
            Tắt lockdown
          </button>
          {config?.panicLockdown && (
            <span className="text-xs text-rose-400 self-center">ĐANG LOCKDOWN</span>
          )}
        </div>
      </div>

      {/* Feature flags */}
      <div className={`rounded-xl border ${card} p-4 space-y-3`}>
        <p className="text-sm font-medium">Feature flags</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              ["FEATURE_SPIN", "Vòng quay"],
              ["FEATURE_CHECKIN", "Điểm danh"],
              ["FEATURE_SHOP", "Cửa hàng / Kho"],
              ["FEATURE_TRANSFER", "Giao dịch / Tặng"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className={`flex items-center justify-between gap-2 rounded-lg border ${border} px-3 py-2 text-sm`}
            >
              <span>{label}</span>
              <input
                type="checkbox"
                checked={!!flags[key]}
                onChange={(e) =>
                  setFlags((f) => ({ ...f, [key]: e.target.checked }))
                }
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void post({ action: "set_flags", flags })}
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white"
        >
          Lưu flags
        </button>
      </div>

      {/* Revalidate + snapshot */}
      <div className={`rounded-xl border ${card} p-4 space-y-3`}>
        <p className="text-sm font-medium">Cache & Backup</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() =>
              void post({
                action: "revalidate",
                paths: ["/", "/su-kien", "/tai-khoan"],
              })
            }
            className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
          >
            Revalidate ISR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void downloadSnapshot()}
            className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
          >
            Tải snapshot JSON
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className={`rounded-lg border px-3 py-1.5 text-sm ${border}`}
          >
            Refresh
          </button>
        </div>
        <p className={`text-[11px] ${muted}`}>
          build: {config?.buildId || "—"} · schema v{config?.schemaVersion ?? "—"}
        </p>
      </div>

      {/* Audit logs — append only, no delete UI */}
      <div className={`rounded-xl border ${card} overflow-hidden`}>
        <p className="px-4 py-2 text-sm font-medium border-b border-inherit">
          Audit log (chỉ đọc)
        </p>
        <div className="overflow-y-auto max-h-[240px]">
          <table className="w-full text-xs">
            <thead className={isDark ? "bg-zinc-900" : "bg-zinc-100"}>
              <tr className={`text-left ${muted}`}>
                <th className="px-3 py-1.5">Thời gian</th>
                <th className="px-3 py-1.5">Action</th>
                <th className="px-3 py-1.5">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr>
                  <td colSpan={3} className={`px-3 py-4 text-center ${muted}`}>
                    Trống
                  </td>
                </tr>
              )}
              {logs.map((l) => (
                <tr key={l.id} className={`border-t ${border}`}>
                  <td className="px-3 py-1.5 whitespace-nowrap">
                    {new Date(l.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-3 py-1.5 font-mono">{l.action}</td>
                  <td className={`px-3 py-1.5 ${muted}`}>{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-xl bg-zinc-800 px-4 py-2 text-sm text-white shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}

export default SystemControlTab;
