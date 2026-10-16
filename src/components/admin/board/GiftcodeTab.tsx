"use client";

import { useCallback, useEffect, useState } from "react";
import { Gift, Shuffle } from "lucide-react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
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
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await onAction({ action: "list_giftcodes" })) as {
        ok?: boolean;
        giftcodes?: Array<Record<string, unknown>>;
      } | null;
      if (data && data.giftcodes) setList(data.giftcodes);
    } finally {
      setLoading(false);
    }
  }, [onAction]);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    await onAction({
      action: "create_giftcode",
      code: code.trim() || null,
      coins_reward:
        rewardTab === "coins" || rewardTab === "combo" ? Number(coins) || 0 : 0,
      vip_hours:
        rewardTab === "hours" || rewardTab === "combo" ? Number(vipHours) || 0 : 0,
      vip_tier_key:
        rewardTab === "tier" || rewardTab === "combo" ? vipTierKey || null : null,
      max_claims: maxClaims ? Number(maxClaims) : null,
      starts_at: startsAt || null,
      expires_at: expiresAt || null,
    });
    setCode("");
    setCoins("");
    setVipHours("");
    setVipTierKey("");
    setMaxClaims("");
    setStartsAt("");
    setExpiresAt("");
    void load();
  };

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
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
              className={`${btn.compact} ${rewardTab === id ? btn.primary : btn.ghost}`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex gap-2 sm:col-span-2">
            <input
              className={`flex-1 rounded-md border px-2.5 py-1.5 font-mono text-sm uppercase ${t.input}`}
              placeholder="Mã (để trống = tự sinh)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className={`${btn.compact} ${btn.ghost}`}
              onClick={() => setCode(randomGiftCode())}
            >
              <Shuffle className="mr-1 inline h-3.5 w-3.5" strokeWidth={1.75} />
              Tạo mã ngẫu nhiên
            </button>
          </div>

          <div className="sm:col-span-2">
            <p className={`mb-1 text-xs ${t.muted}`}>Số người tối đa</p>
            <input
              className={`mb-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
              placeholder="Số nguyên dương"
              value={maxClaims}
              onChange={(e) => setMaxClaims(e.target.value)}
            />
            <div className="flex flex-wrap gap-1">
              {CLAIM_PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`${btn.compact} ${btn.ghost}`}
                  onClick={() => setMaxClaims(String(n))}
                >
                  {n} người
                </button>
              ))}
            </div>
          </div>

          {(rewardTab === "coins" || rewardTab === "combo") && (
            <div className="sm:col-span-2">
              <p className={`mb-1 text-xs ${t.muted}`}>Xu thưởng</p>
              <input
                className={`mb-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                placeholder="Số xu"
                value={coins}
                onChange={(e) => setCoins(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {COIN_PRESETS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`${btn.compact} ${btn.ghost}`}
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
              <p className={`mb-1 text-xs ${t.muted}`}>Giờ VIP</p>
              <input
                className={`mb-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                placeholder="Số giờ"
                value={vipHours}
                onChange={(e) => setVipHours(e.target.value)}
              />
              <div className="flex flex-wrap gap-1">
                {HOUR_PRESETS.map((x) => (
                  <button
                    key={x.h}
                    type="button"
                    className={`${btn.compact} ${btn.ghost}`}
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
              <p className={`mb-1 text-xs ${t.muted}`}>Gói VIP</p>
              <select
                className={`w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
                value={vipTierKey}
                onChange={(e) => setVipTierKey(e.target.value)}
              >
                <option value="">Không kèm gói</option>
                {VIP_TIERS.filter((x) => x.code !== "LIFETIME").map((x) => (
                  <option key={x.code} value={x.code}>
                    {x.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <label className={`text-xs ${t.muted}`}>
            Từ ngày
            <input
              type="datetime-local"
              className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </label>
          <label className={`text-xs ${t.muted}`}>
            Đến ngày
            <input
              type="datetime-local"
              className={`mt-1 w-full rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </label>
        </div>

        <button
          type="button"
          className={`mt-3 ${btn.compact} ${btn.primary}`}
          onClick={() => void create()}
        >
          Tạo giftcode
        </button>
      </section>

      <section className={`overflow-hidden rounded-xl border ${t.surface}`}>
        <div className={`border-b px-4 py-2 text-xs font-semibold uppercase ${t.border} ${t.muted}`}>
          Danh sách giftcode {loading ? "…" : ""}
        </div>
        <div className="max-h-72 overflow-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className={`text-xs uppercase ${t.muted}`}>
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
                  <td colSpan={6} className={`px-3 py-8 text-center ${t.muted}`}>
                    Chưa có giftcode
                  </td>
                </tr>
              ) : (
                list.map((g) => (
                  <tr key={String(g.id || g.code)} className={`border-t ${t.border}`}>
                    <td className="px-3 py-2 font-mono text-xs">{String(g.code)}</td>
                    <td className={`px-3 py-2 text-xs ${t.muted}`}>
                      {Number(g.coins_reward || 0) > 0 ? `${g.coins_reward} xu ` : ""}
                      {Number(g.vip_hours || 0) > 0 ? `${g.vip_hours}h VIP ` : ""}
                      {g.vip_tier_key ? String(g.vip_tier_key) : ""}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-xs">
                      {String(g.current_claims ?? 0)}/{g.max_claims ?? "∞"}
                    </td>
                    <td className={`px-3 py-2 text-[11px] ${t.muted}`}>
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
                          className={`${btn.compact} ${btn.ghost}`}
                          onClick={() =>
                            void onAction({ action: "toggle_giftcode", code: g.code }).then(
                              () => load()
                            )
                          }
                        >
                          Khóa/Mở
                        </button>
                        <button
                          type="button"
                          className={`${btn.compact} ${btn.ban}`}
                          onClick={() =>
                            void onAction({ action: "delete_giftcode", code: g.code }).then(
                              () => load()
                            )
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
