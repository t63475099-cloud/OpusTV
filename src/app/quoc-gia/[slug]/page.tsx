import type { Metadata } from "next";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import { getMoviesByCountry } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Quốc gia ${slug.replace(/-/g, " ")}` };
}

export const revalidate = 1800;

export default async function CountryPage({ params }: Props) {
  const { slug } = await params;
  const data = await getMoviesByCountry(slug, 1).catch(() => null);
  const items = data?.data?.items || [];
  const pagination = data?.data?.params?.pagination;
  const title = data?.data?.titlePage || slug.replace(/-/g, " ");

  return (
    <div className="min-h-screen app-content-offset pb-28 px-3 sm:px-4 md:px-8">
      <div className="flex items-center gap-3 py-2 mb-3"><h1 className="text-lg md:text-xl font-bold text-white capitalize">{title}</h1></div>
      {items.length === 0 ? (
        <p className="text-zinc-500">Không có phim nào.</p>
      ) : (
        <InfiniteMovieGrid
          type="country"
          slug={slug}
          initialItems={items}
          initialPage={1}
          totalPages={pagination?.totalPages || 1}
        />
      )}
    </div>
  );
}
