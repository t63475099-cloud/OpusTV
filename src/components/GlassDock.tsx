"use client";

/* Lucian UX/UI Prompt #041 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#041 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { openComingSoon } from "@/components/ComingSoonModal";
import { markEnterSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";
import { useI18n } from "@/hooks/useI18n";
import { InboxDockPanel, useInboxUnread } from "@/components/inbox/InboxDockPanel";

type MainItem = {
  id: string;
  href?: string;
  labelKey: string;
  fallback: string;
  icon: string;
  kind: "link" | "plus";
  section?: "film" | "chat" | "music" | "code" | "settings" | "pass";
};

const MAIN: MainItem[] = [
  {
    id: "home",
    href: "/home",
    labelKey: "nav.home",
    fallback: "Trang chủ",
    icon: "/dock/home.png",
    kind: "link",
    section: "film",
  },
  {
    id: "music",
    href: "/nhac",
    labelKey: "nav.music",
    fallback: "Music",
    icon: "/dock/music.png",
    kind: "link",
    section: "music",
  },
  {
    id: "plus",
    labelKey: "nav.more",
    fallback: "Thêm",
    icon: "/dock/add.png",
    kind: "plus",
  },
  {
    id: "chat",
    href: "/tin-nhan",
    labelKey: "nav.chat",
    fallback: "Trò chuyện",
    icon: "/dock/chat.png",
    kind: "link",
    section: "chat",
  },
  {
    id: "settings",
    href: "/cai-dat",
    labelKey: "nav.settings",
    fallback: "Cài đặt",
    icon: "/dock/settings.png",
    kind: "link",
    section: "settings",
  },
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
  if (path.startsWith("/tin-nhan") || path.startsWith("/chat")) return true;
  return false;
}

function activeIndex(path: string, sheetOpen: boolean): number {
  if (sheetOpen) return 2;
  if (
    path === "/home" ||
    path === "/" ||
    path.startsWith("/danh-sach") ||
    path.startsWith("/the-loai") ||
    path.startsWith("/quoc-gia") ||
    path.startsWith("/tim-kiem")
  )
    return 0;
  if (path.startsWith("/nhac")) return 1;
  if (path.startsWith("/code") || path.startsWith("/su-kien")) return 2;
  if (path.startsWith("/tin-nhan")) return 3;
  if (path.startsWith("/cai-dat")) return 4;
  return 0;
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
        style={{ filter: "invert(1) brightness(1.15)" }}
      />
    );
  }
  return (
    <span
      className={cn("block bg-current pointer-events-none", className)}
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

export default function GlassDock() {
  const path = usePathname() || "/";
  const router = useRouter();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [inboxView, setInboxView] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const inboxUnread = useInboxUnread();
  const plusRef = useRef<HTMLButtonElement>(null);

  const selected = activeIndex(path, sheetOpen);

  // Notch spring animation (--x)
  useLayoutEffect(() => {
    if (!mounted || !rootRef.current) return;
    const btn = tabRefs.current[selected];
    if (!btn) return;
    const parent = btn.parentElement;
    if (!parent) return;
    const target = parent.offsetLeft + parent.offsetWidth / 2;
    const rm =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (rm) {
      rootRef.current.style.setProperty("--x", `${target}px`);
      return;
    }
    let x = parseFloat(rootRef.current.style.getPropertyValue("--x") || "0") || target;
    let v = 0;
    let raf = 0;
    const step = () => {
      if (!rootRef.current) return;
      const a = (target - x) * 0.16 - v * 0.42;
      v += a;
      x += v;
      rootRef.current.style.setProperty("--x", `${x.toFixed(2)}px`);
      if (Math.abs(target - x) > 0.3 || Math.abs(v) > 0.3) {
        raf = requestAnimationFrame(step);
      } else {
        rootRef.current.style.setProperty("--x", `${target}px`);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [selected, mounted, ready]);

  useEffect(() => {
    setMounted(true);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setReady(true));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    setSheetOpen(false);
    setInboxView(false);
  }, [path]);

  useEffect(() => {
    if (!sheetOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      const node = e.target as Node;
      if (sheetRef.current?.contains(node)) return;
      if (plusRef.current?.contains(node)) return;
      setSheetOpen(false);
      setInboxView(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSheetOpen(false);
        setInboxView(false);
      }
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
      if (
        href.startsWith("/su-kien") ||
        href.startsWith("/code") ||
        section === "code" ||
        section === "pass"
      ) {
        setSheetOpen(false);
        setInboxView(false);
        openComingSoon(
          "Sắp ra mắt",
          href.startsWith("/code") || section === "code"
            ? "Opus Code đang được hoàn thiện. Vui lòng quay lại sau."
            : "Opus Event đang được hoàn thiện. Vui lòng quay lại sau."
        );
        return;
      }
      if (section) markEnterSection(section);
      setSheetOpen(false);
      setInboxView(false);
      router.push(href);
    },
    [router]
  );

  if (!mounted || shouldHideDock(path)) return null;

  const ui = (
    <div
      data-opus-dock="1"
      className={cn(
        "u041-wrap fixed z-[60] pointer-events-none left-1/2 -translate-x-1/2",
        "flex flex-col items-center",
        "transition-opacity duration-300 ease-out",
        ready ? "opacity-100" : "opacity-0"
      )}
      style={{
        bottom: "calc(0.65rem + env(safe-area-inset-bottom, 0px))",
        width: "max-content",
        maxWidth: "calc(100vw - 1rem)",
      }}
    >
      {/* Sheet: Hòm thư / Code / Event */}
      <div
        ref={sheetRef}
        className={cn(
          "pointer-events-auto mb-2 w-[min(340px,calc(100vw-1.5rem))]",
          "transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] origin-bottom",
          sheetOpen
            ? "opacity-100 translate-y-0 scale-100 visible"
            : "opacity-0 translate-y-3 scale-95 invisible pointer-events-none"
        )}
        aria-hidden={!sheetOpen}
      >
        <div className="u041-sheet relative rounded-[24px] border border-[var(--u041-line)] bg-[var(--u041-surface)] px-3 pt-2 pb-3 text-[var(--u041-ink)] shadow-xl">
          <button
            type="button"
            onClick={() => {
              setSheetOpen(false);
              setInboxView(false);
            }}
            className="mx-auto mb-2 flex h-8 w-11 items-center justify-center rounded-full text-[var(--u041-ink-3)] hover:bg-[var(--u041-surface-2)] hover:text-[var(--u041-ink)]"
            aria-label="Đóng"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {inboxView ? (
            <InboxDockPanel open={inboxView} onBack={() => setInboxView(false)} />
          ) : (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setInboxView(true)}
                className="relative flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[var(--u041-line)] bg-[var(--u041-surface-2)] px-4 text-[var(--u041-ink)] transition hover:opacity-90"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16v12H4z" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
                <span className="text-[15px] font-medium tracking-wide">Hòm thư</span>
                {inboxUnread > 0 ? (
                  <span className="absolute right-3 top-1/2 flex h-[18px] min-w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-[#FF5A6E] px-1 text-[10px] font-bold text-white">
                    {inboxUnread > 9 ? "9+" : inboxUnread}
                  </span>
                ) : null}
              </button>
              {MORE.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.href, item.section)}
                  className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-[var(--u041-line)] bg-[var(--u041-surface-2)] px-4 text-[var(--u041-ink)] transition hover:opacity-90"
                >
                  <span className="flex h-6 w-6 items-center justify-center">
                    <DockIcon src={item.icon} className="h-6 w-6" />
                  </span>
                  <span className="text-[15px] font-medium tracking-wide">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notched bar #041 */}
      <div
        ref={rootRef}
        className="ux u041 pointer-events-auto"
        style={{ ["--x" as string]: "50%" }}
      >
        <span className="u041-shadow" aria-hidden />
        <div className="u041-bar" aria-hidden />
        <span className="u041-bub" aria-hidden />
        <ul className="u041-tabs" role="tablist" aria-label="Điều hướng">
          {MAIN.map((item, i) => {
            const selectedTab = selected === i;
            const label = t(item.labelKey) || item.fallback;
            if (item.kind === "plus") {
              return (
                <li key={item.id} role="none">
                  <button
                    ref={(el) => {
                      tabRefs.current[i] = el;
                      (plusRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
                    }}
                    type="button"
                    role="tab"
                    className="u041-tab"
                    aria-selected={selectedTab}
                    aria-expanded={sheetOpen}
                    aria-label={sheetOpen ? "Đóng menu thêm" : "Mở Hòm thư, Code & Sự kiện"}
                    tabIndex={selectedTab ? 0 : -1}
                    onClick={() =>
                      setSheetOpen((v) => {
                        if (v) setInboxView(false);
                        return !v;
                      })
                    }
                    onKeyDown={(e) => {
                      const d =
                        e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                      if (!d) return;
                      e.preventDefault();
                      const next = (i + d + MAIN.length) % MAIN.length;
                      const nextItem = MAIN[next];
                      if (nextItem.kind === "plus") {
                        setSheetOpen(true);
                        tabRefs.current[next]?.focus();
                      } else if (nextItem.href) {
                        go(nextItem.href, nextItem.section);
                      }
                    }}
                  >
                    <span className="u041-ic" aria-hidden>
                      <DockIcon
                        src={item.icon}
                        className="h-full w-full"
                        invert={selectedTab}
                      />
                    </span>
                    {inboxUnread > 0 ? (
                      <em className="u041-bd" aria-label={`${inboxUnread} thư chưa đọc`}>
                        {inboxUnread > 9 ? "9+" : inboxUnread}
                      </em>
                    ) : null}
                    <span className="u041-lab">{label}</span>
                  </button>
                </li>
              );
            }
            return (
              <li key={item.id} role="none">
                <button
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  className="u041-tab"
                  aria-selected={selectedTab}
                  tabIndex={selectedTab ? 0 : -1}
                  onClick={() => {
                    if (item.href) go(item.href, item.section);
                  }}
                  onKeyDown={(e) => {
                    const d =
                      e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    const next = (i + d + MAIN.length) % MAIN.length;
                    const nextItem = MAIN[next];
                    if (nextItem.kind === "plus") {
                      setSheetOpen(true);
                      tabRefs.current[next]?.focus();
                    } else if (nextItem.href) {
                      go(nextItem.href, nextItem.section);
                    }
                  }}
                >
                  <span className="u041-ic" aria-hidden>
                    <DockIcon
                      src={item.icon}
                      className="h-full w-full"
                      invert={selectedTab}
                    />
                  </span>
                  <span className="u041-lab">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <style jsx global>{`
        .u041-wrap {
          --u041-page: var(--background, #f4f2ee);
          --u041-surface: var(--surface, #ffffff);
          --u041-surface-2: var(--surface-elevated, #f5f3ef);
          --u041-ink: var(--foreground, #16151b);
          --u041-ink-2: var(--foreground-muted, #57535f);
          --u041-ink-3: var(--foreground-subtle, #8e8a97);
          --u041-line: var(--border, rgba(22, 21, 27, 0.09));
          --u041-accent: #6a57f2;
          --u041-accent-ink: #ffffff;
          --u041-shadow: rgba(40, 30, 80, 0.14);
          --u041-shadow-strong: rgba(40, 30, 80, 0.3);
          --u041-grad: linear-gradient(120deg, #7b61ff, #3d8bff 55%, #1fb89a);
          --u041-spring: cubic-bezier(0.34, 1.45, 0.64, 1);
        }
        html[data-theme="dark"] .u041-wrap,
        html.dark .u041-wrap {
          --u041-page: #07080d;
          --u041-surface: #13141c;
          --u041-surface-2: #1a1b25;
          --u041-ink: #f4f0e8;
          --u041-ink-2: rgba(244, 240, 232, 0.68);
          --u041-ink-3: rgba(244, 240, 232, 0.42);
          --u041-line: rgba(255, 255, 255, 0.08);
          --u041-accent: #b7a4ff;
          --u041-accent-ink: #0b0c12;
          --u041-shadow: rgba(0, 0, 0, 0.45);
          --u041-shadow-strong: rgba(0, 0, 0, 0.72);
          --u041-grad: linear-gradient(120deg, #b7a4ff, #7db4ff 55%, #a5f2d3);
        }
        .u041 {
          --x: 50%;
          position: relative;
          width: min(350px, calc(100vw - 1.25rem));
          height: 120px;
          display: flex;
          align-items: flex-end;
        }
        .u041-bar {
          position: relative;
          width: 100%;
          height: 84px;
          border-radius: 28px;
          background: var(--u041-surface);
          -webkit-mask: radial-gradient(
            circle 42px at var(--x) -4px,
            transparent 96%,
            #000 100%
          );
          mask: radial-gradient(
            circle 42px at var(--x) -4px,
            transparent 96%,
            #000 100%
          );
          box-shadow: 0 0 0 1px var(--u041-line);
        }
        .u041-shadow {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 84px;
          border-radius: 28px;
          box-shadow: 0 24px 40px -24px var(--u041-shadow-strong);
          pointer-events: none;
        }
        .u041-bub {
          position: absolute;
          left: var(--x);
          top: calc(100% - 84px - 35px);
          width: 62px;
          height: 62px;
          margin-left: -31px;
          border-radius: 50%;
          background: var(--u041-grad);
          box-shadow: 0 14px 26px -12px rgba(91, 72, 255, 0.55);
          pointer-events: none;
        }
        .u041-tabs {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 84px;
          display: flex;
          margin: 0;
          padding: 0 10px;
          list-style: none;
        }
        .u041-tabs > li {
          flex: 1;
          display: flex;
        }
        .u041-tab {
          position: relative;
          flex: 1;
          height: 100%;
          border: 0;
          padding: 0;
          background: none;
          color: var(--u041-ink-3);
          cursor: pointer;
        }
        .u041-tab:hover .u041-ic {
          color: var(--u041-ink);
        }
        .u041-tab:focus-visible {
          outline: 2px solid var(--u041-accent);
          outline-offset: -6px;
          border-radius: 18px;
        }
        .u041-ic {
          position: absolute;
          left: 50%;
          top: 22px;
          width: 26px;
          height: 26px;
          margin-left: -13px;
          color: currentColor;
          transition: transform 0.55s var(--u041-spring), color 0.3s;
        }
        .u041-lab {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 12px;
          font-size: 11px;
          font-weight: 700;
          color: var(--u041-ink);
          opacity: 0;
          transform: translateY(6px);
          transition: opacity 0.3s, transform 0.45s var(--u041-spring);
          text-align: center;
          pointer-events: none;
        }
        .u041-tab[aria-selected="true"] .u041-ic {
          transform: translateY(-39px);
          color: var(--u041-accent-ink);
        }
        .u041-tab[aria-selected="true"] .u041-lab {
          opacity: 1;
          transform: none;
        }
        .u041-bd {
          position: absolute;
          left: calc(50% + 6px);
          top: 16px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: #ff5a6e;
          color: #fff;
          font-size: 10.5px;
          font-weight: 800;
          line-height: 18px;
          font-style: normal;
          box-shadow: 0 0 0 2.5px var(--u041-surface);
          transition: transform 0.45s var(--u041-spring), opacity 0.3s;
          text-align: center;
        }
        .u041-tab[aria-selected="true"] .u041-bd {
          transform: scale(0);
          opacity: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .u041,
          .u041 *,
          .u041 *::before,
          .u041 *::after {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );

  return createPortal(ui, document.body);
}
