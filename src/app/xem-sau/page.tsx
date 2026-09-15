"use client";

import Link from "next/link";
import { Clock, Trash2 } from "lucide-react";
import { useWatchLaterStore } from "@/lib/watchLater";
import { getImageUrl } from "@/lib/api";

export default function XemSauPage() {
  const items = useWatchLaterStore((s) => s.items);
  const remove = useWatchLaterStore((s) => s.remove);
  const clear = useWatchLaterStore((s) => s.clear);

  return (
    <div className="px-3 md:px-6 py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-400" />
          Xem sau
        </h1>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Xóa hết danh sách xem sau?")) clear();
            }}
            className="text-xs text-zinc-400 hover:text-rose-300 transition"
          >
            Xóa tất cả
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500 py-16 text-center">
          Chưa có phim nào. Vào trang phim bấm &quot;Xem sau&quot; để thêm.
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {items.map((m) => (
            <li key={m.slug} className="group relative">
              <Link href={`/phim/${m.slug}`} className="block">
                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getImageUrl(m.poster || "")}
                    alt={m.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-200 line-clamp-2">{m.name}</p>
                {m.year ? (
                  <p className="text-[10px] text-zinc-500">{m.year}</p>
                ) : null}
              </Link>
              <button
                type="button"
                title="Gỡ"
                onClick={() => remove(m.slug)}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 border border-white/10 text-zinc-300 opacity-0 group-hover:opacity-100 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
