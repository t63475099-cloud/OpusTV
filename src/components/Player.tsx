"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import {
  SkipForward,
  Settings,
  Check,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useHistoryStore } from "@/lib/history";
import { useSettingsStore } from "@/lib/settings";
import type { Episode, Movie } from "@/lib/types";
import { getImageUrl } from "@/lib/api";

interface PlayerProps {
  m3u8: string;
  movie: Movie;
  currentEpisode: Episode;
  serverName: string;
  nextEpisode?: Episode | null;
  onNextEpisode?: () => void;
}

interface QualityOption {
  level: number;
  label: string;
  height?: number;
  bitrate?: number;
}

function formatQuality(height?: number, bitrate?: number): string {
  if (height && height >= 2160) return "2160p (4K)";
  if (height && height >= 1440) return "1440p";
  if (height && height >= 1080) return "1080p";
  if (height && height >= 720) return "720p";
  if (height && height >= 480) return "480p";
  if (height && height >= 360) return "360p";
  if (height && height > 0) return `${height}p`;
  if (bitrate) return `${Math.round(bitrate / 1000)} kbps`;
  return "Mặc định";
}

function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function Player({
  m3u8,
  movie,
  currentEpisode,
  serverName,
  nextEpisode,
  onNextEpisode,
}: PlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fsPlaceholderRef = useRef<HTMLDivElement | null>(null);
  const fsParentRef = useRef<HTMLElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.setAttribute("playsinline", "true");
    v.setAttribute("webkit-playsinline", "true");
    v.setAttribute("x-webkit-airplay", "allow");
  }, []);

  const [showNext, setShowNext] = useState(false);
  const [qualities, setQualities] = useState<QualityOption[]>([
    { level: -1, label: "Tự động" },
  ]);
  const [currentLevel, setCurrentLevel] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState("Tự động");
  const [supportsLevels, setSupportsLevels] = useState(false);

  const [controlsVisible, setControlsVisible] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFs, setIsFs] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const [seekFlash, setSeekFlash] = useState<"left" | "right" | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const lastTap = useRef<{ t: number; x: number }>({ t: 0, x: 0 });

  const addOrUpdate = useHistoryStore((s) => s.addOrUpdate);
  const historyItem = useHistoryStore((s) => s.getBySlug(movie.slug));
  const autoPlayNext = useSettingsStore((s) => s.settings.autoPlayNext);
  const defaultQuality = useSettingsStore((s) => s.settings.defaultQuality);
  const seekSeconds = useSettingsStore((s) => s.settings.seekSeconds) || 10;
  const fillMode = useSettingsStore((s) => s.settings.fillMode) || "cover";
  const doubleTapSeek = useSettingsStore((s) => s.settings.doubleTapSeek) !== false;
  const hideControlsMs = useSettingsStore((s) => s.settings.hideControlsMs) || 3200;
  const alwaysShowControls = useSettingsStore((s) => s.settings.alwaysShowControls);
  const centerPlayButton = useSettingsStore((s) => s.settings.centerPlayButton) !== false;
  const showTimeCode = useSettingsStore((s) => s.settings.showTimeCode) !== false;

  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !movie) return;
    addOrUpdate({
      slug: movie.slug,
      name: movie.name,
      poster: getImageUrl(movie.poster_url || movie.thumb_url),
      episode: currentEpisode.name,
      episodeSlug: currentEpisode.slug,
      server: serverName,
      currentTime: video.currentTime,
      duration: video.duration || 0,
      updatedAt: Date.now(),
    });
  }, [movie, currentEpisode, serverName, addOrUpdate]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (alwaysShowControls) return;
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false);
      setMenuOpen(false);
    }, hideControlsMs);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  // HLS setup
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !m3u8) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    setQualities([{ level: -1, label: "Tự động" }]);
    setCurrentLevel(-1);
    setActiveLabel("Tự động");
    setSupportsLevels(false);
    setMenuOpen(false);
    setShowNext(false);

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        startLevel: -1,
      });
      hls.loadSource(m3u8);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = data.levels || hls.levels || [];
        if (levels.length > 0) {
          const opts: QualityOption[] = [
            { level: -1, label: "Tự động" },
            ...levels
              .map((lv: { height?: number; bitrate?: number }, idx: number) => ({
                level: idx,
                label: formatQuality(lv.height, lv.bitrate),
                height: lv.height,
                bitrate: lv.bitrate,
              }))
              .sort((a: QualityOption, b: QualityOption) => (b.height || 0) - (a.height || 0)),
          ];
          const seen = new Set<string>();
          const unique = opts.filter((o) => {
            if (o.level === -1) return true;
            if (seen.has(o.label)) return false;
            seen.add(o.label);
            return true;
          });
          setQualities(unique);
          setSupportsLevels(unique.length > 1);

          if (defaultQuality !== "auto" && unique.length > 1) {
            const targetH = parseInt(defaultQuality, 10);
            const match = unique.find(
              (o) => o.level >= 0 && o.height && Math.abs((o.height || 0) - targetH) < 80
            );
            if (match) {
              hls.currentLevel = match.level;
              setCurrentLevel(match.level);
              setActiveLabel(match.label);
            }
          }
        }

        if (
          historyItem &&
          historyItem.episodeSlug === currentEpisode.slug &&
          historyItem.currentTime > 10
        ) {
          video.currentTime = historyItem.currentTime;
        }
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lv = hls.levels[data.level];
        if (hls.autoLevelEnabled) {
          setActiveLabel(`Tự động (${formatQuality(lv?.height, lv?.bitrate)})`);
        }
      });

      hlsRef.current = hls;
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = m3u8;
      video.addEventListener("loadedmetadata", () => {
        if (
          historyItem &&
          historyItem.episodeSlug === currentEpisode.slug &&
          historyItem.currentTime > 10
        ) {
          video.currentTime = historyItem.currentTime;
        }
        video.play().catch(() => {});
      });
    }

    const interval = setInterval(saveProgress, 5000);
    return () => {
      clearInterval(interval);
      saveProgress();
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [m3u8, currentEpisode.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  // Video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => {
      setPlaying(false);
      saveProgress();
    };
    const onTime = () => {
      if (!seeking) setCurrentTime(video.currentTime);
    };
    const onMeta = () => setDuration(video.duration || 0);
    const onVol = () => setMuted(video.muted || video.volume === 0);

    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("loadedmetadata", onMeta);
    video.addEventListener("durationchange", onMeta);
    video.addEventListener("volumechange", onVol);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("loadedmetadata", onMeta);
      video.removeEventListener("durationchange", onMeta);
      video.removeEventListener("volumechange", onVol);
    };
  }, [seeking, saveProgress]);

  // Fullscreen / iOS webkit end
  useEffect(() => {
    const syncFs = () => {
      const v = videoRef.current as any;
      const nativeFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement
      );
      const iosFs = !!(v && (v.webkitDisplayingFullscreen || v.webkitPresentationMode === "fullscreen"));
      const cssFs = !!wrapRef.current?.classList.contains("player-fs-css");
      const on = nativeFs || iosFs || cssFs;
      setIsFs(on);
      if (!on) {
        try {
          const o = screen.orientation as any;
          if (o?.unlock) o.unlock();
        } catch { /* */ }
      }
    };
    document.addEventListener("fullscreenchange", syncFs);
    document.addEventListener("webkitfullscreenchange", syncFs);
    const v = videoRef.current;
    if (v) {
      v.addEventListener("webkitbeginfullscreen", syncFs);
      v.addEventListener("webkitendfullscreen", syncFs);
    }
    return () => {
      document.removeEventListener("fullscreenchange", syncFs);
      document.removeEventListener("webkitfullscreenchange", syncFs);
      if (v) {
        v.removeEventListener("webkitbeginfullscreen", syncFs);
        v.removeEventListener("webkitendfullscreen", syncFs);
      }
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const el = wrapRef.current;
        if (el?.classList.contains("player-fs-css")) {
          el.classList.remove("player-fs-css", "player-fs-force-land");
          document.body.classList.remove("player-fs-lock");
          document.documentElement.classList.remove("player-fs-html-lock");
          setIsFs(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click outside quality menu
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Auto-hide when playing
  useEffect(() => {
    if (playing && controlsVisible && !menuOpen) {
      scheduleHide();
    }
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playing, controlsVisible, menuOpen, scheduleHide]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
    showControls();
  };

  const seekBy = (delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    const next = Math.max(0, Math.min((v.duration || 0), v.currentTime + delta));
    v.currentTime = next;
    setCurrentTime(next);
    showControls();
  };

  const onProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    setCurrentTime(t);
    v.currentTime = t;
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
    showControls();
  };


  const handleEnded = () => {
    setPlaying(false);
    setShowNext(true);
    saveProgress();
    if (autoPlayNext && nextEpisode && onNextEpisode) {
      onNextEpisode();
    }
  };

  const onStageClick = (e: React.MouseEvent) => {
    // avoid when clicking controls
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest("input") || target.closest("[data-controls]")) {
      return;
    }
    if (!doubleTapSeek) {
      togglePlay();
      showControls();
      return;
    }
    const now = Date.now();
    const last = lastTap.current;
    lastTap.current = { t: now, x: e.clientX };
    if (last && now - last.t < 320) {
      const rect = wrapRef.current?.getBoundingClientRect();
      if (rect) {
        const mid = rect.left + rect.width / 2;
        if (e.clientX < mid) seekBy(-seekSeconds);
        else seekBy(seekSeconds);
        setSeekFlash(e.clientX < mid ? "left" : "right");
        window.setTimeout(() => setSeekFlash(null), 500);
      }
      lastTap.current = { t: 0, x: 0 };
      return;
    }
    // single tap: toggle controls or play
    if (controlsVisible) togglePlay();
    else showControls();
  };

  const selectQuality = (opt: QualityOption) => {
    const hls = hlsRef.current as any;
    if (!hls) return;
    try {
      if (opt.level === -1) {
        hls.currentLevel = -1;
      } else {
        hls.currentLevel = opt.level;
      }
      setCurrentLevel(opt.level);
      setActiveLabel(opt.label);
      setMenuOpen(false);
      showControls();
    } catch {
      /* ignore */
    }
  };

  const cycleRate = () => {
    const v = videoRef.current;
    if (!v) return;
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
    const idx = rates.indexOf(playbackRate);
    const next = rates[(idx + 1) % rates.length] ?? 1;
    v.playbackRate = next;
    setPlaybackRate(next);
    showControls();
  };

  const togglePiP = async () => {
    const v = videoRef.current as any;
    if (!v) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
      } else if (v.webkitSetPresentationMode) {
        const mode = v.webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture";
        v.webkitSetPresentationMode(mode);
      }
    } catch {
      /* not supported */
    }
    showControls();
  };



  // Đồng bộ kích thước fullscreen với visualViewport (YouTube-style, mọi mobile)
  useEffect(() => {
    if (!isFs) return;
    const applyVv = () => {
      const el = wrapRef.current;
      if (!el || !el.classList.contains("player-fs-css")) return;
      const vv = window.visualViewport;
      const w = Math.round(vv?.width ?? window.innerWidth);
      const h = Math.round(vv?.height ?? window.innerHeight);
      const top = Math.round(vv?.offsetTop ?? 0);
      const left = Math.round(vv?.offsetLeft ?? 0);
      el.style.setProperty("--fs-w", `${w}px`);
      el.style.setProperty("--fs-h", `${h}px`);
      el.style.setProperty("--fs-top", `${top}px`);
      el.style.setProperty("--fs-left", `${left}px`);
    };
    applyVv();
    window.addEventListener("resize", applyVv);
    window.addEventListener("orientationchange", applyVv);
    window.visualViewport?.addEventListener("resize", applyVv);
    window.visualViewport?.addEventListener("scroll", applyVv);
    const t1 = window.setTimeout(applyVv, 50);
    const t2 = window.setTimeout(applyVv, 250);
    return () => {
      window.removeEventListener("resize", applyVv);
      window.removeEventListener("orientationchange", applyVv);
      window.visualViewport?.removeEventListener("resize", applyVv);
      window.visualViewport?.removeEventListener("scroll", applyVv);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      const el = wrapRef.current;
      if (el) {
        el.style.removeProperty("--fs-w");
        el.style.removeProperty("--fs-h");
        el.style.removeProperty("--fs-top");
        el.style.removeProperty("--fs-left");
      }
    };
  }, [isFs]);

  const isMobileDevice = () => {
    if (typeof window === "undefined") return false;
    const ua = navigator.userAgent || "";
    const touch = navigator.maxTouchPoints > 0;
    const mobileUA = /Android|iPhone|iPad|iPod|Mobile|webOS|BlackBerry/i.test(ua);
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    return mobileUA || iPadOS || (touch && window.matchMedia("(pointer: coarse)").matches);
  };

  const isIOSDevice = () => {
    if (typeof window === "undefined") return false;
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  };

  const exitCssFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    el.classList.remove("player-fs-css", "player-fs-force-land");
    document.body.classList.remove("player-fs-lock");
    document.documentElement.classList.remove("player-fs-html-lock");
    document.documentElement.classList.remove("opus-hide-chrome");
    el.style.removeProperty("--fs-w");
    el.style.removeProperty("--fs-h");
    el.style.removeProperty("--fs-top");
    el.style.removeProperty("--fs-left");
    // Đưa player về chỗ cũ
    const ph = fsPlaceholderRef.current;
    if (ph && ph.parentNode) {
      ph.parentNode.insertBefore(el, ph);
      ph.remove();
      fsPlaceholderRef.current = null;
      fsParentRef.current = null;
    }
    setIsFs(false);
  };

  const enterCssFs = () => {
    const el = wrapRef.current;
    if (!el) return;
    // Portal lên body — tránh stacking/transform của layout (navbar đè, iOS fixed bug)
    if (el.parentElement !== document.body) {
      const ph = document.createElement("div");
      ph.setAttribute("data-player-fs-ph", "1");
      ph.style.width = "100%";
      ph.style.aspectRatio = "16 / 9";
      ph.style.background = "#000";
      fsParentRef.current = el.parentElement as HTMLElement;
      el.parentNode?.insertBefore(ph, el);
      fsPlaceholderRef.current = ph;
      document.body.appendChild(el);
    }
    el.classList.remove("player-fs-force-land");
    el.classList.add("player-fs-css");
    document.body.classList.add("player-fs-lock");
    document.documentElement.classList.add("player-fs-html-lock");
    document.documentElement.classList.add("opus-hide-chrome");
    setIsFs(true);
    const apply = () => {
      const vv = window.visualViewport;
      const w = Math.round(vv?.width ?? window.innerWidth);
      const h = Math.round(vv?.height ?? window.innerHeight);
      el.style.setProperty("--fs-w", `${w}px`);
      el.style.setProperty("--fs-h", `${h}px`);
      el.style.setProperty("--fs-top", `${Math.round(vv?.offsetTop ?? 0)}px`);
      el.style.setProperty("--fs-left", `${Math.round(vv?.offsetLeft ?? 0)}px`);
    };
    apply();
    requestAnimationFrame(apply);
    setTimeout(apply, 50);
    setTimeout(apply, 300);
  };

  const lockLandscape = async () => {
    try {
      const o = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>;
      };
      if (o && typeof o.lock === "function") {
        await o.lock("landscape");
        return true;
      }
    } catch {
      /* blocked on iOS / many browsers */
    }
    return false;
  };

  const unlockOrientation = async () => {
    try {
      const o = screen.orientation as ScreenOrientation & { unlock?: () => void };
      if (o && typeof o.unlock === "function") o.unlock();
    } catch {
      /* ignore */
    }
  };

  /**
   * Fullscreen kiểu YouTube Web:
   * - iPhone/iPad: CSS fixed full visualViewport (giữ control tùy chỉnh, không webkitEnterFullscreen)
   * - Android: Fullscreen API trên container + fallback CSS
   * - PC: Fullscreen API
   */
  const toggleFs = async () => {
    const el = wrapRef.current;
    const video = videoRef.current as any;
    if (!el || !video) return;

    const inNative = !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement
    );
    const inCss = el.classList.contains("player-fs-css");
    const inIosNative = !!(video.webkitDisplayingFullscreen);

    // —— Thoát ——
    if (inNative || inCss || inIosNative) {
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitFullscreenElement && (document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        }
      } catch {
        /* ignore */
      }
      try {
        if (inIosNative && typeof video.webkitExitFullscreen === "function") {
          video.webkitExitFullscreen();
        }
      } catch {
        /* ignore */
      }
      exitCssFs();
      await unlockOrientation();
      showControls();
      return;
    }

    const mobile = isMobileDevice();
    const ios = isIOSDevice();

    // —— iOS Safari: ưu tiên native video fullscreen (che UI Safari thật) ——
    if (ios) {
      try {
        if (video && typeof video.webkitEnterFullscreen === "function") {
          // Cần playsInline + user gesture; native FS full landscape khi xoay
          video.webkitEnterFullscreen();
          setIsFs(true);
          showControls();
          return;
        }
      } catch (e) {
        console.warn("webkitEnterFullscreen failed", e);
      }
      // Fallback: CSS portal full viewport
      enterCssFs();
      showControls();
      return;
    }

    // —— Android / mobile khác: thử Fullscreen API trước ——
    if (mobile) {
      try {
        if (typeof el.requestFullscreen === "function") {
          await el.requestFullscreen({ navigationUI: "hide" } as FullscreenOptions);
          setIsFs(true);
          // Gợi ý ngang nếu trình duyệt cho phép (không bắt buộc)
          void lockLandscape();
          showControls();
          return;
        }
        if (typeof (el as any).webkitRequestFullscreen === "function") {
          await (el as any).webkitRequestFullscreen();
          setIsFs(true);
          void lockLandscape();
          showControls();
          return;
        }
      } catch {
        /* fallback CSS */
      }
      enterCssFs();
      void lockLandscape();
      showControls();
      return;
    }

    // —— Desktop ——
    try {
      if (typeof el.requestFullscreen === "function") {
        await el.requestFullscreen();
        setIsFs(true);
        showControls();
        return;
      }
      if (typeof (el as any).webkitRequestFullscreen === "function") {
        await (el as any).webkitRequestFullscreen();
        setIsFs(true);
        showControls();
        return;
      }
    } catch {
      /* fall through */
    }
    enterCssFs();
    showControls();
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={wrapRef}
      className="player-shell relative w-full bg-black aspect-video group select-none overflow-hidden"
      onMouseMove={showControls}
      onTouchStart={showControls}
    >
      <video
        ref={videoRef}
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        className={`player-video absolute inset-0 w-full h-full bg-black ${fillMode === "cover" ? "player-fill-cover object-cover" : "player-fill-contain object-contain"}`}
        onEnded={handleEnded}
        onClick={onStageClick}
      />

      {seekFlash === "left" && (
        <div className="seek-flash absolute left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-white">
          <RotateCcw className="w-8 h-8" />
          <span className="text-sm font-bold mt-1">-{seekSeconds}s</span>
        </div>
      )}
      {seekFlash === "right" && (
        <div className="seek-flash absolute right-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center text-white">
          <RotateCw className="w-8 h-8" />
          <span className="text-sm font-bold mt-1">+{seekSeconds}s</span>
        </div>
      )}

      {/* Center play when paused & controls hidden briefly */}
      {!playing && controlsVisible && centerPlayButton && (
        <button
          type="button"
          data-controls
          onClick={togglePlay}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/50 border border-white/20 flex items-center justify-center z-10 hover:bg-black/70 transition"
          aria-label="Phát"
        >
          <Play className="w-8 h-8 text-white fill-white ml-1" />
        </button>
      )}

      {/* Quality top-right */}
      {supportsLevels && controlsVisible && (
        <div ref={menuRef} data-controls className="player-quality-pos absolute z-20">
          <button
            type="button"
            onClick={() => {
              setMenuOpen((v) => !v);
              showControls();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black/90 text-white text-xs font-medium backdrop-blur border border-white/10 transition"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="max-w-[90px] truncate">{activeLabel}</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-[#212121] border border-zinc-700 shadow-2xl overflow-hidden">
              <p className="px-3 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                Chất lượng
              </p>
              <ul className="py-1 max-h-56 overflow-y-auto custom-scroll">
                {qualities.map((opt) => {
                  const selected =
                    opt.level === -1 ? currentLevel === -1 : currentLevel === opt.level;
                  return (
                    <li key={`${opt.level}-${opt.label}`}>
                      <button
                        type="button"
                        onClick={() => selectQuality(opt)}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition ${
                          selected ? "bg-white/10 text-white" : "text-zinc-300 hover:bg-white/5"
                        }`}
                      >
                        <span className="w-4 shrink-0">
                          {selected && <Check className="w-4 h-4 text-red-500" />}
                        </span>
                        {opt.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Bottom controls — hidden until interaction */}
      <div
        data-controls
        className={`absolute inset-x-0 bottom-0 z-20 transition-opacity duration-300 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="player-controls-bar glass-player-bar bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-12 px-3 sm:px-4">
          {/* Progress / time bar */}
          <div className="flex items-center gap-2 mb-2">
            {showTimeCode && (
            <span className="text-[11px] text-zinc-300 tabular-nums w-10 text-right shrink-0">
              {formatTime(currentTime)}
            </span>
            )}
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={onProgressChange}
              onMouseDown={() => setSeeking(true)}
              onMouseUp={() => setSeeking(false)}
              onTouchStart={() => setSeeking(true)}
              onTouchEnd={() => setSeeking(false)}
              className="flex-1 h-1 accent-red-600 cursor-pointer"
              style={{
                background: `linear-gradient(to right, #e50914 ${progress}%, #52525b ${progress}%)`,
              }}
              aria-label="Thanh thời gian"
            />
            {showTimeCode && (
            <span className="text-[11px] text-zinc-300 tabular-nums w-10 shrink-0">
              {formatTime(duration)}
            </span>
            )}
          </div>

          {/* Buttons: Rewind | Pause | Forward */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => seekBy(-seekSeconds)}
                className="p-2 rounded-full hover:bg-white/10 text-white transition relative"
                title={`Lùi ${seekSeconds}s`}
                aria-label={`Lùi ${seekSeconds} giây`}
              >
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white">
                  {seekSeconds}
                </span>
              </button>

              <button
                type="button"
                onClick={togglePlay}
                className="p-2.5 sm:p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition btn-press"
                aria-label={playing ? "Tạm dừng" : "Phát"}
              >
                {playing ? (
                  <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
                ) : (
                  <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={() => seekBy(seekSeconds)}
                className="p-2 rounded-full hover:bg-white/10 text-white transition relative"
                title={`Tiến ${seekSeconds}s`}
                aria-label={`Tiến ${seekSeconds} giây`}
              >
                <RotateCw className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-white">
                  {seekSeconds}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-0.5 sm:gap-1">
              <button
                type="button"
                onClick={cycleRate}
                className="px-2 py-1.5 rounded-full hover:bg-white/10 text-white text-xs font-bold tabular-nums transition min-w-[2.5rem]"
                title="Tốc độ phát"
              >
                {playbackRate}x
              </button>
              <button
                type="button"
                onClick={togglePiP}
                className="px-2 py-1.5 rounded-full hover:bg-white/10 text-white text-[10px] font-bold transition hidden sm:inline-flex"
                aria-label="Picture in Picture"
                title="PiP"
              >
                PiP
              </button>
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/10 text-white transition"
                aria-label={muted ? "Bật tiếng" : "Tắt tiếng"}
              >
                {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={toggleFs}
                className="p-2 rounded-full hover:bg-white/10 text-white transition"
                aria-label={isFs ? "Thoát toàn màn hình" : "Toàn màn hình"}
              >
                {isFs ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showNext && nextEpisode && (
        <div data-controls className="absolute bottom-20 right-4 bg-black/90 backdrop-blur rounded-lg p-4 max-w-xs z-30">
          <p className="text-sm text-zinc-400 mb-1">Tập tiếp theo sau 5s</p>
          <p className="text-white font-medium mb-3">{nextEpisode.name}</p>
          <button
            onClick={() => {
              onNextEpisode?.();
              setShowNext(false);
            }}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white text-sm px-4 py-2 rounded w-full justify-center"
          >
            <SkipForward className="w-4 h-4" />
            Xem ngay
          </button>
        </div>
      )}
    </div>
  );
}
