"use client";

import { useEffect, useState } from "react";
import { Monitor, Smartphone, LogOut, X, ShieldAlert } from "lucide-react";
import type { AdminUserRow, DeviceSession } from "./accountTypes";

type Props = {
  open: boolean;
  user: AdminUserRow | null;
  adminSecret: string;
  onClose: () => void;
  onToast: (msg: string, ok?: boolean) => void;
};

export function DeviceSessionModal({ open, user, adminSecret, onClose, onToast }: Props) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/accounts?action=sessions&userId=${encodeURIComponent(user.id)}`,
          { headers: { "x-admin-secret": adminSecret } },
        );
        const data = await res.json();
        if (!cancelled) {
          setSessions(Array.isArray(data.sessions) ? data.sessions : user.sessions ?? []);
        }
      } catch {
        if (!cancelled) setSessions(user.sessions ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, user, adminSecret]);

  if (!open || !user) return null;

  async function revoke(sessionId: string | "ALL") {
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({
          action: sessionId === "ALL" ? "revoke_all_sessions" : "revoke_session",
          userId: user!.id,
          sessionId: sessionId === "ALL" ? undefined : sessionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Thất bại");
      onToast(sessionId === "ALL" ? "Đã đăng xuất tất cả thiết bị" : "Đã đăng xuất thiết bị", true);
      if (sessionId === "ALL") setSessions([]);
      else setSessions((s) => s.filter((x) => x.id !== sessionId));
    } catch (e) {
      onToast(e instanceof Error ? e.message : "Lỗi", false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#12141C] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-white">Thiết bị & phiên</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {user.username} · UID {user.uid}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-3 space-y-2">
          {loading && <p className="text-sm text-slate-400 py-6 text-center">Đang tải…</p>}
          {!loading && sessions.length === 0 && (
            <p className="text-sm text-slate-500 py-6 text-center">Không có phiên đang mở</p>
          )}
          {sessions.map((s) => {
            const isMobile = /android|ios|mobile/i.test(s.platform + s.deviceLabel);
            const Icon = isMobile ? Smartphone : Monitor;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3"
              >
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/15 text-violet-300">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100 truncate">{s.deviceLabel}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {s.platform}
                    {s.ipAddress ? ` · ${s.ipAddress}` : ""}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString("vi-VN") : "—"}
                    {s.status ? ` · ${s.status}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => revoke(s.id)}
                  className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-[11px] font-medium text-red-300 hover:bg-red-500/20"
                >
                  Đăng xuất
                </button>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 px-5 py-4 space-y-2">
          <button
            type="button"
            onClick={() => revoke("ALL")}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2.5 text-sm font-medium text-amber-200 hover:bg-amber-500/20"
          >
            <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
            Đăng xuất tất cả thiết bị (Reset token)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-white/10 py-2 text-sm text-slate-300 hover:bg-white/5"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
