"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";
import { Loader2 } from "lucide-react";

const SOURCES: { type: string; slug: string }[] = [
  { type: "list", slug: "phim-moi-cap-nhat" },
  { type: "list", slug: "phim-bo" },
  { type: "list", slug: "phim-le" },
  { type: "category", slug: "hanh-dong" },
  { type: "category", slug: "tinh-cam" },
  { type: "category", slug: "kinh-di" },
  { type: "category", slug: "co-trang" },
  { type: "category", slug: "vien-tuong" },
  { type: "country", slug: "han-quoc" },
  { type: "country", slug: "trung-quoc" },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function HomeInfiniteFeed() {
  const [items, setItems] = useState<MovieListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState(0);
  const seen = useRef<Set<string>>(new Set());
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const loadBatch = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const page = (round % 8) + 1;
      const picks = shuffle(SOURCES).slice(0, 4);
      const results = await Promise.all(
        picks.map(async (s) => {
          const qs = new URLSearchParams({
            type: s.type,
            slug: s.slug,
            page: String(page),
          });
          const res = await fetch(`/api/movies?${qs}`);
          const data = await res.json();
          return (data.items || []) as MovieListItem[];
        })
      );
      const merged: MovieListItem[] = [];
      shuffle(results.flat()).forEach((m) => {
        const k = m.slug || m._id;
        if (!k || seen.current.has(k)) return;
        seen.current.add(k);
        merged.push(m);
      });
      if (merged.length) {
        setItems((prev) => [...prev, ...merged]);
      }
      setRound((r) => r + 1);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
      busy.current = false;
    }
  }, [round]);

  useEffect(() => {
    loadBatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !busy.current) loadBatch();
      },
      { rootMargin: "600px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadBatch]);

  if (items.length === 0 && !loading) return null;

  return (
    <section className="px-3 sm:px-4 md:px-6 lg:px-8 mb-10">
      <h2 className="text-base md:text-lg font-bold text-white mb-4">Đề xuất cho bạn</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
        {items.map((movie, i) => (
          <div key={movie.slug || movie._id || String(i)} className="min-w-0 [&_a]:!w-full">
            <MovieCard movie={movie} priority={i < 6} variant="poster" />
          </div>
        ))}
      </div>
      <div ref={sentinel} className="h-14 flex items-center justify-center mt-6">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-[#aaa]">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thêm phim...
          </div>
        )}
      </div>
    </section>
  );
}
