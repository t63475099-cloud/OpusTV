"use client";

import { useEffect, useState } from "react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

export function ModerationTab({
  theme,
  adminSecret,
}: {
  theme: BoardTheme;
  adminSecret: string;
}) {
  const t = boardTokens(theme);
  const [rows, setRows] = useState<Array<Record<string, unknown>>>([]);
  const [msg, setMsg] = useState("Đang tải báo cáo…");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/moderation", {
          headers: { "x-admin-secret": adminSecret },
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (data.ok && Array.isArray(data.reports)) {
          setRows(data.reports);
          setMsg(data.reports.length ? "" : "Chưa có báo cáo nào");
        } else {
          setRows([]);
          setMsg(data.error || "Chưa có endpoint báo cáo hoặc danh sách trống");
        }
      } catch {
        if (!cancelled) setMsg("Không tải được báo cáo");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adminSecret]);

  return (
    <div className={`overflow-hidden rounded-xl border ${t.surface}`}>
      <div className="max-h-[min(60vh,560px)] overflow-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className={`sticky top-0 border-b ${t.border} ${t.surface}`}>
            <tr className={`text-xs uppercase ${t.muted}`}>
              <th className="px-3 py-2">Loại</th>
              <th className="px-3 py-2">Nội dung</th>
              <th className="px-3 py-2">Người gửi</th>
              <th className="px-3 py-2">Thời gian</th>
              <th className="px-3 py-2">Xử lý</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className={`px-3 py-8 text-center ${t.muted}`}>
                  {msg || "Chưa có báo cáo nào"}
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={String(r.id || i)} className={`border-t ${t.border} ${t.rowHover}`}>
                  <td className="px-3 py-2">{String(r.type || r.kind || "—")}</td>
                  <td className="px-3 py-2 text-xs max-w-xs truncate">
                    {String(r.message || r.body || r.slug || "—")}
                  </td>
                  <td className="px-3 py-2 text-xs">{String(r.username || r.userId || "—")}</td>
                  <td className={`px-3 py-2 text-xs ${t.muted}`}>
                    {r.createdAt ? new Date(String(r.createdAt)).toLocaleString("vi-VN") : "—"}
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" className={`${btn.compact} ${btn.ghost}`}>
                      Xem
                    </button>
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
