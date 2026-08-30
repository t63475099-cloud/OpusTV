"use client";

import { useState } from "react";
import Link from "next/link";
import type { CuratedMovie } from "@/lib/curatedMovies";
import { cn } from "@/lib/utils";

export default function CuratedWatchClient({ movie }: { movie: CuratedMovie }) {
  const [ep, setEp] = useState(0);
  const current = movie.episodes[ep] || movie.episodes[0];

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 pb-24 pt-4">
      <div className="mb-3 text-sm text-zinc-400">
        <Link href="/" className="hover:text-white">
          Trang chủ
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-white">{movie.name}</span>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black ring-1 ring-white/10">
        <iframe
          key={current.youtubeId}
          src={`https://www.youtube.com/embed/${current.youtubeId}?rel=0&modestbranding=1`}
          title={current.name}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>

      <div className="mt-4">
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          {movie.name} · {current.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          {movie.origin_name} · {movie.year} · {movie.quality} · {movie.lang} · FAPTV
        </p>
        <p className="mt-3 text-sm leading-relaxed text-zinc-300">{movie.content}</p>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">
          Danh sách tập ({movie.episodes.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {movie.episodes.map((e, i) => (
            <button
              key={e.youtubeId + i}
              type="button"
              onClick={() => setEp(i)}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition",
                i === ep
                  ? "border-red-500 bg-red-600 text-white"
                  : "border-white/15 bg-white/5 text-zinc-200 hover:bg-white/10"
              )}
            >
              {e.name}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-6 text-xs text-zinc-500">
        Nguồn: FAPTV (YouTube).{" "}
        <a
          href={`https://www.youtube.com/watch?v=${current.youtubeId}`}
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 hover:underline"
        >
          Mở trên YouTube
        </a>
        {" · "}
        <a
          href="https://www.youtube.com/playlist?list=PLEyKu1JwbU4tKa3ilm9WzdkHGdSBxrWx2"
          target="_blank"
          rel="noreferrer"
          className="text-sky-400 hover:underline"
        >
          Playlist chính thức
        </a>
      </p>
    </div>
  );
}
