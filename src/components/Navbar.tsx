"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  PlayCircle,
  History,
  Heart,
  Settings,
  Gift,
  MessageCircle,
  Home,
  Flame,
  Clapperboard,
  Music2,
  Bell,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import StreakBadge from "@/components/StreakBadge";
import { NAV_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import SearchBox from "./SearchBox";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const pathname = usePathname() || "/";

  const isMinimalChrome =
    pathname.startsWith("/cai-dat") || pathname.startsWith("/tai-khoan");

  const hideChips =
    isMinimalChrome ||
    pathname.startsWith("/nhac") ||
    pathname.startsWith("/phim/");

  const showSearch = !isMinimalChrome && !pathname.startsWith("/nhac");

  /** Mobile: ẩn chữ OpusFilm khi search mở rộng & menu đóng */
  const hideLogoTextMobile = showSearch && searchExpanded && !menuOpen;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchExpanded(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.navChips = hideChips ? "0" : "1";
    root.dataset.navMinimal = isMinimalChrome ? "1" : "0";
    return () => {
      root.dataset.navChips = "0";
      root.dataset.navMinimal = "0";
    };
  }, [hideChips, isMinimalChrome]);

  const onExpandChange = useCallback((v: boolean) => {
    setSearchExpanded(v);
  }, []);

  const mainNav = NAV_CATEGORIES.filter((i) => i.href !== "/cai-dat");

  const drawerLinks = [
    { href: "/", name: "Trang chủ", icon: Home },
    { href: "/su-kien", name: "Chuỗi & sự kiện", icon: Gift },
    { href: "/tin-nhan", name: "Opus Chat", icon: MessageCircle },
    { href: "/nhac", name: "Opus Music", icon: Music2 },
    { href: "/danh-sach/phim-moi-cap-nhat", name: "Mới cập nhật", icon: Flame },
    { href: "/yeu-thich", name: "Yêu thích", icon: Heart },
    { href: "/lich-su", name: "Lịch sử xem", icon: History },
    ...mainNav
      .filter(
        (i) =>
          !["/", "/nhac", "/yeu-thich", "/lich-su"].includes(i.href) &&
          i.href !== "/danh-sach/phim-moi-cap-nhat"
      )
      .slice(0, 8)
      .map((i) => ({ href: i.href, name: i.name, icon: Clapperboard })),
    { href: "/cai-dat", name: "Cài đặt", icon: Settings },
  ];

  /** Ẩn toàn bộ thanh menu trên các trang form / pháp lý / chat — tránh đè UI */
  const hideEntireNav =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/tin-nhan") ||
    pathname.startsWith("/tai-khoan") ||
    pathname.startsWith("/get-key") ||
    pathname.startsWith("/dieu-khoan") ||
    pathname.startsWith("/chinh-sach") ||
    pathname.startsWith("/bao-tri");

  if (hideEntireNav) return null;

  return (
    <header
      data-app-nav="1"
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "backdrop-blur-2xl bg-neutral-950/70",
        "transition-[background-color,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        scrolled || menuOpen
          ? "border-b border-white/12 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          : "border-b border-transparent"
      )}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        overflow: "visible",
      }}
    >
      <div
        data-bell-fixed
        className="hidden lg:block absolute top-[max(0.4rem,env(safe-area-inset-top))] right-1.5 sm:right-3 z-[120]"
      >
        <NotificationBell />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 h-12 sm:h-14 px-2.5 sm:px-4 pr-3 lg:pr-14">
        {/* Hamburger — mobile */}
        <button
          type="button"
          className="lg:hidden p-2 -ml-0.5 rounded-full text-zinc-200 hover:bg-white/10 shrink-0 transition-all duration-300 active:scale-95"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo — chữ ẩn khi search mở rộng trên mobile */}
        <Link
          href="/"
          className="flex items-center gap-1.5 shrink-0 min-w-0"
          onClick={() => setMenuOpen(false)}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/40 ring-1 ring-white/20">
            <PlayCircle className="w-5 h-5 text-white fill-white/30" />
          </div>
          <span
            className={cn(
              "inline-flex items-center font-bold tracking-tight text-white whitespace-nowrap text-base sm:text-lg leading-none",
              "overflow-hidden transition-[max-width,opacity,margin] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
              "lg:inline-flex lg:max-w-[10rem] lg:opacity-100 lg:ml-0",
              hideLogoTextMobile
                ? "max-w-0 opacity-0 ml-0 pointer-events-none"
                : "max-w-[7.5rem] opacity-100 ml-0"
            )}
            style={{
              transition: "max-width 0.5s ease, opacity 0.5s ease, margin 0.5s ease",
              overflow: "hidden",
            }}
          >
            Opus<span className="font-semibold">Film</span>
          </span>
        </Link>

        {/* Search */}
        <div
          className={cn(
            "relative z-[90] flex-1 min-w-0 px-1",
            "flex justify-center max-lg:justify-end"
          )}
          style={{ overflow: "visible" }}
        >
          {showSearch && (
            <div
              className={cn(
                "w-full",
                /* PC: luôn max 560px, không đổi khi hover */
                "lg:max-w-[560px] lg:transition-none",
                /* Mobile: thu khi mở menu / nở khi search */
                menuOpen
                  ? "max-lg:max-w-[2.75rem]"
                  : searchExpanded
                    ? "max-lg:max-w-full"
                    : "max-lg:max-w-[2.75rem]",
                "max-lg:transition-[max-width] max-lg:duration-500 max-lg:ease-[cubic-bezier(0.4,0,0.2,1)]"
              )}
            >
              <SearchBox
                variant="desktop"
                forceCollapse={menuOpen}
                onExpandChange={onExpandChange}
                onNavigate={() => setMenuOpen(false)}
              />
            </div>
          )}
        </div>

        <div className="hidden lg:flex shrink-0 items-center gap-1 relative z-[95]">
          <StreakBadge />
        </div>
      </div>

      {/* Chip categories — mobile */}
      {!hideChips && (
        <div
          className={cn(
            "flex lg:hidden items-center gap-2 px-3 pb-2 overflow-x-auto scrollbar-hide h-10",
            "transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            menuOpen ? "max-h-0 opacity-0 overflow-hidden pb-0 h-0" : "max-h-10 opacity-100"
          )}
          style={{ overflowX: menuOpen ? "hidden" : "auto", overflowY: "hidden" }}
        >
          <Link
            href="/"
            className="shrink-0 px-3 py-1.5 rounded-full bg-gradient-to-r from-white to-zinc-100 text-black text-sm font-semibold shadow-sm"
          >
            Tất cả
          </Link>
          {mainNav.slice(0, 8).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition backdrop-blur-md border border-white/5"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* Drawer menu — mobile, transition 0.5s overflow hidden */}
      <div
        className={cn(
          "lg:hidden border-t border-white/10",
          "bg-neutral-950/85 backdrop-blur-2xl",
          "transition-[max-height,opacity,padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          menuOpen
            ? "max-h-[min(70vh,calc(100dvh-3.5rem))] opacity-100"
            : "max-h-0 opacity-0 pointer-events-none"
        )}
        style={{
          overflow: "hidden",
          transition: "max-height 0.5s ease, opacity 0.5s ease, padding 0.5s ease",
          paddingBottom: menuOpen ? "max(1rem, env(safe-area-inset-bottom))" : 0,
        }}
      >
        <nav
          className="space-y-0.5 px-3 py-3 overflow-y-auto overscroll-contain max-h-[min(65vh,calc(100dvh-4rem))]"
          aria-label="Menu chính"
        >
          {drawerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm",
                "transition-all duration-300 active:scale-[0.98]",
                "border border-transparent hover:border-white/10",
                pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href.split("?")[0]))
                  ? "bg-white/10 text-white font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-zinc-200 hover:bg-white/8"
              )}
            >
              <item.icon className="w-5 h-5 text-zinc-400 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          ))}
          <Link
            href="/hop-thu"
            onClick={() => setMenuOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 active:scale-[0.98]",
              pathname.startsWith("/hop-thu")
                ? "bg-white/10 text-white font-medium"
                : "text-zinc-200 hover:bg-white/8"
            )}
          >
            <Bell className="w-5 h-5 text-zinc-400 shrink-0" />
            <span className="truncate leading-none">Thông báo & hòm thư</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
