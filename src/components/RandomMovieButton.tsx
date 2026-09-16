"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shuffle, Loader2 } from "lucide-react";

/** Lấy 1 phim ngẫu nhiên từ API mới cập nhật */
export default function RandomMovieButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function go() {
    if (busy) return;
    setBusy(true);
    try {
      const page = 1 + Math.floor(Math.random() * 5);
      const res = await fetch(`/api/movies?type=list&slug=phim-moi-cap-nhat&page=${page}`, {
        cache: "no-store",
      });
      const data = await res.json();
      const list =
        data?.items ||
        data?.data?.items ||
        data?.data ||
        data?.movies ||
        [];
      const arr = Array.isArray(list) ? list : [];
      if (!arr.length) {
        router.push("/danh-sach/phim-moi-cap-nhat");
        return;
      }
      const pick = arr[Math.floor(Math.random() * arr.length)];
      const slug = pick?.slug || pick?.origin_name || pick?.name;
      if (slug) router.push(`/phim/${encodeURIComponent(String(slug))}`);
      else router.push("/danh-sach/phim-moi-cap-nhat");
    } catch {
      router.push("/danh-sach/phim-moi-cap-nhat");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void go()}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 px-3.5 py-2 text-sm text-zinc-200 transition duration-500 disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Shuffle className="w-4 h-4" />
      )}
      Phim ngẫu nhiên
    </button>
  );
}
