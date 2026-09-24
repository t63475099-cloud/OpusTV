import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";

interface MovieRowProps {
  title: string;
  movies: MovieListItem[];
  href?: string;
}

/** Hàng poster cuộn ngang — không dùng CSS grid */
export default function MovieRow({ title, movies, href }: MovieRowProps) {
  if (!movies?.length) return null;

  return (
    <section data-movie-row className="relative py-3 sm:py-4">
      <div className="mb-3 flex items-end justify-between gap-3 px-3 sm:px-4 md:px-6 lg:px-8">
        <h2 className="row-title text-base font-bold tracking-tight text-white sm:text-lg md:text-xl">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-0.5 text-xs font-medium text-zinc-400 transition hover:text-rose-400 sm:text-sm"
          >
            Xem tất cả
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3 pb-1 sm:gap-4 sm:px-4 md:px-6 lg:px-8">
        {movies.map((m, i) => (
          <MovieCard key={m.slug || m._id || String(i)} movie={m} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}
