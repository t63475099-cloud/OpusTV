const FILM_KEY = "opustv-search-history";
const MUSIC_KEY = "opustv-music-search-history";
const MAX = 12;

function read(key: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

function write(key: string, items: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(items.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

export function getFilmSearchHistory(): string[] {
  return read(FILM_KEY);
}

export function pushFilmSearchHistory(q: string) {
  const s = q.trim().slice(0, 80);
  if (!s) return;
  const next = [s, ...getFilmSearchHistory().filter((x) => x.toLowerCase() !== s.toLowerCase())];
  write(FILM_KEY, next);
}

export function removeFilmSearchHistory(q: string) {
  write(
    FILM_KEY,
    getFilmSearchHistory().filter((x) => x !== q)
  );
}

export function clearFilmSearchHistory() {
  write(FILM_KEY, []);
}

export function getMusicSearchHistory(): string[] {
  return read(MUSIC_KEY);
}

export function pushMusicSearchHistory(q: string) {
  const s = q.trim().slice(0, 80);
  if (!s) return;
  const next = [s, ...getMusicSearchHistory().filter((x) => x.toLowerCase() !== s.toLowerCase())];
  write(MUSIC_KEY, next);
}

export function removeMusicSearchHistory(q: string) {
  write(
    MUSIC_KEY,
    getMusicSearchHistory().filter((x) => x !== q)
  );
}

export function clearMusicSearchHistory() {
  write(MUSIC_KEY, []);
}
