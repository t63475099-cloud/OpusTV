"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Flame,
  Clapperboard,
  Heart,
  History,
  Settings,
  Film,
  Ghost,
  Sparkles,
  Music2,
  MessageCircle,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/danh-sach/phim-moi-cap-nhat", label: "Thịnh hành", icon: Flame },
  { href: "/danh-sach/phim-bo", label: "Phim bộ", icon: Clapperboard },
  { href: "/quoc-gia/han-quoc", label: "Phim Hàn", icon: Film },
  { href: "/the-loai/kinh-di", label: "Kinh dị", icon: Ghost },
  { href: "/the-loai/co-trang", label: "Cổ trang", icon: Sparkles },
  { href: "/yeu-thich", label: "Yêu thích", icon: Heart },
  { href: "/lich-su", label: "Đã xem", icon: History },
  { href: "/nhac", label: "Opus Music", icon: Music2 },
  { href: "/tin-nhan", label: "Opus Chat", icon: MessageCircle },
  { href: "/su-kien", label: "Sự kiện", icon: Gift },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname() || "/";
  if (path.startsWith("/admin")) return null;
  if (path.startsWith("/tin-nhan")) return null;

  return (
    <aside
      data-sidebar="1"
      className={cn(
        "hidden lg:flex flex-col shrink-0 sticky top-14",
        "h-[calc(100dvh-3.5rem)]",
        "w-[72px] xl:w-[220px]",
        "border-r border-white/10",
        "bg-neutral-950/55 backdrop-blur-2xl",
        "shadow-[inset_-1px_0_0_rgba(255,255,255,0.04)]",
        "transition-[width,background-color,box-shadow] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "overflow-hidden"
      )}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transition: "width 0.5s ease, background-color 0.5s ease",
        overflow: "hidden",
      }}
    >
      <nav
        className="flex-1 space-y-0.5 py-3 px-2 overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ overflowX: "hidden" }}
      >
        {ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? path === "/"
              : path === item.href || path.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm",
                "overflow-hidden",
                "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "border border-transparent",
                active
                  ? "bg-white/12 text-white font-medium border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-zinc-300 hover:bg-white/8 hover:text-white hover:border-white/8"
              )}
              title={item.label}
              style={{ overflow: "hidden" }}
            >
              {/* glow hover */}
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-r from-rose-500/10 via-transparent to-violet-500/10"
                )}
              />
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 relative z-[1] transition-transform duration-500",
                  active ? "text-rose-400 scale-105" : "text-zinc-400 group-hover:text-white group-hover:scale-105"
                )}
              />
              <span
                className={cn(
                  "hidden xl:inline truncate relative z-[1] leading-none",
                  "transition-[opacity,max-width,transform] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  "opacity-100 max-w-[10rem]"
                )}
                style={{ overflow: "hidden" }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
      <div
        className={cn(
          "hidden xl:block px-3 pb-4 text-[11px] text-zinc-600 leading-relaxed",
          "overflow-hidden transition-opacity duration-500"
        )}
        style={{ overflow: "hidden" }}
      >
        OpusFilm
      </div>
    </aside>
  );
}
