import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tạm nghỉ | OpusFilm",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 bg-[#050505] text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center mb-6 shadow-lg shadow-red-600/30">
        <span className="text-2xl" aria-hidden>
          🌙
        </span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Đã hết giờ hoạt động</h1>
      <p className="text-zinc-400 text-sm sm:text-base max-w-md leading-relaxed mb-2">
        Website tự động tạm dừng từ <strong className="text-white">23:00</strong> đến{" "}
        <strong className="text-white">07:00</strong> (giờ Việt Nam) mỗi ngày.
      </p>
      <p className="text-zinc-500 text-sm max-w-md mb-8">
        Vui lòng quay lại sau 7:00 sáng. Cảm ơn bạn đã sử dụng OpusFilm.
      </p>
      <p className="text-xs text-zinc-600">
        Lịch tự động · Không cần tắt server
      </p>
    </div>
  );
}
