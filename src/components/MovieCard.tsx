import Link from "next/link";
import Image from "next/image";
import { getImageUrl } from "@/lib/api";
import type { MovieListItem } from "@/lib/types";

interface MovieCardProps {
  movie: MovieListItem;
  priority?: boolean;
  variant?: "poster" | "thumb";
}

export default function MovieCard({
  movie,
  priority = false,
  variant = "poster",
}: MovieCardProps) {
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);

  // poster: hàng ngang (flex-shrink) hoặc lưới (w-full nhờ parent)
  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="movie-card-glass bounce-press group movie-card-hover relative flex-shrink-0 w-[118px] sm:w-[148px] md:w-[168px] lg:w-[188px] max-w-full card-lift block"
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[#272727] ring-1 ring-white/5">
        <Image
          src={poster}
          alt={movie.name}
          fill
          sizes="(max-width:640px) 40vw, 188px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          priority={priority}
          unoptimized
        />
        {movie.episode_current && (
          <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-white text-[11px] font-medium px-1.5 py-0.5 rounded">
            {movie.episode_current}
          </span>
        )}
        {movie.quality && (
          <span className="absolute top-1.5 left-1.5 bg-red-600/90 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            {movie.quality}
          </span>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="text-[13px] sm:text-sm font-semibold text-zinc-100 line-clamp-2 group-hover:text-red-400 transition-colors">
          {movie.name}
        </h3>
        <p className="text-[11px] text-zinc-500 mt-0.5 line-clamp-1">
          {[movie.origin_name, movie.year].filter(Boolean).join(" · ")}
        </p>
      </div>
    </Link>
  );
}
