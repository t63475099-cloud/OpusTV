"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";

/**
 * Infinite scroll trang chủ — flex wrap, không CSS grid.
 * Gọi /api/movies?mode=feed&cursor=
 */
export default function HomeInfiniteFeed() {
  const [items, setItems] = useState<MovieListItem[]>([]);
  const [cursor, setCursor] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const seen = useRef<Set<string>>(new Set());
  const sentinel = useRef<HTMLDivElement | null>(null);
  const boot = useRef(false);

  const load = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/movies?mode=feed&cursor=${cursor}`);
      const data = await res.json();
      const batch: MovieListItem[] = data?.items || [];
      const nextCursor = typeof data?.cursor === "number" ? data.cursor : cursor + 1;
      const more = data?.hasMore !== false;

      const add: MovieListItem[] = [];
      for (const m of batch) {
        if (!m?.slug || seen.current.has(m.slug)) continue;
        seen.current.add(m.slug);
        add.push(m);
      }
      if (add.length) setItems((prev) => [...prev, ...add]);
      setCursor(nextCursor);
      setHasMore(more);
    } catch {
      /* giữ hasMore để thử lại khi cuộn */
    } finally {
      setLoading(false);
    }
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    if (boot.current) return;
    boot.current = true;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loading && hasMore) void load();
      },
      { rootMargin: "480px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load, loading, hasMore]);

  return (
    <section className="relative py-4 sm:py-5">
      <div className="mb-3 flex items-end justify-between gap-3 px-3 sm:px-4 md:px-6 lg:px-8">
        <h2 className="text-base font-bold tracking-tight text-white sm:text-lg md:text-xl">
          Khám phá thêm
        </h2>
      </div>

      <div className="flex flex-wrap gap-3 px-3 sm:gap-4 sm:px-4 md:px-6 lg:px-8">
        {items.map((m, i) => (
          <MovieCard key={m.slug || m._id || String(i)} movie={m} priority={i < 6} />
        ))}
      </div>

      <div ref={sentinel} className="h-10 w-full" aria-hidden />

      {loading ? (
        <p className="py-3 text-center text-xs text-zinc-500">Đang tải thêm phim…</p>
      ) : null}
      {!hasMore && items.length > 0 ? (
        <p className="py-3 text-center text-[11px] text-zinc-600">Đã hết nội dung gợi ý</p>
      ) : null}
    </section>
  );
}
