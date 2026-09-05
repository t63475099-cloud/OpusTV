"use client";

/** Lưu mốc xem độc lập — tránh mất currentTime khi reload */

const FILM_PREFIX = "opus_resume_film_";
const MUSIC_PREFIX = "opus_resume_music_";

function filmKey(slug: string, episodeSlug?: string) {
  return FILM_PREFIX + slug + "_" + (episodeSlug || "default");
}

export function saveFilmResume(
  slug: string,
  episodeSlug: string | undefined,
  currentTime: number,
  duration: number,
  meta?: {
    name?: string;
    poster?: string;
    episode?: string;
    server?: string;
    m3u8?: string;
  }
) {
  if (typeof window === "undefined" || !slug) return;
  if (!currentTime || currentTime < 3) return;
  try {
    const payload = {
      slug,
      episodeSlug: episodeSlug || "",
      currentTime: Math.floor(currentTime),
      duration: Math.floor(duration || 0),
      updatedAt: Date.now(),
      ...meta,
    };
    localStorage.setItem(filmKey(slug, episodeSlug), JSON.stringify(payload));
    // snapshot phiên active gần nhất
    localStorage.setItem("opus_resume_film_last", JSON.stringify(payload));
  } catch {
    /* quota */
  }
}

export function loadFilmResume(slug: string, episodeSlug?: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(filmKey(slug, episodeSlug));
    if (!raw) return 0;
    const j = JSON.parse(raw);
    return Number(j.currentTime) > 3 ? Number(j.currentTime) : 0;
  } catch {
    return 0;
  }
}

export function loadLastFilmResume(): {
  slug: string;
  episodeSlug: string;
  currentTime: number;
  duration: number;
  name?: string;
  poster?: string;
  episode?: string;
  server?: string;
  m3u8?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("opus_resume_film_last");
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j?.slug || !(Number(j.currentTime) > 3)) return null;
    return j;
  } catch {
    return null;
  }
}

export function saveMusicResume(id: string, currentTime: number, meta?: { title?: string; artist?: string; thumb?: string }) {
  if (typeof window === "undefined" || !id) return;
  if (!currentTime || currentTime < 3) return;
  try {
    const payload = {
      id,
      currentTime: Math.floor(currentTime),
      updatedAt: Date.now(),
      ...meta,
    };
    localStorage.setItem(MUSIC_PREFIX + id, JSON.stringify(payload));
    localStorage.setItem("opus_resume_music_last", JSON.stringify(payload));
  } catch {}
}

export function loadMusicResume(id: string): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(MUSIC_PREFIX + id);
    if (!raw) return 0;
    const j = JSON.parse(raw);
    return Number(j.currentTime) > 3 ? Number(j.currentTime) : 0;
  } catch {
    return 0;
  }
}

export function loadLastMusicResume(): {
  id: string;
  currentTime: number;
  title?: string;
  artist?: string;
  thumb?: string;
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("opus_resume_music_last");
    if (!raw) return null;
    const j = JSON.parse(raw);
    if (!j?.id || !(Number(j.currentTime) > 3)) return null;
    return j;
  } catch {
    return null;
  }
}
