"use client";

import Link from "next/link";
import BackgroundMesh from "@/components/ecosystem/BackgroundMesh";
import EcosystemGrid from "@/components/ecosystem/EcosystemGrid";
import PortalNav from "@/components/ecosystem/PortalNav";
import KineticHeadline from "@/components/landing/KineticHeadline";
import { markEnterSection } from "@/lib/routeManager";

export default function EcosystemHubPage() {
  return (
    <div className="relative min-h-[100dvh] text-zinc-100 overflow-x-hidden">
      <BackgroundMesh />
      <PortalNav />

      <main className="relative z-0">
        <section
          className="mx-auto max-w-4xl text-center"
          style={{
            paddingTop: "calc(6.5rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "clamp(2rem, 5vw, 3rem)",
            paddingLeft: "clamp(1.5rem, 5vw, 2.5rem)",
            paddingRight: "clamp(1.5rem, 5vw, 2.5rem)",
          }}
        >
          <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-zinc-500 mb-5">
            OPUSTV · UNIFIED ENTERTAINMENT ECOSYSTEM
          </p>

          <div className="opus-hero-breath mx-auto inline-block max-w-full">
            <KineticHeadline
              text="Một Hệ Sinh Thái — Không Giới Hạn Không Gian Giải Trí"
              className="!text-xl sm:!text-3xl md:!text-4xl lg:!text-5xl"
            />
          </div>

          <p className="mt-6 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Cổng kết nối tập trung đưa toàn bộ nhu cầu số về một tọa độ duy nhất.
            Điện ảnh, nhạc, code và chat — một tài khoản, nhiều trải nghiệm.
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
            paddingLeft: "clamp(1.5rem, 5vw, 2.5rem)",
            paddingRight: "clamp(1.5rem, 5vw, 2.5rem)",
          }}
        >
          <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-3">
            Vì sao gom năm mảng vào một chỗ
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Thay vì mở nhiều app rời, OpusTV gom Film, Music, Code, Chat và Pass trong một tài khoản.
            Back trong từng mảng về trang chủ mảng — không về cổng trừ khi bạn chọn.
          </p>
        </section>

        <section className="pb-[clamp(3rem,8vw,5rem)]" aria-label="Các phân hệ Opus">
          <div
            className="mx-auto max-w-6xl mb-6 sm:mb-8"
            style={{
              paddingLeft: "clamp(1.5rem, 5vw, 2.5rem)",
              paddingRight: "clamp(1.5rem, 5vw, 2.5rem)",
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
          paddingLeft: "clamp(1.5rem, 5vw, 2.5rem)",
          paddingRight: "clamp(1.5rem, 5vw, 2.5rem)",
          paddingBottom: "max(2rem, env(safe-area-inset-bottom))",
        }}
      >
        <p className="text-zinc-400 font-medium">OpusTV</p>
        <p className="mt-1">Film · Music · Code · Chat · Pass</p>
      </footer>

      <style jsx global>{`
        .opus-hero-breath {
          display: inline-block;
          max-width: 100%;
          transform-origin: center center;
          animation: opus-title-breath 3.6s ease-in-out infinite;
          will-change: transform, filter;
        }
        .opus-hero-rainbow {
          background: linear-gradient(
            110deg,
            #c084fc 0%,
            #f472b6 18%,
            #fb923c 36%,
            #facc15 52%,
            #22d3ee 70%,
            #34d399 88%,
            #c084fc 100%
          );
          background-size: 240% auto;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: opus-rainbow-shift 7s linear infinite;
          filter: drop-shadow(0 0 14px rgba(192, 132, 252, 0.35));
        }
        @keyframes opus-rainbow-shift {
          0% { background-position: 0% center; }
          100% { background-position: 240% center; }
        }
        @keyframes opus-title-breath {
          0%, 100% {
            transform: scale(0.94);
            filter: brightness(0.9);
          }
          50% {
            transform: scale(1.06);
            filter: brightness(1.15);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .opus-hero-breath,
          .opus-hero-rainbow {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
