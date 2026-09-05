"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import type { MovieListItem } from "@/lib/types";

interface BannerSliderProps {
  movies: MovieListItem[];
}

export default function BannerSlider({ movies }: BannerSliderProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const len = movies?.length || 0;

  const next = useCallback(() => {
    if (len <= 1) return;
    setCurrent((c) => (c + 1) % len);
  }, [len]);

  const prev = useCallback(() => {
    if (len <= 1) return;
    setCurrent((c) => (c - 1 + len) % len);
  }, [len]);

  useEffect(() => {
    if (len <= 1 || paused) return;
    const timer = setInterval(next, 6500);
    return () => clearInterval(timer);
  }, [len, paused, next]);

  if (!movies?.length) return null;
  const movie = movies[current];
  const bg = getImageUrl(movie.thumb_url || movie.poster_url);

  return (
    <section
      className="relative w-full px-0 sm:px-4 md:px-6 lg:px-8 pt-0 sm:pt-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full aspect-[16/10] sm:aspect-[21/9] min-h-[220px] sm:min-h-[260px] max-h-[48vh] sm:max-h-[420px] lg:max-h-[480px] overflow-hidden sm:rounded-2xl bg-zinc-900 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <Image
          key={movie.slug}
          src={bg}
          alt={movie.name}
          fill
          priority
          className="object-cover transition-opacity duration-700"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent" />

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 max-w-2xl">
          <p className="text-[10px] sm:text-xs uppercase tracking-widest text-rose-400 font-semibold mb-1">
            Đề xuất
          </p>
          <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg">
            {movie.name}
          </h2>
          {movie.origin_name && (
            <p className="text-xs sm:text-sm text-zinc-300 mt-1 line-clamp-1">{movie.origin_name}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] sm:text-xs text-zinc-300">
            {movie.year ? <span>{movie.year}</span> : null}
            {movie.time ? (
              <span className="px-1.5 py-0.5 rounded bg-white/15 font-medium tabular-nums">{movie.time}</span>
            ) : null}
            {movie.quality ? (
              <span className="px-1.5 py-0.5 rounded bg-white/15 font-medium">{movie.quality}</span>
            ) : null}
            {movie.lang ? <span>{movie.lang}</span> : null}
            {movie.episode_current ? <span>{movie.episode_current}</span> : null}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link
              href={`/phim/${movie.slug}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-zinc-100 transition active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-black" />
              Xem ngay
            </Link>
            <Link
              href={`/phim/${movie.slug}`}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-white/15 text-white text-sm font-medium hover:bg-white/25 border border-white/10 transition"
            >
              <Info className="w-4 h-4" />
              Chi tiết
            </Link>
          </div>
        </div>

        {len > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center text-white backdrop-blur"
              aria-label="Trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 items-center justify-center text-white backdrop-blur"
              aria-label="Sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 right-4 flex gap-1.5">
              {movies.slice(0, 8).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
