"use client";

import Link from "next/link";
import BackgroundMesh from "@/components/ecosystem/BackgroundMesh";
import KineticMarquee from "@/components/ecosystem/KineticMarquee";
import EcosystemGrid from "@/components/ecosystem/EcosystemGrid";
import PortalNav from "@/components/ecosystem/PortalNav";
import KineticHeadline from "@/components/landing/KineticHeadline";
import { markEnterSection } from "@/lib/routeManager";

/**
 * OpusTV Ecosystem Hub — portal landing only.
 * Sub-apps: /home Film · /tin-nhan Chat · /code · /nhac · /su-kien Pass
 */
export default function EcosystemHubPage() {
  return (
    <div className="relative min-h-[100dvh] text-zinc-100 overflow-x-hidden">
      <BackgroundMesh />
      <PortalNav />

      <main className="relative z-0">
        {/* Hero — flow layout, no absolute text over cards */}
        <section
          className="mx-auto max-w-6xl px-[clamp(1rem,3vw,1.5rem)]"
          style={{
            paddingTop: "calc(5.5rem + env(safe-area-inset-top, 0px))",
            paddingBottom: "clamp(1.5rem, 4vw, 2.5rem)",
          }}
        >
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.2em] text-zinc-500 mb-4">
              OpusTV · Hệ sinh thái
            </p>
            <KineticHeadline
              text="Một hệ sinh thái. Bốn không gian."
              className="!text-[1.5rem] sm:!text-4xl md:!text-5xl !leading-snug !whitespace-normal"
            />
            <p className="mt-5 text-sm sm:text-base text-zinc-400 leading-relaxed">
              Film, Chat, Code và Music trong một tài khoản — mở đúng phần bạn cần,
              quay lại cổng khi muốn đổi hướng.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/home"
                onClick={() => markEnterSection("film")}
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-cyan-500 border border-white/15 shadow-lg shadow-violet-900/30 hover:brightness-110 transition-[filter] duration-500"
              >
                Bắt đầu với Film
              </Link>
              <Link
                href="/tai-khoan?next=/home"
                className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-medium text-zinc-200 border border-white/12 bg-white/[0.04] hover:bg-white/[0.08] transition-colors duration-500"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </section>

        {/* Mid-ground ticker — in document flow */}
        <KineticMarquee className="mb-[clamp(1.5rem,4vw,2.5rem)]" />

        {/* Ecosystem cards */}
        <section
          className="pb-[clamp(3rem,8vw,5rem)]"
          aria-label="Các phân hệ Opus"
        >
          <div className="mx-auto max-w-6xl px-[clamp(1rem,3vw,1.5rem)] mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white tracking-tight">
              Chọn không gian
            </h2>
            <p className="text-sm text-zinc-500 mt-1">
              Mỗi thẻ mở đúng trang chủ của phân hệ — không đè layout.
            </p>
          </div>
          <EcosystemGrid />
        </section>
      </main>

      <footer className="relative z-0 border-t border-white/8 py-8 px-4 text-center text-xs text-zinc-550 text-zinc-500">
        <p className="text-zinc-400 font-medium">OpusTV</p>
        <p className="mt-1">Film · Chat · Code · Music · Pass</p>
      </footer>
    </div>
  );
}
