export interface Category {
  id?: string;
  name: string;
  slug: string;
}

export interface Country {
  id?: string;
  name: string;
  slug: string;
}

export interface Episode {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8: string;
}

export interface Server {
  server_name: string;
  is_ai?: boolean;
  server_data: Episode[];
}

export interface Movie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  content?: string;
  type: string;
  status?: string;
  thumb_url: string;
  poster_url: string;
  trailer_url?: string;
  time: string;
  episode_current: string;
  episode_total?: number | string;
  quality: string;
  lang: string;
  year: number;
  actor?: string[];
  director?: string[];
  category: Category[];
  country: Country[];
  view?: number;
  modified?: { time: string };
}

export interface MovieDetailResponse {
  status: boolean;
  msg: string;
  movie: Movie;
  episodes: Server[];
}

export interface MovieListItem extends Movie {
  last_episodes?: { server_name: string; name: string }[];
}

export interface ListResponse {
  status: boolean | string;
  msg?: string;
  data?: {
    items: MovieListItem[];
    titlePage?: string;
    params?: {
      pagination?: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
      };
    };
    APP_DOMAIN_CDN_IMAGE?: string;
  };
}

export interface WatchHistory {
  slug: string;
  name: string;
  poster: string;
  episode: string;
  episodeSlug: string;
  server: string;
  currentTime: number;
  duration: number;
  updatedAt: number;
}
