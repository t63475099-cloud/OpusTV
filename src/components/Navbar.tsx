"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Menu, X, Search, Clock, Heart } from "lucide-react";
import SearchBox from "./SearchBox";
import UserAvatar from "./UserAvatar";
import StreakBadge from "./StreakBadge";
import { useAccountStore } from "@/lib/account";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [localProfile, setLocalProfile] = useState<any>(null);

  // Lấy dữ liệu profile trực tiếp từ Store tài khoản
  const storeProfile = useAccountStore((state: any) => state?.profile || state?.user || null);

  useEffect(() => {
    const syncProfile = () => {
      try {
        const stored =
          localStorage.getItem("opustv_account") ||
          localStorage.getItem("opustv_user") ||
          localStorage.getItem("user_profile") ||
          localStorage.getItem("profile");
        if (stored) {
          setLocalProfile(JSON.parse(stored));
        }
      } catch {
        setLocalProfile(null);
      }
    };

    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("user-updated", syncProfile);
    window.addEventListener("account-updated", syncProfile);
    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("user-updated", syncProfile);
      window.removeEventListener("account-updated", syncProfile);
    };
  }, []);

  // Ẩn toàn bộ Navbar trên cùng khi người dùng vào trang Cài đặt (/cai-dat)
  if (pathname === "/cai-dat" || pathname?.startsWith("/cai-dat/")) {
    return null;
  }

  const activeProfile = storeProfile || localProfile;

  const navLinks = [
    { label: "Trang chủ", href: "/" },
    { label: "Phim lẻ", href: "/danh-sach/phim-le" },
    { label: "Phim bộ", href: "/danh-sach/phim-bo" },
    { label: "Hoạt hình", href: "/danh-sach/hoat-hinh" },
    { label: "TV Shows", href: "/danh-sach/tv-shows" },
    { label: "Nhạc", href: "/nhac" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/80 border-b border-white/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Main Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-400">
              Opus<span className="text-red-500">TV</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isActive
                      ? "text-white bg-white/10 shadow-sm"
                      : "text-neutral-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Desktop Search */}
          <div className="hidden lg:block w-64">
            <SearchBox />
          </div>

          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="lg:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Tìm kiếm"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Daily Streak Badge */}
          <StreakBadge />

          {/* User Account Avatar (Tự động hiển thị đúng ảnh & khung viền) */}
          <UserAvatar profile={activeProfile} />

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            aria-label="Mở menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Modal */}
      {showSearchModal && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/85 backdrop-blur-md p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-white text-base">Tìm kiếm</span>
            <button
              onClick={() => setShowSearchModal(false)}
              className="p-2 text-neutral-400 hover:text-white rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="w-full">
            <SearchBox />
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-neutral-900 border-b border-neutral-800 px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top-4">
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium ${
                    isActive
                      ? "text-white bg-white/10"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-4 border-t border-neutral-800 grid grid-cols-2 gap-2 text-sm text-neutral-400">
            <Link
              href="/lich-su"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 hover:text-white"
            >
              <Clock className="w-4 h-4" /> Lịch sử xem
            </Link>
            <Link
              href="/yeu-thich"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 hover:text-white"
            >
              <Heart className="w-4 h-4" /> Yêu thích
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
