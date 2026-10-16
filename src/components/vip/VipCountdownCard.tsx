"use client";

import { useEffect, useState } from "react";
import { Clock, Infinity, KeyRound, ShieldCheck, Trash2, X } from "lucide-react";
import { formatVipRemaining, OPUS_KEY_REGEX } from "@/lib/vipCatalog";
import { useVipAccess } from "@/lib/vipAccess";
import { useAccountStore } from "@/lib/account";

export function VipCountdownCard({
  onActivate,
}: {
  onActivate?: () => void;
}) {
  const username = useAccountStore((s) => s.username);
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);
  const setFromServer = useVipAccess((s) => s.setFromServer);
  const [now, setNow] = useState(() => Date.now());
  const [panel, setPanel] = useState<"none" | "key" | "clear">("none");
  const [keyInput, setKeyInput] = useState("");
  const [clearConfirm, setClearConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const active = isLifetime || (vipExpiresAt != null && vipExpiresAt > now);
  const rem = formatVipRemaining(active && vipExpiresAt ? vipExpiresAt - now : 0);
  const pad = (n: number) => String(n).padStart(2, "0");

  const redeemKey = async () => {
    if (!username) {
      setMsg("Cần đăng nhập");
      return;
    }
    const raw = keyInput.trim().toUpperCase();
    if (!raw) {
      setMsg("Nhập mã Key hoặc Giftcode");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const isKey = OPUS_KEY_REGEX.test(raw);
      const res = await fetch(isKey ? "/api/vip/redeem-key" : "/api/vip/redeem-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isKey ? { username, key: raw } : { username, code: raw }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Không kích hoạt được");
      } else {
        setFromServer({
          coins: data.coins,
          isLifetime: data.isLifetime,
          vipExpiresAt: data.vipExpiresAt,
        });
        setMsg(data.message || "Kích hoạt thành công");
        setKeyInput("");
        setPanel("none");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("vip-status-updated"));
        }
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const clearVip = async () => {
    if (!username) {
      setMsg("Cần đăng nhập");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/vip/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, confirm: clearConfirm.trim() }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Không xóa được");
      } else {
        setFromServer({ isLifetime: false, vipExpiresAt: null });
        setMsg(data.message || "Đã xóa gói");
        setClearConfirm("");
        setPanel("none");
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("vip-status-updated"));
        }
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border-2 border-slate-300 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-900/60">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
        <span className="text-sm font-semibold text-foreground">
          {isLifetime
            ? "THỜI HẠN VIP: VĨNH VIỄN (KHÔNG GIỚI HẠN)"
            : active
              ? "ĐANG KÍCH HOẠT VIP"
              : "CHƯA KÍCH HOẠT VIP"}
        </span>
      </div>

      {isLifetime ? (
        <div className="mt-3 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <Infinity className="h-5 w-5" strokeWidth={1.75} />
          <span className="text-sm font-medium">Không giới hạn thời gian</span>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {(
            [
              [rem.days, "NGÀY"],
              [rem.hours, "GIỜ"],
              [rem.minutes, "PHÚT"],
              [rem.seconds, "GIÂY"],
            ] as const
          ).map(([v, label]) => (
            <div
              key={label}
              className="rounded-lg border border-slate-300 bg-white px-1 py-2 text-center dark:border-slate-600 dark:bg-slate-950"
            >
              <div className="font-mono text-lg font-semibold tabular-nums text-foreground">
                {pad(v)}
              </div>
              <div className="text-[10px] font-medium text-foreground-muted">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Actions under countdown */}
      <div className="mt-3 flex flex-wrap gap-2">
        {!active && !isLifetime ? (
          <button
            type="button"
            onClick={onActivate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            <Clock className="h-4 w-4" strokeWidth={1.75} />
            Gia hạn / Kích hoạt ngay
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setPanel(panel === "key" ? "none" : "key");
            setMsg(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
        >
          <KeyRound className="h-4 w-4" strokeWidth={1.75} />
          Nhập Key mới
        </button>
        {(active || isLifetime) && (
          <button
            type="button"
            onClick={() => {
              setPanel(panel === "clear" ? "none" : "clear");
              setMsg(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/50 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-700 dark:text-rose-300"
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            Xóa gói
          </button>
        )}
      </div>

      {panel === "key" ? (
        <div className="mt-3 rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-slate-950">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Nhập License Key hoặc Giftcode</p>
            <button type="button" onClick={() => setPanel("none")} aria-label="Đóng">
              <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
            </button>
          </div>
          <input
            className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-sm uppercase text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="OPUS-24H-XXXXXXXX hoặc GIFT-XXXX-YYYY"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void redeemKey()}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void redeemKey()}
            className="mt-2 w-full rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : "Kích hoạt"}
          </button>
        </div>
      ) : null}

      {panel === "clear" ? (
        <div className="mt-3 rounded-lg border border-rose-400/40 bg-rose-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Xóa gói VIP hiện tại?</p>
            <button type="button" onClick={() => setPanel("none")} aria-label="Đóng">
              <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
            </button>
          </div>
          <p className="text-xs text-foreground-muted">
            Gói sẽ hết hiệu lực ngay. Gõ <span className="font-mono font-semibold text-rose-600">XOA</span> để
            xác nhận.
          </p>
          <input
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            placeholder="XOA"
            value={clearConfirm}
            onChange={(e) => setClearConfirm(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || clearConfirm.trim().toUpperCase() !== "XOA"}
            onClick={() => void clearVip()}
            className="mt-2 w-full rounded-lg bg-rose-600 py-2 text-xs font-medium text-white disabled:opacity-40"
          >
            {busy ? "Đang xóa…" : "Xác nhận xóa gói"}
          </button>
        </div>
      ) : null}

      {msg ? <p className="mt-2 text-xs text-foreground-muted">{msg}</p> : null}
    </div>
  );
}
