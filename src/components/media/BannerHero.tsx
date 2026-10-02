"use client";

import Image from "next/image";
import Link from "next/link";
import type { MovieItem } from "@/types/media";
import { emptyDescriptionLabel } from "@/types/media";

interface Props {
  movie: MovieItem | null;
  loading?: boolean;
  watchHref?: string;
}

export function BannerHero({ movie, loading, watchHref }: Props) {
  if (loading) {
    return (
      <div className="relative w-full overflow-hidden rounded-none bg-surface md:rounded-2xl">
        <div className="skeleton-shimmer aspect-[16/9] w-full md:aspect-auto md:h-[520px]" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center bg-surface-elevated text-sm text-foreground-muted md:h-[520px] md:aspect-auto">
        Không có banner
      </div>
    );
  }

  const href = watchHref || (movie.slug ? `/xem-phim/${movie.slug}` : "#");
  const desc = movie.description?.trim();
  const objectPosition =
    movie.focusX != null && movie.focusY != null
      ? `${movie.focusX}% ${movie.focusY}%`
      : "center center";

  return (
    <section className="relative w-full overflow-hidden bg-background">
      <div className="relative aspect-[16/9] w-full md:aspect-auto md:h-[520px]">
        {movie.bannerUrl || movie.posterUrl ? (
          <Image
            src={(movie.bannerUrl || movie.posterUrl)!}
            alt={movie.title}
            fill
            priority
            className="object-cover"
            style={{ objectPosition }}
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-surface-elevated" />
        )}
        <div className="banner-scrim absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 z-10 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-6 md:p-10">
          <div className="mx-auto max-w-6xl">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {movie.quality ? (
                <span className="rounded-md border border-badge bg-badge px-2 py-0.5 text-[11px] font-medium text-badge tabular-nums">
                  {movie.quality}
                </span>
              ) : null}
              {movie.isVip ? (
                <span className="rounded-md border border-badge bg-badge px-2 py-0.5 text-[11px] font-medium text-badge">
                  VIP
                </span>
              ) : null}
              {movie.currentEpisode != null ? (
                <span className="rounded-md border border-badge bg-badge px-2 py-0.5 text-[11px] font-medium text-badge tabular-nums">
                  Tập {movie.currentEpisode}
                  {movie.episodeCount != null ? `/${movie.episodeCount}` : ""}
                </span>
              ) : null}
              {movie.tags.slice(0, 4).map((t) => (
                <span
                  key={t}
                  className="rounded-md border border-badge bg-badge px-2 py-0.5 text-[11px] text-badge"
                >
                  {t}
                </span>
              ))}
            </div>
            <h1 className="max-w-2xl text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
              {movie.title}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground-muted line-clamp-3">
              {desc || emptyDescriptionLabel()}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={href}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Xem ngay
              </Link>
              {movie.rating != null ? (
                <span className="inline-flex items-center rounded-lg border border-border bg-surface/80 px-3 py-2 text-sm text-foreground tabular-nums ui-border-contrast">
                  ★ {movie.rating.toFixed(1)}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BannerHero;
