"use client";

import { useState } from "react";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

export function MovieCmsTab({ theme }: { theme: BoardTheme }) {
  const t = boardTokens(theme);
  const [tmdbId, setTmdbId] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown> | null>(null);

  const pull = async () => {
    const id = tmdbId.trim();
    if (!id) return;
    setBusy(true);
    setMsg(null);
    setPreview(null);
    try {
      const res = await fetch(`/api/admin/movies/tmdb?id=${encodeURIComponent(id)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        setMsg(data.error || "Không kéo được dữ liệu TMDB (API chưa cấu hình hoặc ID sai)");
      } else {
        setPreview(data.movie || data);
        setMsg("Đã tải metadata — kiểm tra rồi lưu vào CMS khi API sẵn sàng");
      }
    } catch {
      setMsg("Không kết nối được máy chủ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Nạp phim qua TMDB</h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Nhập TMDB ID hoặc URL — không điền sẵn dữ liệu giả.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            className={`min-w-[220px] flex-1 rounded-md border px-2.5 py-1.5 text-sm ${t.input}`}
            placeholder="TMDB ID hoặc URL phim"
            value={tmdbId}
            onChange={(e) => setTmdbId(e.target.value)}
          />
          <button
            type="button"
            disabled={busy || !tmdbId.trim()}
            onClick={() => void pull()}
            className={`${btn.compact} ${btn.primary} disabled:opacity-50`}
          >
            {busy ? "Đang kéo…" : "Kéo dữ liệu tự động"}
          </button>
        </div>
        {msg ? <p className={`mt-2 text-xs ${t.muted}`}>{msg}</p> : null}
        {preview ? (
          <pre className={`mt-3 max-h-48 overflow-auto rounded-md border p-2 text-xs ${t.border} ${t.muted}`}>
            {JSON.stringify(preview, null, 2)}
          </pre>
        ) : null}
      </section>

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Kho phim & tập</h3>
        <p className={`mt-2 text-sm ${t.muted}`}>
          Chưa có danh sách phim nội bộ từ database. Dùng API KKPhim/Ophim trên trang công khai;
          CMS lưu trữ sẽ hiển thị tại đây khi endpoint `/api/admin/movies` có dữ liệu.
        </p>
      </section>
    </div>
  );
}
