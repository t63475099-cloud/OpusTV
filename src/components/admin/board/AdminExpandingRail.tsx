"use client";

/* Lucian UX/UI Prompt #040 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#040 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type AdminRailTabId =
  | "ACCOUNTS"
  | "MOVIES"
  | "KEY-BOARD"
  | "PAYMENT"
  | "VERIFY"
  | "GIFTCODE"
  | "MODERATION"
  | "MASS"
  | "SYSTEM";

const RAIL_TABS: {
  id: AdminRailTabId;
  label: string;
  i: number;
  paths: string; // SVG path(s) as children markup via icon key
  icon: "users" | "film" | "key" | "card" | "check" | "gift" | "shield" | "star" | "sliders";
}[] = [
  { id: "ACCOUNTS", label: "Tài khoản", i: 0, icon: "users", paths: "" },
  { id: "MOVIES", label: "Phim & Tập", i: 1, icon: "film", paths: "" },
  { id: "KEY-BOARD", label: "Key-board", i: 2, icon: "key", paths: "" },
  { id: "PAYMENT", label: "Mua Key", i: 3, icon: "card", paths: "" },
  { id: "VERIFY", label: "Xác minh", i: 4, icon: "check", paths: "" },
  { id: "GIFTCODE", label: "Giftcode & Sự kiện", i: 5, icon: "gift", paths: "" },
  { id: "MODERATION", label: "Báo lỗi & Kiểm duyệt", i: 6, icon: "shield", paths: "" },
  { id: "MASS", label: "Phát thưởng", i: 7, icon: "star", paths: "" },
  { id: "SYSTEM", label: "Hệ thống & AI", i: 8, icon: "sliders", paths: "" },
];

function RailIcon({ name }: { name: (typeof RAIL_TABS)[number]["icon"] }) {
  const common = {
    viewBox: "0 0 24 24",
    "aria-hidden": true as const,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case "film":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 12h18" />
        </svg>
      );
    case "key":
      return (
        <svg {...common}>
          <circle cx="8" cy="15" r="4" />
          <path d="M10.85 12.15L19 4M18 5l2 2M15 8l2 2" />
        </svg>
      );
    case "card":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M9 12l2 2 4-4" />
          <circle cx="12" cy="12" r="9" />
        </svg>
      );
    case "gift":
      return (
        <svg {...common}>
          <rect x="3" y="8" width="18" height="13" rx="2" />
          <path d="M12 8v13M3 12h18" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 2l3 6 6 .9-4.3 4.2 1 6-5.7-3-5.7 3 1-6L3 8.9 9 8z" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...common}>
          <path d="M5 19.5V13M5 9V4.5M12 19.5V11M12 7V4.5M19 19.5V15M19 11V4.5M3 13h4M10 7h4M17 15h4" />
        </svg>
      );
    default:
      return null;
  }
}

export function AdminExpandingRail({
  activeTab,
  onTabChange,
  paymentPending = 0,
  adminLabel = "OpusFilm Admin",
  adminSub = "Master Board",
  titleExtra,
  children,
  theme = "dark",
}: {
  activeTab: AdminRailTabId;
  onTabChange: (id: AdminRailTabId) => void;
  paymentPending?: number;
  adminLabel?: string;
  adminSub?: string;
  titleExtra?: ReactNode;
  children: ReactNode;
  theme?: "dark" | "light";
}) {
  const [wide, setWide] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [y, setY] = useState(0);

  const activeIndex = Math.max(
    0,
    RAIL_TABS.findIndex((t) => t.id === activeTab)
  );
  const activeLabel = RAIL_TABS[activeIndex]?.label || "Tài khoản";

  const placeHighlight = useCallback(() => {
    const btn = itemRefs.current[activeIndex];
    if (!btn || !navRef.current) return;
    const li = btn.parentElement;
    if (!li) return;
    setY(li.offsetTop);
  }, [activeIndex]);

  useLayoutEffect(() => {
    placeHighlight();
  }, [placeHighlight, wide, activeTab]);

  useEffect(() => {
    const onResize = () => placeHighlight();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [placeHighlight]);

  return (
    <div
      ref={rootRef}
      data-theme={theme}
      className={"ux u040" + (wide ? " is-wide" : "") + (theme === "light" ? " u040-light" : " u040-dark")}
    >
      <nav className="u040-rail" aria-label="Admin menu">
        <div className="u040-top">
          <span className="u040-logo" aria-hidden />
          <span className="u040-name">OpusFilm</span>
        </div>
        <button
          className="u040-tog"
          type="button"
          aria-expanded={wide}
          aria-label={wide ? "Thu gọn menu" : "Mở rộng menu"}
          onClick={() => setWide((w) => !w)}
        >
          <svg viewBox="0 0 16 16">
            <path d="M6 3.5L10.5 8 6 12.5" />
          </svg>
        </button>

        <ul className="u040-nav" ref={navRef}>
          <li
            className="u040-hl"
            role="presentation"
            style={{ transform: `translateY(${y}px)` }}
          />
          {RAIL_TABS.map((item, idx) => {
            const current = item.id === activeTab;
            const showBadge = item.id === "PAYMENT" && paymentPending > 0;
            return (
              <li key={item.id}>
                <button
                  ref={(el) => {
                    itemRefs.current[idx] = el;
                  }}
                  className="u040-it"
                  type="button"
                  style={{ ["--i" as string]: item.i }}
                  aria-current={current ? "page" : undefined}
                  onClick={() => onTabChange(item.id)}
                  onKeyDown={(e) => {
                    const d =
                      e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
                    if (!d) return;
                    e.preventDefault();
                    const next = (idx + d + RAIL_TABS.length) % RAIL_TABS.length;
                    itemRefs.current[next]?.focus();
                  }}
                >
                  <RailIcon name={item.icon} />
                  <span>{item.label}</span>
                  {showBadge ? (
                    <em className="u040-bd" aria-label={`${paymentPending} chờ duyệt`}>
                      {paymentPending > 99 ? "99+" : paymentPending}
                    </em>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="u040-me">
          <i aria-hidden />
          <span>
            {adminLabel}
            <small>{adminSub}</small>
          </span>
        </div>
      </nav>

      <section className="u040-main" aria-live="polite">
        <div className="u040-main-head">
          <div className="min-w-0 flex-1">
            <small>OpusFilm · Master Board</small>
            <h3 key={activeTab}>{activeLabel}</h3>
          </div>
          {titleExtra ? <div className="u040-main-actions">{titleExtra}</div> : null}
        </div>
        <div className="u040-main-body">{children}</div>
      </section>

      <style jsx global>{`
        .u040 {
          --rw: 76px;
          position: relative;
          display: flex;
          gap: 16px;
          width: 100%;
          min-height: calc(100vh - 32px);
          padding: 16px;
          box-sizing: border-box;
          font-family: inherit;
          -webkit-font-smoothing: antialiased;
        }
        /* Dark (default) */
        .u040.u040-dark {
          --ux-page: #07080d;
          --ux-surface: #13141c;
          --ux-surface-2: #1a1b25;
          --ux-ink: #f4f0e8;
          --ux-ink-2: rgba(244, 240, 232, 0.68);
          --ux-ink-3: rgba(244, 240, 232, 0.42);
          --ux-line: rgba(255, 255, 255, 0.08);
          --ux-rail: #16151b;
          --ux-rail-ink: #f4f2ee;
          color: var(--ux-ink);
          background: var(--ux-page);
        }
        /* Light — tương phản rõ, không chữ trắng trên nền sáng */
        .u040.u040-light {
          --ux-page: #f4f2ee;
          --ux-surface: #ffffff;
          --ux-surface-2: #f5f3ef;
          --ux-ink: #16151b;
          --ux-ink-2: #57535f;
          --ux-ink-3: #8e8a97;
          --ux-line: rgba(22, 21, 27, 0.09);
          --ux-rail: #16151b;
          --ux-rail-ink: #f4f2ee;
          color: var(--ux-ink);
          background: var(--ux-page);
        }
        .u040.is-wide {
          --rw: 236px;
        }
        .u040-rail {
          position: sticky;
          top: 16px;
          flex: none;
          width: var(--rw);
          min-height: 640px;
          height: calc(100vh - 32px);
          padding: 12px 10px 76px;
          border-radius: 24px;
          background: var(--ux-rail, #16151b);
          color: var(--ux-rail-ink, #f4f2ee);
          overflow: hidden;
          transition: width 0.6s cubic-bezier(0.34, 1.45, 0.64, 1);
          z-index: 20;
        }
        .u040-top {
          display: flex;
          align-items: center;
          gap: 10px;
          height: 44px;
          margin-bottom: 14px;
        }
        .u040-logo {
          width: 36px;
          height: 36px;
          flex: none;
          margin-left: 10px;
          border-radius: 12px;
          background: linear-gradient(120deg, #b7a4ff, #7db4ff 55%, #a5f2d3);
        }
        .u040-name {
          font-size: 15.5px;
          font-weight: 780;
          letter-spacing: -0.03em;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .u040.is-wide .u040-name {
          opacity: 1;
          transition: opacity 0.3s 0.15s;
        }
        .u040-tog {
          position: absolute;
          right: -1px;
          top: 16px;
          width: 30px;
          height: 36px;
          border: 0;
          padding: 0;
          border-radius: 10px 0 0 10px;
          background: color-mix(in srgb, var(--ux-rail-ink, #f4f2ee) 14%, transparent);
          color: inherit;
          display: grid;
          place-items: center;
          opacity: 0;
          transition: opacity 0.2s;
          cursor: pointer;
        }
        .u040-rail:hover .u040-tog,
        .u040-tog:focus-visible,
        .u040.is-wide .u040-tog {
          opacity: 1;
        }
        @media (hover: none) {
          .u040-tog {
            opacity: 1;
          }
        }
        .u040-tog svg {
          width: 16px;
          height: 16px;
          fill: none;
          stroke: currentColor;
          stroke-width: 2.4;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: transform 0.5s cubic-bezier(0.34, 1.45, 0.64, 1);
        }
        .u040.is-wide .u040-tog svg {
          transform: rotate(180deg);
        }
        .u040-nav {
          position: relative;
          margin: 0;
          padding: 0;
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .u040-hl {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          height: 48px;
          border-radius: 15px;
          background: color-mix(in srgb, var(--ux-rail-ink, #f4f2ee) 15%, transparent);
          transition: transform 0.5s cubic-bezier(0.34, 1.45, 0.64, 1);
          pointer-events: none;
        }
        .u040-hl::before {
          content: "";
          position: absolute;
          left: -10px;
          top: 12px;
          bottom: 12px;
          width: 4px;
          border-radius: 0 4px 4px 0;
          background: linear-gradient(120deg, #b7a4ff, #7db4ff 55%, #a5f2d3);
        }
        .u040-it {
          position: relative;
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          height: 48px;
          padding: 0 0 0 16px;
          border: 0;
          border-radius: 15px;
          background: none;
          color: inherit;
          opacity: 0.62;
          text-align: left;
          transition: opacity 0.25s;
          cursor: pointer;
        }
        .u040-it:hover,
        .u040-it[aria-current="page"] {
          opacity: 1;
        }
        .u040-it:focus-visible {
          outline: 2px solid #b7a4ff;
          outline-offset: -2px;
        }
        .u040-it svg {
          width: 22px;
          height: 22px;
          flex: none;
        }
        .u040-it span {
          font-size: 14px;
          font-weight: 650;
          white-space: nowrap;
          opacity: 0;
          transform: translateX(-8px);
          transition: opacity 0.2s, transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
        }
        .u040.is-wide .u040-it span {
          opacity: 1;
          transform: none;
          transition: opacity 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
            transform 0.5s cubic-bezier(0.34, 1.45, 0.64, 1);
          transition-delay: calc(0.12s + var(--i, 0) * 35ms);
        }
        .u040-bd {
          position: absolute;
          left: 34px;
          top: 9px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          border-radius: 9px;
          background: #ff5a6e;
          color: #fff;
          font-size: 10.5px;
          font-weight: 800;
          display: grid;
          place-items: center;
          font-style: normal;
          box-shadow: 0 0 0 2.5px var(--ux-rail, #16151b);
          transition: left 0.5s cubic-bezier(0.34, 1.45, 0.64, 1);
        }
        .u040.is-wide .u040-bd {
          left: 202px;
        }
        .u040-me {
          position: absolute;
          left: 10px;
          right: 10px;
          bottom: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          height: 52px;
          padding: 0 0 0 10px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--ux-rail-ink, #f4f2ee) 8%, transparent);
        }
        .u040-me i {
          width: 34px;
          height: 34px;
          flex: none;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #ffd3a8, #ff7a93 60%, #8b6cff);
        }
        .u040-me span {
          font-size: 13px;
          font-weight: 650;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.25s;
        }
        .u040-me small {
          display: block;
          font-size: 11.5px;
          opacity: 0.6;
        }
        .u040.is-wide .u040-me span {
          opacity: 1;
          transition-delay: 0.25s;
        }
        .u040-main {
          flex: 1;
          min-width: 0;
          padding: 18px 20px 24px;
          border-radius: 24px;
          background: var(--ux-surface);
          color: var(--ux-ink);
          box-shadow: 0 0 0 1px var(--ux-line);
          overflow-x: auto;
        }
        .u040-main-head {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
        }
        .u040-main small {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--ux-ink-3);
        }
        .u040-main h3 {
          margin: 4px 0 0;
          font-size: 21px;
          font-weight: 780;
          letter-spacing: -0.035em;
          color: var(--ux-ink);
        }
        .u040-main-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }
        .u040-main-body {
          min-width: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .u040,
          .u040 *,
          .u040 *::before,
          .u040 *::after {
            animation-duration: 0.001ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.001ms !important;
          }
        }
        @media (max-width: 900px) {
          .u040 {
            flex-direction: column;
            padding: 8px;
            gap: 10px;
          }
          .u040-rail {
            position: relative;
            top: 0;
            width: 100%;
            height: auto;
            min-height: 0;
            padding-bottom: 12px;
          }
          .u040.is-wide .u040-rail,
          .u040-rail {
            --rw: 100%;
            width: 100%;
          }
          .u040-me {
            position: relative;
            left: 0;
            right: 0;
            bottom: 0;
            margin-top: 8px;
          }
          .u040-me span {
            opacity: 1;
          }
          .u040-name {
            opacity: 1;
          }
          .u040-it span {
            opacity: 1;
            transform: none;
          }
          .u040-nav {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 4px;
          }
          .u040-hl {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
