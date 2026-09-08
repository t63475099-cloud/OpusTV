"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  Check,
  ChevronRight,
  Wallet,
  X,
} from "lucide-react";
import {
  COIN_TO_VND,
  MIN_REDEEM_COINS,
  PAYMENT_METHODS,
  REDEEM_FEE_RATE,
  useEventStore,
  type PaymentMethodId,
} from "@/lib/eventCoins";
import { cn } from "@/lib/utils";
import { useNotifStore } from "@/lib/notifications";

function fmtVnd(n: number) {
  return n.toLocaleString("vi-VN") + "₫";
}

export default function RedeemCashPanel() {
  const coins = useEventStore((s) => s.coins);
  const history = useEventStore((s) => s.redeemHistory) || [];
  const redeemCash = useEventStore((s) => s.redeemCash);
  const cancelRedeem = useEventStore((s) => s.cancelRedeem);

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(MIN_REDEEM_COINS));
  const [method, setMethod] = useState<PaymentMethodId>("momo");
  const [accountName, setAccountName] = useState("");
  const [accountInfo, setAccountInfo] = useState("");
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const amt = Math.floor(Number(amount) || 0);
  const calc = useMemo(() => {
    const gross = Math.max(0, amt) * COIN_TO_VND;
    const fee = Math.round(gross * REDEEM_FEE_RATE);
    return { gross, fee, net: Math.max(0, gross - fee) };
  }, [amt]);

  const submit = () => {
    setError("");
    setOkMsg("");
    const res = redeemCash({
      coins: amt,
      method,
      accountName,
      accountInfo,
    });
    if (!res.ok) {
      setError(res.error || "Không thể đổi");
      return;
    }
    setOkMsg(
      `Đã gửi yêu cầu · ${fmtVnd(res.request!.vndNet)} qua ${
        PAYMENT_METHODS.find((m) => m.id === method)?.name || method
      }`
    );
    try {
      useNotifStore.getState().add({
        kind: "system",
        title: "Đổi xu",
        body: `Yêu cầu ${amt} xu · ${fmtVnd(res.request!.vndNet)}`,
        href: "/su-kien",
      });
    } catch {
      /* */
    }
    setAccountInfo("");
  };

  return (
    <section className="glass-panel p-4 space-y-3" data-gsap-reveal>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Banknote className="w-4 h-4 text-emerald-400" />
          Đổi xu thành tiền
        </h2>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30"
        >
          {open ? "Đóng" : "Đổi ngay"}
        </button>
      </div>
      <p className="text-xs text-zinc-400">
        1 xu = {COIN_TO_VND}₫ · Tối thiểu {MIN_REDEEM_COINS.toLocaleString("vi-VN")} xu · Phí{" "}
        {Math.round(REDEEM_FEE_RATE * 100)}%
      </p>
      <p className="text-xs text-zinc-500">
        Số dư: <strong className="text-amber-300">{coins.toLocaleString("vi-VN")} xu</strong>
        {" ≈ "}
        <strong className="text-emerald-300">{fmtVnd(coins * COIN_TO_VND)}</strong>
      </p>

      {open && (
        <div className="space-y-3 pt-1 border-t border-white/10">
          <label className="block text-xs text-zinc-400">
            Số xu muốn đổi
            <input
              type="number"
              min={MIN_REDEEM_COINS}
              step={100}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
            />
          </label>
          <div className="rounded-xl bg-black/30 border border-white/10 p-3 text-xs text-zinc-300 space-y-1">
            <div className="flex justify-between">
              <span>Tạm tính</span>
              <span>{fmtVnd(calc.gross)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Phí</span>
              <span>-{fmtVnd(calc.fee)}</span>
            </div>
            <div className="flex justify-between text-emerald-300 font-semibold pt-1 border-t border-white/10">
              <span>Thực nhận</span>
              <span>{fmtVnd(calc.net)}</span>
            </div>
          </div>

          <p className="text-xs font-medium text-zinc-300">Phương thức nhận tiền</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-300",
                    method === m.id
                      ? "border-emerald-400/50 bg-emerald-500/15"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  )}
                >
                  <span className="text-sm text-white font-medium flex items-center gap-1">
                    <Wallet className="w-3.5 h-3.5 opacity-70" />
                    {m.name}
                  </span>
                  <span className="text-[11px] text-zinc-500 block mt-0.5">{m.desc}</span>
                </button>
              </li>
            ))}
          </ul>

          <label className="block text-xs text-zinc-400">
            Tên chủ tài khoản / ví
            <input
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
              placeholder="Nguyễn Văn A"
              autoComplete="name"
            />
          </label>
          <label className="block text-xs text-zinc-400">
            {method === "bank"
              ? "Số tài khoản + ngân hàng"
              : method === "card"
                ? "Số thẻ (chỉ để ghi nhận yêu cầu)"
                : "Số điện thoại ví"}
            <input
              value={accountInfo}
              onChange={(e) => setAccountInfo(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
              placeholder={
                method === "bank" ? "0123456789 · MB Bank" : "09xx xxx xxx"
              }
            />
          </label>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {okMsg && (
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {okMsg}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold py-2.5 transition-all duration-300 active:scale-[0.98]"
          >
            Xác nhận đổi xu
          </button>
        </div>
      )}

      {history.length > 0 && (
        <div className="pt-2 border-t border-white/10 space-y-2">
          <p className="text-xs font-medium text-zinc-400">Lịch sử đổi</p>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {history.slice(0, 10).map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between gap-2 text-[11px] rounded-lg bg-black/25 px-2.5 py-2 border border-white/5"
              >
                <div className="min-w-0">
                  <p className="text-zinc-200 truncate">
                    {h.coins.toLocaleString("vi-VN")} xu → {fmtVnd(h.vndNet)}
                  </p>
                  <p className="text-zinc-500 truncate">
                    {PAYMENT_METHODS.find((m) => m.id === h.method)?.name} ·{" "}
                    {h.status === "pending"
                      ? "Chờ xử lý"
                      : h.status === "done"
                        ? "Hoàn tất"
                        : h.status === "processing"
                          ? "Đang xử lý"
                          : "Đã hủy"}
                  </p>
                </div>
                {h.status === "pending" && (
                  <button
                    type="button"
                    className="shrink-0 text-rose-300 hover:text-rose-200 p-1"
                    title="Hủy & hoàn xu"
                    onClick={() => cancelRedeem(h.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
