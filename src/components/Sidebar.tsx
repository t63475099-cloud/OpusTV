"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Heart,
  History,
  Settings,
  Music2,
  MessageCircle,
  Gift,
  ChevronDown,
  Clapperboard,
} from "lucide-react";
import { GENRE_LINKS } from "@/lib/constants";
import { t } from "@/lib/i18n";
import { useSettingsStore } from "@/lib/settings";
import { cn } from "@/lib/utils";

const ITEM_DEFS: {
  href: string;
  key: string;
  icon: typeof Home;
  expandable?: boolean;
}[] = [
  { href: "/", key: "home", icon: Home, expandable: true },
  { href: "/yeu-thich", key: "favorites", icon: Heart },
  { href: "/lich-su", key: "history", icon: History },
  { href: "/nhac", key: "music", icon: Music2 },
  { href: "/tin-nhan", key: "chat", icon: MessageCircle },
  { href: "/su-kien", key: "events", icon: Gift },
  { href: "/cai-dat", key: "settings", icon: Settings },
];

export default function Sidebar() {
  const path = usePathname() || "/";
  const lang = useSettingsStore((s) => s.settings.language) || "vi";
  const [genresOpen, setGenresOpen] = useState(false);

  if (
    path.startsWith("/admin") ||
    path.startsWith("/tin-nhan") ||
    path.startsWith("/tai-khoan") ||
    path.startsWith("/get-key") ||
    path.startsWith("/dieu-khoan") ||
    path.startsWith("/chinh-sach") ||
    path.startsWith("/bao-tri")
  )
    return null;

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
        overflow: "hidden",
      }}
    >
      <nav
        className="flex-1 space-y-0.5 py-3 px-2 overflow-y-auto overflow-x-hidden scrollbar-hide"
        style={{ overflowX: "hidden" }}
      >
        {ITEM_DEFS.map((item) => {
          const active =
            item.href === "/"
              ? path === "/"
              : path === item.href || path.startsWith(item.href + "/");
          const Icon = item.icon;

          if (item.expandable) {
            return (
              <div key={item.href} className="space-y-0.5">
                <div className="flex items-center gap-0.5">
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative flex flex-1 items-center gap-4 rounded-xl px-3 py-2.5 text-sm min-w-0",
                      "overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                      "border border-transparent",
                      active
                        ? "bg-white/12 text-white font-medium border-white/10"
                        : "text-zinc-300 hover:bg-white/8 hover:text-white"
                    )}
                    title={t(lang, item.key)}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span className="hidden xl:inline truncate">{t(lang, item.key)}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setGenresOpen((v) => !v)}
                    className={cn(
                      "hidden xl:flex p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10",
                      "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                      genresOpen && "bg-white/10 text-white"
                    )}
                    aria-label="Thể loại"
                    aria-expanded={genresOpen}
                  >
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                        genresOpen && "rotate-180"
                      )}
                    />
                  </button>
                </div>
                <div
                  className={cn(
                    "hidden xl:block overflow-hidden transition-[max-height,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                    genresOpen ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"
                  )}
                >
                  <div className="pl-3 ml-3 border-l border-white/10 space-y-0.5 pb-1">
                    {GENRE_LINKS.map((g) => {
                      const gActive =
                        path === g.href || path.startsWith(g.href + "/");
                      return (
                        <Link
                          key={g.href}
                          href={g.href}
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs",
                            "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                            gActive
                              ? "bg-white/10 text-white"
                              : "text-zinc-500 hover:text-zinc-200 hover:bg-white/6"
                          )}
                        >
                          <Clapperboard className="w-3 h-3 shrink-0 opacity-60" />
                          <span className="truncate">{g.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          }

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
              title={t(lang, item.key)}
            >
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  "bg-gradient-to-r from-rose-500/10 via-transparent to-violet-500/10"
                )}
              />
              <Icon className="w-5 h-5 shrink-0 relative z-[1]" />
              <span className="hidden xl:inline truncate relative z-[1]">{t(lang, item.key)}</span>
            </Link>
          );
        })}
      </nav>
      <div className="hidden xl:block mt-auto px-3 py-3 text-[11px] text-zinc-600 leading-relaxed border-t border-white/5">
        OpusFilm
      </div>
    </aside>
  );
}
