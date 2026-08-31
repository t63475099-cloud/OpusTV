"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useHistoryStore } from "@/lib/history";
import type { WatchHistory } from "@/lib/types";
import { Play } from "lucide-react";

function formatRemain(item: WatchHistory) {
  if (!item.duration || item.duration <= 0) return "";
  const left = Math.max(0, Math.floor(item.duration - item.currentTime));
  const m = Math.floor(left / 60);
  const s = left % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `Còn ${h}h${m % 60}p`;
  }
  return `Còn ${m}:${String(s).padStart(2, "0")}`;
}

export default function ContinueWatching() {
  const history = useHistoryStore((s) => s.history);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !history.length) return null;

  // Chỉ hiện mục xem dở (>5% và <95%)
  const items = history.filter((h) => {
    if (!h.duration || h.duration < 30) return h.currentTime > 10;
    const p = h.currentTime / h.duration;
    return p > 0.03 && p < 0.95;
  }).slice(0, 16);

  if (!items.length) return null;

  return (
    <section className="mb-8 md:mb-10 px-4 md:px-12">
      <h2 className="text-lg md:text-xl font-bold text-white mb-3 tracking-tight">
        Tiếp tục xem
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
        {items.map((item: WatchHistory) => {
          const progress =
            item.duration > 0
              ? Math.min(100, Math.round((item.currentTime / item.duration) * 100))
              : 0;
          const qs = new URLSearchParams();
          if (item.episodeSlug) qs.set("ep", item.episodeSlug);
          if (item.server) qs.set("server", item.server);
          const href = `/phim/${item.slug}${qs.toString() ? `?${qs}` : ""}`;

          return (
            <Link
              key={`${item.slug}-${item.episodeSlug}`}
              href={href}
              className="group relative flex-shrink-0 w-[140px] sm:w-[160px] md:w-[180px] transition-transform duration-300 hover:scale-105"
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-800 shadow-lg">
                <Image
                  src={item.poster || "/placeholder.svg"}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
                {progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                    <div className="h-full bg-red-500" style={{ width: `${progress}%` }} />
                  </div>
                )}
                <span className="absolute top-2 left-2 text-[10px] font-semibold bg-black/70 text-white px-1.5 py-0.5 rounded">
                  Xem tiếp
                </span>
              </div>
              <div className="mt-2">
                <h3 className="text-sm font-medium text-zinc-100 line-clamp-1 group-hover:text-red-400">
                  {item.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                  {item.episode}
                  {formatRemain(item) ? ` · ${formatRemain(item)}` : ""}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
