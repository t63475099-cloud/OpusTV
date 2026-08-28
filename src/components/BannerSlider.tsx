"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
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
    const timer = setInterval(next, 7000);
    return () => clearInterval(timer);
  }, [len, paused, next]);

  if (!movies?.length) return null;
  const movie = movies[current];
  const bg = getImageUrl(movie.thumb_url || movie.poster_url);

  return (
    <section
      className="relative w-full max-w-[1920px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative w-full aspect-[21/9] min-h-[180px] max-h-[360px] overflow-hidden rounded-2xl bg-[#272727]">
        <Image
          key={movie.slug}
          src={bg}
          alt={movie.name}
          fill
          priority
          className="object-cover"
          unoptimized
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-8 max-w-xl">
          <h1 className="text-xl sm:text-3xl md:text-4xl font-bold text-white leading-tight line-clamp-2">
            {movie.name}
          </h1>
          <p className="text-[#ccc] text-xs sm:text-sm mt-1.5 line-clamp-1">
            {movie.origin_name} · {movie.year} · {movie.quality}
          </p>
          <Link
            href={`/phim/${movie.slug}`}
            className="mt-3 sm:mt-4 inline-flex items-center gap-2 self-start bg-white text-black font-semibold text-sm px-4 py-2 rounded-full hover:bg-zinc-200 transition"
          >
            <Play className="w-4 h-4 fill-current" />
            Xem ngay
          </Link>
        </div>

        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white hidden sm:flex items-center justify-center"
          aria-label="Trước"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white hidden sm:flex items-center justify-center"
          aria-label="Sau"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="flex justify-center gap-1.5 mt-2.5">
        {movies.slice(0, 8).map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`h-1 rounded-full transition-all ${
              idx === current ? "bg-white w-5" : "bg-white/30 w-1.5"
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
