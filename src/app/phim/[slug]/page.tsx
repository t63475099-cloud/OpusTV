import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getMovieDetail, getMoviesByCategory, getNewestMovies } from "@/lib/api";
import WatchPageClient from "@/components/WatchPageClient";
import { getCuratedMovie } from "@/lib/curatedMovies";
import CuratedWatchClient from "@/components/CuratedWatchClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const curated = getCuratedMovie(slug);
  if (curated) {
    return {
      title: curated.name,
      description: curated.content.slice(0, 160),
    };
  }
  try {
    const data = await getMovieDetail(slug);
    if (!data.status || !data.movie) return { title: "Không tìm thấy" };
    const m = data.movie;
    return {
      title: m.name,
      description: m.content?.replace(/<[^>]+>/g, "").slice(0, 160) || m.origin_name,
    };
  } catch {
    return { title: "Phim" };
  }
}

export default async function PhimPage({ params }: Props) {
  const { slug } = await params;

  const curated = getCuratedMovie(slug);
  if (curated) {
    return <CuratedWatchClient movie={curated} />;
  }

  let data;
  try {
    data = await getMovieDetail(slug);
  } catch {
    notFound();
  }
  if (!data?.status || !data.movie) notFound();

  const catSlug = data.movie.category?.[0]?.slug || "co-trang";
  const [relatedRes, newestRes] = await Promise.all([
    getMoviesByCategory(catSlug, 1).catch(() => null),
    getNewestMovies(1).catch(() => null),
  ]);

  const related = [
    ...(relatedRes?.data?.items || []),
    ...(newestRes?.data?.items || []),
  ]
    .filter((m) => m.slug !== slug)
    .filter((m, i, arr) => arr.findIndex((x) => x.slug === m.slug) === i)
    .slice(0, 24);

  return (
    <WatchPageClient
      movie={data.movie}
      episodes={data.episodes || []}
      related={related}
      categorySlug={catSlug}
    />
  );
}
