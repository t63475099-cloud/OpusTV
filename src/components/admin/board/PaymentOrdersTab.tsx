"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, X, RefreshCw } from "lucide-react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

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
  note?: string;
  status: string;
  keyCode: string | null;
  durationLabel: string;
  createdAt: string | null;
};

function formatVnd(n: number) {
  if (!n) return "—";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export function PaymentOrdersTab({
  theme,
  onAction,
}: {
  theme: BoardTheme;
  onAction: (body: Record<string, unknown>, opts?: { silent?: boolean }) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await onAction({ action: "list_payment_orders" }, { silent: true })) as {
        ok?: boolean;
        orders?: Order[];
      };
      if (data?.orders) setOrders(data.orders);
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 12000);
    return () => clearInterval(id);
  }, [load]);

  const approve = async (id: string) => {
    const data = (await onAction({ action: "approve_payment_order", orderId: id })) as {
      ok?: boolean;
      message?: string;
      error?: string;
      keyCode?: string;
    };
    setMsg(data?.message || data?.error || (data?.ok ? "Đã cấp key" : ""));
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

  const pending = orders.filter((o) => o.status === "PENDING");
  const done = orders.filter((o) => o.status !== "PENDING");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Đơn mua Key</h2>
          <p className={`mt-0.5 text-xs ${t.muted}`}>
            Duyệt cấp key hoặc từ chối. Không cần nhập ngân hàng hay tài khoản khách.
          </p>
        </div>
        <button
          type="button"
          className={`${btn.compact} ${btn.ghost}`}
          onClick={() => void load()}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {msg ? <p className={`text-sm ${t.muted}`}>{msg}</p> : null}

      <section className={`overflow-hidden rounded-xl border ${t.surface}`}>
        <div className={`border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${t.border} ${t.muted}`}>
          Chờ duyệt ({pending.length})
        </div>
        <div className="max-h-[min(55vh,520px)] overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={`sticky top-0 border-b text-xs ${t.border} ${t.surface} ${t.muted}`}>
              <tr>
                <th className="px-3 py-2 font-medium">Khách</th>
                <th className="px-3 py-2 font-medium">Gói / Số tiền</th>
                <th className="px-3 py-2 font-medium">Ngân hàng</th>
                <th className="px-3 py-2 font-medium">Nội dung CK</th>
                <th className="px-3 py-2 font-medium">Thời gian</th>
                <th className="px-3 py-2 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`px-3 py-10 text-center ${t.muted}`}>
                    Không có đơn chờ
                  </td>
                </tr>
              ) : (
                pending.map((o) => (
                  <tr key={o.id} className={`border-t ${t.border} ${t.rowHover}`}>
                    <td className="px-3 py-2.5">
                      <div className="font-medium">{o.username}</div>
                      <div className={`text-xs ${t.muted}`}>{o.buyerName}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div>{o.productLabel || o.tierCode}</div>
                      <div className="font-semibold tabular-nums">{formatVnd(o.amountVnd)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">
                      <div>{o.bankName}</div>
                      <div className={`font-mono ${t.muted}`}>{o.bankAccount}</div>
                    </td>
                    <td className={`px-3 py-2.5 font-mono text-xs ${t.muted}`}>
                      {o.transferContent || o.note || "—"}
                    </td>
                    <td className={`px-3 py-2.5 text-xs ${t.muted}`}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.primary}`}
                          onClick={() => void approve(o.id)}
                        >
                          <Check className="h-3.5 w-3.5" strokeWidth={2} />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ban}`}
                          onClick={() => void reject(o.id)}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                          Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {done.length > 0 ? (
        <section className={`overflow-hidden rounded-xl border ${t.surface}`}>
          <div className={`border-b px-4 py-2.5 text-xs font-semibold uppercase tracking-wide ${t.border} ${t.muted}`}>
            Đã xử lý
          </div>
          <div className="max-h-[240px] overflow-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <tbody>
                {done.slice(0, 40).map((o) => (
                  <tr key={o.id} className={`border-t ${t.border}`}>
                    <td className="px-3 py-2">{o.username}</td>
                    <td className="px-3 py-2">{o.productLabel}</td>
                    <td className="px-3 py-2 tabular-nums">{formatVnd(o.amountVnd)}</td>
                    <td className="px-3 py-2 text-xs">{o.status}</td>
                    <td className={`px-3 py-2 font-mono text-xs ${t.muted}`}>{o.keyCode || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
