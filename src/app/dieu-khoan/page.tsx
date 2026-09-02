import Link from "next/link";

export const metadata = { title: "Điều khoản sử dụng · OpusFilm" };

export default function Page() {
  return (
    <div className="min-h-[100dvh] pt-16 pb-24 px-4">
      <article className="mx-auto max-w-2xl">
        <Link href="/cai-dat" className="text-sky-400 text-sm">← Cài đặt</Link>
        <h1 className="text-2xl font-bold text-white mt-4">Điều khoản sử dụng</h1>
        <p className="text-zinc-500 text-xs mt-1">Áp dụng cho dịch vụ OpusFilm</p>
        <div className="mt-6 space-y-4 text-sm text-zinc-300 leading-relaxed">
          <p>
            Khi sử dụng OpusFilm, bạn đồng ý tuân thủ các quy định về tài khoản, nội dung
            và quyền riêng tư được nêu tại đây.
          </p>
          <h2 className="text-base font-semibold text-white pt-2">1. Tài khoản</h2>
          <p>
            Bạn chịu trách nhiệm bảo mật mật khẩu và mã PIN khôi phục. Không chia sẻ tài khoản
            cho người khác. Tên hiển thị và nội dung bình luận phải phù hợp, không xúc phạm
            hoặc vi phạm pháp luật.
          </p>
          <h2 className="text-base font-semibold text-white pt-2">2. Nội dung</h2>
          <p>
            Phim và nhạc được lấy từ nguồn công khai qua API bên thứ ba. OpusFilm không lưu
            bản sao video trên máy chủ. Chất lượng và tình trạng link phát phụ thuộc nhà cung cấp.
          </p>
          <h2 className="text-base font-semibold text-white pt-2">3. Dữ liệu cá nhân</h2>
          <p>
            Chúng tôi lưu thông tin cần thiết để vận hành: tài khoản, lịch sử xem, yêu thích,
            cài đặt và tương tác khi bạn đăng nhập. Dữ liệu đồng bộ qua kết nối mã hóa.
          </p>
          <h2 className="text-base font-semibold text-white pt-2">4. Xác minh</h2>
          <p>
            Tích xanh được cấp sau khi xét duyệt yêu cầu. Việc cấp hoặc thu hồi do quản trị quyết định.
          </p>
          <h2 className="text-base font-semibold text-white pt-2">5. Thay đổi</h2>
          <p>
            Điều khoản có thể được cập nhật trên trang này. Tiếp tục sử dụng đồng nghĩa chấp nhận bản mới.
          </p>
        </div>
      </article>
    </div>
  );
}
