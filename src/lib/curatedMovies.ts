/** Phim thủ công (YouTube) — không có trên KKPhim/Ophim */

export interface CuratedEpisode {
  name: string;
  youtubeId: string;
}

export interface CuratedMovie {
  slug: string;
  name: string;
  origin_name: string;
  year: number;
  content: string;
  poster: string;
  thumb: string;
  quality: string;
  lang: string;
  episode_current: string;
  episode_total: string;
  category: { name: string; slug: string }[];
  country: { name: string; slug: string }[];
  episodes: CuratedEpisode[];
}

export const CURATED_MOVIES: CuratedMovie[] = [
  {
    slug: "nguoi-trong-san-truong",
    name: "Người Trong Sân Trường",
    origin_name: "The Schoolyard People",
    year: 2026,
    content:
      "Series học đường FAPTV x Peace Walker. Sân trường nào cũng có bí mật — những câu chuyện tuổi học trò gần gũi, trong trẻo và đầy cảm xúc. Phần 1 gồm 11 tập.",
    poster: "https://i.ytimg.com/vi/v2FnzedNeI4/maxresdefault.jpg",
    thumb: "https://i.ytimg.com/vi/v2FnzedNeI4/hqdefault.jpg",
    quality: "FHD",
    lang: "Vietsub",
    episode_current: "Full 11/11",
    episode_total: "11",
    category: [
      { name: "Hài hước", slug: "hai-huoc" },
      { name: "Tình cảm", slug: "tinh-cam" },
    ],
    country: [{ name: "Việt Nam", slug: "viet-nam" }],
    episodes: [
      { name: "Tập 01", youtubeId: "v2FnzedNeI4" },
      { name: "Tập 02", youtubeId: "j5BxY4h--gY" },
      { name: "Tập 03", youtubeId: "bdanLGNzQO0" },
      { name: "Tập 04", youtubeId: "YTbC6GAHoJ0" },
      { name: "Tập 05", youtubeId: "Ax7dDybLNAY" },
      { name: "Tập 06", youtubeId: "PKQcjaM3goA" },
      { name: "Tập 07", youtubeId: "0mf_pO8Z3hg" },
      { name: "Tập 08", youtubeId: "ZtxZ9ryE0m0" },
      { name: "Tập 09", youtubeId: "6vZ3zeckyiM" },
      { name: "Tập 10", youtubeId: "gDDkJnsiFXs" },
      { name: "Tập 11 (Hết phần 1)", youtubeId: "Jd9GA7oE4HU" },
      { name: "Full (ghép)", youtubeId: "Cd2BYYCJLpc" },
    ],
  },
];

export function getCuratedMovie(slug: string) {
  return CURATED_MOVIES.find((m) => m.slug === slug) || null;
}
