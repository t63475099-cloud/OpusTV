"use client";

import { useState } from "react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

export function GiftcodeTab({
  theme,
  onAction,
}: {
  theme: BoardTheme;
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"shared" | "once">("shared");
  const [maxUses, setMaxUses] = useState("");
  const [coins, setCoins] = useState("");
  const [vipHours, setVipHours] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [listMsg, setListMsg] = useState("Chưa tải danh sách mã — bấm Làm mới khi API giftcode sẵn sàng");

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Tạo mã thưởng</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Mã (để trống = tự sinh)"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <select
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={mode}
            onChange={(e) => setMode(e.target.value as "shared" | "once")}
          >
            <option value="shared">Dùng chung (giới hạn lượt)</option>
            <option value="once">Một lần / mã</option>
          </select>
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Số người tối đa"
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Xu thưởng"
            value={coins}
            onChange={(e) => setCoins(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Giờ VIP"
            value={vipHours}
            onChange={(e) => setVipHours(e.target.value)}
          />
          <input
            type="datetime-local"
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
          <input
            type="datetime-local"
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
        <button
          type="button"
          className={`mt-3 ${btn.compact} ${btn.primary}`}
          onClick={async () => {
            await onAction({
              action: "create_giftcode",
              code: code.trim() || null,
              mode,
              maxUses: maxUses ? Number(maxUses) : null,
              coins: coins ? Number(coins) : 0,
              vipHours: vipHours ? Number(vipHours) : 0,
              startsAt: startsAt || null,
              endsAt: endsAt || null,
            });
            setCode("");
            setCoins("");
            setVipHours("");
            setMaxUses("");
          }}
        >
          Tạo mã
        </button>
      </section>
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Mã đang phát hành</h3>
        <p className={`mt-2 text-sm ${t.muted}`}>{listMsg}</p>
      </section>
    </div>
  );
}
