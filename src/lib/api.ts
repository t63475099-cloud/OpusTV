import { API_BASE, CDN_IMAGE } from "./constants";
import type { ListResponse, MovieDetailResponse, MovieListItem } from "./types";

export function getImageUrl(path?: string | null): string {
  if (!path) return "/placeholder.svg";
  if (path.startsWith("http")) return path;
  return `${CDN_IMAGE}/${path.replace(/^\//, "")}`;
}

async function fetcher<T>(url: string, revalidate = 1800): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate },
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; XianxiaStream/1.0)",
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getNewestMovies(page = 1): Promise<ListResponse> {
  return fetcher(`${API_BASE}/v1/api/danh-sach/phim-moi-cap-nhat?page=${page}`, 900);
}

export async function getMoviesByList(slug: string, page = 1): Promise<ListResponse> {
  return fetcher(`${API_BASE}/v1/api/danh-sach/${slug}?page=${page}`);
}

export async function getMoviesByCategory(slug: string, page = 1): Promise<ListResponse> {
  return fetcher(`${API_BASE}/v1/api/the-loai/${slug}?page=${page}`);
}

export async function getMoviesByCountry(slug: string, page = 1): Promise<ListResponse> {
  return fetcher(`${API_BASE}/v1/api/quoc-gia/${slug}?page=${page}`);
}

export async function searchMovies(keyword: string, page = 1): Promise<ListResponse> {
  return fetcher(
    `${API_BASE}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`,
    1800
  );
}

export async function getMovieDetail(slug: string): Promise<MovieDetailResponse> {
  return fetcher(`${API_BASE}/phim/${slug}`, 3600);
}

export async function getFeaturedMovies(slugs: string[]): Promise<MovieListItem[]> {
  const results = await Promise.allSettled(
    slugs.map(async (slug) => {
      const data = await getMovieDetail(slug);
      if (data.status && data.movie) {
        return {
          ...data.movie,
          last_episodes: data.episodes?.[0]?.server_data?.slice(-1).map((e) => ({
            server_name: data.episodes[0].server_name,
            name: e.name,
          })),
        } as MovieListItem;
      }
      return null;
    })
  );

  return results
    .filter((r) => r.status === "fulfilled" && r.value)
    .map((r) => (r as PromiseFulfilledResult<MovieListItem>).value);
}

export async function getCategories() {
  return fetcher(`${API_BASE}/v1/api/the-loai`);
}
