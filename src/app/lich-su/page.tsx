"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useHistoryStore } from "@/lib/history";
import { Trash2 } from "lucide-react";

export default function HistoryPage() {
  const history = useHistoryStore((s) => s.history);
  const remove = useHistoryStore((s) => s.remove);
  const clear = useHistoryStore((s) => s.clear);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="min-h-screen app-content-offset px-4 max-w-5xl mx-auto">
        <div className="h-8 w-48 skeleton rounded mb-6" />
      </div>
    );
  }

  return (
    <div className="min-h-screen app-content-offset pb-16 px-4 md:px-8 max-w-5xl mx-auto animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Lịch sử xem</h1>
        {history.length > 0 && (
          <button
            onClick={clear}
            className="text-sm text-zinc-400 hover:text-red-400 transition"
          >
            Xóa tất cả
          </button>
        )}
      </div>
      {history.length === 0 ? (
        <p className="text-zinc-500">Chưa có lịch sử. Hãy xem một bộ phim nhé!</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => (
            <div
              key={item.slug}
              className="flex gap-3 items-center bg-[#212121] rounded-xl p-2 border border-zinc-800 hover:border-zinc-600 transition"
            >
              <Link href={`/phim/${item.slug}`} className="flex gap-3 flex-1 min-w-0">
                <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  <Image src={item.poster} alt={item.name} fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 py-1">
                  <h3 className="text-sm font-medium text-white line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    {item.episode} · {item.server}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => remove(item.slug)}
                className="p-2 text-zinc-500 hover:text-red-400"
                aria-label="Xóa"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
