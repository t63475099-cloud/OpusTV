import Link from "next/link";

export const metadata = {
  title: "Chính sách & Điều khoản · OpusFilm",
  description: "Điều khoản sử dụng và chính sách bảo mật của OpusFilm",
};

export default function LegalPage() {
  return (
    <div className="min-h-[100dvh] pt-16 pb-28 px-4">
      <article className="mx-auto max-w-2xl">
        <Link href="/cai-dat" className="text-sky-400 text-sm hover:underline">
          ← Cài đặt
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mt-4 tracking-tight">
          Chính sách & Điều khoản
        </h1>
        <p className="text-zinc-500 text-xs mt-2">
          Cập nhật lần cuối: 02/09/2026 · Áp dụng cho toàn bộ dịch vụ OpusFilm trên web
        </p>

        <nav className="mt-6 flex flex-wrap gap-2 text-xs">
          <a href="#dieu-khoan" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white">
            Điều khoản sử dụng
          </a>
          <a href="#bao-mat" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white">
            Chính sách bảo mật
          </a>
          <a href="#quyen" className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 hover:text-white">
            Quyền của bạn
          </a>
        </nav>

        <div className="mt-8 space-y-5 text-sm text-zinc-300 leading-relaxed">
          <p>
            Tài liệu này giải thích cách bạn được phép sử dụng OpusFilm, những việc chúng tôi
            làm với dữ liệu của bạn, và trách nhiệm hai bên khi bạn tạo tài khoản hoặc xem nội dung
            trên trang. Việc tiếp tục truy cập và sử dụng dịch vụ đồng nghĩa bạn đã đọc và chấp nhận
            các nội dung dưới đây.
          </p>

          <h2 id="dieu-khoan" className="text-lg font-semibold text-white pt-4 scroll-mt-20">
            A. Điều khoản sử dụng
          </h2>

          <h3 className="text-base font-medium text-white pt-2">1. Đối tượng và phạm vi</h3>
          <p>
            OpusFilm là nền tảng web cho phép xem phim, nghe nhạc và tương tác cộng đồng (bình luận,
            thích, hồ sơ cá nhân) theo khả năng hiện có của hệ thống. Dịch vụ dành cho người dùng
            cá nhân. Nếu bạn chưa đủ tuổi theo quy định pháp luật tại nơi bạn cư trú, hãy sử dụng
            dưới sự đồng ý và giám sát của người giám hộ.
          </p>

          <h3 className="text-base font-medium text-white pt-2">2. Tài khoản</h3>
          <p>
            Khi đăng ký, bạn cần cung cấp thông tin trung thực trong phạm vi yêu cầu (tên đăng nhập,
            mật khẩu, mã PIN khôi phục, và các thông tin khác nếu có). Bạn chịu trách nhiệm giữ bí mật
            mật khẩu và PIN; mọi hoạt động diễn ra trên tài khoản được coi là do bạn thực hiện cho đến
            khi bạn thông báo khóa hoặc thu hồi phiên đăng nhập.
          </p>
          <p>
            Không được tạo hàng loạt tài khoản để spam, quấy rối, hoặc lợi dụng hệ thống điểm thưởng /
            xác minh. Chúng tôi có quyền tạm khóa hoặc xóa tài khoản khi phát hiện hành vi vi phạm
            nghiêm trọng mà không cần báo trước trong trường hợp khẩn cấp.
          </p>

          <h3 className="text-base font-medium text-white pt-2">3. Nội dung trên trang</h3>
          <p>
            Phim, trailer và nhạc hiển thị trên OpusFilm được lấy từ nguồn công khai thông qua API
            của bên thứ ba. OpusFilm không lưu trữ bản sao video trên máy chủ của mình và không khẳng định
            sở hữu bản quyền đối với các tác phẩm đó. Chất lượng phát, phụ đề, số tập và tình trạng link
            phụ thuộc nhà cung cấp nguồn; trang có thể không phát được một số tựa tại một số thời điểm.
          </p>
          <p>
            Bạn không được dùng OpusFilm để tải xuống trái phép, phát lại công cộng có thu phí, hoặc
            phân phối lại nội dung khi chưa có quyền hợp pháp. Nếu bạn là chủ sở hữu bản quyền và muốn
            yêu cầu gỡ liên kết hiển thị, hãy liên hệ quản trị kèm bằng chứng quyền sở hữu.
          </p>

          <h3 className="text-base font-medium text-white pt-2">4. Hành vi người dùng</h3>
          <p>
            Bình luận, biệt danh, ảnh đại diện và các nội dung do bạn đăng phải phù hợp. Cấm nội dung
            xúc phạm, kích động thù hận, quấy rối, tiết lộ thông tin cá nhân của người khác, hoặc vi phạm
            pháp luật Việt Nam và quy định nơi bạn đang ở. Chúng tôi có thể ẩn hoặc xóa nội dung vi phạm
            và hạn chế tính năng của tài khoản liên quan.
          </p>

          <h3 className="text-base font-medium text-white pt-2">5. Xác minh tài khoản (tích xanh)</h3>
          <p>
            Tích xanh là dấu hiệu tài khoản đã qua xét duyệt theo quy trình nội bộ. Việc gửi yêu cầu
            không đảm bảo được chấp thuận. Quản trị có quyền từ chối hoặc thu hồi tích xanh nếu thông tin
            không còn phù hợp hoặc có dấu hiệu lạm dụng.
          </p>

          <h3 className="text-base font-medium text-white pt-2">6. Giới hạn trách nhiệm</h3>
          <p>
            OpusFilm được cung cấp “như hiện có”. Chúng tôi không cam kết dịch vụ không gián đoạn, không
            lỗi, hoặc luôn đầy đủ mọi tựa phim. Trong phạm vi pháp luật cho phép, chúng tôi không chịu
            trách nhiệm đối với thiệt hại gián tiếp phát sinh từ việc bạn dựa vào nội dung hoặc không
            xem được một số nguồn phát.
          </p>

          <h3 className="text-base font-medium text-white pt-2">7. Thay đổi điều khoản</h3>
          <p>
            Nội dung tài liệu này có thể được cập nhật. Ngày cập nhật sẽ ghi ở đầu trang. Nếu thay đổi
            quan trọng, chúng tôi cố gắng thể hiện rõ trên giao diện; việc bạn tiếp tục dùng dịch vụ sau
            khi cập nhật được hiểu là chấp nhận bản mới.
          </p>

          <h2 id="bao-mat" className="text-lg font-semibold text-white pt-6 scroll-mt-20">
            B. Chính sách bảo mật
          </h2>

          <h3 className="text-base font-medium text-white pt-2">1. Dữ liệu chúng tôi thu thập</h3>
          <p>Tùy mức độ bạn sử dụng, hệ thống có thể xử lý:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-zinc-400">
            <li>Thông tin tài khoản: tên đăng nhập, mật khẩu đã băm, mã PIN khôi phục đã băm, UID.</li>
            <li>Hồ sơ: tên hiển thị, giới thiệu, ảnh đại diện, khung viền, trạng thái xác minh.</li>
            <li>Hoạt động: lịch sử xem, yêu thích, tiến độ tập, lịch sử nghe nhạc (khi đăng nhập và đồng bộ).</li>
            <li>Tương tác: bình luận, lượt thích, yêu cầu xác minh.</li>
            <li>Kỹ thuật cơ bản: nhật ký lỗi máy chủ, cookie phiên đăng nhập cần thiết để duy trì trạng thái đăng nhập.</li>
          </ul>

          <h3 className="text-base font-medium text-white pt-2">2. Mục đích sử dụng</h3>
          <p>
            Dữ liệu dùng để vận hành tài khoản, đồng bộ giữa các thiết bị khi bạn đăng nhập, hiển thị
            nội dung cá nhân hóa (tiếp tục xem, gợi ý cơ bản), bảo mật (phát hiện đăng nhập bất thường
            trong phạm vi kỹ thuật hiện có), và cải thiện ổn định dịch vụ. Chúng tôi không bán danh sách
            người dùng cho bên thứ ba vì mục đích quảng cáo.
          </p>

          <h3 className="text-base font-medium text-white pt-2">3. Lưu trữ và bảo vệ</h3>
          <p>
            Mật khẩu và PIN được lưu dưới dạng băm, không lưu plaintext. Kết nối tới cơ sở dữ liệu dùng
            kênh mã hóa khi cấu hình đúng trên môi trường triển khai. Dù vậy, không hệ thống nào tuyệt đối
            an toàn; bạn nên dùng mật khẩu riêng và không chia sẻ tài khoản.
          </p>

          <h3 className="text-base font-medium text-white pt-2">4. Cookie và lưu trữ trên máy</h3>
          <p>
            Cookie phiên giúp duy trì đăng nhập. Trên trình duyệt còn có thể lưu tạm lịch sử xem, cài đặt
            phát lại, thông báo — phục vụ trải nghiệm khi chưa đăng nhập hoặc khi đồng bộ chưa kịp.
            Bạn có thể xóa dữ liệu trình duyệt bất cứ lúc nào; khi đó một số tùy chọn cá nhân sẽ mất cho
            đến khi đăng nhập và đồng bộ lại.
          </p>

          <h3 className="text-base font-medium text-white pt-2">5. Chia sẻ dữ liệu</h3>
          <p>
            Chúng tôi có thể chia sẻ dữ liệu khi pháp luật yêu cầu, hoặc với nhà cung cấp hạ tầng
            (máy chủ, cơ sở dữ liệu) chỉ trong phạm vi cần thiết để chạy dịch vụ. Các API phim/nhạc bên
            thứ ba nhận yêu cầu kỹ thuật (ví dụ tìm kiếm, lấy danh sách) nhưng không nhận mật khẩu tài khoản
            OpusFilm của bạn.
          </p>

          <h2 id="quyen" className="text-lg font-semibold text-white pt-6 scroll-mt-20">
            C. Quyền của bạn
          </h2>
          <p>
            Bạn có thể chỉnh sửa tên hiển thị, ảnh, giới thiệu và cài đặt trong mục Tài khoản / Cài đặt.
            Bạn có thể đăng xuất trên thiết bị đang dùng. Nếu muốn xóa tài khoản và dữ liệu liên quan trên
            máy chủ, hãy liên hệ quản trị qua kênh hỗ trợ chính thức của trang và xác minh đúng chủ tài khoản.
            Thời gian xử lý phụ thuộc khối lượng yêu cầu và kiểm tra an toàn.
          </p>

          <h3 className="text-base font-medium text-white pt-2">Liên hệ</h3>
          <p>
            Mọi thắc mắc về điều khoản, bảo mật hoặc yêu cầu liên quan tài khoản, vui lòng dùng mục hỗ trợ
            / liên hệ trên trang (nếu có) hoặc kênh mà quản trị viên công bố. Tài liệu này không thay thế
            tư vấn pháp lý chuyên sâu cho từng trường hợp cụ thể.
          </p>

          <p className="text-xs text-zinc-500 pt-4 border-t border-white/10">
            OpusFilm · Chính sách & Điều khoản · Bản áp dụng trên opus-tv.vercel.app và các tên miền chính thức khác (nếu có).
          </p>
        </div>
      </article>
    </div>
  );
}
