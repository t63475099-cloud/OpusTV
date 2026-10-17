"use client";

import { useState } from "react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
import { Gift, Users } from "lucide-react";

export function MassOpsTab({
  theme,
  loading,
  onAction,
}: {
  theme: BoardTheme;
  loading: boolean;
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  const [rewardType, setRewardType] = useState<"coins" | "vip_hours" | "vip_lifetime">("coins");
  const [rewardValue, setRewardValue] = useState("100");
  const [message, setMessage] = useState("");
  const [bulkCount, setBulkCount] = useState("20");
  const [prefix, setPrefix] = useState("user_");
  const [bulkPass, setBulkPass] = useState("");
  const [created, setCreated] = useState<
    Array<{ username: string; password: string; uid: string }>
  >([]);

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gift className="h-4 w-4" strokeWidth={1.75} />
          Phát thưởng toàn server
        </h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Mọi user đăng nhập sẽ thấy popup nhận quà (mỗi đợt chỉ nhận 1 lần).
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <select
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={rewardType}
            onChange={(e) => setRewardType(e.target.value as typeof rewardType)}
          >
            <option value="coins">Cộng xu</option>
            <option value="vip_hours">VIP theo giờ</option>
            <option value="vip_lifetime">VIP vĩnh viễn</option>
          </select>
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder={
              rewardType === "coins" ? "Số xu" : rewardType === "vip_hours" ? "Số giờ" : "1"
            }
            value={rewardValue}
            onChange={(e) => setRewardValue(e.target.value)}
            disabled={rewardType === "vip_lifetime"}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Thông điệp (tuỳ chọn)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={loading}
          className={`mt-3 ${btn.compact} ${btn.primary}`}
          onClick={() =>
            void onAction({
              action: "create_broadcast_reward",
              reward_type: rewardType,
              reward_value: rewardType === "vip_lifetime" ? "1" : rewardValue,
              message_template: message,
            })
          }
        >
          Phát thưởng & kích hoạt toàn server
        </button>
      </section>

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="h-4 w-4" strokeWidth={1.75} />
          Tạo tài khoản hàng loạt
        </h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Số lượng"
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Prefix (user_)"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Mật khẩu chung (trống = random)"
            value={bulkPass}
            onChange={(e) => setBulkPass(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            className={`${btn.compact} ${btn.primary}`}
            onClick={async () => {
              const res = (await onAction({
                action: "bulk_create_accounts",
                count: Math.min(200, Math.max(1, Number(bulkCount) || 1)),
                prefix,
                password: bulkPass.trim() || undefined,
              })) as {
                ok?: boolean;
                accounts?: Array<{ username: string; password: string; uid: string }>;
              };
              if (res?.accounts) setCreated(res.accounts);
            }}
          >
            Tạo hàng loạt ngay
          </button>
        </div>
        {created.length > 0 ? (
          <div className="mt-3 max-h-64 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={t.muted}>
                  <th className="px-2 py-1">Username</th>
                  <th className="px-2 py-1">Password</th>
                  <th className="px-2 py-1">UID</th>
                </tr>
              </thead>
              <tbody>
                {created.map((a) => (
                  <tr key={a.username} className={`border-t ${t.border}`}>
                    <td className="px-2 py-1 font-mono">{a.username}</td>
                    <td className="px-2 py-1 font-mono">{a.password}</td>
                    <td className="px-2 py-1 font-mono">{a.uid}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className={`m-2 ${btn.compact} ${btn.ghost}`}
              onClick={() => {
                const text = created
                  .map((a) => `${a.username}\t${a.password}\t${a.uid}`)
                  .join("\n");
                void navigator.clipboard.writeText(text);
              }}
            >
              Copy danh sách
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
