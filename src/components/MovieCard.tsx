"use client";

import Link from "next/link";
import Image from "next/image";
import { LockKeyhole } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import type { MovieListItem } from "@/lib/types";
import { useVipAccess } from "@/lib/vipAccess";
import { isVipActive } from "@/lib/vipCatalog";
import { requestVipAccess } from "@/components/vip/VipGateProvider";

interface MovieCardProps {
  movie: MovieListItem;
  priority?: boolean;
}

export default function MovieCard({ movie, priority = false }: MovieCardProps) {
  const isLifetime = useVipAccess((s) => s.isLifetime);
  const vipExpiresAt = useVipAccess((s) => s.vipExpiresAt);
  const locked = !isVipActive({ isLifetime, expiresAtMs: vipExpiresAt });
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);
  const subtitle = [movie.origin_name, movie.year].filter(Boolean).join(" · ");

  return (
    <Link
      data-movie-card="1"
      href={locked ? "#" : `/phim/${movie.slug}`}
      onClick={(e) => {
        if (locked) {
          e.preventDefault();
          e.stopPropagation();
          requestVipAccess();
        }
      }}
      className="group relative block w-[42vw] max-w-[160px] flex-shrink-0 transition-transform duration-300 ease-out hover:-translate-y-1 active:scale-[0.98] sm:w-[140px] md:w-[156px] lg:w-[172px]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border-2 border-border-strong bg-surface-elevated ui-border-contrast">
        <Image
          src={poster}
          alt={movie.name || ""}
          fill
          sizes="(max-width:640px) 42vw, 172px"
          className="object-cover object-center transition duration-500 ease-out group-hover:scale-105"
          priority={priority}
          unoptimized
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[var(--banner-scrim-from)] via-transparent to-transparent opacity-90" />
        {movie.quality ? (
          <span className="absolute left-2 top-2 z-[1] rounded-md border border-badge bg-badge px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-badge">
            {movie.quality}
          </span>
        ) : null}
        {movie.episode_current ? (
          <span className="absolute bottom-2 right-2 z-[1] rounded-md border border-badge bg-badge px-1.5 py-0.5 font-mono text-[10px] font-medium tabular-nums text-badge">
            {movie.episode_current}
          </span>
        ) : null}
        {locked ? (
          <div
            className="absolute inset-0 z-[3] flex items-center justify-center bg-slate-950/65 backdrop-blur-[3px] transition-all duration-200"
            aria-label="Yêu cầu VIP"
          >
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white shadow-lg">
              <LockKeyhole className="h-4 w-4 shrink-0 text-amber-400" strokeWidth={1.75} />
              LOCKED · YÊU CẦU VIP
            </span>
          </div>
        ) : null}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors duration-300 group-hover:text-primary sm:text-sm">
          {movie.name}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 line-clamp-1 text-[11px] text-foreground-muted">{subtitle}</p>
        ) : null}
      </div>
    </Link>
  );
}
