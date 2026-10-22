"use client";

import { useState } from "react";
import { VipTimer } from "@/components/settings/VipTimer";
import { OPUS_KEY_REGEX } from "@/lib/vipCatalog";
import { useVipAccess } from "@/lib/vipAccess";
import { useAccountStore } from "@/lib/account";

export function VipCountdownCard({ onActivate }: { onActivate?: () => void }) {
  const username = useAccountStore((s) => s.username);
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);
  const setFromServer = useVipAccess((s) => s.setFromServer);

  const [panel, setPanel] = useState<"none" | "key" | "clear">("none");
  const [keyInput, setKeyInput] = useState("");
  const [clearConfirm, setClearConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const active = isLifetime || (vipExpiresAt != null && vipExpiresAt > Date.now());

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
    <div className="space-y-3">
      <VipTimer />

      <div className="flex flex-wrap gap-2">
        {!active && !isLifetime ? (
          <button
            type="button"
            onClick={onActivate}
            className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
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
          className="inline-flex items-center rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200"
        >
          Nhập Key mới
        </button>
        {(active || isLifetime) && (
          <button
            type="button"
            onClick={() => {
              setPanel(panel === "clear" ? "none" : "clear");
              setMsg(null);
            }}
            className="inline-flex items-center rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300"
          >
            Xóa gói
          </button>
        )}
      </div>

      {panel === "key" ? (
        <div className="rounded-lg border border-white/10 bg-[#0e0f14] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-200">Nhập License Key hoặc Giftcode</p>
            <button type="button" onClick={() => setPanel("none")} className="text-zinc-400">
              Đóng
            </button>
          </div>
          <input
            className="w-full rounded-md border border-white/10 bg-[#13141c] px-2.5 py-1.5 font-mono text-sm uppercase text-white placeholder:text-zinc-500"
            placeholder="OPUS-24H-XXXXXXXX hoặc GIFT-XXXX-YYYY"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void redeemKey();
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void redeemKey()}
            className="mt-2 w-full rounded-lg bg-indigo-600 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {busy ? "Đang xử lý…" : "Kích hoạt"}
          </button>
        </div>
      ) : null}

      {panel === "clear" ? (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-200">Xóa gói VIP hiện tại?</p>
            <button type="button" onClick={() => setPanel("none")} className="text-zinc-400">
              Đóng
            </button>
          </div>
          <p className="mb-2 text-[11px] text-zinc-400">Gõ CONFIRM để xác nhận.</p>
          <input
            className="w-full rounded-md border border-white/10 bg-[#13141c] px-2.5 py-1.5 text-sm text-white"
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

      {msg ? <p className="text-xs text-zinc-400">{msg}</p> : null}
    </div>
  );
}
