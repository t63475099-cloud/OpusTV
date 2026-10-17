"use client";

import { useState } from "react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";
import { Gift, Megaphone } from "lucide-react";

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
  const [annTitle, setAnnTitle] = useState("OpusFilm");
  const [annContent, setAnnContent] = useState("Nhóm Zalo");
  const [annImage, setAnnImage] = useState("");
  const [annLink, setAnnLink] = useState("");


  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Gift className="h-4 w-4" strokeWidth={1.75} />
          Phát thưởng toàn server
        </h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Tạo tài khoản hàng loạt đã chuyển vào tab Tài khoản. Tab này chỉ phát thưởng.
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
            placeholder={rewardType === "coins" ? "Số xu" : "Số giờ"}
            value={rewardValue}
            onChange={(e) => setRewardValue(e.target.value)}
            disabled={rewardType === "vip_lifetime"}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Thông điệp"
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
          <Megaphone className="h-4 w-4" strokeWidth={1.75} />
          Thông báo chào mừng / QR
        </h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Ảnh QR hoặc banner — user thấy 1 lần cho mỗi thông báo (theo id).
        </p>
        <div className="mt-3 grid gap-2">
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Tiêu đề"
            value={annTitle}
            onChange={(e) => setAnnTitle(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Nội dung ngắn"
            value={annContent}
            onChange={(e) => setAnnContent(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="URL ảnh / mã QR"
            value={annImage}
            onChange={(e) => setAnnImage(e.target.value)}
          />
          <input
            className={`rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="Link hành động (tuỳ chọn)"
            value={annLink}
            onChange={(e) => setAnnLink(e.target.value)}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            className={`${btn.compact} ${btn.primary}`}
            onClick={() =>
              void onAction({
                action: "create_announcement",
                title: annTitle,
                content: annContent,
                image_url: annImage,
                link_action: annLink,
              })
            }
          >
            Đăng thông báo active
          </button>
          <button
            type="button"
            disabled={loading}
            className={`${btn.compact} ${btn.ghost}`}
            onClick={() => void onAction({ action: "deactivate_announcements" })}
          >
            Tắt tất cả thông báo
          </button>
        </div>
      </section>
    </div>
  );
}

