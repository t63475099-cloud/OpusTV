"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Maximize, Maximize2, Pause, Play, X } from "lucide-react";
import Hls from "hls.js";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import { useActiveMediaStore } from "@/lib/activeMediaStore";
import { useHistoryStore } from "@/lib/history";
import {
  loadFilmResume,
  loadLastFilmResume,
  loadMusicResume,
  loadLastMusicResume,
  saveFilmResume,
  saveMusicResume,
} from "@/lib/resumeStore";
import { cn } from "@/lib/utils";

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, "0")}`;
}

function filmPageHref(item: {
  slug: string;
  episodeSlug?: string;
  server?: string;
  currentTime: number;
}) {
  const qs = new URLSearchParams();
  if (item.episodeSlug) qs.set("ep", item.episodeSlug);
  if (item.server) qs.set("server", item.server);
  const t = Math.floor(item.currentTime || 0);
  if (t > 5) qs.set("t", String(t));
  const q = qs.toString();
  return `/phim/${item.slug}${q ? `?${q}` : ""}`;
}

async function requestFs(el: HTMLElement) {
  const anyEl = el as any;
  try {
    if (el.requestFullscreen) await el.requestFullscreen();
    else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
    else if (anyEl.webkitEnterFullscreen) await anyEl.webkitEnterFullscreen();
  } catch {
    /* user gesture / policy */
  }
}

export default function FloatingMiniPlayer() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const track = useMusicPlayerStore((s) => s.track);
  const setTrack = useMusicPlayerStore((s) => s.setTrack);
  const playing = useMusicPlayerStore((s) => s.playing);
  const setPlaying = useMusicPlayerStore((s) => s.setPlaying);
  const stopMusic = useMusicPlayerStore((s) => s.stop);

  const film = useActiveMediaStore((s) => s.film);
  const setFilm = useActiveMediaStore((s) => s.setFilm);
  const updateFilmTime = useActiveMediaStore((s) => s.updateFilmTime);
  const clearFilm = useActiveMediaStore((s) => s.clearFilm);
  const addOrUpdate = useHistoryStore((s) => s.addOrUpdate);

  const [filmPlaying, setFilmPlaying] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const streamKeyRef = useRef("");

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!useActiveMediaStore.getState().film) {
      const last = loadLastFilmResume();
      if (last?.m3u8 || last?.slug) {
        setFilm({
          slug: last.slug,
          name: last.name || last.slug,
          poster: last.poster || "",
          episode: last.episode,
          episodeSlug: last.episodeSlug,
          server: last.server,
          currentTime: last.currentTime,
          duration: last.duration,
          m3u8: last.m3u8,
        });
        setDisplayTime(last.currentTime);
      }
    } else {
      const f = useActiveMediaStore.getState().film!;
      const t = Math.max(f.currentTime, loadFilmResume(f.slug, f.episodeSlug));
      setDisplayTime(t);
      if (t > f.currentTime) updateFilmTime(t, f.duration);
    }
    if (!useMusicPlayerStore.getState().track) {
      const last = loadLastMusicResume();
      if (last?.id) {
        setTrack(
          {
            id: last.id,
            title: last.title || "Đang phát",
            artist: last.artist || "",
            thumb: last.thumb,
            currentTime: last.currentTime,
          },
          false
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const getResumeSec = useCallback(() => {
    if (!film) return 0;
    const a = film.currentTime || 0;
    const b = loadFilmResume(film.slug, film.episodeSlug);
    return Math.max(a, b, displayTime);
  }, [film, displayTime]);

  useEffect(() => {
    if (!mounted || !film?.m3u8) return;
    const video = videoRef.current;
    if (!video) return;
    const key = `${film.slug}|${film.episodeSlug || ""}|${film.m3u8}`;
    if (streamKeyRef.current === key && hlsRef.current) return;
    streamKeyRef.current = key;

    try {
      hlsRef.current?.destroy();
    } catch {}
    hlsRef.current = null;

    const seekResume = () => {
      const t = getResumeSec();
      if (t <= 5) return;
      try {
        if (Math.abs(video.currentTime - t) > 1.5) video.currentTime = t;
      } catch {}
    };

    if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(film.m3u8);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, seekResume);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = film.m3u8;
      video.addEventListener("loadedmetadata", seekResume);
    }

    const onTime = () => {
      const ct = video.currentTime;
      const dur = video.duration || 0;
      if (ct < 2) return;
      setDisplayTime(ct);
      updateFilmTime(ct, dur);
      saveFilmResume(film.slug, film.episodeSlug, ct, dur, {
        name: film.name,
        poster: film.poster,
        episode: film.episode,
        server: film.server,
        m3u8: film.m3u8,
      });
      addOrUpdate({
        slug: film.slug,
        name: film.name,
        poster: film.poster,
        episode: film.episode || "",
        episodeSlug: film.episodeSlug || "",
        server: film.server || "",
        currentTime: ct,
        duration: dur,
        updatedAt: Date.now(),
      });
    };

    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", seekResume);
    video.addEventListener("canplay", seekResume);

    return () => {
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", seekResume);
      video.removeEventListener("canplay", seekResume);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, film?.slug, film?.episodeSlug, film?.m3u8]);

  useEffect(() => {
    if (film && path.startsWith(`/phim/${film.slug}`)) {
      videoRef.current?.pause();
      setFilmPlaying(false);
    }
  }, [path, film?.slug]);

  useEffect(() => {
    if (!mounted) return;
    const show =
      (!!film && !path.startsWith(`/phim/${film.slug}`)) ||
      (!!track && !path.startsWith("/nhac"));
    if (show) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    setVisible(false);
  }, [mounted, film, track, path]);

  if (!mounted) return null;
  if (path.startsWith("/tin-nhan") || path.startsWith("/bao-tri") || path.startsWith("/code")) return null;

  const onMusicPage = path.startsWith("/nhac");
  const onFilmPage = film ? path.startsWith(`/phim/${film.slug}`) : false;
  const showMusic = !!track && !onMusicPage;
  const showFilm = !!film && !onFilmPage;
  const mode: "music" | "film" | null = showFilm ? "film" : showMusic ? "music" : null;
  if (!mode) return null;

  const shellClass = cn(
    "fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 z-[60]",
    "w-[min(92vw,320px)]",
    "transition-all duration-300 ease-in-out",
    visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-3 scale-95 pointer-events-none"
  );

  const cardClass =
    "rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-[#0c0c12]/92 backdrop-blur-xl transition-all duration-300 ease-in-out";

  if (mode === "music" && track) {
    const start = Math.max(Math.floor(track.currentTime || 0), loadMusicResume(track.id));
    const togglePlay = () => {
      const next = !playing;
      setPlaying(next);
      if (next && start > 3) {
        saveMusicResume(track.id, start, {
          title: track.title,
          artist: track.artist,
          thumb: track.thumb,
        });
      }
    };
    const expand = () => {
      const q = new URLSearchParams();
      q.set("v", track.id);
      if (start > 5) q.set("t", String(start));
      q.set("expand", "1");
      router.push(`/nhac?${q.toString()}`);
    };

    return (
      <div className={shellClass} data-mini-player="music">
        <div className={cardClass}>
          <div className="relative w-full aspect-video bg-black">
            {playing ? (
              <iframe
                key={`${track.id}-s${start}`}
                title={track.title}
                src={`https://www.youtube.com/embed/${track.id}?autoplay=1&rel=0${
                  start > 5 ? `&start=${start}` : ""
                }`}
                className="absolute inset-0 w-full h-full border-0"
                allow="autoplay; encrypted-media; picture-in-picture"
              />
            ) : (
              <button type="button" onClick={togglePlay} className="absolute inset-0 w-full h-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={track.thumb || `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center transition-transform duration-300 hover:scale-105">
                    <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                  </div>
                </div>
                {start > 0 && (
                  <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded">
                    {formatTime(start)}
                  </span>
                )}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 p-2.5">
            <button
              type="button"
              className="min-w-0 flex-1 text-left"
              onClick={expand}
              title="Mở Opus Music"
            >
              <p className="text-xs font-semibold text-white line-clamp-1">{track.title}</p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {track.artist}
                {start > 0 ? ` · từ ${formatTime(start)}` : ""}
              </p>
            </button>
            <button type="button" className="p-2 rounded-full hover:bg-white/10 text-white transition-colors duration-300" onClick={togglePlay}>
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button type="button" className="p-2 rounded-full hover:bg-white/10 text-white transition-colors duration-300" onClick={expand} title="Phóng to">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button type="button" className="p-2 rounded-full hover:bg-white/10 text-zinc-400 transition-colors duration-300" onClick={() => stopMusic()}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "film" && film) {
    const resumeSec = getResumeSec();
    const progress =
      film.duration > 0 ? Math.min(100, Math.round((resumeSec / film.duration) * 100)) : 0;

    const togglePlay = async () => {
      const v = videoRef.current;
      if (!v || !film.m3u8) {
        router.push(filmPageHref({ ...film, currentTime: resumeSec }));
        return;
      }
      if (v.paused) {
        const t = getResumeSec();
        const doSeek = () => {
          if (t > 5) {
            try {
              v.currentTime = t;
            } catch {}
          }
        };
        doSeek();
        try {
          await v.play();
          setFilmPlaying(true);
          requestAnimationFrame(() => {
            doSeek();
            setTimeout(doSeek, 200);
            setTimeout(doSeek, 600);
          });
        } catch {
          router.push(filmPageHref({ ...film, currentTime: t }));
        }
      } else {
        v.pause();
        setFilmPlaying(false);
        const ct = v.currentTime;
        if (ct > 3) {
          saveFilmResume(film.slug, film.episodeSlug, ct, v.duration || film.duration, {
            name: film.name,
            poster: film.poster,
            episode: film.episode,
            server: film.server,
            m3u8: film.m3u8,
          });
          updateFilmTime(ct, v.duration || film.duration);
          setDisplayTime(ct);
        }
      }
    };

    const goDetail = () => {
      videoRef.current?.pause();
      setFilmPlaying(false);
      router.push(filmPageHref({ ...film, currentTime: getResumeSec() }));
    };

    const goFullscreen = async () => {
      const v = videoRef.current;
      const box = boxRef.current;
      if (v) {
        if (v.paused) {
          try {
            const t = getResumeSec();
            if (t > 5) v.currentTime = t;
            await v.play();
            setFilmPlaying(true);
          } catch {}
        }
        await requestFs(v);
        return;
      }
      if (box) await requestFs(box);
    };

    return (
      <div className={shellClass} data-mini-player="film" ref={boxRef}>
        <div className={cardClass}>
          <div className="relative w-full aspect-video bg-black group">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-contain bg-black"
              playsInline
              preload="auto"
              poster={film.poster || undefined}
            />
            {!filmPlaying && (
              <button
                type="button"
                onClick={() => void togglePlay()}
                className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 transition-opacity duration-300"
              >
                <div className="w-12 h-12 rounded-full bg-red-600/95 flex items-center justify-center shadow-lg shadow-red-600/30 transition-transform duration-300 hover:scale-105">
                  <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                </div>
              </button>
            )}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/90 z-20">
              <div
                className="h-full bg-red-500 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            {resumeSec > 0 && (
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/75 text-white px-1.5 py-0.5 rounded z-20 tabular-nums">
                {formatTime(resumeSec)}
                {film.duration > 0 ? ` / ${formatTime(film.duration)}` : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 p-2.5">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={goDetail} title="Xem chi tiết">
              <p className="text-xs font-semibold text-white line-clamp-1 hover:text-rose-200 transition-colors duration-300">
                {film.name}
              </p>
              <p className="text-[11px] text-zinc-400 line-clamp-1">
                {film.episode || "Xem tiếp"}
                {resumeSec > 0 ? ` · ${formatTime(resumeSec)}` : ""}
              </p>
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors duration-300"
              onClick={() => void togglePlay()}
              aria-label={filmPlaying ? "Tạm dừng" : "Phát tiếp"}
            >
              {filmPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors duration-300"
              onClick={() => void goFullscreen()}
              aria-label="Toàn màn hình"
              title="Toàn màn hình"
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-white transition-colors duration-300"
              onClick={goDetail}
              aria-label="Mở trang xem"
              title="Trang xem phim"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 transition-colors duration-300"
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
