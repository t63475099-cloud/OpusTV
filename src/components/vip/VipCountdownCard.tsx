"use client";

import { useState } from "react";
import { KeyRound, Trash2, X } from "lucide-react";
import { VipTimer } from "@/components/settings/VipTimer";
import { OPUS_KEY_REGEX } from "@/lib/vipCatalog";
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
  const [panel, setPanel] = useState<"none" | "key" | "clear">("none");
  const [keyInput, setKeyInput] = useState("");
  const [clearConfirm, setClearConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const active =
    isLifetime || (vipExpiresAt != null && vipExpiresAt > Date.now());

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
        window.dispatchEvent(new Event("vip-status-updated"));
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
        window.dispatchEvent(new Event("vip-status-updated"));
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const btnSecondary =
    "inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-foreground";
  const btnDanger =
    "inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-300";

  return (
    <div className="space-y-3">
      <VipTimer />

      <div className="flex flex-wrap gap-2">
        {!active && !isLifetime ? (
          <button
            type="button"
            onClick={onActivate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
          >
            Gia hạn / Kích hoạt ngay
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setPanel(panel === "key" ? "none" : "key");
            setMsg(null);
          }}
          className={btnSecondary}
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
            className={btnDanger}
          >
            <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            Xóa gói
          </button>
        )}
      </div>

      {panel === "key" ? (
        <div className="rounded-lg border border-border bg-background p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Nhập License Key hoặc Giftcode</p>
            <button type="button" onClick={() => setPanel("none")} aria-label="Đóng">
              <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
            </button>
          </div>
          <input
            className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 font-mono text-sm uppercase text-foreground placeholder:text-foreground-subtle"
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
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-foreground">Xóa gói VIP hiện tại?</p>
            <button type="button" onClick={() => setPanel("none")} aria-label="Đóng">
              <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
            </button>
          </div>
          <p className="mb-2 text-[11px] text-foreground-muted">
            Gõ CONFIRM để xác nhận. Thao tác không hoàn tác.
          </p>
          <input
            className="w-full rounded-md border border-border bg-surface px-2.5 py-1.5 text-sm text-foreground"
            placeholder="CONFIRM"
            value={clearConfirm}
            onChange={(e) => setClearConfirm(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || clearConfirm.trim() !== "CONFIRM"}
            onClick={() => void clearVip()}
            className="mt-2 w-full rounded-lg bg-rose-600 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy ? "Đang xóa…" : "Xóa gói"}
          </button>
        </div>
      ) : null}

      {msg ? (
        <p className="text-xs text-foreground-muted" role="status">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
