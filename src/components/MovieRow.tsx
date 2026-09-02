import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";

interface MovieRowProps {
  title: string;
  movies: MovieListItem[];
  href?: string;
}

/** Hàng poster ngang — giao diện phim OpusFilm (không dùng grid YouTube) */
export default function MovieRow({ title, movies, href }: MovieRowProps) {
  if (!movies?.length) return null;

  return (
    <section data-movie-row className="mb-6 md:mb-8 px-3 sm:px-4 md:px-6 lg:px-8 bounce-in">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="text-base md:text-lg font-bold text-white tracking-tight">{title}</h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-xs md:text-sm text-[#aaa] hover:text-white transition shrink-0"
          >
            Xem tất cả
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="flex gap-3 overflow-x-auto scrollbar-hide row-scroll pb-1">
        {movies.map((movie, i) => (
          <MovieCard
            key={movie.slug || movie._id}
            movie={movie}
            priority={i < 5}
            variant="poster"
          />
        ))}
      </div>
    </section>
  );
}
