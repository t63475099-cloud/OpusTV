/** Media schema — chỉ dữ liệu từ API/props, không mock mô tả */

export interface MovieItem {
  id: string;
  slug: string;
  title: string;
  /** null/"" → hiển thị empty state chuẩn */
  description: string | null;
  posterUrl: string | null;
  bannerUrl: string | null;
  year: number | null;
  rating: number | null;
  quality: string | null;
  tags: string[];
  episodeCount: number | null;
  currentEpisode: number | null;
  isVip: boolean;
  focusX?: number | null;
  focusY?: number | null;
}

export interface EpisodeItem {
  id: string;
  number: number;
  name: string | null;
  slug: string | null;
  watched: boolean;
}

export function emptyDescriptionLabel(): string {
  return "Chưa có mô tả chính thức";
}
