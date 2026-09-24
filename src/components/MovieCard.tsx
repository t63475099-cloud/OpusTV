import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/api";
import type { MovieListItem } from "@/lib/types";

interface MovieCardProps {
  movie: MovieListItem;
  priority?: boolean;
}

export default function MovieCard({ movie, priority = false }: MovieCardProps) {
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);

  return (
    <Link
      data-movie-card="1"
      href={`/phim/${movie.slug}`}
      className="group relative block flex-shrink-0 w-[42vw] max-w-[160px] sm:w-[140px] md:w-[156px] lg:w-[172px] transition-transform duration-300 ease-out hover:-translate-y-1 active:scale-[0.98]"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl bg-zinc-900/80 ring-1 ring-white/10 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.65)]">
        <Image
          src={poster}
          alt={movie.name}
          fill
          sizes="(max-width:640px) 42vw, 172px"
          className="object-cover transition duration-500 ease-out group-hover:scale-105"
          priority={priority}
          unoptimized
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
        {movie.quality ? (
          <span className="absolute top-2 left-2 rounded-md bg-rose-600/95 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
            {movie.quality}
          </span>
        ) : null}
        {movie.episode_current ? (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-100 backdrop-blur-sm">
            {movie.episode_current}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 px-0.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-100 transition-colors duration-300 group-hover:text-rose-300 sm:text-sm">
          {movie.name}
        </h3>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-zinc-500">
          {[movie.origin_name, movie.year].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
