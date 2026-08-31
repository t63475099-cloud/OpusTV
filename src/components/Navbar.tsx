"use client";

import { useState, useEffect } from "react";
import Link from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Film,
  Music,
  Compass,
  Search,
  Settings,
  User,
  Sparkles,
  Flame,
  Radio,
  Bookmark,
  Bell,
  X,
  ChevronRight,
  ShieldCheck,
  Play,
} from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";
import UserAvatar from "@/components/UserAvatar";

const NAV_LINKS = [
  { href: "/", label: "Khám Phá", icon: Compass },
  { href: "/phim", label: "Phim Chiếu Rạp", icon: Film },
  { href: "/nhac", label: "Âm Nhạc & OST", icon: Music },
  { href: "/yeu-thich", label: "Bộ Sưu Tập", icon: Bookmark },
];

const SEARCH_SUGGESTIONS = [
  { id: "1", title: "Thiên Mệnh Thần Giới", type: "Phim 4K", category: "Tiên Hiệp", rating: 9.8 },
  { id: "2", title: "Nguyệt Hoa Vũ Điệu", type: "Soundtrack", category: "Cổ Phong", rating: 9.9 },
  { id: "3", title: "Vạn Cổ Độc Tôn", type: "Phim Bộ", category: "Hành Động", rating: 9.5 },
  { id: "4", title: "Thư Kích Thần Vực", type: "Phim Chiếu Rạp", category: "Viễn Tưởng", rating: 9.2 },
];

export default function Navbar() {
  const pathname = usePathname();
  const username = useAccountStore((s) => s.username);
  const profile = useSettingsStore((s) => s.profile);

  const [isScrolled, setIsScrolled] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isVerified = Boolean(profile.verified);

  // Theo dõi cuộn trang để tăng độ mờ và bóng của thanh kính
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Đóng modal tìm kiếm khi ấn phím Escape hoặc mở phím tắt Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
      if (e.key === "Escape") {
        setShowSearchModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const filteredSuggestions = SEARCH_SUGGESTIONS.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-500 ${
          isScrolled
            ? "py-3 bg-[#050508]/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
            : "py-5 bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            
            {/* Logo Thương Hiệu Kính Lỏng */}
            <Link href="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-purple-600 to-blue-600 p-[1.5px] shadow-[0_0_20px_rgba(244,63,94,0.3)] group-hover:scale-105 transition-transform duration-300">
                <div className="w-full h-full bg-[#0a0a10] rounded-[14px] flex items-center justify-center backdrop-blur-md">
                  <Play className="w-4 h-4 fill-rose-500 text-rose-500 ml-0.5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white flex items-center gap-1">
                  OPUS<span className="text-rose-500">FILM</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase">Giải Trí Đỉnh Cao</span>
              </div>
            </Link>

            {/* Menu Điều Hướng Trung Tâm (Desktop) */}
            <nav className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl shadow-inner">
              {NAV_LINKS.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-rose-600/90 to-purple-600/90 text-white shadow-[0_0_15px_rgba(244,63,94,0.35)] border border-white/20"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Cụm Tiện Ích: Tìm Kiếm, Cài Đặt & Profile */}
            <div className="flex items-center gap-3">
              
              {/* Nút Tìm kiếm nhanh */}
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-zinc-400 hover:text-white transition-all duration-300 backdrop-blur-md text-xs group"
              >
                <Search className="w-4 h-4 text-zinc-400 group-hover:text-rose-400 transition-colors" />
                <span className="hidden sm:inline">Tìm kiếm tác phẩm...</span>
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-black/40 rounded-md border border-white/10 text-zinc-500">
                  Ctrl K
                </kbd>
              </button>

              {/* Nút Cài đặt */}
              <Link
                href="/cai-dat"
                className="p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 text-zinc-400 hover:text-white transition-all backdrop-blur-md"
                title="Cài đặt hệ thống"
              >
                <Settings className="w-4 h-4" />
              </Link>

              {/* Khu vực Tài Khoản */}
              {username ? (
                <Link
                  href="/tai-khoan"
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 transition-all backdrop-blur-md group"
                >
                  <UserAvatar
                    profile={{ ...profile, name: profile.name || username }}
                    size={32}
                    ring
                    showBadge={isVerified}
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-zinc-200 group-hover:text-rose-400 transition-colors truncate max-w-[90px]">
                      {profile.name || username}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">@{username}</span>
                  </div>
                </Link>
              ) : (
                <Link
                  href="/cai-dat"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-purple-600 text-white text-xs font-bold shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-105 transition-all"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Đăng Nhập</span>
                </Link>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* POPUP TÌM KIẾM NHANH DẠNG KÍNH LỎNG (QUICK SEARCH MODAL) */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-xl animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#0d111d]/90 border border-white/15 rounded-3xl p-5 shadow-[0_25px_70px_rgba(0,0,0,0.8)] space-y-4 backdrop-blur-2xl">
            
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <Search className="w-5 h-5 text-rose-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập tên phim, bài hát, nghệ sĩ hoặc thể loại..."
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowSearchModal(false)}
                className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider px-2">Gợi ý thịnh hành</div>
              {filteredSuggestions.length > 0 ? (
                filteredSuggestions.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setShowSearchModal(false)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 text-xs font-bold">
                        ★
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-zinc-400">{item.category} · {item.type}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500">Không tìm thấy kết quả phù hợp cho từ khóa trên.</div>
              )}
            </div>

            <div className="pt-2 border-t border-white/10 flex justify-between items-center text-[11px] text-zinc-500">
              <span>Nhấn <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/10 text-zinc-400 font-mono">ESC</kbd> để đóng</span>
              <span>Hệ thống tìm kiếm thời gian thực</span>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
