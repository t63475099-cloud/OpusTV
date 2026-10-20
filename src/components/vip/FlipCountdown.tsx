"use client";

/* Lucian UX/UI Prompt #100 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#100 */

import { useEffect, useRef } from "react";

type FlipCardProps = {
  value: string;
  warn?: boolean;
};

/**
 * Một chữ số flip đồng bộ đúng thuật toán #100:
 * - Chỉ lật khi value đổi
 * - Mặt trên nhảy sang số mới ngay; mặt dưới giữ số cũ đến hết animation
 * - ft (fold top) = số cũ, fb (fold bottom) = số mới — không lệch pha
 */
function FlipCard({ value, warn }: FlipCardProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const topRef = useRef<HTMLElement>(null);
  const botRef = useRef<HTMLElement>(null);
  const ftRef = useRef<HTMLSpanElement>(null);
  const fbRef = useRef<HTMLSpanElement>(null);
  const valRef = useRef(value);

  useEffect(() => {
    const v = value;
    if (v === valRef.current) return;
    const old = valRef.current;
    valRef.current = v;

    const top = topRef.current;
    const bot = botRef.current;
    const ft = ftRef.current;
    const fb = fbRef.current;
    const root = rootRef.current;
    if (!top || !bot || !ft || !fb || !root) return;

    const rm =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    top.textContent = v;
    const ftB = ft.querySelector("b");
    const fbB = fb.querySelector("b");
    if (ftB) ftB.textContent = old;
    if (fbB) fbB.textContent = v;

    if (rm) {
      bot.textContent = v;
      return;
    }

    bot.textContent = old;
    root.classList.remove("is-flip");
    void root.offsetWidth;
    root.classList.add("is-flip");

    const onEnd = (e: AnimationEvent) => {
      if (e.target !== fb) return;
      bot.textContent = valRef.current;
      root.classList.remove("is-flip");
      fb.removeEventListener("animationend", onEnd);
    };
    fb.addEventListener("animationend", onEnd);
    return () => fb.removeEventListener("animationend", onEnd);
  }, [value]);

  useEffect(() => {
    if (topRef.current) topRef.current.textContent = value;
    if (botRef.current) botRef.current.textContent = value;
    valRef.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span
      ref={rootRef}
      className={"u100-fl" + (warn ? " is-warn" : "")}
      aria-hidden
    >
      <span className="u100-t">
        <b ref={topRef}>{value}</b>
      </span>
      <span className="u100-b">
        <b ref={botRef}>{value}</b>
      </span>
      <span className="u100-ft" ref={ftRef}>
        <b>{value}</b>
      </span>
      <span className="u100-fb" ref={fbRef}>
        <b>{value}</b>
      </span>
    </span>
  );
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0").slice(-2);
}

export function FlipCountdown({
  days,
  hours,
  minutes,
  seconds,
  active,
}: {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  active: boolean;
}) {
  const totalSec = days * 86400 + hours * 3600 + minutes * 60 + seconds;
  const warn = active && totalSec > 0 && totalSec <= 10;
  const dayStr =
    days > 99 ? String(Math.min(999, days)) : pad2(days);
  const d1 = dayStr.length >= 2 ? dayStr[dayStr.length - 2] : "0";
  const d2 = dayStr[dayStr.length - 1];
  const d0 = dayStr.length >= 3 ? dayStr[dayStr.length - 3] : null;
  const h = pad2(hours);
  const m = pad2(minutes);
  const s = pad2(seconds);

  return (
    <div
      className={
        "ux u100-vip" + (warn ? " warn" : "") + (active ? " run" : "")
      }
    >
      <div className="u100-clk" role="timer" aria-live="off">
        <div className="u100-unit">
          <div className="u100-pair">
            {d0 != null ? <FlipCard value={d0} warn={warn} /> : null}
            <FlipCard value={d1} warn={warn} />
            <FlipCard value={d2} warn={warn} />
          </div>
          <span className="u100-ulab">NGÀY</span>
        </div>
        <span className="u100-co" aria-hidden>
          <i />
          <i />
        </span>
        <div className="u100-unit">
          <div className="u100-pair">
            <FlipCard value={h[0]} warn={warn} />
            <FlipCard value={h[1]} warn={warn} />
          </div>
          <span className="u100-ulab">GIỜ</span>
        </div>
        <span className="u100-co" aria-hidden>
          <i />
          <i />
        </span>
        <div className="u100-unit">
          <div className="u100-pair">
            <FlipCard value={m[0]} warn={warn} />
            <FlipCard value={m[1]} warn={warn} />
          </div>
          <span className="u100-ulab">PHÚT</span>
        </div>
        <span className="u100-co" aria-hidden>
          <i />
          <i />
        </span>
        <div className="u100-unit">
          <div className="u100-pair">
            <FlipCard value={s[0]} warn={warn} />
            <FlipCard value={s[1]} warn={warn} />
          </div>
          <span className="u100-ulab">GIÂY</span>
        </div>
      </div>

      <style jsx global>{`
        .u100-vip {
          --u100-line: var(--border, rgba(255, 255, 255, 0.08));
          --u100-ink-3: var(--foreground-subtle, rgba(244, 240, 232, 0.42));
        }
        .u100-vip .u100-clk {
          display: flex;
          align-items: flex-start;
          justify-content: center;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 4px;
        }
        .u100-vip .u100-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .u100-vip .u100-pair {
          display: flex;
          gap: 3px;
        }
        .u100-vip .u100-ulab {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          color: var(--u100-ink-3);
        }
        .u100-vip .u100-co {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 18px 2px 0;
        }
        .u100-vip .u100-co i {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--u100-ink-3);
        }
        .u100-vip.run .u100-co i {
          animation: u100-blink 1s steps(1) infinite;
        }
        @keyframes u100-blink {
          50% {
            opacity: 0.25;
          }
        }
        .u100-vip .u100-fl {
          position: relative;
          width: 28px;
          height: 40px;
          border-radius: 8px;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 40px;
          text-align: center;
          color: #f3f1ec;
          box-shadow: 0 0 0 1px var(--u100-line),
            0 6px 12px -8px rgba(0, 0, 0, 0.55);
          font-variant-numeric: tabular-nums;
          overflow: hidden;
        }
        @media (min-width: 400px) {
          .u100-vip .u100-fl {
            width: 32px;
            height: 46px;
            font-size: 26px;
            line-height: 46px;
          }
        }
        .u100-vip.warn .u100-fl,
        .u100-vip .u100-fl.is-warn {
          color: #ffb547;
        }
        .u100-vip .u100-fl > span {
          position: absolute;
          left: 0;
          right: 0;
          height: 50%;
          overflow: hidden;
          background: #1f2027;
        }
        .u100-vip .u100-fl > span b {
          position: absolute;
          left: 0;
          right: 0;
          height: 40px;
          font: inherit;
        }
        @media (min-width: 400px) {
          .u100-vip .u100-fl > span b {
            height: 46px;
          }
        }
        .u100-vip .u100-t,
        .u100-vip .u100-ft {
          top: 0;
          border-radius: 8px 8px 0 0;
          transform-origin: 50% 100%;
          background: linear-gradient(#26272f, #1f2027) !important;
        }
        .u100-vip .u100-b,
        .u100-vip .u100-fb {
          bottom: 0;
          border-radius: 0 0 8px 8px;
          transform-origin: 50% 0;
        }
        .u100-vip .u100-b b,
        .u100-vip .u100-fb b {
          top: -20px;
        }
        @media (min-width: 400px) {
          .u100-vip .u100-b b,
          .u100-vip .u100-fb b {
            top: -23px;
          }
        }
        .u100-vip .u100-t b,
        .u100-vip .u100-ft b {
          top: 0;
        }
        .u100-vip .u100-ft {
          z-index: 2;
          transform: perspective(240px) rotateX(-90deg);
          pointer-events: none;
        }
        .u100-vip .u100-fb {
          z-index: 2;
          transform: perspective(240px) rotateX(90deg);
          pointer-events: none;
        }
        .u100-vip .u100-fl.is-flip .u100-ft {
          animation: u100-fold-top 0.24s cubic-bezier(0.55, 0, 0.9, 0.6) forwards;
        }
        .u100-vip .u100-fl.is-flip .u100-fb {
          animation: u100-fold-bot 0.3s 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.25)
            forwards;
        }
        @keyframes u100-fold-top {
          from {
            transform: perspective(240px) rotateX(0deg);
            filter: brightness(1);
          }
          to {
            transform: perspective(240px) rotateX(-90deg);
            filter: brightness(0.6);
          }
        }
        @keyframes u100-fold-bot {
          from {
            transform: perspective(240px) rotateX(90deg);
            filter: brightness(1.5);
          }
          to {
            transform: perspective(240px) rotateX(0deg);
            filter: brightness(1);
          }
        }
        .u100-vip .u100-fl::after {
          content: "";
          position: absolute;
          left: 0;
          right: 0;
          top: 50%;
          z-index: 3;
          height: 1px;
          margin-top: -0.5px;
          background: rgba(0, 0, 0, 0.55);
        }
        @media (prefers-reduced-motion: reduce) {
          .u100-vip .u100-fl.is-flip .u100-ft,
          .u100-vip .u100-fl.is-flip .u100-fb {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
