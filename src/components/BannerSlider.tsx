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

/** Banner hero — scrim theo theme, chỉ data từ API */
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
  const meta = [m.origin_name, m.year, m.quality, m.episode_current]
    .filter(Boolean)
    .join(" · ");

  return (
    <section data-banner className="banner-slider relative w-full overflow-hidden bg-background">
      <div className="relative aspect-[16/9] w-full max-h-[72vh] sm:aspect-[21/9] md:h-[520px] md:aspect-auto">
        <Image
          key={m.slug}
          src={img}
          alt={m.name || ""}
          fill
          priority
          unoptimized
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-700"
        />
        <div className="banner-scrim absolute inset-0" aria-hidden />
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background:
              "linear-gradient(to right, var(--banner-scrim-from) 0%, var(--banner-scrim-via) 40%, transparent 70%)",
          }}
          aria-hidden
        />

        <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-8 pt-16 sm:px-6 sm:pb-10 md:px-10 md:pb-14">
          <div className="max-w-2xl space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {m.quality ? (
                <span className="rounded-md border border-badge bg-badge px-2 py-0.5 text-[11px] font-medium text-badge">
                  {m.quality}
                </span>
              ) : null}
              {m.episode_current ? (
                <span className="rounded-md border border-badge bg-badge px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-badge">
                  {m.episode_current}
                </span>
              ) : null}
            </div>
            <h1 className="text-2xl font-bold leading-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              {m.name}
            </h1>
            {meta ? (
              <p className="line-clamp-2 max-w-xl text-sm text-foreground-muted sm:text-base">
                {meta}
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Link
                href={`/phim/${m.slug}`}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground shadow-lg"
              >
                <Play className="h-4 w-4 fill-current" />
                Xem ngay
              </Link>
              <Link
                href={`/phim/${m.slug}`}
                className="inline-flex h-11 items-center rounded-full border border-border-strong bg-surface/80 px-5 text-sm font-semibold text-foreground backdrop-blur-md ui-border-contrast"
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
              className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/80 text-foreground backdrop-blur-md ui-border-contrast sm:flex"
              aria-label="Trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-surface/80 text-foreground backdrop-blur-md ui-border-contrast sm:flex"
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
                    i === idx ? "w-6 bg-primary" : "w-1.5 bg-foreground-subtle"
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
