import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
      <p className="text-xl text-zinc-300 mb-6">Không tìm thấy trang hoặc phim này</p>
      <Link
        href="/"
        className="bg-red-600 hover:bg-red-500 text-white px-6 py-2.5 rounded font-medium transition"
      >
        Về trang chủ
      </Link>
    </div>
  );
}
