"use client";

import { useState } from "react";
import type { KeyTier, LicenseKeyRecord } from "@/lib/keyEngine";
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
  const [tier, setTier] = useState<KeyTier>("24H");
  const [count, setCount] = useState("5");
  const [prefix, setPrefix] = useState("");

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">API Gateway ngoại vi</h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Theo dõi key TMDB / R2 / Neon / Telegram / LLM — cấu hình qua biến môi trường Vercel, không hardcode.
        </p>
        <ul className={`mt-3 space-y-1 text-sm ${t.muted}`}>
          {["TMDB", "Cloudflare R2", "Neon Pooler", "Telegram Bot", "AI LLM"].map((name) => (
            <li key={name} className="flex justify-between border-b border-dashed py-1.5 last:border-0">
              <span>{name}</span>
              <span className="font-mono text-xs">ENV only</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Sinh License Key VIP</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={tier}
            onChange={(e) => setTier(e.target.value as KeyTier)}
          >
            <option value="24H">24H</option>
            <option value="12H">12H</option>
            <option value="7D">7D</option>
            <option value="30D">30D</option>
            <option value="VIP">VIP</option>
          </select>
          <input
            className={`w-20 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Số lượng"
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
          <input
            className={`w-28 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Prefix (tuỳ chọn)"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            className={`${btn.compact} ${btn.primary}`}
            onClick={() =>
              void onAction({
                action: "generate_keys",
                tier,
                count: Math.min(50, Math.max(1, Number(count) || 1)),
                customPrefix: prefix.trim() || undefined,
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
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={`sticky top-0 border-b ${t.border} ${t.surface}`}>
              <tr className={`text-xs uppercase ${t.muted}`}>
                <th className="px-3 py-2">Mã key</th>
                <th className="px-3 py-2">Tier</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2">Đã dùng</th>
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
                  <tr key={k.id || k.code} className={`border-t ${t.border} ${t.rowHover}`}>
                    <td className="px-3 py-2 font-mono text-xs">{k.code}</td>
                    <td className="px-3 py-2">{k.tier}</td>
                    <td className="px-3 py-2">{k.status}</td>
                    <td className={`px-3 py-2 text-xs ${t.muted}`}>
                      {k.usedBy || "—"}
                      {k.usedAt ? ` · ${new Date(k.usedAt).toLocaleString("vi-VN")}` : ""}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ban}`}
                          onClick={() =>
                            void onAction({
                              action: k.status === "revoked" ? "unrevoke_key" : "revoke_key",
                              code: k.code,
                              id: k.id,
                            })
                          }
                        >
                          {k.status === "revoked" ? "Mở lại" : "Thu hồi"}
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ban}`}
                          onClick={() =>
                            void onAction({ action: "delete_key", code: k.code, id: k.id })
                          }
                        >
                          Xóa
                        </button>
                      </div>
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
