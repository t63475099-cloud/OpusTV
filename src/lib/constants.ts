export const APP_NAME = "OpusFilm";
export const APP_TAGLINE = "Phim bạn muốn xem";

/** Một vài tựa hay xem — không giới hạn thể loại */
export const FEATURED_PICKS = [
  { slug: "tam-sinh-tam-the-thap-ly-dao-hoa", name: "Tam Sinh Tam Thế Thập Lý Đào Hoa" },
  { slug: "tran-tinh-lenh", name: "Trần Tình Lệnh" },
  { slug: "huong-mat-tua-khoi-suong", name: "Hương Mật Tựa Khói Sương" },
  { slug: "hoa-thien-cot", name: "Hoa Thiên Cốt" },
  { slug: "du-phuong-hanh", name: "Dữ Phượng Hành" },
  { slug: "vinh-da-tinh-ha", name: "Vĩnh Dạ Tinh Hà" },
  { slug: "thuong-lan-quyet", name: "Thương Lan Quyết" },
  { slug: "truong-nguyet-tan-minh", name: "Trường Nguyệt Tẫn Minh" },
  { slug: "truong-tuong-tu", name: "Trường Tương Tư" },
  { slug: "pham-nhan-tu-tien", name: "Phàm Nhân Tu Tiên" },
  { slug: "gia-thien", name: "Già Thiên" },
  { slug: "ninh-an-nhu-mong", name: "Ninh An Như Mộng" },
];

/** @deprecated dùng FEATURED_PICKS */
export const FEATURED_XIANXIA = FEATURED_PICKS;

export const NAV_CATEGORIES = [
  { name: "Trang chủ", href: "/" },
  { name: "Mới cập nhật", href: "/danh-sach/phim-moi-cap-nhat" },
  { name: "Phim bộ", href: "/danh-sach/phim-bo" },
  { name: "Phim lẻ", href: "/danh-sach/phim-le" },
  { name: "Phim Hàn", href: "/quoc-gia/han-quoc" },
  { name: "Hành động", href: "/the-loai/hanh-dong" },
  { name: "Tình cảm", href: "/the-loai/tinh-cam" },
  { name: "Kinh dị", href: "/the-loai/kinh-di" },
  { name: "Cổ trang", href: "/the-loai/co-trang" },
  { name: "Hoạt hình", href: "/danh-sach/hoathinh" },
  { name: "Lịch sử", href: "/lich-su" },
  { name: "Opus Music", href: "/nhac" },
  { name: "Cài đặt", href: "/cai-dat" },
];

export const API_BASE = "https://phimapi.com";
export const CDN_IMAGE = "https://phimimg.com";
