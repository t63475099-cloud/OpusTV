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
  { slug: "mai", name: "Mai" },
  { slug: "dat-rung-phuong-nam", name: "Đất Rừng Phương Nam" },
  { slug: "nha-ba-nu", name: "Nhà Bà Nữ" },
  { slug: "bo-gia", name: "Bố Già" },
  { slug: "trang-ti", name: "Trạng Tí" },
  { slug: "em-va-trinh", name: "Em và Trịnh" },
  { slug: "hai-phuong", name: "Hai Phượng" },
  { slug: "squid-game", name: "Squid Game" },
  { slug: "queen-of-tears", name: "Queen of Tears" },
  { slug: "the-glory", name: "The Glory" },
  { slug: "crash-landing-on-you", name: "Crash Landing on You" },
  { slug: "avatar", name: "Avatar" },
  { slug: "oppenheimer", name: "Oppenheimer" },
  { slug: "barbie", name: "Barbie" },
  { slug: "dune", name: "Dune" },
  { slug: "john-wick", name: "John Wick" },
  // Bổ sung phim nổi bật / cập nhật
  { slug: "ky-son-truyen-than-ma", name: "Kỳ Sơn Truyện Thần Ma" },
  { slug: "tien-nghich", name: "Tiên Nghịch" },
  { slug: "dau-pha-thuong-khung", name: "Đấu Phá Thương Khung" },
  { slug: "toan-chuc-cao-thu", name: "Toàn Chức Cao Thủ" },
  { slug: "nhat-niem-vinh-hang", name: "Nhất Niệm Vĩnh Hằng" },
  { slug: "kiem-lai", name: "Kiếm Lai" },
  { slug: "nguoi-vo-cuoi-cung", name: "Người Vợ Cuối Cùng" },
  { slug: "mai-cau-hon", name: "Mai Cầu Hôn" },
  { slug: "gap-em-ngay-nang-dep", name: "Gặp Em Ngày Nắng Đẹp" },
  { slug: "chay-di-em-yeu", name: "Chạy Đi Em Yêu" },
  { slug: "mat-biec", name: "Mắt Biếc" },
  { slug: "co-gai-den-tu-hom-qua", name: "Cô Gái Đến Từ Hôm Qua" },
  { slug: "lat-mat-7", name: "Lật Mặt 7" },
  { slug: "mai-cau", name: "Mai" },
  { slug: "the-avengers", name: "The Avengers" },
  { slug: "spider-man-no-way-home", name: "Spider-Man: No Way Home" },
  { slug: "top-gun-maverick", name: "Top Gun: Maverick" },
  { slug: "interstellar", name: "Interstellar" },
  { slug: "inception", name: "Inception" },
  { slug: "joker", name: "Joker" },
  { slug: "parasite", name: "Parasite" },
  { slug: "demon-slayer", name: "Demon Slayer" },
  { slug: "one-piece", name: "One Piece" },
  { slug: "naruto", name: "Naruto" },
  { slug: "attack-on-titan", name: "Attack on Titan" },
  { slug: "jujutsu-kaisen", name: "Jujutsu Kaisen" },
  { slug: "solo-leveling", name: "Solo Leveling" },
  { slug: "when-life-gives-you-tangerines", name: "When Life Gives You Tangerines" },
  { slug: "moving", name: "Moving" },
  { slug: "weak-hero", name: "Weak Hero" },
  { slug: "lovely-runner", name: "Lovely Runner" },
  { slug: "hierarchy", name: "Hierarchy" },
  { slug: "cxg-mot-bo-phim-ve-tinh-ban", name: "CXG" },
];

/** @deprecated dùng FEATURED_PICKS */
export const FEATURED_XIANXIA = FEATURED_PICKS;

/** Menu chính gọn — thể loại nằm trong dropdown Trang chủ */
export const NAV_CATEGORIES = [
  { name: "Trang chủ", href: "/home" },
  { name: "Yêu thích", href: "/yeu-thich" },
  { name: "Lịch sử", href: "/lich-su" },
  { name: "Opus Music", href: "/nhac" },
  { name: "Cài đặt", href: "/cai-dat" },
];

/** Thể loại / quốc gia — chỉ hiện khi mở mũi tên dưới Trang chủ */
export const GENRE_LINKS = [
  { name: "Mới cập nhật", href: "/danh-sach/phim-moi-cap-nhat" },
  { name: "Phim Việt", href: "/quoc-gia/viet-nam" },
  { name: "Phim bộ", href: "/danh-sach/phim-bo" },
  { name: "Phim lẻ", href: "/danh-sach/phim-le" },
  { name: "Phim Hàn", href: "/quoc-gia/han-quoc" },
  { name: "Trung Quốc", href: "/quoc-gia/trung-quoc" },
  { name: "Âu Mỹ", href: "/quoc-gia/au-my" },
  { name: "Thái Lan", href: "/quoc-gia/thai-lan" },
  { name: "Nhật Bản", href: "/quoc-gia/nhat-ban" },
  { name: "Hành động", href: "/the-loai/hanh-dong" },
  { name: "Tình cảm", href: "/the-loai/tinh-cam" },
  { name: "Kinh dị", href: "/the-loai/kinh-di" },
  { name: "Hài", href: "/the-loai/hai-huoc" },
  { name: "Cổ trang", href: "/the-loai/co-trang" },
  { name: "Hoạt hình", href: "/danh-sach/hoathinh" },
];

export const API_BASE = "https://phimapi.com";
export const CDN_IMAGE = "https://phimimg.com";
