"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Infinity as InfinityIcon, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { allowPortalReturn, markEnterSection } from "@/lib/routeManager";

export default function PortalNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-[60] flex justify-center pointer-events-none",
        "pt-[max(1rem,env(safe-area-inset-top))] px-4 sm:px-6"
      )}
    >
      <nav
        className={cn(
          "pointer-events-auto flex items-center gap-2 sm:gap-3 max-w-full",
          "rounded-full border border-white/12 px-2.5 sm:px-3 py-1.5",
          "bg-white/[0.06] backdrop-blur-2xl shadow-lg shadow-black/30",
          "transition-all duration-500",
          scrolled && "bg-[#0a0a12]/85 border-white/15"
        )}
      >
        <Link
          href="/"
          onClick={() => allowPortalReturn()}
          className="flex items-center gap-2 pl-1 pr-2 shrink-0"
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 via-violet-500 to-fuchsia-500 flex items-center justify-center">
            <InfinityIcon className="w-4 h-4 text-white" strokeWidth={2.4} />
          </span>
          <span className="font-semibold text-sm text-white hidden sm:inline">Opus</span>
        </Link>
        <span className="hidden sm:block w-px h-5 bg-white/10" />
        <Link
          href="/"
          onClick={() => allowPortalReturn()}
          className="hidden sm:inline text-xs text-zinc-300 hover:text-white px-2 py-1 rounded-full hover:bg-white/8 transition-colors"
        >
          Trang chủ
        </Link>
        <Link
          href="/home"
          onClick={() => markEnterSection("film")}
          className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded-full px-3 py-1.5 transition-colors"
        >
          Vào hệ sinh thái
          <ArrowRight className="w-3 h-3" />
        </Link>
      </nav>
    </header>
  );
}
