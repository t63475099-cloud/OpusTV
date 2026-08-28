import type { Metadata } from "next";
import InfiniteMovieGrid from "@/components/InfiniteMovieGrid";
import { getMoviesByCategory } from "@/lib/api";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Thể loại ${slug.replace(/-/g, " ")}` };
}

export const revalidate = 1800;

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const data = await getMoviesByCategory(slug, 1).catch(() => null);
  const items = data?.data?.items || [];
  const pagination = data?.data?.params?.pagination;
  const title = data?.data?.titlePage || slug.replace(/-/g, " ");

  return (
    <div className="min-h-screen pt-[6.75rem] lg:pt-20 pb-16 px-3 sm:px-4 md:px-8">
      <h1 className="text-xl md:text-2xl font-bold text-white mb-5 capitalize">{title}</h1>
      {items.length === 0 ? (
        <p className="text-zinc-500">Không có phim nào.</p>
      ) : (
        <InfiniteMovieGrid
          type="category"
          slug={slug}
          initialItems={items}
          initialPage={1}
          totalPages={pagination?.totalPages || 1}
        />
      )}
    </div>
  );
}
