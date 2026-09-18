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
  body: string;
  highlights: string[];
  icon: typeof Film;
  visual: "film" | "chat" | "code" | "music";
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
      "Opus Film gom phim bộ, phim lẻ và nhiều thể loại vào một giao diện xem liền mạch. Mỗi tập ghi nhớ đúng giây bạn dừng lại, phụ đề và chất lượng phát có thể chỉnh theo thiết bị. Chế độ rạp làm tối nền xung quanh khung hình, danh sách phát giúp xếp hàng các bộ đang theo dõi. Từ trang chủ bạn mở banner, hàng phim mới hoặc tìm theo tên; khi thoát giữa chừng, lần sau chỉ cần chạm “Xem tiếp”. Lịch sử và yêu thích gắn tài khoản, đồng bộ khi đăng nhập máy khác.",
    highlights: ["Tiến trình theo giây", "Theater mode", "Yêu thích & lịch sử"],
    icon: Film,
    visual: "film",
    accent: "from-rose-600/40 via-rose-900/20 to-transparent",
    glow: "hover:shadow-[0_0_40px_rgba(244,63,94,0.22)]",
    cta: "Vào Opus Film",
  },
  {
    section: "chat",
    href: "/tin-nhan",
    title: "Opus Chat",
    badge: "SOCIAL · REAL-TIME",
    body:
      "Opus Chat gắn cùng tài khoản Opus: nhắn một–một, nhóm, trạng thái đã gửi / đã xem và gọi thoại hoặc video trong trình duyệt. Kết bạn bằng UID, avatar lấy từ hồ sơ đang đăng nhập. Trong nhóm có thể đổi tên, thêm thành viên, phân quyền và tin hệ thống khi ai vào hoặc rời. Ghim hội thoại, tìm trong đoạn chat và tắt thông báo theo khung giờ giúp hộp thư gọn. Chạy trên web, đủ để liên lạc nhanh trong lúc xem phim hay làm việc trên Code.",
    highlights: ["UID kết bạn", "Gọi & video", "Nhóm & ghim chat"],
    icon: MessageSquare,
    visual: "chat",
    accent: "from-indigo-600/40 via-violet-900/20 to-transparent",
    glow: "hover:shadow-[0_0_40px_rgba(99,102,241,0.22)]",
    cta: "Vào Opus Chat",
  },
  {
    section: "code",
    href: "/code",
    title: "Opus Code",
    badge: "DEV · CLOUD IDE",
    body:
      "Opus Code đưa soạn thảo lên trình duyệt: tạo file, đổi ngôn ngữ, tô màu cú pháp và chạy thử trong workspace. JS/TS/HTML mở live preview; Python và ngôn ngữ khác đổ log ra terminal. Nhiều tab, đánh dấu chưa lưu, thu gọn cây thư mục trên điện thoại. Kho snippet cho phép fork mẫu; phòng cộng tác đồng bộ giữa hai máy. Nút Chạy và Dừng tách terminal với preview. Phù hợp học nhanh hoặc thử ý tưởng không cần cài IDE nặng.",
    highlights: ["Monaco editor", "Live preview", "Pair & snippet"],
    icon: Code2,
    visual: "code",
    accent: "from-cyan-600/40 via-emerald-900/20 to-transparent",
    glow: "hover:shadow-[0_0_40px_rgba(6,182,212,0.22)]",
    cta: "Vào Opus Code",
  },
  {
    section: "music",
    href: "/nhac",
    title: "Opus Music",
    badge: "AUDIO · STREAM",
    body:
      "Opus Music tập trung nghe liền: tìm bài, phát ngay, xếp playlist và giữ mini player khi chuyển sang Film hoặc trang khác. Tiến trình bài hát được nhớ sau khi tải lại; phát nền giữ nhịp khi duyệt. Gợi ý theo ngữ cảnh, danh sách đã nghe tách riêng. Giao diện tối, thanh điều khiển lớn trên điện thoại. Một tài khoản chung với lịch sử xem phim — mở nhạc nhanh trong cùng hệ sinh thái.",
    highlights: ["Mini player", "Playlist", "Nghe nền"],
    icon: Music2,
    visual: "music",
    accent: "from-pink-600/35 via-blue-900/20 to-transparent",
    glow: "hover:shadow-[0_0_40px_rgba(236,72,153,0.22)]",
    cta: "Vào Opus Music",
  },
];

const PASS_BODY =
  "Opus Pass gắn điểm danh, nhiệm vụ nhận xu và mùa thưởng. Xu đổi khung viền, huy hiệu, thẻ xem; Pass XP mở mốc miễn phí và cao cấp theo mùa. Thanh thời gian mùa hiển thị ngày kết thúc rồi sang mùa mới. Xu và tiến trình gắn tài khoản nên đăng nhập máy khác vẫn giữ.";

function VisualBanner({ kind, accent }: { kind: CardDef["visual"]; accent: string }) {
  if (kind === "chat") {
    return (
      <div className={cn("relative h-40 sm:h-44 overflow-hidden bg-[#0c0c14]", `bg-gradient-to-br ${accent}`)}>
        <div className="absolute inset-0 flex items-end justify-center p-4 sm:p-5">
          <div className="w-full max-w-[220px] rounded-2xl border border-white/15 bg-[#12121a]/95 shadow-xl p-3 space-y-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-7 h-7 rounded-full bg-indigo-500/80" />
              <span className="h-2 w-16 rounded bg-white/20" />
            </div>
            <div className="ml-0 max-w-[75%] rounded-2xl rounded-tl-sm bg-white/10 px-2.5 py-1.5">
              <span className="block h-1.5 w-20 rounded bg-white/25 mb-1" />
              <span className="block h-1.5 w-14 rounded bg-white/15" />
            </div>
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-tr-sm bg-indigo-500/50 px-2.5 py-1.5">
              <span className="block h-1.5 w-16 rounded bg-white/40" />
            </div>
            <div className="ml-0 max-w-[65%] rounded-2xl rounded-tl-sm bg-white/10 px-2.5 py-1.5">
              <span className="block h-1.5 w-12 rounded bg-white/25" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "code") {
    return (
      <div className={cn("relative h-40 sm:h-44 overflow-hidden", `bg-gradient-to-br ${accent}`)}>
        <div className="absolute inset-0 p-4 font-mono text-[10px] sm:text-[11px] leading-relaxed text-emerald-300/90">
          <p className="text-zinc-500">// opus-code</p>
          <p>
            <span className="text-violet-400">function</span>{" "}
            <span className="text-cyan-300">run</span>() {"{"}
          </p>
          <p className="pl-3">
            <span className="text-amber-300">return</span>{" "}
            <span className="text-rose-300">&quot;ready&quot;</span>;
          </p>
          <p>{"}"}</p>
          <p className="mt-2 text-zinc-500">$ opus run main.ts</p>
          <p className="text-emerald-400">ok · 12ms</p>
        </div>
      </div>
    );
  }
  if (kind === "music") {
    return (
      <div className={cn("relative h-40 sm:h-44 overflow-hidden flex items-end justify-center gap-1 px-8 pb-6", `bg-gradient-to-br ${accent}`)}>
        {[40, 70, 55, 90, 45, 75, 60, 85, 50, 65].map((h, i) => (
          <span
            key={i}
            className="w-1.5 sm:w-2 rounded-full bg-pink-400/80"
            style={{
              height: `${h}%`,
              animation: `opus-bar 1.2s ease-in-out ${i * 0.08}s infinite alternate`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes opus-bar {
            from {
              transform: scaleY(0.55);
              opacity: 0.6;
            }
            to {
              transform: scaleY(1);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    );
  }
  // film
  return (
    <div className={cn("relative h-40 sm:h-44 overflow-hidden", `bg-gradient-to-br ${accent}`)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[70%] aspect-video rounded-lg border border-white/20 bg-black/50 shadow-2xl flex items-center justify-center">
          <span className="w-12 h-12 rounded-full border-2 border-white/40 flex items-center justify-center">
            <span className="ml-0.5 w-0 h-0 border-y-[7px] border-y-transparent border-l-[12px] border-l-white/80" />
          </span>
        </div>
      </div>
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
    </div>
  );
}

function SectionCard({ item }: { item: CardDef }) {
  const Icon = item.icon;
  return (
    <article
      className={cn(
        "relative flex flex-col h-full rounded-2xl overflow-hidden",
        "border border-white/[0.09] bg-white/[0.03] backdrop-blur-2xl",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
        "transition-all duration-500",
        item.glow
      )}
    >
      <div className="relative">
        <VisualBanner kind={item.visual} accent={item.accent} />
        <div className="absolute bottom-3 left-4 right-4 z-[3] flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-black/50 text-white">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">{item.title}</h3>
            <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-400">{item.badge}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-4 p-5 sm:p-6">
        <p className="text-sm text-zinc-400 leading-relaxed">{item.body}</p>
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
        <div className="mt-auto pt-4">
          <Link
            href={item.href}
            onClick={() => markEnterSection(item.section)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium",
              "border border-white/15 bg-white/[0.06] text-white",
              "hover:bg-white/[0.12] hover:border-white/25 transition-all duration-300"
            )}
          >
            {item.cta}
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function EcosystemGrid() {
  return (
    <div className="mx-auto w-full max-w-6xl px-[clamp(1.5rem,5vw,2.5rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 items-stretch">
        {CARDS.map((c) => (
          <SectionCard key={c.section} item={c} />
        ))}
      </div>

      <article
        className={cn(
          "mt-8 sm:mt-10 relative rounded-2xl overflow-hidden",
          "border border-amber-500/20 bg-white/[0.03] backdrop-blur-2xl",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]"
        )}
      >
        <div className="relative h-32 sm:h-36 bg-gradient-to-r from-amber-700/35 via-yellow-600/15 to-transparent flex items-end p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/15 text-amber-300">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-white">Opus Pass</h3>
              <p className="text-[10px] uppercase tracking-[0.14em] text-amber-400/90">SEASON · REWARDS</p>
            </div>
          </div>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-sm text-zinc-400 leading-relaxed">{PASS_BODY}</p>
          <Link
            href="/su-kien"
            onClick={() => markEnterSection("pass")}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border border-amber-400/25 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20 transition-all duration-300"
          >
            Mở Pass
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </article>
    </div>
  );
}
