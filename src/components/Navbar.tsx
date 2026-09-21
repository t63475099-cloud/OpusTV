"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PlayCircle, ArrowLeft } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import StreakBadge from "@/components/StreakBadge";
import { cn } from "@/lib/utils";
import SearchBox from "./SearchBox";
import { markEnterSection } from "@/lib/routeManager";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const pathname = usePathname() || "/";
  const router = useRouter();

  const isPortal = pathname === "/";
  const isWatch = pathname.startsWith("/phim/");
  const isMinimalChrome =
    pathname.startsWith("/cai-dat") ||
    pathname.startsWith("/tai-khoan") ||
    pathname.startsWith("/tin-nhan") ||
    pathname.startsWith("/code") ||
    isWatch;

  const showSearch =
    !isMinimalChrome &&
    !isPortal &&
    !pathname.startsWith("/nhac") &&
    !pathname.startsWith("/admin");

  const hideLogoText = showSearch && searchExpanded;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchExpanded(false);
  }, [pathname]);

  const onExpandChange = useCallback((v: boolean) => {
    setSearchExpanded(v);
  }, []);

  const onBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/home");
  }, [router]);

  if (isPortal) return null;

  return (
    <header
      data-navbar="1"
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        "border-b border-white/[0.06]",
        scrolled
          ? "bg-[#0a0a0f]/90 backdrop-blur-xl shadow-lg shadow-black/20"
          : "bg-[#0a0a0f]/70 backdrop-blur-md"
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {/* Desktop: 3 cột cân bằng → search đúng giữa bar */}
      <div
        className={cn(
          "h-14 px-3 sm:px-4 max-w-[1920px] mx-auto w-full",
          "flex items-center gap-2 sm:gap-3",
          "lg:grid lg:grid-cols-[1fr_minmax(280px,36rem)_1fr]"
        )}
      >
        {/* Trái: back (trang xem) + logo */}
        <div className="flex items-center gap-2 min-w-0 shrink-0 lg:justify-self-start">
          {isWatch && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Quay lại"
              className={cn(
                "shrink-0 flex items-center justify-center",
                "w-9 h-9 rounded-full",
                "border border-white/20 bg-black/50 text-white",
                "backdrop-blur-md shadow-md",
                "hover:bg-black/70 transition-colors duration-300"
              )}
            >
              <ArrowLeft className="w-5 h-5" strokeWidth={2.25} />
            </button>
          )}
          <Link
            href="/home"
            onClick={() => markEnterSection("film")}
            className="flex items-center gap-2 shrink-0 group min-w-0"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/20 shrink-0">
              <PlayCircle className="h-4 w-4 text-white" />
            </span>
            <span
              className={cn(
                "font-semibold text-white tracking-tight transition-all duration-500 overflow-hidden whitespace-nowrap",
                hideLogoText ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"
              )}
            >
              OpusFilm
            </span>
          </Link>
        </div>

        {/* Giữa: search — căn giữa thanh bar (PC) */}
        <div className="flex-1 min-w-0 lg:justify-self-center lg:w-full lg:max-w-xl px-0.5">
          {showSearch ? (
            <SearchBox onExpandChange={onExpandChange} />
          ) : (
            <span className="block w-full" aria-hidden />
          )}
        </div>

        {/* Phải: streak + bell — căn phải, bề rộng tương đương trái để search thật sự giữa */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto lg:ml-0 lg:justify-self-end">
          {!pathname.startsWith("/tin-nhan") && (
            <>
              <div className="hidden sm:block">
                <StreakBadge />
              </div>
              <div className="hidden sm:block">
                <NotificationBell />
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
