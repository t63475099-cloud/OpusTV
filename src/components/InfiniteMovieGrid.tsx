"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface Props {
  type: "list" | "category" | "country" | "search";
  slug?: string;
  keyword?: string;
  initialItems: MovieListItem[];
  initialPage?: number;
  totalPages?: number;
}

export default function InfiniteMovieGrid({
  type,
  slug = "",
  keyword = "",
  initialItems,
  initialPage = 1,
  totalPages: initialTotal = 1,
}: Props) {
  const [items, setItems] = useState<MovieListItem[]>(initialItems);
  const [page, setPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(initialPage >= initialTotal);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadMore = useCallback(async () => {
    if (busy.current || done || loading) return;
    if (page >= totalPages) {
      setDone(true);
      return;
    }
    busy.current = true;
    setLoading(true);
    const next = page + 1;
    try {
      const qs = new URLSearchParams({ type, page: String(next) });
      if (slug) qs.set("slug", slug);
      if (keyword) qs.set("q", keyword);
      const res = await fetch(`/api/movies?${qs}`);
      const data = await res.json();
      const more: MovieListItem[] = data.items || [];
      setItems((prev) => {
        const seen = new Set(prev.map((m) => m.slug || m._id));
        const merged = [...prev];
        more.forEach((m) => {
          const k = m.slug || m._id;
          if (k && !seen.has(k)) {
            seen.add(k);
            merged.push(m);
          }
        });
        return merged;
      });
      setPage(next);
      if (data.totalPages) setTotalPages(data.totalPages);
      if (next >= (data.totalPages || totalPages) || more.length === 0) setDone(true);
    } catch {
      /* keep */
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, [done, loading, page, totalPages, type, slug, keyword]);

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
    <>
      {/* Lưới poster dọc — giống trang danh sách phim cũ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
        {items.map((movie, i) => (
          <div key={movie.slug || movie._id || String(i)} className="min-w-0 [&_a]:!w-full">
            <MovieCard movie={movie} priority={i < 8} variant="poster" />
          </div>
        ))}
      </div>
      <div ref={sentinel} className="h-12 flex items-center justify-center mt-8">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#aaa]">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thêm...
          </div>
        )}
        {done && items.length > 0 && (
          <p className="text-xs text-[#717171]">Đã hết danh sách</p>
        )}
      </div>
    </>
  );
}
