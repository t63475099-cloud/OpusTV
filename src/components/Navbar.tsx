"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { PlayCircle } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import StreakBadge from "@/components/StreakBadge";
import { cn } from "@/lib/utils";
import SearchBox from "./SearchBox";
import { markEnterSection } from "@/lib/routeManager";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const pathname = usePathname() || "/";

  const isPortal = pathname === "/";
  const isMinimalChrome =
    pathname.startsWith("/cai-dat") ||
    pathname.startsWith("/tai-khoan") ||
    pathname.startsWith("/tin-nhan") ||
    pathname.startsWith("/code") ||
    pathname.startsWith("/phim/");

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

  if (isPortal) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-500",
        "border-b border-white/[0.06]",
        scrolled ? "bg-[#0a0a0f]/90 backdrop-blur-xl shadow-lg shadow-black/20" : "bg-[#0a0a0f]/70 backdrop-blur-md"
      )}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="flex items-center gap-2 sm:gap-3 h-14 px-3 sm:px-4 max-w-[1920px] mx-auto">
        <Link
          href="/home"
          onClick={() => markEnterSection("film")}
          className="flex items-center gap-2 shrink-0 group"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/20">
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

        <div className="flex-1 min-w-0 flex justify-center md:justify-end">
          {showSearch && (
            <div className="w-full max-w-md md:max-w-lg">
              <SearchBox onExpandChange={onExpandChange} />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {!pathname.startsWith("/tin-nhan") && (
            <>
              <div className="hidden sm:block">
                <StreakBadge />
              </div>
              <NotificationBell />
            </>
          )}
        </div>
      </div>
    </header>
  );
}
