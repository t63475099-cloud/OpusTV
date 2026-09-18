"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { markEnterSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";

type DockItem = {
  id: string;
  href: string;
  label: string;
  icon: string;
  section?: "film" | "chat" | "music" | "code" | "settings";
  lightIcon?: boolean;
};

const ITEMS: DockItem[] = [
  { id: "home", href: "/home", label: "Trang chủ", icon: "/dock/home.png", section: "film" },
  { id: "chat", href: "/tin-nhan", label: "Trò chuyện", icon: "/dock/chat.png", section: "chat" },
  { id: "film", href: "/danh-sach/phim-moi-cap-nhat", label: "Xem phim", icon: "/dock/youtube.png", section: "film" },
  { id: "music", href: "/nhac", label: "Music", icon: "/dock/music.png", section: "music", lightIcon: true },
  { id: "code", href: "/code", label: "Code", icon: "/dock/code.png", section: "code" },
  { id: "settings", href: "/cai-dat", label: "Cài đặt", icon: "/dock/settings.png", section: "settings" },
];

function shouldHideDock(path: string): boolean {
  if (path === "/") return true;
  if (path.startsWith("/admin")) return true;
  if (path.startsWith("/bao-tri")) return true;
  if (path.startsWith("/get-key")) return true;
  if (path.startsWith("/phim/")) return true;
  if (path.startsWith("/tai-khoan")) return true;
  if (path.startsWith("/hop-thu")) return true;
  if (path.startsWith("/dieu-khoan") || path.startsWith("/chinh-sach")) return true;
  return false;
}

function activeIndex(path: string): number {
  if (path.startsWith("/tin-nhan")) return 1;
  if (path.startsWith("/danh-sach") || path.startsWith("/the-loai") || path.startsWith("/quoc-gia")) return 2;
  if (path.startsWith("/nhac")) return 3;
  if (path.startsWith("/code")) return 4;
  if (path.startsWith("/cai-dat")) return 5;
  return 0;
}

export default function GlassDock() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [idx, setIdx] = useState(0);
  const hide = shouldHideDock(path);

  useEffect(() => setMounted(true), []);
  useEffect(() => setIdx(activeIndex(path)), [path]);

  useEffect(() => {
    document.documentElement.dataset.dock = hide ? "0" : "1";
    return () => {
      document.documentElement.dataset.dock = "0";
    };
  }, [hide]);

  const go = useCallback(
    (item: DockItem, i: number) => {
      setIdx(i);
      if (item.section) markEnterSection(item.section);
      router.push(item.href);
    },
    [router]
  );

  if (!mounted || hide) return null;

  const dock = (
    <nav
      aria-label="Opus Dock"
      className={cn(
        "opus-glass-dock",
        "fixed z-[60] left-1/2 -translate-x-1/2",
        "bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
        "pointer-events-none select-none"
      )}
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div
        className={cn(
          "pointer-events-auto relative flex items-center justify-center",
          "gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2",
          "rounded-full overflow-hidden",
          "border border-white/25",
          "bg-white/[0.12] backdrop-blur-xl",
          "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)]",
          "max-w-[min(100vw-1rem,520px)]"
        )}
      >
        {ITEMS.map((item, i) => {
          const active = i === idx;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => go(item, i)}
              className={cn(
                "relative z-[1] flex flex-col items-center justify-center gap-0.5",
                "min-w-[52px] sm:min-w-[64px] h-[52px] sm:h-[60px] px-1.5",
                "rounded-2xl outline-none",
                "transition-[color,opacity,transform] duration-300 ease-out",
                "cursor-pointer"
              )}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
            >
              {/* Active pill — chỉ trong ô tab */}
              <span
                className={cn(
                  "absolute inset-1 rounded-2xl border border-white/20",
                  "bg-white/15 backdrop-blur-md",
                  "transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]",
                  active ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
                aria-hidden
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.icon}
                alt=""
                draggable={false}
                className={cn(
                  "relative z-[1] w-6 h-6 sm:w-7 sm:h-7 object-contain pointer-events-none",
                  "transition-transform duration-300",
                  !item.lightIcon && "brightness-0 invert",
                  active && "scale-110"
                )}
              />
              <span
                className={cn(
                  "relative z-[1] text-[9px] sm:text-[10px] font-medium leading-none max-w-[64px] truncate",
                  "transition-opacity duration-300",
                  active ? "text-white opacity-100" : "text-white/55 opacity-90"
                )}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(dock, document.body);
}
