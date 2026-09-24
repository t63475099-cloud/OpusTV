"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";

type FeedType = "list" | "category" | "country" | "search";

interface Props {
  type: FeedType;
  slug: string;
  initialItems: MovieListItem[];
  initialPage?: number;
  totalPages?: number;
  query?: string;
}

/**
 * Danh sách phim cuộn vô hạn — layout flex wrap (không dùng CSS grid).
 */
export default function InfiniteMovieGrid({
  type,
  slug,
  initialItems,
  initialPage = 1,
  totalPages = 1,
  query = "",
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(initialPage);
  const [maxPage, setMaxPage] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialPage >= totalPages);
  const sentinel = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || done) return;
    const next = page + 1;
    if (next > maxPage) {
      setDone(true);
      return;
    }
    setLoading(true);
    try {
      let url = "";
      if (type === "list") url = `/api/movies?type=list&slug=${encodeURIComponent(slug)}&page=${next}`;
      else if (type === "category")
        url = `/api/movies?type=category&slug=${encodeURIComponent(slug)}&page=${next}`;
      else if (type === "country")
        url = `/api/movies?type=country&slug=${encodeURIComponent(slug)}&page=${next}`;
      else
        url = `/api/search?q=${encodeURIComponent(query || slug)}&page=${next}`;

      const res = await fetch(url);
      const data = await res.json();
      const batch: MovieListItem[] = data?.data?.items || data?.items || [];
      const tp = data?.data?.params?.pagination?.totalPages || maxPage;
      setMaxPage(tp);
      if (!batch.length) {
        setDone(true);
      } else {
        setItems((prev) => {
          const seen = new Set(prev.map((m) => m.slug));
          const add = batch.filter((m) => m?.slug && !seen.has(m.slug));
          return [...prev, ...add];
        });
        setPage(next);
        if (next >= tp) setDone(true);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [done, loading, maxPage, page, query, slug, type]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore]);

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-3 sm:gap-4 justify-start">
        {items.map((m, i) => (
          <MovieCard key={m.slug || m._id || String(i)} movie={m} priority={i < 8} />
        ))}
      </div>
      <div ref={sentinel} className="h-8 w-full" />
      {loading ? (
        <p className="py-4 text-center text-xs text-zinc-500">Đang tải thêm…</p>
      ) : null}
      {done && items.length > 0 ? (
        <p className="py-3 text-center text-[11px] text-zinc-600">Hết danh sách</p>
      ) : null}
    </div>
  );
}
