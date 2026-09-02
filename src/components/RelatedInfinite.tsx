"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import type { MovieListItem } from "@/lib/types";

interface Props {
  initial: MovieListItem[];
  excludeSlug: string;
  categorySlug?: string;
}

export default function RelatedInfinite({
  initial,
  excludeSlug,
  categorySlug = "phim-moi-cap-nhat",
}: Props) {
  const [items, setItems] = useState<MovieListItem[]>(initial);
  const [page, setPage] = useState(2);
  const [cursor, setCursor] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seen = useRef(new Set(initial.map((m) => m.slug)));
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const merge = useCallback((list: MovieListItem[]) => {
    const add: MovieListItem[] = [];
    for (const m of list) {
      if (!m?.slug || m.slug === excludeSlug || seen.current.has(m.slug)) continue;
      seen.current.add(m.slug);
      add.push(m);
    }
    if (add.length) setItems((prev) => [...prev, ...add]);
    return add.length;
  }, [excludeSlug]);

  const loadMore = useCallback(async () => {
    if (busy.current || !hasMore) return;
    busy.current = true;
    setLoading(true);
    try {
      // Xen kẽ: theo thể loại rồi feed ngẫu nhiên để luôn còn phim
      const useCat = page % 2 === 0;
      const url = useCat
        ? `/api/movies?type=category&slug=${encodeURIComponent(categorySlug)}&page=${page}`
        : `/api/movies?mode=feed&cursor=${cursor}`;
      const res = await fetch(url);
      const data = await res.json();
      const list: MovieListItem[] = data.items || [];
      const added = merge(list);
      if (useCat) {
        setPage((p) => p + 1);
        if (!list.length) setCursor((c) => c + 1);
      } else {
        setCursor(typeof data.cursor === "number" ? data.cursor : cursor + 1);
      }
      // vẫn coi hasMore = true gần như vô hạn; dừng tạm nếu 3 lần liên tiếp trống
      if (!list.length && added === 0) {
        setCursor((c) => c + 1);
      }
    } catch {
      setCursor((c) => c + 1);
    }
    setLoading(false);
    busy.current = false;
  }, [hasMore, page, cursor, categorySlug, merge]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div className="space-y-3">
      {items.length === 0 && !loading && (
        <p className="text-zinc-500 text-sm">Chưa có gợi ý</p>
      )}
      {items.map((item) => (
        <Link
          key={item.slug}
          href={`/phim/${item.slug}`}
          className="flex gap-3 group hover:bg-white/5 rounded-xl p-1.5 -mx-1.5 transition bounce-press"
        >
          <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
            <Image
              src={getImageUrl(item.thumb_url || item.poster_url)}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized
            />
            {item.episode_current && (
              <span className="absolute bottom-1 right-1 text-[10px] bg-black/80 text-white px-1 rounded">
                {item.episode_current}
              </span>
            )}
          </div>
          <div className="min-w-0 py-0.5">
            <p className="text-sm text-white font-medium line-clamp-2 group-hover:text-rose-400">
              {item.name}
            </p>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
              {[item.year, item.quality].filter(Boolean).join(" · ")}
            </p>
          </div>
        </Link>
      ))}
      <div ref={sentinel} className="h-8 flex items-center justify-center py-2">
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
        )}
        {!loading && hasMore && items.length > 0 && (
          <span className="text-[10px] text-zinc-600">Cuộn để xem thêm</span>
        )}
      </div>
    </div>
  );
}
