"use client";

import Link from "next/link";
import BackgroundMesh from "@/components/ecosystem/BackgroundMesh";
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
            paddingBottom: "clamp(1.75rem, 4vw, 2.5rem)",
            paddingLeft: "clamp(1.25rem, 4vw, 2rem)",
            paddingRight: "clamp(1.25rem, 4vw, 2rem)",
          }}
        >
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-zinc-500 mb-5">
            OPUSTV · UNIFIED ENTERTAINMENT ECOSYSTEM
          </p>

          <h1 className="opus-hero-title text-[1.45rem] sm:text-4xl md:text-[2.65rem] font-bold tracking-tight leading-[1.25]">
            Một Hệ Sinh Thái — Không Giới Hạn Không Gian Giải Trí
          </h1>

          <p className="mt-5 sm:mt-6 text-sm sm:text-[15px] text-zinc-400 leading-relaxed">
            Cổng kết nối tập trung: điện ảnh, âm nhạc, lập trình trên trình duyệt và trò chuyện
            với cùng một tài khoản. Mở đúng phần cần dùng — quay lại cổng khi muốn đổi hướng.
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

        <section
          className="mx-auto max-w-3xl mb-10 sm:mb-12"
          style={{
            paddingLeft: "clamp(1.25rem, 4vw, 2rem)",
            paddingRight: "clamp(1.25rem, 4vw, 2rem)",
          }}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-3">
            Vì sao gom năm mảng vào một chỗ
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Thay vì mở nhiều app và nhiều tài khoản, OpusTV giữ một phiên đăng nhập và chia rõ
            Film, Music, Code, Chat, Pass. Nút quay lại trong từng mảng đưa về trang chủ của
            mảng đó — không kéo về cổng giới thiệu giữa chừng.
          </p>
        </section>

        <section className="pb-[clamp(3rem,8vw,5rem)]" aria-label="Các phân hệ Opus">
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

      <style jsx global>{`
        .opus-hero-title {
          background: linear-gradient(
            110deg,
            #c084fc 0%,
            #f472b6 18%,
            #fb923c 36%,
            #facc15 52%,
            #22d3ee 72%,
            #34d399 88%,
            #c084fc 100%
          );
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: opus-rainbow-shift 8s linear infinite,
            opus-title-breath 4.5s ease-in-out infinite;
          filter: drop-shadow(0 0 12px rgba(192, 132, 252, 0.35));
          will-change: transform, filter, background-position;
        }
        @keyframes opus-rainbow-shift {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 220% 50%;
          }
        }
        @keyframes opus-title-breath {
          0%,
          100% {
            transform: scale(0.97);
            filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.25));
          }
          50% {
            transform: scale(1.03);
            filter: drop-shadow(0 0 18px rgba(244, 114, 182, 0.45));
          }
        }
      `}</style>
    </div>
  );
}
