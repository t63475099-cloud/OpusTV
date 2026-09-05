"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize2, Pause, Play, X } from "lucide-react";
import Hls from "hls.js";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import { useActiveMediaStore } from "@/lib/activeMediaStore";
import { useHistoryStore } from "@/lib/history";

function filmPageHref(item: {
  slug: string;
  episodeSlug?: string;
  server?: string;
  currentTime: number;
}) {
  const qs = new URLSearchParams();
  if (item.episodeSlug) qs.set("ep", item.episodeSlug);
  if (item.server) qs.set("server", item.server);
  if (item.currentTime > 5) qs.set("t", String(Math.floor(item.currentTime)));
  const q = qs.toString();
  return `/phim/${item.slug}${q ? `?${q}` : ""}`;
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function FloatingMiniPlayer() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const track = useMusicPlayerStore((s) => s.track);
  const playing = useMusicPlayerStore((s) => s.playing);
  const setPlaying = useMusicPlayerStore((s) => s.setPlaying);
  const setProgress = useMusicPlayerStore((s) => s.setProgress);
  const stopMusic = useMusicPlayerStore((s) => s.stop);

  const film = useActiveMediaStore((s) => s.film);
  const updateFilmTime = useActiveMediaStore((s) => s.updateFilmTime);
  const clearFilm = useActiveMediaStore((s) => s.clearFilm);
  const addOrUpdate = useHistoryStore((s) => s.addOrUpdate);

  const [filmPlaying, setFilmPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const appliedResume = useRef(false);

  useEffect(() => setMounted(true), []);

  // --- Film HLS trong playbox ---
  useEffect(() => {
    if (!mounted || !film?.m3u8) return;
    const video = videoRef.current;
    if (!video) return;

    appliedResume.current = false;
    const src = film.m3u8;
    const resumeAt = film.currentTime > 5 ? film.currentTime : 0;

    const applyResume = () => {
      if (appliedResume.current) return;
      if (resumeAt > 0 && video.duration && resumeAt < video.duration - 1) {
        video.currentTime = resumeAt;
        appliedResume.current = true;
      } else if (resumeAt > 0 && video.readyState >= 1) {
        video.currentTime = resumeAt;
        appliedResume.current = true;
      }
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => applyResume());
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", applyResume, { once: true });
    }

    const onTime = () => {
      if (!video.duration) return;
      updateFilmTime(video.currentTime, video.duration);
      if (film.slug && video.currentTime > 3) {
        addOrUpdate({
          slug: film.slug,
          name: film.name,
          poster: film.poster,
          episode: film.episode || "",
          episodeSlug: film.episodeSlug || "",
          server: film.server || "",
          currentTime: video.currentTime,
          duration: video.duration,
          updatedAt: Date.now(),
        });
      }
    };
    const onPlay = () => setFilmPlaying(true);
    const onPause = () => setFilmPlaying(false);

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      try {
        hlsRef.current?.destroy();
      } catch {}
      hlsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, film?.slug, film?.episodeSlug, film?.m3u8]);

  // Pause film mini when on film page
  useEffect(() => {
    if (film && path.startsWith(`/phim/${film.slug}`)) {
      videoRef.current?.pause();
      setFilmPlaying(false);
    }
  }, [path, film?.slug]);

  if (!mounted) return null;
  if (path.startsWith("/tin-nhan") || path.startsWith("/bao-tri")) return null;

  const onMusicPage = path.startsWith("/nhac");
  const onFilmPage = film ? path.startsWith(`/phim/${film.slug}`) : false;

  const showMusic = !!track && !onMusicPage;
  const showFilm = !!film && !onFilmPage;

  const mode: "music" | "film" | null =
    showFilm && showMusic
      ? "film"
      : showFilm
        ? "film"
        : showMusic
          ? "music"
          : null;

  if (!mode) return null;

  // ===== MUSIC: phát ngay trong playbox =====
  if (mode === "music" && track) {
    const start = Math.floor(track.currentTime || 0);
    const togglePlay = () => {
      const next = !playing;
      setPlaying(next);
    };
    const expand = () => {
      const q = new URLSearchParams();
      q.set("v", track.id);
      if (start > 5) q.set("t", String(start));
      q.set("expand", "1");
      router.push(`/nhac?${q.toString()}`);
    };

    return (
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]"
        data-mini-player="music"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl">
          <div className="relative w-full aspect-video bg-black">
            {playing ? (
              <iframe
                key={`${track.id}-${start}`}
                title={track.title}
                src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0${
                  start > 5 ? `&start=${start}` : ""
                }`}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            ) : (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 w-full h-full"
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
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 p-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white line-clamp-1">{track.title}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {track.artist}
                {start > 0 ? ` · ${formatTime(start)}` : ""}
              </p>
            </div>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={togglePlay}
              aria-label={playing ? "Tạm dừng" : "Phát tiếp"}
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

  // ===== FILM: phát ngay trong playbox, resume currentTime =====
  if (mode === "film" && film) {
    const progress =
      film.duration > 0
        ? Math.min(100, Math.round((film.currentTime / film.duration) * 100))
        : 0;

    const togglePlay = async () => {
      const v = videoRef.current;
      if (!v) {
        // không có stream → chỉ mở trang với ?t=
        router.push(filmPageHref(film));
        return;
      }
      if (v.paused) {
        // đảm bảo resume
        if (film.currentTime > 5 && Math.abs(v.currentTime - film.currentTime) > 2) {
          try {
            v.currentTime = film.currentTime;
          } catch {}
        }
        try {
          await v.play();
          setFilmPlaying(true);
        } catch {
          router.push(filmPageHref(film));
        }
      } else {
        v.pause();
        setFilmPlaying(false);
      }
    };

    const expand = () => {
      videoRef.current?.pause();
      setFilmPlaying(false);
      router.push(filmPageHref(film));
    };

    return (
      <div
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60] w-[min(92vw,300px)]"
        data-mini-player="film"
      >
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl">
          <div className="relative w-full aspect-video bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              playsInline
              preload="metadata"
              poster={film.poster || undefined}
            />
            {!filmPlaying && (
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="absolute inset-0 flex items-center justify-center bg-black/35 z-10"
                aria-label="Phát tiếp"
              >
                <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </button>
            )}
            {progress > 0 && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700 z-20">
                <div className="h-full bg-red-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            {film.currentTime > 0 && (
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded z-20">
                {formatTime(film.currentTime)}
                {film.duration > 0 ? ` / ${formatTime(film.duration)}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 p-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white line-clamp-1">{film.name}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {film.episode || "Xem tiếp"}
                {progress > 0 ? ` · ${progress}%` : ""}
              </p>
            </div>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={() => void togglePlay()}
              aria-label={filmPlaying ? "Tạm dừng" : "Phát tiếp"}
            >
              {filmPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white"
              onClick={expand}
              aria-label="Phóng to trang xem"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400"
              onClick={() => {
                videoRef.current?.pause();
                clearFilm();
              }}
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
