"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { MovieItem } from "@/types/media";

interface Props {
  movie: MovieItem;
  href?: string;
  className?: string;
}

export function MoviePosterCard({ movie, href, className = "" }: Props) {
  const [imgError, setImgError] = useState(false);
  const link = href || (movie.slug ? `/phim/${movie.slug}` : "#");
  const ep =
    movie.currentEpisode != null
      ? movie.currentEpisode
      : movie.episodeCount != null
        ? movie.episodeCount
        : null;

  return (
    <Link
      href={link}
      className={`group flex flex-col overflow-hidden rounded-xl border border-border bg-surface text-foreground transition-opacity hover:opacity-95 ui-border-contrast ${className}`}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-surface-elevated">
        {movie.posterUrl && !imgError ? (
          <Image
            src={movie.posterUrl}
            alt={movie.title}
            fill
            className="object-cover object-center"
            sizes="(max-width:640px) 45vw, (max-width:1024px) 22vw, 180px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-foreground-subtle">
            No poster
          </div>
        )}
        {ep != null ? (
          <span className="absolute right-1.5 top-1.5 rounded-md border border-badge bg-badge px-1.5 py-0.5 text-[10px] font-medium text-badge tabular-nums font-mono">
            T{ep}
          </span>
        ) : null}
        {movie.quality ? (
          <span className="absolute left-1.5 top-1.5 rounded-md border border-badge bg-badge px-1.5 py-0.5 text-[10px] font-medium text-badge">
            {movie.quality}
          </span>
        ) : null}
      </div>
      <div className="flex h-[3.25rem] flex-col justify-center px-2 py-1.5">
        <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground sm:text-sm">
          {movie.title}
        </p>
      </div>
    </Link>
  );
}

export function MoviePosterSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="skeleton-shimmer aspect-[2/3] w-full" />
      <div className="h-[3.25rem] px-2 py-2">
        <div className="skeleton-shimmer h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}

export default MoviePosterCard;
