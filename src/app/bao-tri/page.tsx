export default function BaoTriPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 text-center bg-[#0a0a0a]">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-500 flex items-center justify-center text-white text-xl font-bold mb-6 shadow-lg shadow-red-900/40">
        OF
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
        Đang bảo trì
      </h1>
      <p className="text-zinc-400 text-sm sm:text-base max-w-md leading-relaxed mb-2">
        Website tạm dừng từ{" "}
        <strong className="text-white">00:00</strong> đến{" "}
        <strong className="text-white">06:00</strong> (giờ Việt Nam).
      </p>
      <p className="text-zinc-500 text-sm max-w-md mb-8">
        Vui lòng quay lại sau 6:00 sáng.
      </p>
      <p className="text-xs text-zinc-600">Lịch tự động · Giờ Asia/Ho_Chi_Minh</p>
    </div>
  );
}
