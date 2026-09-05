"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize2, Pause, Play, X } from "lucide-react";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import { useHistoryStore } from "@/lib/history";
import type { WatchHistory } from "@/lib/types";

function filmHref(item: WatchHistory) {
  const qs = new URLSearchParams();
  if (item.episodeSlug) qs.set("ep", item.episodeSlug);
  if (item.server) qs.set("server", item.server);
  if (item.currentTime > 5) qs.set("t", String(Math.floor(item.currentTime)));
  const q = qs.toString();
  return `/phim/${item.slug}${q ? `?${q}` : ""}`;
}

export default function FloatingMiniPlayer() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const track = useMusicPlayerStore((s) => s.track);
  const playing = useMusicPlayerStore((s) => s.playing);
  const setPlaying = useMusicPlayerStore((s) => s.setPlaying);
  const setExpanded = useMusicPlayerStore((s) => s.setExpanded);
  const stopMusic = useMusicPlayerStore((s) => s.stop);

  const history = useHistoryStore((s) => s.history);
  const removeFilm = useHistoryStore((s) => s.remove);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;
  if (path.startsWith("/tin-nhan") || path.startsWith("/bao-tri")) return null;

  // Phim đang xem dở gần nhất (không hiện khi đã ở trang phim đó)
  const film = history.find((h) => {
    if (!h?.slug) return false;
    if (path.startsWith(`/phim/${h.slug}`)) return false;
    if (!h.duration || h.duration < 30) return h.currentTime > 10;
    const p = h.currentTime / h.duration;
    return p > 0.03 && p < 0.95;
  });

  const showMusic = !!track && !path.startsWith("/nhac");
  const showFilm = !!film && !showMusic; // ưu tiên nhạc nếu đang có track

  if (!showMusic && !showFilm) return null;

  if (showMusic && track) {
    const start = Math.floor(track.currentTime || 0);
    const expand = () => {
      setExpanded(true);
      setPlaying(true);
      const q = new URLSearchParams();
      q.set("v", track.id);
      if (start > 5) q.set("t", String(start));
      q.set("expand", "1");
      router.push(`/nhac?${q.toString()}`);
    };

    return (
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]"
        data-mini-player
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl">
          <button
            type="button"
            onClick={expand}
            className="relative w-full aspect-video bg-black block text-left"
            aria-label="Phóng to bài đang phát"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.thumb || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35">
              <Maximize2 className="w-8 h-8 text-white drop-shadow" />
            </div>
          </button>
          <div className="flex items-center gap-2 p-2.5">
            <button type="button" onClick={expand} className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-white line-clamp-1">{track.title}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">{track.artist}</p>
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={() => setPlaying(!playing)}
              aria-label={playing ? "Tạm dừng" : "Phát"}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
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

  if (showFilm && film) {
    const progress =
      film.duration > 0
        ? Math.min(100, Math.round((film.currentTime / film.duration) * 100))
        : 0;
    const expand = () => {
      router.push(filmHref(film));
    };

    return (
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]"
        data-mini-player
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl">
          <button
            type="button"
            onClick={expand}
            className="relative w-full aspect-video bg-black block text-left"
            aria-label="Phóng to phim đang xem"
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
          </button>
          <div className="flex items-center gap-2 p-2.5">
            <button type="button" onClick={expand} className="min-w-0 flex-1 text-left">
              <p className="text-xs font-semibold text-white line-clamp-1">{film.name}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {film.episode || "Xem tiếp"} · {progress}%
              </p>
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
              onClick={() => removeFilm(film.slug)}
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
