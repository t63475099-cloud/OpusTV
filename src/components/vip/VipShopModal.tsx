"use client";

import { useState } from "react";
import { Clock, Coins, Infinity, ShieldCheck, X } from "lucide-react";
import { VIP_TIERS, type VipTierCode } from "@/lib/vipCatalog";
import { useVipAccess } from "@/lib/vipAccess";
import { useAccountStore } from "@/lib/account";

export function VipShopModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const username = useAccountStore((s) => s.username);
  const setFromServer = useVipAccess((s) => s.setFromServer);
  const coins = useVipAccess((s) => s.coins);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  const buy = async (code: VipTierCode) => {
    if (!username) {
      setMsg("Cần đăng nhập");
      return;
    }
    setBusy(code);
    setMsg(null);
    try {
      const res = await fetch("/api/vip/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, tierCode: code }),
      });
      const data = await res.json();
      if (!data.ok) {
        setMsg(data.error || "Mua thất bại");
      } else {
        setFromServer({
          coins: data.coins,
          isLifetime: data.isLifetime,
          vipExpiresAt: data.vipExpiresAt,
        });
        setMsg(data.message || "OK");
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[101] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[min(90vh,640px)] w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ui-border-contrast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.75} />
            <h2 className="text-sm font-semibold text-foreground">Mua gói VIP bằng Xu</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs text-foreground-muted">
              <Coins className="h-4 w-4" strokeWidth={1.75} />
              {coins}
            </span>
            <button type="button" onClick={onClose} aria-label="Đóng">
              <X className="h-4 w-4 text-foreground-muted" strokeWidth={1.75} />
            </button>
          </div>
        </div>
        <div className="max-h-[min(70vh,520px)] space-y-2 overflow-y-auto p-3">
          {VIP_TIERS.map((tier) => (
            <div
              key={tier.code}
              className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5 ui-border-contrast"
            >
              <span className="text-primary">
                {tier.isLifetime ? (
                  <Infinity className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Clock className="h-5 w-5" strokeWidth={1.75} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{tier.label}</p>
                <p className="text-xs text-foreground-muted tabular-nums">
                  {tier.coinPrice.toLocaleString("vi-VN")} Xu
                </p>
              </div>
              <button
                type="button"
                disabled={!!busy}
                onClick={() => void buy(tier.code)}
                className="rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50"
              >
                {busy === tier.code ? "…" : "Mua"}
              </button>
            </div>
          ))}
        </div>
        {msg ? (
          <p className="border-t border-border px-4 py-2 text-xs text-foreground-muted">{msg}</p>
        ) : null}
      </div>
    </div>
  );
}
