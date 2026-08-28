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
import { FEATURED_XIANXIA } from "@/lib/constants";
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
    phimHan,
    phimBo,
    phimLe,
    hoathinh,
    featured,
  ] = await Promise.all([
    loadNewest(3),
    loadCategory("co-trang", 2),
    loadCategory("vien-tuong", 2),
    loadCategory("than-thoai", 2),
    loadCategory("kinh-di", 2),
    loadCategory("hanh-dong", 2),
    loadCategory("tinh-cam", 2),
    loadCountry("han-quoc", 3),
    loadList("phim-bo", 2),
    loadList("phim-le", 2),
    loadList("hoathinh", 2),
    getFeaturedMovies(FEATURED_XIANXIA.map((f) => f.slug)).catch(() => []),
  ]);

  const bannerMovies = mergeMovies(
    featured.slice(0, 4),
    phimHan.slice(0, 3),
    newest.slice(0, 5),
    kinhDi.slice(0, 2)
  ).slice(0, 12);

  return (
    <div className="min-h-screen pb-16 pt-14">
      <BannerSlider movies={bannerMovies} />
      <div className="relative z-10 pt-2 space-y-1">
        <ContinueWatching />
        {featured.length > 0 && (
          <MovieRow
            title="Siêu phẩm đề xuất"
            movies={featured}
            href="/the-loai/co-trang"
          />
        )}
        <MovieRow
          title="Phim mới cập nhật"
          movies={newest}
          href="/danh-sach/phim-moi-cap-nhat"
        />
        {phimHan.length > 0 && (
          <MovieRow
            title="Phim Hàn Quốc"
            movies={phimHan}
            href="/quoc-gia/han-quoc"
          />
        )}
        {kinhDi.length > 0 && (
          <MovieRow title="Phim kinh dị" movies={kinhDi} href="/the-loai/kinh-di" />
        )}
        <MovieRow
          title="Cổ trang · Tiên hiệp"
          movies={coTrang}
          href="/the-loai/co-trang"
        />
        {hanhDong.length > 0 && (
          <MovieRow
            title="Hành động"
            movies={hanhDong}
            href="/the-loai/hanh-dong"
          />
        )}
        {tinhCam.length > 0 && (
          <MovieRow title="Tình cảm" movies={tinhCam} href="/the-loai/tinh-cam" />
        )}
        <MovieRow
          title="Viễn tưởng"
          movies={vienTuong}
          href="/the-loai/vien-tuong"
        />
        <MovieRow
          title="Thần thoại"
          movies={thanThoai}
          href="/the-loai/than-thoai"
        />
        <MovieRow title="Phim bộ" movies={phimBo} href="/danh-sach/phim-bo" />
        <MovieRow title="Phim lẻ" movies={phimLe} href="/danh-sach/phim-le" />
        <MovieRow
          title="Hoạt hình"
          movies={hoathinh}
          href="/danh-sach/hoathinh"
        />
        <HomeInfiniteFeed />
      </div>
    </div>
  );
}
