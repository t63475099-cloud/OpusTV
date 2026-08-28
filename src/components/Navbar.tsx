"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Menu,
  X,
  PlayCircle,
  History,
  Heart,
  Settings,
  Home,
  Flame,
  Clapperboard,
  Music2,
} from "lucide-react";
import { NAV_CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import SearchBox from "./SearchBox";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const hideChips =
    pathname?.startsWith("/cai-dat") ||
    pathname?.startsWith("/nhac") ||
    pathname?.startsWith("/phim/");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const mainNav = NAV_CATEGORIES.filter((i) => i.href !== "/cai-dat");

  const drawerLinks = [
    { href: "/", name: "Trang chủ", icon: Home },
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

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        scrolled || menuOpen
          ? "glass-nav border-b border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
          : "glass-nav border-b border-transparent"
      )}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      {/* Hàng chính: Menu | Logo | Search — không icon phải trên PC */}
      <div className="flex items-center gap-2 sm:gap-3 h-14 px-2 sm:px-4 max-w-[1920px] mx-auto w-full">
        {/* Mobile menu button */}
        <button
          type="button"
          className="p-2 rounded-full hover:bg-white/10 text-white lg:hidden shrink-0"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo OpusFilm — mọi thiết bị */}
        <Link
          href="/"
          className="flex items-center gap-1.5 shrink-0 min-w-0"
          onClick={() => setMenuOpen(false)}
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 via-red-600 to-orange-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/40 ring-1 ring-white/20">
            <PlayCircle className="w-5 h-5 text-white fill-white/30" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap">
            Opus<span className="font-semibold">Film</span>
          </span>
        </Link>

        {/* Search giữa — PC luôn hiện; mobile hiện khi không mở drawer (gọn) */}
        <div className="flex-1 min-w-0 flex justify-center px-1 sm:px-4">
          <div className="w-full max-w-[640px] hidden sm:block">
            <SearchBox variant="desktop" />
          </div>
        </div>

        {/* Chỉ Cài đặt — tài khoản nằm trong Cài đặt */}
        <div className="flex items-center gap-1 shrink-0">
          <Link
            href="/cai-dat"
            className="p-2.5 rounded-full text-zinc-200 hover:text-white hover:bg-white/10 transition duration-300 hover:scale-105 active:scale-95"
            title="Cài đặt"
            aria-label="Cài đặt"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Chip thể loại — chỉ mobile/tablet, không chồng logo */}
      {!hideChips && (
        <div className="flex lg:hidden items-center gap-2 px-3 pb-2.5 overflow-x-auto scrollbar-hide">
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
              className="shrink-0 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition duration-300 backdrop-blur-md border border-white/5"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}

      {/* Drawer mobile / tablet */}
      {menuOpen && (
        <div
          className="lg:hidden border-t border-white/10 glass-strong px-3 py-3 space-y-3 max-h-[min(70vh,calc(100dvh-3.5rem))] overflow-y-auto overscroll-contain"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="sm:hidden">
            <SearchBox variant="mobile" onNavigate={() => setMenuOpen(false)} />
          </div>
          <nav className="space-y-0.5" aria-label="Menu chính">
            {drawerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-300 active:scale-[0.98]",
                  pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href.split("?")[0]))
                    ? "bg-[#272727] text-white font-medium"
                    : "text-zinc-200 hover:bg-white/10"
                )}
              >
                <item.icon className="w-5 h-5 text-zinc-400 shrink-0" />
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
