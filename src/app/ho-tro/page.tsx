"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, HelpCircle, Mail } from "lucide-react";

type FaqItem = { q: string; a: string };

const GROUPS: { title: string; items: FaqItem[] }[] = [
  {
    title: "Tài khoản",
    items: [
      {
        q: "Làm sao để đăng ký tài khoản?",
        a: "Vào Cài đặt → Tài khoản (hoặc /tai-khoan), chọn Đăng ký. Cần tên đăng nhập, mật khẩu, mã PIN khôi phục và mã kích hoạt (nếu trang đang bật khóa đăng ký). Sau khi tạo xong bạn có thể chỉnh tên hiển thị và ảnh đại diện.",
      },
      {
        q: "Quên mật khẩu thì làm gì?",
        a: "Ở màn đăng nhập, chọn Quên MK / Khôi phục. Nhập tên tài khoản và mã PIN khôi phục (4–8 số) đã đặt lúc đăng ký, rồi tạo mật khẩu mới. Nếu quên cả PIN, hiện chưa có cách tự phục hồi — cần liên hệ quản trị và xác minh đúng chủ tài khoản.",
      },
      {
        q: "UID là gì?",
        a: "UID là dãy 10 chữ số gắn với từng tài khoản, dùng để nhận diện hồ sơ. Bạn có thể sao chép UID trong trang Tài khoản. UID không thay đổi khi đổi tên hiển thị.",
      },
      {
        q: "Tích xanh hoạt động thế nào?",
        a: "Trong Tài khoản, chọn Xác minh và gửi thông tin theo form. Yêu cầu được ghi nhận; quản trị duyệt thủ công. Được duyệt thì huy hiệu hiện trên avatar. Gửi yêu cầu không đồng nghĩa chắc chắn được chấp thuận.",
      },
    ],
  },
  {
    title: "Xem phim & nghe nhạc",
    items: [
      {
        q: "Tại sao một số phim không phát được?",
        a: "Nguồn phim lấy từ API bên thứ ba. Link có thể lỗi, hết hạn hoặc bị chặn theo mạng. Thử đổi server (nếu có), tải lại trang, hoặc xem tựa khác. Trang không lưu bản video trên máy chủ riêng.",
      },
      {
        q: "Tiến độ xem có được lưu không?",
        a: "Có. Khi đang xem, mốc thời gian và tập có thể lưu trên máy; nếu bạn đăng nhập và bấm Đồng bộ, dữ liệu gắn với tài khoản để dùng trên thiết bị khác.",
      },
      {
        q: "Opus Music khác gì phần phim?",
        a: "Opus Music dùng nguồn video nhạc (ví dụ YouTube API khi đã cấu hình khóa). Lịch sử nghe và danh sách đã xem nằm riêng với lịch sử phim.",
      },
    ],
  },
  {
    title: "Thông báo & hòm thư",
    items: [
      {
        q: "Hòm thư chứa những gì?",
        a: "Thông báo về tương tác (trả lời, thích — tùy tính năng đang bật), trạng thái xác minh, và một số thông báo hệ thống. Vào /hop-thu hoặc biểu tượng chuông trên thanh trên.",
      },
      {
        q: "Xóa thông báo có mất trên máy khác không?",
        a: "Hòm thư hiện gắn với trình duyệt / bộ nhớ local của thiết bị. Xóa trên một máy không tự xóa trên máy khác trừ khi sau này hệ thống đồng bộ thông báo lên tài khoản.",
      },
    ],
  },
  {
    title: "Kỹ thuật & lỗi thường gặp",
    items: [
      {
        q: "Trang báo 404?",
        a: "Kiểm tra đúng đường dẫn (ví dụ /hop-thu, /dieu-khoan, /tai-khoan). Thử tải lại mạnh (Ctrl+F5). Nếu lỗi kéo dài sau khi cập nhật site, có thể bản deploy chưa xong — đợi vài phút rồi thử lại.",
      },
      {
        q: "Toàn màn hình trên điện thoại bị lệch?",
        a: "Trình duyệt mobile xử lý fullscreen khác nhau. Dùng nút toàn màn hình trong player; trên iPhone, xoay ngang và ẩn thanh địa chỉ có thể giúp khung phát rộng hơn. Cập nhật trình duyệt lên bản mới nếu có.",
      },
      {
        q: "Đăng nhập được trên máy này nhưng máy khác mất dữ liệu?",
        a: "Cần đăng nhập đúng tài khoản và bấm Đồng bộ trong Tài khoản. Lịch sử chỉ trên máy (chưa đăng nhập) sẽ không tự lên cloud.",
      },
    ],
  },
  {
    title: "Chính sách",
    items: [
      {
        q: "Điều khoản và bảo mật nằm ở đâu?",
        a: "Gộp trong một trang: /dieu-khoan (Cài đặt → Chính sách & Điều khoản). Có mục Điều khoản sử dụng và Chính sách bảo mật.",
      },
      {
        q: "OpusFilm có lưu video trên server không?",
        a: "Không. Phát trực tiếp từ nguồn bên thứ ba. Dữ liệu tài khoản và tương tác (khi đăng nhập) lưu trên cơ sở dữ liệu cấu hình của dự án.",
      },
    ],
  },
];

function Item({ q, a }: FaqItem) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-1 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="flex-1 text-sm font-medium text-white leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 shrink-0 mt-0.5 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="pb-3.5 pr-6 text-sm text-zinc-400 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

export default function HoTroPage() {
  return (
    <div className="min-h-[100dvh] pt-14 pb-24 bg-[#07070c]">
      <div className="mx-auto max-w-lg px-3 sm:px-4">
        <div className="flex items-center gap-3 py-4">
          <Link
            href="/cai-dat"
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300"
            aria-label="Quay lại"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-sky-400" />
              Hỗ trợ & FAQ
            </h1>
            <p className="text-xs text-zinc-500">Câu hỏi thường gặp khi dùng OpusFilm</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 mb-4 text-sm text-zinc-400 leading-relaxed">
          Chọn câu hỏi để xem trả lời. Nếu vẫn kẹt, mở{" "}
          <Link href="/hop-thu" className="text-sky-400 hover:underline">
            Hòm thư
          </Link>{" "}
          hoặc xem{" "}
          <Link href="/dieu-khoan" className="text-sky-400 hover:underline">
            Chính sách & Điều khoản
          </Link>
          .
        </div>

        <div className="space-y-4">
          {GROUPS.map((g) => (
            <section
              key={g.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2"
            >
              <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500 pt-2 pb-1">
                {g.title}
              </h2>
              {g.items.map((item) => (
                <Item key={item.q} {...item} />
              ))}
            </section>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-white/15 px-4 py-5 text-center">
          <Mail className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
          <p className="text-sm text-zinc-400">
            Chưa hết thắc mắc? Gửi phản hồi cho quản trị qua kênh đã công bố trên trang.
          </p>
        </div>
      </div>
    </div>
  );
}
