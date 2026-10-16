"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";
import type { LicenseKeyRecord } from "@/lib/keyEngine";
import { VIP_TIERS, type VipTierCode } from "@/lib/vipCatalog";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

export function KeyBoardTab({
  theme,
  keys,
  loading,
  onAction,
  onRefresh,
}: {
  theme: BoardTheme;
  keys: LicenseKeyRecord[];
  loading: boolean;
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
  onRefresh: () => void;
}) {
  const t = boardTokens(theme);
  const [tier, setTier] = useState<VipTierCode>("24H");
  const [count, setCount] = useState("5");

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="h-4 w-4" strokeWidth={1.75} />
          Sinh License Key (11 mốc)
        </h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Định dạng: OPUS-&lt;GÓI&gt;-XXXXXXXX · mỗi key chỉ gắn 1 tài khoản
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={tier}
            onChange={(e) => setTier(e.target.value as VipTierCode)}
          >
            {VIP_TIERS.map((x) => (
              <option key={x.code} value={x.code}>
                {x.label}
              </option>
            ))}
          </select>
          <input
            className={`w-20 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Số lượng"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            className={`${btn.compact} ${btn.primary}`}
            onClick={() =>
              void onAction({
                action: "generate_opus_keys",
                tierCode: tier,
                count: Math.min(50, Math.max(1, Number(count) || 1)),
              })
            }
          >
            Sinh key
          </button>
          <button type="button" className={`${btn.compact} ${btn.ghost}`} onClick={onRefresh}>
            Làm mới
          </button>
        </div>
      </section>

      <div className={`overflow-hidden rounded-xl border ${t.surface}`}>
        <div className="max-h-[min(50vh,480px)] overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className={`sticky top-0 border-b ${t.border} ${t.surface}`}>
              <tr className={`text-xs uppercase ${t.muted}`}>
                <th className="px-3 py-2">Mã key</th>
                <th className="px-3 py-2">Gói</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Tài khoản</th>
                <th className="px-3 py-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {keys.length === 0 ? (
                <tr>
                  <td colSpan={5} className={`px-3 py-8 text-center ${t.muted}`}>
                    Chưa có license key nào
                  </td>
                </tr>
              ) : (
                keys.map((k) => (
                  <tr key={k.id || k.keyCode} className={`border-t ${t.border} ${t.rowHover}`}>
                    <td className="px-3 py-2 font-mono text-xs">{k.keyCode}</td>
                    <td className="px-3 py-2">{String(k.tier)}</td>
                    <td className="px-3 py-2">{k.status}</td>
                    <td className={`px-3 py-2 text-xs ${t.muted}`}>
                      {k.usedBy || "—"}
                      {k.usedAt ? ` · ${new Date(k.usedAt).toLocaleString("vi-VN")}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className={`${btn.compact} ${btn.ban}`}
                        onClick={() =>
                          void onAction({
                            action: "delete_opus_key",
                            code: k.keyCode,
                            id: k.id,
                          })
                        }
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
