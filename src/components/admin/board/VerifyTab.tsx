"use client";

import type { VerifyRequestItem } from "@/lib/adminEngine";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

export function VerifyTab({
  theme,
  items,
  loading,
  onAction,
}: {
  theme: BoardTheme;
  items: VerifyRequestItem[];
  loading: boolean;
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  return (
    <div className={`overflow-hidden rounded-xl border ${t.surface}`}>
      <div className="max-h-[min(60vh,560px)] overflow-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className={`sticky top-0 border-b ${t.border} ${t.surface}`}>
            <tr className={`text-xs uppercase ${t.muted}`}>
              <th className="px-3 py-2">Người dùng</th>
              <th className="px-3 py-2">Họ tên / Field</th>
              <th className="px-3 py-2">Liên kết</th>
              <th className="px-3 py-2">Trạng thái</th>
              <th className="px-3 py-2">Ngày gửi</th>
              <th className="px-3 py-2">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className={`px-3 py-8 text-center ${t.muted}`}>
                  Chưa có yêu cầu xác minh nào đang chờ xử lý
                </td>
              </tr>
            ) : (
              items.map((v) => (
                <tr key={v.id} className={`border-t ${t.border} ${t.rowHover}`}>
                  <td className="px-3 py-2 font-medium">{v.username}</td>
                  <td className="px-3 py-2 text-xs">
                    {v.fullName || "—"}
                    <div className={t.muted}>{v.field}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {v.socialLink ? (
                      <a href={v.socialLink} target="_blank" rel="noreferrer" className="text-sky-600 dark:text-sky-400">
                        Mở liên kết
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs">{v.status}</td>
                  <td className={`px-3 py-2 text-xs ${t.muted}`}>
                    {v.createdAt ? new Date(v.createdAt).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        disabled={loading}
                        className={`${btn.compact} ${btn.ok}`}
                        onClick={() =>
                          void onAction({ action: "approve_verify", id: v.id, userId: v.userId })
                        }
                      >
                        Duyệt cấp tick
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        className={`${btn.compact} ${btn.ban}`}
                        onClick={() => {
                          const reason = window.prompt("Lý do từ chối") || "";
                          void onAction({
                            action: "reject_verify",
                            id: v.id,
                            userId: v.userId,
                            reason,
                          });
                        }}
                      >
                        Từ chối
                      </button>
                      <button
                        type="button"
                        className={`${btn.compact} ${btn.ghost}`}
                        onClick={() => void onAction({ action: "delete_verify", id: v.id })}
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
  );
}
