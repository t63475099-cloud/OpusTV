"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import type { MovieListItem } from "@/lib/types";

interface Props {
  movies: MovieListItem[];
}

export default function BannerSlider({ movies }: Props) {
  const list = (movies || []).filter((m) => m?.slug).slice(0, 10);
  const [idx, setIdx] = useState(0);

  const go = useCallback(
    (dir: number) => {
      if (!list.length) return;
      setIdx((i) => (i + dir + list.length) % list.length);
    },
    [list.length]
  );

  useEffect(() => {
    if (list.length < 2) return;
    const t = window.setInterval(() => go(1), 6500);
    return () => window.clearInterval(t);
  }, [go, list.length]);

  if (!list.length) return null;
  const m = list[idx];
  const img = getImageUrl(m.thumb_url || m.poster_url);

  return (
    <section
      data-banner
      className="banner-slider relative w-full overflow-hidden"
    >
      <div className="relative aspect-[16/10] w-full sm:aspect-[21/9] md:aspect-[2.4/1] max-h-[72vh]">
        <Image
          key={m.slug}
          src={img}
          alt={m.name}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover transition-opacity duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/45 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0c]/90 via-[#0a0a0c]/35 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 pt-16 sm:px-6 sm:pb-10 md:px-10 md:pb-14">
          <div className="max-w-2xl space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-400/90">
              Đề xuất
            </p>
            <h1 className="text-2xl font-bold leading-tight text-white drop-shadow-lg sm:text-3xl md:text-4xl lg:text-5xl">
              {m.name}
            </h1>
            <p className="line-clamp-2 max-w-xl text-sm text-zinc-300 sm:text-base">
              {[m.origin_name, m.year, m.quality, m.episode_current]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={`/phim/${m.slug}`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-black shadow-lg transition hover:bg-zinc-100"
              >
                <Play className="h-4 w-4 fill-current" />
                Xem ngay
              </Link>
              <Link
                href={`/phim/${m.slug}`}
                className="inline-flex h-11 items-center rounded-full border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/15"
              >
                Chi tiết
              </Link>
            </div>
          </div>
        </div>

        {list.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 sm:flex"
              aria-label="Trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white backdrop-blur-md transition hover:bg-black/60 sm:flex"
              aria-label="Sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
              {list.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
