import Link from "next/link";
import { ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";
import type { MovieListItem } from "@/lib/types";

interface MovieRowProps {
  title: string;
  movies: MovieListItem[];
  href?: string;
}

export default function MovieRow({ title, movies, href }: MovieRowProps) {
  if (!movies?.length) return null;

  return (
    <section className="space-y-3 px-3 sm:px-4 md:px-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-0.5 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground sm:text-sm"
          >
            Xem thêm
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : null}
      </div>
      <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-1 scrollbar-none sm:-mx-4 sm:px-4 md:-mx-6 md:px-6">
        {movies.map((m, i) => (
          <MovieCard key={m.slug || String(i)} movie={m} priority={i < 4} />
        ))}
      </div>
    </section>
  );
}
