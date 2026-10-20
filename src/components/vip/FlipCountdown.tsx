"use client";

/* Lucian UX/UI Prompt #100 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#100 */

import { useEffect, useRef, useState } from "react";

type FlipCardProps = {
  value: string;
  warn?: boolean;
};

function FlipCard({ value, warn }: FlipCardProps) {
  const [display, setDisplay] = useState(value);
  const [prev, setPrev] = useState(value);
  const [flipping, setFlipping] = useState(false);
  const rmRef = useRef(false);

  useEffect(() => {
    rmRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    if (value === display) return;
    if (rmRef.current) {
      setDisplay(value);
      setPrev(value);
      return;
    }
    setPrev(display);
    setFlipping(true);
    const t = window.setTimeout(() => {
      setDisplay(value);
      setFlipping(false);
    }, 540);
    return () => window.clearTimeout(t);
  }, [value, display]);

  return (
    <span
      className={"u100-fl" + (warn ? " warn" : "") + (flipping ? " is-flip" : "")}
      aria-hidden
    >
      <span className="u100-t">
        <b>{flipping ? prev : display}</b>
      </span>
      <span className="u100-b">
        <b>{flipping ? prev : display}</b>
      </span>
      <span className="u100-ft">
        <b>{prev}</b>
      </span>
      <span className="u100-fb">
        <b>{display}</b>
      </span>
    </span>
  );
}

function pad2(n: number) {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0").slice(-2);
}

/** Đếm ngược VIP — hiệu ứng flip #100, dữ liệu thật từ expiresAt */
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
  const d = pad2(days);
  const h = pad2(hours);
  const m = pad2(minutes);
  const s = pad2(seconds);

  return (
    <div className={"ux u100-vip" + (warn ? " warn" : "") + (active ? " run" : "")}>
      <div className="u100-clk" role="timer" aria-live="off">
        <div className="u100-unit">
          <div className="u100-pair">
            <FlipCard value={d[0]} warn={warn} />
            <FlipCard value={d[1]} warn={warn} />
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
          --u100-surface: var(--surface, #13141c);
          --u100-line: var(--border, rgba(255, 255, 255, 0.08));
          --u100-ink: var(--foreground, #f4f0e8);
          --u100-ink-3: var(--foreground-subtle, rgba(244, 240, 232, 0.42));
          --u100-spring: cubic-bezier(0.34, 1.45, 0.64, 1);
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
          padding: 22px 2px 0;
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
          box-shadow: 0 0 0 1px var(--u100-line), 0 6px 12px -8px rgba(0, 0, 0, 0.55);
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
        .u100-vip.warn .u100-fl {
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
        }
        .u100-vip .u100-fb {
          z-index: 2;
          transform: perspective(240px) rotateX(90deg);
        }
        .u100-vip .u100-fl.is-flip .u100-ft {
          animation: u100-fold-top 0.24s cubic-bezier(0.55, 0, 0.9, 0.6) forwards;
        }
        .u100-vip .u100-fl.is-flip .u100-fb {
          animation: u100-fold-bot 0.3s 0.24s cubic-bezier(0.2, 0.9, 0.3, 1.25) forwards;
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
