import type { Metadata } from "next";
import Link from "next/link";
import MovieCard from "@/components/MovieCard";
import { searchMovies } from "@/lib/api";

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Tìm kiếm: ${q}` : "Tìm kiếm",
  };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q, page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;
  const keyword = q?.trim() || "";

  let items: any[] = [];
  let pagination: any = null;

  if (keyword) {
    const data = await searchMovies(keyword, page).catch(() => null);
    items = data?.data?.items || [];
    pagination = data?.data?.params?.pagination;
  }

  return (
    <div className="min-h-screen pt-20 pb-16 px-4 md:px-12 max-w-[1600px] mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
        {keyword ? `Kết quả: “${keyword}”` : "Tìm kiếm phim"}
      </h1>
      {keyword && (
        <p className="text-zinc-500 text-sm mb-6">
          {pagination?.totalItems ?? items.length} kết quả
          {pagination?.totalPages ? ` · Trang ${page}/${pagination.totalPages}` : ""}
        </p>
      )}

      {!keyword ? (
        <p className="text-zinc-500">
          Gõ từ khóa vào ô tìm kiếm trên thanh menu — gợi ý hiện ngay khi bạn nhập.
        </p>
      ) : items.length === 0 ? (
        <div className="text-zinc-500 space-y-2">
          <p>Không tìm thấy phim phù hợp với “{keyword}”.</p>
          <p className="text-sm">Thử tên ngắn hơn, tên khác hoặc tên tiếng Trung/phiên âm.</p>
          <Link href="/" className="inline-block mt-3 text-red-400 hover:underline text-sm">
            ← Về trang chủ
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6 md:gap-6">
            {items.map((movie) => (
              <MovieCard key={movie._id || movie.slug} movie={movie} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {page > 1 && (
                <Link
                  href={`/tim-kiem?q=${encodeURIComponent(keyword)}&page=${page - 1}`}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                >
                  ← Trước
                </Link>
              )}
              <span className="px-4 py-2 text-zinc-400 text-sm">
                Trang {page} / {pagination.totalPages}
              </span>
              {page < pagination.totalPages && (
                <Link
                  href={`/tim-kiem?q=${encodeURIComponent(keyword)}&page=${page + 1}`}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm"
                >
                  Sau →
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
