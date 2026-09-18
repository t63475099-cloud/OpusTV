"use client";

import Link from "next/link";
import {
  Film,
  MessageSquare,
  Code2,
  Music2,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markEnterSection, type OpusSection } from "@/lib/routeManager";

type CardDef = {
  section: Exclude<OpusSection, "portal">;
  href: string;
  title: string;
  badge: string;
  /** ~600 ký tự giới thiệu */
  body: string;
  highlights: string[];
  icon: typeof Film;
  /** gradient + image */
  image: string;
  imageAlt: string;
  accent: string;
  glow: string;
  cta: string;
};

const CARDS: CardDef[] = [
  {
    section: "film",
    href: "/home",
    title: "Opus Film",
    badge: "CINEMA · 4K",
    body:
      "Opus Film gom phim bộ, phim lẻ và nhiều thể loại vào một giao diện xem liền mạch. Mỗi tập ghi nhớ đúng giây bạn dừng lại, phụ đề và chất lượng phát có thể chỉnh theo thiết bị. Chế độ rạp làm tối nền xung quanh khung hình, danh sách phát giúp xếp hàng các bộ đang theo dõi. Từ trang chủ bạn mở banner, hàng phim mới hoặc tìm theo tên; khi thoát giữa chừng, lần sau chỉ cần chạm “Xem tiếp”. Toàn bộ lịch sử và yêu thích gắn với tài khoản, đồng bộ khi đăng nhập trên máy khác. Mục tiêu đơn giản: mở ra là xem được, không phải dò đường giữa nhiều app rời.",
    highlights: ["Tiến trình theo giây", "Theater mode", "Yêu thích & lịch sử"],
    icon: Film,
    image:
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
    imageAlt: "Rạp chiếu và màn hình phim",
    accent: "from-rose-600/35 via-transparent to-amber-500/20",
    glow: "hover:shadow-[0_0_40px_rgba(244,63,94,0.22)]",
    cta: "Vào Opus Film",
  },
  {
    section: "chat",
    href: "/tin-nhan",
    title: "Opus Chat",
    badge: "SOCIAL · REAL-TIME",
    body:
      "Opus Chat là lớp trò chuyện gắn trực tiếp với cùng tài khoản Opus: nhắn tin một–một, nhóm, trạng thái đã gửi / đã xem và cuộc gọi thoại hoặc video trong trình duyệt. Bạn bè được thêm bằng UID, avatar và tên lấy từ hồ sơ đang đăng nhập. Trong nhóm có thể đổi tên, thêm thành viên, phân quyền quản trị và xem tin hệ thống khi ai đó vào hoặc rời. Ghim hội thoại, tìm trong đoạn chat và tắt thông báo theo khung giờ giúp giữ hộp thư gọn. Mọi thứ chạy trên web, không cần cài app riêng, nhưng vẫn giữ cảm giác ứng dụng nhắn tin hằng ngày — đủ để liên lạc nhanh trong lúc xem phim hay làm việc trên Code.",
    highlights: ["UID kết bạn", "Gọi & video", "Nhóm & ghim chat"],
    icon: MessageSquare,
    image:
      "https://images.unsplash.com/photo-1611162617474-5b21e64e5757?w=800&q=80",
    imageAlt: "Giao diện tin nhắn trên điện thoại",
    accent: "from-indigo-600/35 via-transparent to-violet-500/20",
    glow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.22)]",
    cta: "Vào Opus Chat",
  },
  {
    section: "code",
    href: "/code",
    title: "Opus Code",
    badge: "DEV · CLOUD IDE",
    body:
      "Opus Code đưa môi trường soạn thảo lên trình duyệt: tạo file, đổi ngôn ngữ, tô màu cú pháp và chạy thử ngay trong workspace. JavaScript, TypeScript và HTML mở live preview; Python và các ngôn ngữ khác đổ log ra terminal. Có thể mở nhiều tab, đánh dấu file chưa lưu và thu gọn cây thư mục trên điện thoại để còn chỗ gõ. Kho snippet cho phép fork mẫu sẵn, phòng cộng tác đồng bộ nội dung giữa hai máy khi chia sẻ mã phòng. Nút Chạy và Dừng tách bạch terminal với preview để tránh đè lên nhau. Phù hợp học nhanh, thử ý tưởng hoặc chỉnh đoạn nhỏ mà không cần cài IDE nặng trên máy.",
    highlights: ["Monaco editor", "Live preview", "Pair & snippet"],
    icon: Code2,
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80",
    imageAlt: "Màn hình code trên laptop",
    accent: "from-cyan-600/35 via-transparent to-emerald-500/20",
    glow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.22)]",
    cta: "Vào Opus Code",
  },
  {
    section: "music",
    href: "/nhac",
    title: "Opus Music",
    badge: "AUDIO · STREAM",
    body:
      "Opus Music tập trung vào nghe liền: tìm bài, phát ngay, xếp playlist và giữ mini player khi bạn chuyển sang Film hoặc trang khác. Tiến trình bài hát được nhớ sau khi tải lại trang; phát nền giúp không mất nhịp khi duyệt. Gợi ý ưu tiên ngữ cảnh nghe quen, danh sách đã nghe tách riêng để dễ chọn lại. Giao diện tối, thanh điều khiển lớn trên điện thoại, cuộn danh sách mượt. Không thay thế toàn bộ thư viện cá nhân offline, nhưng đủ để mở nhạc nhanh trong cùng hệ sinh thái — một tài khoản, một chỗ lưu sở thích nghe cùng lịch sử xem phim.",
    highlights: ["Mini player", "Playlist", "Nghe nền"],
    icon: Music2,
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80",
    imageAlt: "Thiết bị và không gian nghe nhạc",
    accent: "from-pink-600/30 via-transparent to-blue-500/20",
    glow: "hover:shadow-[0_0_40px_rgba(236,72,153,0.22)]",
    cta: "Vào Opus Music",
  },
];

const PASS_BODY =
  "Opus Pass gắn chuỗi điểm danh, nhiệm vụ nhận xu và mùa thưởng vào một lịch rõ ràng. Xu đổi khung viền, huy hiệu, thẻ xem hoặc vật phẩm sự kiện; Pass XP mở mốc miễn phí và cao cấp theo mùa. Thanh thời gian mùa hiển thị ngày kết thúc, sau đó sang mùa mới với chuỗi thưởng khác. Xu và tiến trình gắn tài khoản nên đăng nhập máy khác vẫn giữ. Không phải cửa hàng ồn ào: chỉ một vòng nhiệm vụ – đổi thưởng – trang bị, đủ để quay lại mỗi ngày trong lúc xem phim hay nghe nhạc.";

function SectionCard({ item }: { item: CardDef }) {
  const Icon = item.icon;
  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl overflow-hidden",
        "border border-white/[0.09] bg-white/[0.03] backdrop-blur-2xl",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
        "transition-all duration-500",
        item.glow
      )}
    >
      {/* Image banner */}
      <div className="relative h-40 sm:h-48 w-full overflow-hidden">
        <div className={cn("absolute inset-0 bg-gradient-to-br z-[1]", item.accent)} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.image}
          alt={item.imageAlt}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#0a0a10] via-[#0a0a10]/40 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 z-[3] flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/40 text-white">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">
              {item.badge}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-5 sm:p-6 flex-1">
        <p className="text-sm text-zinc-400 leading-relaxed text-left">
          {item.body}
        </p>
        <ul className="flex flex-wrap gap-1.5">
          {item.highlights.map((h) => (
            <li
              key={h}
              className="text-[11px] px-2.5 py-1 rounded-full border border-white/10 bg-black/30 text-zinc-300"
            >
              {h}
            </li>
          ))}
        </ul>
        <Link
          href={item.href}
          onClick={() => markEnterSection(item.section)}
          className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors duration-300"
        >
          {item.cta}
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export default function EcosystemGrid() {
  return (
    <div className="mx-auto w-full max-w-6xl px-[clamp(1.25rem,4vw,2rem)]">
      {/* Vertical stack on mobile, 2-col on desktop — generous gaps */}
      <div className="flex flex-col gap-8 sm:gap-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10">
          {CARDS.map((c) => (
            <SectionCard key={c.section} item={c} />
          ))}
        </div>

        {/* Pass banner — full width, padded */}
        <article
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "border border-amber-500/20 bg-white/[0.03] backdrop-blur-2xl",
            "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
          )}
        >
          <div className="relative h-36 sm:h-44 w-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-700/40 via-yellow-600/20 to-transparent z-[1]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80"
              alt="Sân khấu sự kiện ánh sáng vàng"
              className="absolute inset-0 h-full w-full object-cover opacity-45"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 z-[2] bg-gradient-to-t from-[#0a0a10] to-transparent" />
            <div className="absolute bottom-3 left-5 z-[3] flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-300">
                <Crown className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-white">Opus Pass</h3>
                <p className="text-[10px] uppercase tracking-[0.14em] text-amber-400/90">
                  SEASON · REWARDS
                </p>
              </div>
            </div>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <p className="text-sm text-zinc-400 leading-relaxed">{PASS_BODY}</p>
            <Link
              href="/su-kien"
              onClick={() => markEnterSection("pass")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-200 hover:text-white transition-colors duration-300"
            >
              Mở Pass
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
