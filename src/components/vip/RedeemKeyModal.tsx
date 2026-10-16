"use client";

import { useState } from "react";
import { KeyRound, TicketCheck, X } from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useVipAccess } from "@/lib/vipAccess";
import { OPUS_KEY_REGEX } from "@/lib/vipCatalog";

export function RedeemKeyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const username = useAccountStore((s) => s.username);
  const setFromServer = useVipAccess((s) => s.setFromServer);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  const submit = async () => {
    const raw = code.trim().toUpperCase();
    if (!username) {
      setMsg("Cần đăng nhập");
      return;
    }
    if (!raw) {
      setMsg("Nhập mã");
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const isKey = OPUS_KEY_REGEX.test(raw);
      const url = isKey ? "/api/vip/redeem-key" : "/api/vip/redeem-gift";
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isKey ? { username, key: raw } : { username, code: raw }
        ),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Không kích hoạt được");
      } else {
        if (data.coins != null || data.vipExpiresAt != null || data.isLifetime != null) {
          setFromServer({
            coins: data.coins,
            vipExpiresAt: data.vipExpiresAt,
            isLifetime: data.isLifetime,
          });
        }
        setMsg(data.message || "OK");
        setCode("");
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[101] flex items-center justify-center bg-black/55 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-xl ui-border-contrast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-foreground">Nhập Key / Giftcode</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
          </button>
        </div>
        <p className="mt-2 text-xs text-foreground-muted">
          Key: OPUS-24H-XXXXXXXX · Giftcode: mã sự kiện
        </p>
        <input
          className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
          placeholder="OPUS-7D-A1B2C3D4"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit()}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          <TicketCheck className="h-4 w-4" strokeWidth={1.75} />
          {busy ? "Đang xử lý…" : "Kích hoạt"}
        </button>
        {msg ? <p className="mt-2 text-xs text-foreground-muted">{msg}</p> : null}
      </div>
    </div>
  );
}
