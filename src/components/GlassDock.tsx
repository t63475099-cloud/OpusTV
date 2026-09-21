"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { markEnterSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";

type MainItem = {
  id: string;
  href?: string;
  label: string;
  icon: string;
  kind: "link" | "plus";
  section?: "film" | "chat" | "music" | "code" | "settings" | "pass";
};

const MAIN: MainItem[] = [
  { id: "home", href: "/home", label: "Trang chủ", icon: "/dock/home.png", kind: "link", section: "film" },
  { id: "music", href: "/nhac", label: "Music", icon: "/dock/music.png", kind: "link", section: "music" },
  { id: "plus", label: "Thêm", icon: "/dock/add.png", kind: "plus" },
  { id: "chat", href: "/tin-nhan", label: "Trò chuyện", icon: "/dock/chat.png", kind: "link", section: "chat" },
  { id: "settings", href: "/cai-dat", label: "Cài đặt", icon: "/dock/settings.png", kind: "link", section: "settings" },
];

const MORE = [
  { id: "code", href: "/code", label: "Opus Code", icon: "/dock/code.png", section: "code" as const },
  { id: "event", href: "/su-kien", label: "Opus Event", icon: "/dock/event.png", section: "pass" as const },
];

function shouldHideDock(path: string): boolean {
  if (path.startsWith("/admin")) return true;
  if (path.startsWith("/bao-tri")) return true;
  if (path.startsWith("/get-key")) return true;
  if (path.startsWith("/phim/")) return true;
  if (path.startsWith("/tai-khoan")) return true;
  if (path.startsWith("/hop-thu")) return true;
  if (path.startsWith("/dieu-khoan") || path.startsWith("/chinh-sach")) return true;
  if (path.startsWith("/cai-dat")) return true;
  return false;
}

function isMainActive(path: string, id: string): boolean {
  if (id === "home") {
    return (
      path === "/home" ||
      path === "/" ||
      path.startsWith("/danh-sach") ||
      path.startsWith("/the-loai") ||
      path.startsWith("/quoc-gia") ||
      path.startsWith("/tim-kiem")
    );
  }
  if (id === "music") return path.startsWith("/nhac");
  if (id === "chat") return path.startsWith("/tin-nhan");
  if (id === "settings") return path.startsWith("/cai-dat");
  return false;
}

function isMoreActive(path: string): boolean {
  return path.startsWith("/code") || path.startsWith("/su-kien");
}

function DockIcon({
  src,
  className,
  invert,
}: {
  src: string;
  className?: string;
  invert?: boolean;
}) {
  if (invert) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        draggable={false}
        className={cn("object-contain pointer-events-none select-none", className)}
        style={{ filter: "invert(1) brightness(1.2)" }}
      />
    );
  }
  return (
    <span
      className={cn("block bg-white pointer-events-none", className)}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
      aria-hidden
    />
  );
}

/** Kính lỏng: nền đặc + blur + viền sáng mép */
const GLASS = cn(
  "bg-[#18181f]/88 backdrop-blur-2xl",
  "border border-white/25",
  "shadow-[0_10px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.25)]"
);

export default function GlassDock() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setSheetOpen(false);
  }, [path]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (sheetRef.current?.contains(t)) return;
      if (plusRef.current?.contains(t)) return;
      setSheetOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [sheetOpen]);

  const go = useCallback(
    (href: string, section?: MainItem["section"] | "pass" | "code") => {
      if (section) markEnterSection(section);
      setSheetOpen(false);
      router.push(href);
    },
    [router]
  );

  if (!mounted || shouldHideDock(path)) return null;

  const moreActive = isMoreActive(path);

  const ui = (
    <div
      data-opus-dock="1"
      className={cn(
        "fixed z-[60] pointer-events-none left-1/2 -translate-x-1/2",
        "flex flex-col items-center",
        "transition-opacity duration-300 ease-out",
        ready ? "opacity-100" : "opacity-0"
      )}
      style={{
        bottom: "calc(0.85rem + env(safe-area-inset-bottom, 0px))",
        width: "max-content",
        maxWidth: "calc(100vw - 1.25rem)",
      }}
    >
      {/* Sheet Code / Event */}
      <div
        ref={sheetRef}
        className={cn(
          "pointer-events-auto mb-3 w-[min(300px,calc(100vw-1.75rem))]",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom",
          sheetOpen
            ? "opacity-100 translate-y-0 scale-100 visible"
            : "opacity-0 translate-y-3 scale-95 invisible pointer-events-none"
        )}
        aria-hidden={!sheetOpen}
      >
        <div className={cn("relative rounded-[28px] px-3 pt-2 pb-3", GLASS)}>
          <button
            type="button"
            onClick={() => setSheetOpen(false)}
            className="mx-auto mb-2 flex h-8 w-11 items-center justify-center rounded-full
              text-white/85 hover:text-white hover:bg-white/10 transition-colors duration-300"
            aria-label="Đóng"
          >
            <svg
              viewBox="0 0 24 24"
              className={cn(
                "w-6 h-6 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                sheetOpen ? "rotate-180" : "rotate-0"
              )}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          <div className="flex flex-col gap-2">
            {MORE.map((item) => {
              const active =
                (item.id === "code" && path.startsWith("/code")) ||
                (item.id === "event" && path.startsWith("/su-kien"));
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.href, item.section)}
                  className={cn(
                    "w-full flex items-center justify-center gap-3",
                    "h-12 rounded-full px-4",
                    "border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active
                      ? "bg-white/22 border-white/45 text-white shadow-[inset_0_0_16px_rgba(255,255,255,0.12)]"
                      : "bg-white/[0.07] border-white/18 text-white/90 hover:bg-white/14 hover:border-white/30"
                  )}
                >
                  <span className="flex items-center justify-center w-6 h-6 shrink-0">
                    <DockIcon src={item.icon} className="w-6 h-6" />
                  </span>
                  <span className="text-[15px] font-medium tracking-wide">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dock pill — lớn hơn một chút */}
      <nav
        className={cn(
          "pointer-events-auto inline-flex items-center justify-center",
          "h-[64px] sm:h-[68px] px-2 sm:px-2.5 gap-1 sm:gap-1.5",
          "rounded-full",
          GLASS
        )}
        style={{ width: "max-content" }}
        aria-label="Điều hướng"
      >
        {MAIN.map((item) => {
          if (item.kind === "plus") {
            const openOrMore = sheetOpen || moreActive;
            return (
              <button
                key={item.id}
                ref={plusRef}
                type="button"
                onClick={() => setSheetOpen((v) => !v)}
                aria-label={sheetOpen ? "Đóng menu thêm" : "Mở Code & Sự kiện"}
                aria-expanded={sheetOpen}
                className={cn(
                  "relative flex items-center justify-center shrink-0",
                  "w-[52px] h-[52px] sm:w-14 sm:h-14 rounded-full outline-none",
                  "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  openOrMore
                    ? "bg-white/25 border border-white/40 scale-105 shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                    : "bg-white/12 border border-white/25 hover:bg-white/18 active:scale-95"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7",
                    "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    sheetOpen ? "rotate-45" : "rotate-0"
                  )}
                >
                  <DockIcon src={item.icon} className="w-full h-full" invert />
                </span>
              </button>
            );
          }

          const active = isMainActive(path, item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => item.href && go(item.href, item.section)}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "relative flex items-center justify-center shrink-0",
                "w-12 h-12 sm:w-[52px] sm:h-[52px] rounded-full outline-none",
                "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                "active:scale-95"
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "absolute inset-0 m-auto w-11 h-11 sm:w-12 sm:h-12 rounded-full",
                  "border border-white/40 bg-white/[0.18]",
                  "shadow-[inset_0_0_14px_rgba(255,255,255,0.2)]",
                  "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  active ? "opacity-100 scale-100" : "opacity-0 scale-75"
                )}
              />
              <span className="relative z-[1] flex items-center justify-center w-6 h-6 sm:w-[26px] sm:h-[26px]">
                <DockIcon
                  src={item.icon!}
                  className="w-full h-full"
                  invert={item.id === "music"}
                />
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return createPortal(ui, document.body);
}
