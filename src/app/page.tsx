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

async function loadCategory(slug: string, pages = 2): Promise<MovieListItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getMoviesByCategory(slug, i + 1).catch(() => null)
    )
  );
  return mergeMovies(...results.map((r) => r?.data?.items));
}

async function loadList(slug: string, pages = 2): Promise<MovieListItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getMoviesByList(slug, i + 1).catch(() => null)
    )
  );
  return mergeMovies(...results.map((r) => r?.data?.items));
}

async function loadNewest(pages = 3): Promise<MovieListItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getNewestMovies(i + 1).catch(() => null)
    )
  );
  return mergeMovies(...results.map((r) => r?.data?.items));
}

async function loadCountry(slug: string, pages = 2): Promise<MovieListItem[]> {
  const results = await Promise.all(
    Array.from({ length: pages }, (_, i) =>
      getMoviesByCountry(slug, i + 1).catch(() => null)
    )
  );
  return mergeMovies(...results.map((r) => r?.data?.items));
}

export default async function HomePage() {
  const [
    newest,
    coTrang,
    vienTuong,
    thanThoai,
    kinhDi,
    hanhDong,
    tinhCam,
    haiHuoc,
    voThuat,
    tamLy,
    hinhSu,
    phimHan,
    phimViet,
    phimTrung,
    phimThai,
    phimAuMy,
    phimNhat,
    phimBo,
    phimLe,
    hoathinh,
    featured,
  ] = await Promise.all([
    loadNewest(4),
    loadCategory("co-trang", 3),
    loadCategory("vien-tuong", 2),
    loadCategory("than-thoai", 2),
    loadCategory("kinh-di", 3),
    loadCategory("hanh-dong", 3),
    loadCategory("tinh-cam", 3),
    loadCategory("hai-huoc", 2),
    loadCategory("vo-thuat", 2),
    loadCategory("tam-ly", 2),
    loadCategory("hinh-su", 2),
    loadCountry("han-quoc", 3),
    loadCountry("viet-nam", 4),
    loadCountry("trung-quoc", 3),
    loadCountry("thai-lan", 2),
    loadCountry("au-my", 3),
    loadCountry("nhat-ban", 2),
    loadList("phim-bo", 3),
    loadList("phim-le", 3),
    loadList("hoathinh", 2),
    getFeaturedMovies(FEATURED_PICKS.map((f) => f.slug)).catch(() => []),
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

  const phimVietMerged = mergeMovies(curatedAsList, phimViet);

  const bannerMovies = mergeMovies(
    featured.slice(0, 3),
    phimVietMerged.slice(0, 3),
    phimHan.slice(0, 2),
    newest.slice(0, 4),
    kinhDi.slice(0, 2),
    phimAuMy.slice(0, 2)
  ).slice(0, 14);

  return (
    <div className="fpt-home min-h-screen pb-16 app-content-offset">
      <div className="relative w-full">
        <BannerSlider movies={bannerMovies} />
        <nav className="fpt-home-cats flex gap-2 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-6 lg:px-8 py-3 -mt-1">
          {[
            { href: "/danh-sach/phim-moi-cap-nhat", label: "Mới cập nhật" },
            { href: "/quoc-gia/viet-nam", label: "Phim Việt" },
            { href: "/danh-sach/phim-bo", label: "Phim bộ" },
            { href: "/danh-sach/phim-le", label: "Phim lẻ" },
            { href: "/quoc-gia/han-quoc", label: "Phim Hàn" },
            { href: "/quoc-gia/trung-quoc", label: "Trung Quốc" },
            { href: "/quoc-gia/au-my", label: "Âu Mỹ" },
            { href: "/quoc-gia/thai-lan", label: "Thái Lan" },
            { href: "/quoc-gia/nhat-ban", label: "Nhật Bản" },
            { href: "/the-loai/hanh-dong", label: "Hành động" },
            { href: "/the-loai/tinh-cam", label: "Tình cảm" },
            { href: "/the-loai/kinh-di", label: "Kinh dị" },
            { href: "/the-loai/hai-huoc", label: "Hài" },
            { href: "/the-loai/co-trang", label: "Cổ trang" },
            { href: "/danh-sach/hoathinh", label: "Hoạt hình" },
            { href: "/nhac", label: "Nhạc" },
          ].map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="glass-chip shrink-0 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium text-zinc-200"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="relative z-10 pt-2 space-y-1">
          <ContinueWatching />

          {phimVietMerged.length > 0 && (
            <MovieRow
              title="Phim Việt Nam"
              movies={phimVietMerged}
              href="/quoc-gia/viet-nam"
            />
          )}

          {featured.length > 0 && (
            <MovieRow
              title="Có thể bạn thích"
              movies={featured}
              href="/danh-sach/phim-moi-cap-nhat"
            />
          )}

          <MovieRow
            title="Phim mới cập nhật"
            movies={newest}
            href="/danh-sach/phim-moi-cap-nhat"
          />

          {phimHan.length > 0 && (
            <MovieRow title="Phim Hàn Quốc" movies={phimHan} href="/quoc-gia/han-quoc" />
          )}

          {phimTrung.length > 0 && (
            <MovieRow
              title="Phim Trung Quốc"
              movies={phimTrung}
              href="/quoc-gia/trung-quoc"
            />
          )}

          {phimAuMy.length > 0 && (
            <MovieRow title="Phim Âu Mỹ" movies={phimAuMy} href="/quoc-gia/au-my" />
          )}

          {phimThai.length > 0 && (
            <MovieRow title="Phim Thái Lan" movies={phimThai} href="/quoc-gia/thai-lan" />
          )}

          {phimNhat.length > 0 && (
            <MovieRow title="Phim Nhật Bản" movies={phimNhat} href="/quoc-gia/nhat-ban" />
          )}

          {kinhDi.length > 0 && (
            <MovieRow title="Kinh dị" movies={kinhDi} href="/the-loai/kinh-di" />
          )}

          {hanhDong.length > 0 && (
            <MovieRow title="Hành động" movies={hanhDong} href="/the-loai/hanh-dong" />
          )}

          {tinhCam.length > 0 && (
            <MovieRow title="Tình cảm" movies={tinhCam} href="/the-loai/tinh-cam" />
          )}

          {haiHuoc.length > 0 && (
            <MovieRow title="Hài hước" movies={haiHuoc} href="/the-loai/hai-huoc" />
          )}

          {voThuat.length > 0 && (
            <MovieRow title="Võ thuật" movies={voThuat} href="/the-loai/vo-thuat" />
          )}

          {tamLy.length > 0 && (
            <MovieRow title="Tâm lý" movies={tamLy} href="/the-loai/tam-ly" />
          )}

          {hinhSu.length > 0 && (
            <MovieRow title="Hình sự" movies={hinhSu} href="/the-loai/hinh-su" />
          )}

          <MovieRow title="Cổ trang" movies={coTrang} href="/the-loai/co-trang" />
          <MovieRow title="Viễn tưởng" movies={vienTuong} href="/the-loai/vien-tuong" />
          <MovieRow title="Thần thoại" movies={thanThoai} href="/the-loai/than-thoai" />
          <MovieRow title="Phim bộ" movies={phimBo} href="/danh-sach/phim-bo" />
          <MovieRow title="Phim lẻ" movies={phimLe} href="/danh-sach/phim-le" />
          <MovieRow title="Hoạt hình" movies={hoathinh} href="/danh-sach/hoathinh" />

          <HomeInfiniteFeed />
        </div>
      </div>
    </div>
  );
}
