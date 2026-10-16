"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Shuffle } from "lucide-react";
import type { BoardTheme } from "./adminUi";
import { VIP_TIERS } from "@/lib/vipCatalog";

type RewardTab = "coins" | "hours" | "tier" | "combo";

const CLAIM_PRESETS = [1, 5, 10, 50, 100, 500, 1000];
const COIN_PRESETS = [100, 250, 500, 1000, 2500, 5000, 10000, 50000];
const HOUR_PRESETS = [
  { h: 24, label: "24h (1 ngày)" },
  { h: 72, label: "72h (3 ngày)" },
  { h: 168, label: "168h (7 ngày)" },
  { h: 360, label: "360h (15 ngày)" },
  { h: 720, label: "720h (1 tháng)" },
  { h: 2160, label: "2160h (3 tháng)" },
  { h: 4320, label: "4320h (6 tháng)" },
  { h: 8760, label: "8760h (1 năm)" },
];

const chipActive =
  "bg-violet-600 text-white border border-violet-600 shadow-sm font-medium text-xs py-1 px-2.5 rounded-md";

function randomGiftCode() {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GIFT-${a}-${b}`;
}

export function GiftcodeTab({
  theme,
  onAction,
}: {
  theme: BoardTheme;
  onAction: (
    body: Record<string, unknown>,
    opts?: { silent?: boolean }
  ) => Promise<unknown>;
}) {
  const [rewardTab, setRewardTab] = useState<RewardTab>("coins");
  const [code, setCode] = useState("");
  const [maxClaims, setMaxClaims] = useState("");
  const [coins, setCoins] = useState("");
  const [vipHours, setVipHours] = useState("");
  const [vipTierKey, setVipTierKey] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [list, setList] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLocalErr(null);
    try {
      const data = (await onAction({ action: "list_giftcodes" }, { silent: true })) as {
        ok?: boolean;
        giftcodes?: Array<Record<string, unknown>>;
        error?: string;
      } | null;
      if (data && Array.isArray(data.giftcodes)) {
        setList(data.giftcodes);
        setLocalErr(null);
      } else if (data && data.error) {
        setLocalErr(String(data.error));
      }
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setLocalErr(null);
    const coinsN = Number(coins) || 0;
    const hoursN = Number(vipHours) || 0;
    const tier =
      rewardTab === "tier" || rewardTab === "combo" ? vipTierKey : "";
    if (
      (rewardTab === "coins" && coinsN <= 0) ||
      (rewardTab === "hours" && hoursN <= 0) ||
      (rewardTab === "tier" && !tier) ||
      (rewardTab === "combo" && coinsN <= 0 && hoursN <= 0 && !tier)
    ) {
      setLocalErr(
        "Vui lòng nhập hoặc chọn ít nhất 1 phần thưởng (Xu, Giờ VIP hoặc Gói VIP)"
      );
      return;
    }
    const data = (await onAction({
      action: "create_giftcode",
      code: code.trim() || null,
      coins_reward: rewardTab === "coins" || rewardTab === "combo" ? coinsN : 0,
      vip_hours: rewardTab === "hours" || rewardTab === "combo" ? hoursN : 0,
      vip_tier_key: tier || null,
      max_claims: maxClaims ? Number(maxClaims) : 1,
      starts_at: startsAt || null,
      expires_at: expiresAt || null,
    })) as { ok?: boolean; error?: string } | null;
    if (data && data.ok === false) {
      setLocalErr(data.error || "Tạo thất bại");
      return;
    }
    setCode("");
    setCoins("");
    setVipHours("");
    setVipTierKey("");
    setMaxClaims("");
    setStartsAt("");
    setExpiresAt("");
    void load();
  };

  const isDark = theme === "dark";
  const surface = isDark
    ? "bg-[#111827] border-slate-800 text-slate-100"
    : "bg-white border-slate-200 text-slate-900";
  const chipIdle = isDark
    ? "bg-slate-800/90 text-slate-200 border border-slate-700 hover:bg-slate-700 font-medium text-xs py-1 px-2.5 rounded-md transition"
    : "bg-slate-100 text-slate-800 border border-slate-300 hover:bg-slate-200 font-medium text-xs py-1 px-2.5 rounded-md transition";
  const inputCls = isDark
    ? "w-full rounded-md border border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 px-2.5 py-1.5 text-sm"
    : "w-full rounded-md border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 px-2.5 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gift className="h-4 w-4" strokeWidth={1.75} />
          Tạo mã thưởng
        </h3>

        <div className="mt-3 flex flex-wrap gap-1">
          {(
            [
              ["coins", "Cấp Xu thưởng"],
              ["hours", "Cấp Giờ VIP"],
              ["tier", "Cấp Gói VIP"],
              ["combo", "Tổ hợp đa phần thưởng"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setRewardTab(id)}
              className={rewardTab === id ? chipActive : chipIdle}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex gap-2 sm:col-span-2">
            <input
              className={`${inputCls} font-mono uppercase`}
              placeholder="Nhập mã"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className={chipIdle}
              onClick={() => setCode(randomGiftCode())}
            >
              <Shuffle className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.75} />
              Tạo mã
            </button>
          </div>

          <div className="sm:col-span-2">
            <p className="mb-1 text-xs text-slate-600 dark:text-slate-400">Số lượng người dùng</p>
            <input
              className={`${inputCls} mb-1`}
              placeholder="Số nguyên dương"
              value={maxClaims}
              onChange={(e) => setMaxClaims(e.target.value)}
            />
            <div className="flex flex-wrap gap-1">
              {CLAIM_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={chipIdle}
                  onClick={() => setMaxClaims(String(n))}
                >
                  {n} người
                </button>
              ))}
            </div>
          </div>

          {(rewardTab === "coins" || rewardTab === "combo") && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs text-slate-600 dark:text-slate-400">Xu thưởng</p>
              <input
                className={`${inputCls} mb-1`}
                placeholder="Số xu"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {COIN_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={chipIdle}
                    onClick={() => setCoins(String(n))}
                  >
                    {n.toLocaleString("vi-VN")} Xu
                  </button>
                ))}
              </div>
            </div>
          )}

          {(rewardTab === "hours" || rewardTab === "combo") && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs text-slate-600 dark:text-slate-400">Giờ VIP</p>
              <input
                className={`${inputCls} mb-1`}
                placeholder="Số giờ"
                value={vipHours}
                onChange={(e) => setVipHours(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {HOUR_PRESETS.map((x) => (
                  <button
                    key={x.h}
                    type="button"
                    className={chipIdle}
                    onClick={() => setVipHours(String(x.h))}
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(rewardTab === "tier" || rewardTab === "combo") && (
            <div className="sm:col-span-2">
              <p className="mb-1 text-xs text-slate-600 dark:text-slate-400">Gói VIP</p>
              <select
                className={inputCls}
                value={vipTierKey}
                onChange={(e) => setVipTierKey(e.target.value)}
              >
                <option value="">Không kèm gói</option>
                {VIP_TIERS.filter((x) => x.code !== "LIFETIME").map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
                <option value="LIFETIME">Vĩnh viễn</option>
              </select>
            </div>
          )}

          <label className="text-xs text-slate-600 dark:text-slate-400">
            Từ ngày
            <input
              type="datetime-local"
              className={`${inputCls} mt-1`}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className="text-xs text-slate-600 dark:text-slate-400">
            Đến ngày
            <input
              type="datetime-local"
              className={`${inputCls} mt-1`}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>

        {localErr ? (
          <p className="mt-2 text-sm text-rose-600 dark:text-rose-400">{localErr}</p>
        ) : null}

        <button
          type="button"
          className="mt-3 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
          onClick={() => void create()}
        >
          Tạo giftcode
        </button>
      </section>

      <section className={`overflow-hidden rounded-xl border ${surface}`}>
        <div className="border-b border-slate-200 px-4 py-2 text-xs font-semibold uppercase text-slate-600 dark:border-slate-800 dark:text-slate-400">
          Danh sách giftcode {loading ? "…" : `(${list.length})`}
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-600 dark:text-slate-400">
                <th className="px-3 py-2">Mã</th>
                <th className="px-3 py-2">Thưởng</th>
                <th className="px-3 py-2">Lượt</th>
                <th className="px-3 py-2">Hạn</th>
                <th className="px-3 py-2">TT</th>
                <th className="px-3 py-2"> </th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-3 py-8 text-center text-slate-600 dark:text-slate-400"
                  >
                    Chưa có giftcode
                  </td>
                </tr>
              ) : (
                list.map((g) => (
                  <tr
                    key={String(g.id || g.code)}
                    className="border-t border-slate-200 dark:border-slate-800"
                  >
                    <td className="px-3 py-2 font-mono text-xs">{String(g.code)}</td>
                    <td className="px-3 py-2 text-xs text-slate-600 dark:text-slate-400">
                      {Number(g.coins_reward || 0) > 0 ? `${g.coins_reward} xu ` : ""}
                      {Number(g.vip_hours || 0) > 0 ? `${g.vip_hours}h VIP ` : ""}
                      {g.vip_tier_key ? String(g.vip_tier_key) : ""}
                    </td>
                    <td className="px-3 py-2 text-xs tabular-nums">
                      {String(g.current_claims ?? 0)}/{g.max_claims ?? "∞"}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-slate-600 dark:text-slate-400">
                      {(g.starts_at ? String(g.starts_at).slice(0, 16) : "—") +
                        " → " +
                        (g.expires_at ? String(g.expires_at).slice(0, 16) : "—")}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {g.is_active ? "Đang mở" : "Tạm khóa"}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex gap-1">
                        <button
                          type="button"
                          className={chipIdle}
                          onClick={() =>
                            void onAction({
                              action: "toggle_giftcode",
                              code: g.code,
                            }).then(() => load())
                          }
                        >
                          Khóa/Mở
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-400/50 bg-rose-500/10 px-2.5 py-1 text-xs font-medium text-rose-700 dark:text-rose-300"
                          onClick={() =>
                            void onAction({
                              action: "delete_giftcode",
                              code: g.code,
                            }).then(() => load())
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
      </section>
    </div>
  );
}
