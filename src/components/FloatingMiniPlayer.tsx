"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import { useActiveMediaStore } from "@/lib/activeMediaStore";

function filmHref(item: {
  slug: string;
  episodeSlug?: string;
  server?: string;
  currentTime: number;
}) {
  const qs = new URLSearchParams();
  if (item.episodeSlug) qs.set("ep", item.episodeSlug);
  if (item.server) qs.set("server", item.server);
  if (item.currentTime > 5) qs.set("t", String(Math.floor(item.currentTime)));
  qs.set("autoplay", "1");
  const q = qs.toString();
  return `/phim/${item.slug}${q ? `?${q}` : ""}`;
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

/**
 * 1 playbox Film (persist) + 1 playbox Music (persist), độc lập.
 * Reload: vẫn hiện, pause; bấm Play / phóng to → tiếp tục đúng mốc, không về 0.
 */
export default function FloatingMiniPlayer() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const track = useMusicPlayerStore((s) => s.track);
  const playing = useMusicPlayerStore((s) => s.playing);
  const setPlaying = useMusicPlayerStore((s) => s.setPlaying);
  const setExpanded = useMusicPlayerStore((s) => s.setExpanded);
  const stopMusic = useMusicPlayerStore((s) => s.stop);

  const film = useActiveMediaStore((s) => s.film);
  const clearFilm = useActiveMediaStore((s) => s.clearFilm);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (path.startsWith("/tin-nhan") || path.startsWith("/bao-tri")) return null;

  const onMusicPage = path.startsWith("/nhac");
  const onFilmPage = film ? path.startsWith(`/phim/${film.slug}`) : path.startsWith("/phim/");

  const showMusic = !!track && !onMusicPage;
  const showFilm = !!film && !onFilmPage;

  // Cùng lúc có thể có 2 trạng thái lưu; ưu tiên hiện đúng ngữ cảnh trang
  // Trang Film/home: hiện film nếu có, không thì music
  // Không hiện cả hai chồng lên nhau — 1 box
  const mode: "music" | "film" | null = showMusic && !showFilm
    ? "music"
    : showFilm && !showMusic
      ? "film"
      : showFilm
        ? "film"
        : showMusic
          ? "music"
          : null;

  if (!mode) return null;

  if (mode === "music" && track) {
    const start = Math.floor(track.currentTime || 0);
    const expand = (andPlay: boolean) => {
      setExpanded(true);
      if (andPlay) setPlaying(true);
      const q = new URLSearchParams();
      q.set("v", track.id);
      if (start > 5) q.set("t", String(start));
      q.set("expand", "1");
      if (andPlay) q.set("play", "1");
      router.push(`/nhac?${q.toString()}`);
    };

    return (
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]"
        data-mini-player="music"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => expand(true)}
            className="relative w-full aspect-video bg-black block text-left"
            aria-label="Phát tiếp bài nhạc"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.thumb || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
            {start > 0 && (
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                {formatTime(start)}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 p-2.5">
            <button type="button" onClick={() => expand(true)} className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-white line-clamp-1">{track.title}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {track.artist}
                {start > 0 ? ` · ${formatTime(start)}` : ""}
              </p>
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={() => expand(true)}
              aria-label="Phát tiếp"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={() => expand(true)}
              aria-label="Phóng to"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
              onClick={() => stopMusic()}
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "film" && film) {
    const progress =
      film.duration > 0
        ? Math.min(100, Math.round((film.currentTime / film.duration) * 100))
        : 0;
    const expand = () => router.push(filmHref(film));

    return (
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]"
        data-mini-player="film"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl">
          <button
            type="button"
            onClick={expand}
            className="relative w-full aspect-video bg-black block text-left"
            aria-label="Xem tiếp phim"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={film.poster || "/placeholder.svg"}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
              </div>
            </div>
            {progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                <div className="h-full bg-red-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            {film.currentTime > 0 && (
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                {formatTime(film.currentTime)}
                {film.duration > 0 ? ` / ${formatTime(film.duration)}` : ""}
              </span>
            )}
          </button>
          <div className="flex items-center gap-2 p-2.5">
            <button type="button" onClick={expand} className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-white line-clamp-1">{film.name}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {film.episode || "Xem tiếp"}
                {progress > 0 ? ` · ${progress}%` : ""}
              </p>
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={expand}
              aria-label="Phát tiếp"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={expand}
              aria-label="Phóng to"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
              onClick={() => clearFilm()}
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
