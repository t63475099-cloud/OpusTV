import Link from "next/link";
import BannerSlider from "@/components/BannerSlider";
import MovieRow from "@/components/MovieRow";
import ContinueWatching from "@/components/ContinueWatching";
import HomeInfiniteFeed from "@/components/HomeInfiniteFeed";
import {
  getNewestMovies,
  getMoviesByCategory,
  getMoviesByList,
  getMoviesByCountry,
  getFeaturedMovies,
} from "@/lib/api";
import { FEATURED_PICKS } from "@/lib/constants";
import { CURATED_MOVIES } from "@/lib/curatedMovies";
import type { MovieListItem } from "@/lib/types";

export const revalidate = 1800;

function mergeMovies(...lists: (MovieListItem[] | undefined)[]): MovieListItem[] {
  const seen = new Set<string>();
  const out: MovieListItem[] = [];
  for (const list of lists) {
    for (const m of list || []) {
      if (!m?.slug || seen.has(m.slug)) continue;
      seen.add(m.slug);
      out.push(m);
    }
  }
  return out;
}

async function loadCategory(slug: string): Promise<MovieListItem[]> {
  const r = await getMoviesByCategory(slug, 1).catch(() => null);
  return r?.data?.items || [];
}

async function loadList(slug: string): Promise<MovieListItem[]> {
  const r = await getMoviesByList(slug, 1).catch(() => null);
  return r?.data?.items || [];
}

async function loadNewest(): Promise<MovieListItem[]> {
  const r = await getNewestMovies(1).catch(() => null);
  return r?.data?.items || [];
}

async function loadCountry(slug: string): Promise<MovieListItem[]> {
  const r = await getMoviesByCountry(slug, 1).catch(() => null);
  return r?.data?.items || [];
}

const CATS = [
  { href: "/danh-sach/phim-moi-cap-nhat", label: "Mới" },
  { href: "/quoc-gia/viet-nam", label: "Việt Nam" },
  { href: "/danh-sach/phim-bo", label: "Phim bộ" },
  { href: "/danh-sach/phim-le", label: "Phim lẻ" },
  { href: "/quoc-gia/han-quoc", label: "Hàn Quốc" },
  { href: "/quoc-gia/trung-quoc", label: "Trung Quốc" },
  { href: "/quoc-gia/au-my", label: "Âu Mỹ" },
  { href: "/the-loai/kinh-di", label: "Kinh dị" },
  { href: "/the-loai/hanh-dong", label: "Hành động" },
  { href: "/the-loai/tinh-cam", label: "Tình cảm" },
  { href: "/the-loai/co-trang", label: "Cổ trang" },
  { href: "/danh-sach/hoathinh", label: "Hoạt hình" },
];

export default async function HomePage() {
  const [
    newest,
    phimViet,
    phimHan,
    phimTrung,
    phimAuMy,
    kinhDi,
    hanhDong,
    tinhCam,
    coTrang,
    phimBo,
    phimLe,
    hoathinh,
    featured,
  ] = await Promise.all([
    loadNewest(),
    loadCountry("viet-nam"),
    loadCountry("han-quoc"),
    loadCountry("trung-quoc"),
    loadCountry("au-my"),
    loadCategory("kinh-di"),
    loadCategory("hanh-dong"),
    loadCategory("tinh-cam"),
    loadCategory("co-trang"),
    loadList("phim-bo"),
    loadList("phim-le"),
    loadList("hoathinh"),
    getFeaturedMovies(FEATURED_PICKS.map((f) => f.slug)).catch(() => [] as MovieListItem[]),
  ]);

  const curatedAsList: MovieListItem[] = CURATED_MOVIES.map((m) => ({
    _id: m.slug,
    name: m.name,
    slug: m.slug,
    origin_name: m.origin_name,
    type: "series",
    time: "",
    poster_url: m.poster,
    thumb_url: m.thumb,
    year: m.year,
    quality: m.quality,
    lang: m.lang,
    episode_current: m.episode_current,
    episode_total: m.episode_total,
    category: m.category,
    country: m.country,
  }));

  const vietMerged = mergeMovies(curatedAsList, phimViet);
  const bannerMovies = mergeMovies(
    featured.slice(0, 4),
    newest.slice(0, 4),
    vietMerged.slice(0, 2),
    phimHan.slice(0, 2)
  ).slice(0, 10);

  return (
    <div className="opus-film-home min-h-screen pb-28 bg-[#0a0a0c]">
      <BannerSlider movies={bannerMovies} />

      <nav className="flex gap-2 overflow-x-auto scrollbar-hide px-3 py-3 sm:px-4 md:px-6 lg:px-8">
        {CATS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-medium text-zinc-300 backdrop-blur-md transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-white sm:text-sm"
          >
            {c.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 sm:space-y-2">
        <ContinueWatching />

        {vietMerged.length > 0 ? (
          <MovieRow title="Phim Việt Nam" movies={vietMerged} href="/quoc-gia/viet-nam" />
        ) : null}

        <MovieRow
          title="Mới cập nhật"
          movies={newest}
          href="/danh-sach/phim-moi-cap-nhat"
        />

        {phimHan.length > 0 ? (
          <MovieRow title="Phim Hàn Quốc" movies={phimHan} href="/quoc-gia/han-quoc" />
        ) : null}

        {phimTrung.length > 0 ? (
          <MovieRow title="Phim Trung Quốc" movies={phimTrung} href="/quoc-gia/trung-quoc" />
        ) : null}

        {phimAuMy.length > 0 ? (
          <MovieRow title="Phim Âu Mỹ" movies={phimAuMy} href="/quoc-gia/au-my" />
        ) : null}

        {kinhDi.length > 0 ? (
          <MovieRow title="Kinh dị" movies={kinhDi} href="/the-loai/kinh-di" />
        ) : null}

        {hanhDong.length > 0 ? (
          <MovieRow title="Hành động" movies={hanhDong} href="/the-loai/hanh-dong" />
        ) : null}

        {tinhCam.length > 0 ? (
          <MovieRow title="Tình cảm" movies={tinhCam} href="/the-loai/tinh-cam" />
        ) : null}

        {coTrang.length > 0 ? (
          <MovieRow title="Cổ trang" movies={coTrang} href="/the-loai/co-trang" />
        ) : null}

        <MovieRow title="Phim bộ" movies={phimBo} href="/danh-sach/phim-bo" />
        <MovieRow title="Phim lẻ" movies={phimLe} href="/danh-sach/phim-le" />
        <MovieRow title="Hoạt hình" movies={hoathinh} href="/danh-sach/hoathinh" />

        <HomeInfiniteFeed />
      </div>
    </div>
  );
}
