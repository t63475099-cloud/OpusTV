"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, Trash2, CheckCircle2 } from "lucide-react";
import { useOfflineQueue } from "@/lib/offlineQueue";
import { getImageUrl } from "@/lib/api";

export default function OfflineDownloads() {
  const items = useOfflineQueue((s) => s.items);
  const remove = useOfflineQueue((s) => s.remove);
  const tick = useOfflineQueue((s) => s.tick);
  const clearDone = useOfflineQueue((s) => s.clearDone);

  useEffect(() => {
    const t = setInterval(() => tick(), 800);
    return () => clearInterval(t);
  }, [tick]);

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-sm text-zinc-400">
        Chưa có mục tải offline. Vào trang xem phim bấm <strong className="text-zinc-200">Tải offline</strong>.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" />
          Tải offline ({items.length})
        </h3>
        <button
          type="button"
          onClick={clearDone}
          className="text-xs text-zinc-400 hover:text-white transition"
        >
          Xóa đã xong
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className="flex gap-3 rounded-xl border border-white/10 bg-black/30 p-2.5"
          >
            <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              {it.poster ? (
                <Image
                  src={getImageUrl(it.poster)}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/phim/${it.slug}`}
                className="text-sm text-white font-medium line-clamp-1 hover:text-red-400"
              >
                {it.name}
              </Link>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {it.episodeName || "Full"} · {it.quality}
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    it.status === "done" ? "bg-emerald-500" : "bg-red-500"
                  }`}
                  style={{ width: `${it.progress}%` }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                {it.status === "done" ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sẵn sàng xem offline (giả lập)
                  </>
                ) : (
                  <>Đang tải {it.progress}%</>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remove(it.id)}
              className="p-2 text-zinc-500 hover:text-red-400 self-start"
              aria-label="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
