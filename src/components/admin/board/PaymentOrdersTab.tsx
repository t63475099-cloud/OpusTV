"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Check, X } from "lucide-react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
import { VIP_TIERS } from "@/lib/vipCatalog";

type Order = {
  id: string;
  username: string;
  tierCode: string;
  productLabel: string;
  amountVnd: number;
  bankName: string;
  bankAccount: string;
  buyerName: string;
  buyerPhone: string;
  transferContent: string;
  status: string;
  keyCode: string | null;
  durationLabel: string;
  createdAt: string | null;
};

type BankRow = {
  id: string;
  name: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  transferHint: string;
  isActive?: boolean;
};

export function PaymentOrdersTab({
  theme,
  onAction,
}: {
  theme: BoardTheme;
  onAction: (body: Record<string, unknown>, opts?: { silent?: boolean }) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [products, setProducts] = useState<Array<{ tierCode: string; label: string; amountVnd: number; durationLabel: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // bank form
  const [bName, setBName] = useState("");
  const [bAcc, setBAcc] = useState("");
  const [bHolder, setBHolder] = useState("");
  const [bBranch, setBBranch] = useState("");
  const [bHint, setBHint] = useState("");

  // product form
  const [pTier, setPTier] = useState("24H");
  const [pLabel, setPLabel] = useState("Gói 24 Giờ");
  const [pAmount, setPAmount] = useState("");
  const [pDur, setPDur] = useState("24 giờ");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await onAction({ action: "list_payment_orders" }, { silent: true })) as {
        ok?: boolean;
        orders?: Order[];
        banks?: BankRow[];
      };
      if (data?.orders) setOrders(data.orders);
      if (data?.banks) setBanks(data.banks);
      if ((data as { products?: typeof products }).products) setProducts((data as { products: typeof products }).products);
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 15000);
    return () => clearInterval(id);
  }, [load]);

  const approve = async (id: string) => {
    const data = (await onAction({ action: "approve_payment_order", orderId: id })) as {
      ok?: boolean;
      message?: string;
      error?: string;
    };
    setMsg(data?.message || data?.error || "");
    void load();
  };

  const reject = async (id: string) => {
    const data = (await onAction({ action: "reject_payment_order", orderId: id })) as {
      ok?: boolean;
      message?: string;
    };
    setMsg(data?.message || "");
    void load();
  };

  const addBank = async () => {
    if (!bName.trim() || !bAcc.trim()) {
      setMsg("Nhập tên ngân hàng và số tài khoản");
      return;
    }
    await onAction({
      action: "upsert_payment_bank",
      name: bName.trim(),
      accountNumber: bAcc.trim(),
      accountHolder: bHolder.trim(),
      branch: bBranch.trim(),
      transferHint: bHint.trim(),
    });
    setBName("");
    setBAcc("");
    setBHolder("");
    setBBranch("");
    setBHint("");
    void load();
  };

  const saveProduct = async () => {
    const amount = Math.floor(Number(pAmount) || 0);
    if (amount <= 0) {
      setMsg("Nhập số tiền VND > 0");
      return;
    }
    await onAction({
      action: "upsert_key_product",
      tierCode: pTier,
      label: pLabel.trim() || pTier,
      amountVnd: amount,
      durationLabel: pDur.trim(),
    });
    setMsg("Đã lưu gói bán");
    void load();
  };

  const pending = orders.filter((o) => o.status === "PENDING");

  return (
    <div className="space-y-4">
      {msg ? <p className={`text-sm ${t.muted}`}>{msg}</p> : null}

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Banknote className="h-4 w-4" strokeWidth={1.75} />
          Đơn mua key chờ duyệt ({pending.length})
        </h3>
        <div className="mt-3 max-h-[min(50vh,420px)] overflow-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className={`sticky top-0 border-b ${t.border} ${t.surface}`}>
              <tr className={`text-xs uppercase ${t.muted}`}>
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Gói / Tiền</th>
                <th className="px-2 py-2">Ngân hàng</th>
                <th className="px-2 py-2">Người CK</th>
                <th className="px-2 py-2">Nội dung</th>
                <th className="px-2 py-2">TT</th>
                <th className="px-2 py-2">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className={`border-b ${t.border}`}>
                  <td className="px-2 py-2 font-medium">{o.username}</td>
                  <td className="px-2 py-2">
                    {o.productLabel}
                    <br />
                    <span className={t.muted}>
                      {new Intl.NumberFormat("vi-VN").format(o.amountVnd)}đ
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    {o.bankName}
                    <br />
                    <span className={t.muted}>{o.bankAccount}</span>
                  </td>
                  <td className="px-2 py-2">
                    {o.buyerName}
                    <br />
                    <span className={t.muted}>{o.buyerPhone}</span>
                  </td>
                  <td className="px-2 py-2 font-mono text-xs">{o.transferContent}</td>
                  <td className="px-2 py-2">{o.status}</td>
                  <td className="px-2 py-2">
                    {o.status === "PENDING" ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={loading}
                          className={`${btn.compact} ${btn.primary}`}
                          onClick={() => void approve(o.id)}
                        >
                          <Check className="h-3.5 w-3.5" /> Gửi key
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.danger}`}
                          onClick={() => void reject(o.id)}
                        >
                          <X className="h-3.5 w-3.5" /> Từ chối
                        </button>
                      </div>
                    ) : o.keyCode ? (
                      <span className="font-mono text-xs">{o.keyCode}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {!orders.length ? (
                <tr>
                  <td colSpan={7} className={`px-2 py-6 text-center ${t.muted}`}>
                    Chưa có đơn
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Ngân hàng nhận tiền</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <input className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Tên NH" value={bName} onChange={(e) => setBName(e.target.value)} />
          <input className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Số TK" value={bAcc} onChange={(e) => setBAcc(e.target.value)} />
          <input className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Chủ TK" value={bHolder} onChange={(e) => setBHolder(e.target.value)} />
          <input className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Chi nhánh" value={bBranch} onChange={(e) => setBBranch(e.target.value)} />
          <input className={`rounded-md border px-2.5 py-1.5 text-sm sm:col-span-2 ${t.input}`} placeholder="Gợi ý CK" value={bHint} onChange={(e) => setBHint(e.target.value)} />
        </div>
        <button type="button" className={`mt-2 ${btn.compact} ${btn.primary}`} onClick={() => void addBank()}>
          Thêm ngân hàng
        </button>
        <ul className={`mt-3 space-y-1 text-sm ${t.muted}`}>
          {banks.map((b) => (
            <li key={b.id}>
              {b.name} · {b.accountNumber} · {b.accountHolder}
            </li>
          ))}
        </ul>
      </section>

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Gói bán (giá VND)</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <select
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={pTier}
            onChange={(e) => {
              setPTier(e.target.value);
              const tier = VIP_TIERS.find((x) => x.code === e.target.value);
              if (tier) {
                setPLabel(tier.label);
                setPDur(tier.isLifetime ? "Vĩnh viễn" : tier.label.replace("Gói ", ""));
              }
            }}
          >
            {VIP_TIERS.map((x) => (
              <option key={x.code} value={x.code}>
                {x.label}
              </option>
            ))}
          </select>
          <input className={`w-40 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Tên hiển thị" value={pLabel} onChange={(e) => setPLabel(e.target.value)} />
          <input className={`w-32 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Giá VND" value={pAmount} onChange={(e) => setPAmount(e.target.value)} />
          <input className={`w-32 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`} placeholder="Thời hạn" value={pDur} onChange={(e) => setPDur(e.target.value)} />
          <button type="button" className={`${btn.compact} ${btn.primary}`} onClick={() => void saveProduct()}>
            Lưu gói
          </button>
        </div>
      </section>
    </div>
  );
}
