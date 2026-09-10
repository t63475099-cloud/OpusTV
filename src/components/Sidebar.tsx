"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home,
  Heart,
  History,
  Music2,
  Code2,
  MessageCircle,
  Gift,
  Settings,
  ChevronDown,
  Clapperboard,
  Film,
  Ghost,
  Sparkles,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const GENRES = [
  { href: "/danh-sach/phim-moi-cap-nhat", label: "Thịnh hành", icon: Flame },
  { href: "/the-loai/co-trang", label: "Cổ trang", icon: Sparkles },
  { href: "/quoc-gia/han-quoc", label: "Phim Hàn", icon: Film },
  { href: "/the-loai/kinh-di", label: "Kinh dị", icon: Ghost },
  { href: "/danh-sach/phim-bo", label: "Phim bộ", icon: Clapperboard },
] as const;

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  expandable?: boolean;
};

const ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ", icon: Home, expandable: true },
  { href: "/yeu-thich", label: "Yêu thích", icon: Heart },
  { href: "/lich-su", label: "Đã xem", icon: History },
  { href: "/nhac", label: "Opus Music", icon: Music2 },
  { href: "/code", label: "Opus Code", icon: Code2 },
  { href: "/tin-nhan", label: "Opus Chat", icon: MessageCircle },
  { href: "/su-kien", label: "Sự kiện", icon: Gift },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname();
  const [homeOpen, setHomeOpen] = useState(false);

  // Ẩn sidebar trên trang full-bleed (chat, code fullscreen handled by CSS too)
  if (path?.startsWith("/tin-nhan")) return null;

  return (
    <>
      {/* Spacer giữ layout — không cuộn theo */}
      <div
        className="hidden lg:block w-[72px] xl:w-[220px] shrink-0"
        aria-hidden
      />
      <aside
        data-sidebar="1"
        className={cn(
          "hidden lg:flex flex-col",
          "fixed left-0 top-14 z-40",
          "w-[72px] xl:w-[220px]",
          "h-[calc(100dvh-3.5rem)]",
          "overflow-y-auto overflow-x-hidden custom-scroll",
          "py-3 px-2 border-r border-white/10",
          "bg-[#0a0a0f]/85 backdrop-blur-xl",
          "glass-sidebar"
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <nav className="space-y-0.5">
          {ITEMS.map((item) => {
            const active =
              item.href === "/"
                ? path === "/"
                : path === item.href || path?.startsWith(item.href + "/");
            const Icon = item.icon;
            const expandable = !!item.expandable;

            if (expandable) {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={() => setHomeOpen((v) => !v)}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm transition-all duration-500",
                      active
                        ? "bg-white/10 text-white font-medium"
                        : "text-[#f1f1f1] hover:bg-white/8"
                    )}
                    title={item.label}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="hidden xl:inline truncate flex-1 text-left">
                      {item.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "hidden xl:block w-4 h-4 text-zinc-500 transition-transform duration-500",
                        homeOpen && "rotate-180"
                      )}
                    />
                  </button>
                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                      homeOpen ? "max-h-80 opacity-100 mt-0.5" : "max-h-0 opacity-0"
                    )}
                  >
                    {GENRES.map((g) => {
                      const GIcon = g.icon;
                      const gActive =
                        path === g.href || path?.startsWith(g.href + "/");
                      return (
                        <Link
                          key={g.href}
                          href={g.href}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-500 xl:pl-5",
                            gActive
                              ? "bg-white/10 text-white"
                              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                          )}
                        >
                          <GIcon className="w-4 h-4 shrink-0" />
                          <span className="hidden xl:inline truncate">{g.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm transition-all duration-500",
                  active
                    ? "bg-white/10 text-white font-medium"
                    : "text-[#f1f1f1] hover:bg-white/8"
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="hidden xl:inline truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="hidden xl:block mt-auto pt-6 px-3 text-[11px] text-[#717171] leading-relaxed">
          OpusFilm
        </div>
      </aside>
    </>
  );
}
