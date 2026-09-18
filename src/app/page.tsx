"use client";

import Link from "next/link";
import BackgroundMesh from "@/components/ecosystem/BackgroundMesh";
import KineticMarquee from "@/components/ecosystem/KineticMarquee";
import EcosystemGrid from "@/components/ecosystem/EcosystemGrid";
import PortalNav from "@/components/ecosystem/PortalNav";
import { markEnterSection } from "@/lib/routeManager";

export default function EcosystemHubPage() {
  return (
    <div className="relative min-h-[100dvh] text-zinc-100 overflow-x-hidden">
      <BackgroundMesh />
      <PortalNav />

      <main className="relative z-0">
        <section
          className="mx-auto max-w-3xl text-center"
          style={{
            paddingTop: "calc(5.75rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "clamp(1.5rem, 3vw, 2.25rem)",
            paddingLeft: "clamp(1.25rem, 4vw, 2rem)",
            paddingRight: "clamp(1.25rem, 4vw, 2rem)",
          }}
        >
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-4">
            OPUSTV · UNIFIED ENTERTAINMENT ECOSYSTEM
          </p>

          <h1 className="text-[1.55rem] sm:text-4xl md:text-[2.75rem] font-bold tracking-tight leading-[1.25] text-white">
            Một Hệ Sinh Thái — Không Giới Hạn Không Gian Giải Trí
          </h1>

          <p className="mt-5 text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
            Khám phá cổng kết nối tập trung đưa toàn bộ nhu cầu số của bạn về một tọa độ
            duy nhất. Trải nghiệm điện ảnh, âm nhạc, lập trình trên trình duyệt và trò chuyện
            với cùng một tài khoản định danh — mở đúng phần cần dùng, quay lại cổng khi muốn
            đổi hướng.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/home"
              onClick={() => markEnterSection("film")}
              className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 border border-white/15 shadow-lg shadow-violet-900/30 transition-all duration-500 hover:brightness-110"
            >
              Khám Phá Hệ Sinh Thái →
            </Link>
            <Link
              href="/tai-khoan?next=/home"
              className="inline-flex items-center justify-center rounded-full px-7 py-3 text-sm font-medium text-zinc-100 border border-white/15 bg-white/[0.04] backdrop-blur-xl transition-all duration-500 hover:bg-white/[0.08]"
            >
              Đăng Nhập Hợp Nhất
            </Link>
          </div>
        </section>

        <KineticMarquee className="mb-8 sm:mb-12" />

        {/* Extra intro strip */}
        <section
          className="mx-auto max-w-3xl mb-10 sm:mb-14"
          style={{
            paddingLeft: "clamp(1.25rem, 4vw, 2rem)",
            paddingRight: "clamp(1.25rem, 4vw, 2rem)",
          }}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-3">
            Vì sao gom năm mảng vào một chỗ
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-3">
            Nhiều người phải mở riêng app xem phim, app nghe nhạc, IDE trên máy và một app
            chat khác — mỗi nơi một tài khoản, một lịch sử. OpusTV giữ một phiên đăng nhập
            và chia rõ Film, Music, Code, Chat, Pass. Bạn không bị ép dùng hết mọi thứ cùng
            lúc; chỉ cần vào đúng không gian đang cần. Nút quay lại trong từng mảng đưa về
            trang chủ của mảng đó, không kéo bạn ra cổng giới thiệu giữa chừng.
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Phía dưới là mô tả chi tiết từng phân hệ. Đọc xong, chọn thẻ để vào thẳng trang
            chủ tương ứng.
          </p>
        </section>

        <section
          className="pb-[clamp(3rem,8vw,5rem)]"
          aria-label="Các phân hệ Opus"
        >
          <div
            className="mx-auto max-w-6xl mb-6 sm:mb-8"
            style={{
              paddingLeft: "clamp(1.25rem, 4vw, 2rem)",
              paddingRight: "clamp(1.25rem, 4vw, 2rem)",
            }}
          >
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Chọn không gian
            </h2>
            <p className="text-sm text-zinc-500 mt-1.5">
              Nội dung trải dọc, có hình minh họa — không sát viền màn hình.
            </p>
          </div>
          <EcosystemGrid />
        </section>
      </main>

      <footer
        className="relative z-0 border-t border-white/[0.07] py-8 text-center text-xs text-zinc-500"
        style={{
          paddingLeft: "clamp(1.25rem, 4vw, 2rem)",
          paddingRight: "clamp(1.25rem, 4vw, 2rem)",
        }}
      >
        <p className="text-zinc-400 font-medium">OpusTV</p>
        <p className="mt-1">Film · Music · Code · Chat · Pass</p>
      </footer>
    </div>
  );
}
