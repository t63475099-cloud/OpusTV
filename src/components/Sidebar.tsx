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
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/danh-sach/phim-moi-cap-nhat", label: "Thịnh hành", icon: Flame },
  { href: "/the-loai/co-trang", label: "Tiên hiệp", icon: Sparkles },
  { href: "/quoc-gia/han-quoc", label: "Phim Hàn", icon: Film },
  { href: "/the-loai/kinh-di", label: "Kinh dị", icon: Ghost },
  { href: "/danh-sach/phim-bo", label: "Phim bộ", icon: Clapperboard },
  { href: "/yeu-thich", label: "Yêu thích", icon: Heart },
  { href: "/lich-su", label: "Đã xem", icon: History },
  { href: "/nhac", label: "Opus Music", icon: Music2 },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname() || "/";
  if (path.startsWith("/admin")) return null;

  return (
    <aside data-sidebar="1"
      className="hidden lg:flex flex-col w-[72px] xl:w-[220px] shrink-0 sticky top-14 h-[calc(100dvh-3.5rem)] overflow-y-auto scrollbar-hide py-3 px-2 border-r border-[#272727] glass-sidebar"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <nav className="space-y-0.5">
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
                "flex items-center gap-4 rounded-xl px-3 py-2.5 text-sm transition",
                active
                  ? "bg-[#272727] text-white font-medium"
                  : "text-[#f1f1f1] hover:bg-[#272727]/80"
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="hidden xl:inline truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="hidden xl:block mt-6 px-3 text-[11px] text-[#717171] leading-relaxed">
        OpusFilm
      </div>
    </aside>
  );
}
