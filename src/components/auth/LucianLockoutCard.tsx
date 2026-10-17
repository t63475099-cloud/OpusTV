/* Lucian UX/UI Prompt #067 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#067 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  /** Tổng số giây khóa (mặc định 60) */
  lockSeconds?: number;
  /** Số lần sai mật khẩu đã dẫn tới khóa */
  failCount?: number;
  onUnlocked?: () => void;
  /** Thay “Email reset” — mở khôi phục PIN OpusFilm */
  onRecoverInstead?: () => void;
};

function formatMmSs(total: number) {
  const s = Math.max(0, Math.ceil(total));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? `0${r}` : r}`;
}

export function LucianLockoutCard({
  lockSeconds = 60,
  failCount = 5,
  onUnlocked,
  onRecoverInstead,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const t0 = useRef(0);
  const raf = useRef(0);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(1);
  const [label, setLabel] = useState(formatMmSs(lockSeconds));
  const [timeHtml, setTimeHtml] = useState<{ kind: "digit" | "sep"; v: string }[]>([]);
  const [mailSent, setMailSent] = useState(false);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const buildDigits = useCallback((str: string) => {
    setTimeHtml(
      str.split("").map((c) => {
        if (c < "0" || c > "9") return { kind: "sep" as const, v: c };
        return { kind: "digit" as const, v: c };
      })
    );
  }, []);

  const unlock = useCallback(() => {
    setOpen(true);
    setProgress(0);
    setLabel("0:00");
    buildDigits("0:00");
  }, [buildDigits]);

  const startLock = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setOpen(false);
    setMailSent(false);
    t0.current = performance.now();
    buildDigits(formatMmSs(lockSeconds));

    const tick = (now: number) => {
      if (!rootRef.current) return;
      const left = Math.max(0, lockSeconds - (now - t0.current) / 1000);
      setProgress(left / lockSeconds);
      const str = formatMmSs(left);
      setLabel(str);
      buildDigits(str);
      if (left <= 0) {
        unlock();
        return;
      }
      raf.current = requestAnimationFrame(tick);
    };

    if (reduced) {
      // Vẫn đếm nhưng cập nhật theo interval thô
      const id = setInterval(() => {
        const left = Math.max(
          0,
          lockSeconds - (performance.now() - t0.current) / 1000
        );
        setProgress(left / lockSeconds);
        buildDigits(formatMmSs(left));
        setLabel(formatMmSs(left));
        if (left <= 0) {
          clearInterval(id);
          unlock();
        }
      }, 250);
      return () => clearInterval(id);
    }

    raf.current = requestAnimationFrame(tick);
  }, [buildDigits, lockSeconds, reduced, unlock]);

  useEffect(() => {
    const cleanup = startLock();
    return () => {
      cancelAnimationFrame(raf.current);
      if (typeof cleanup === "function") cleanup();
    };
  }, [startLock]);

  const tryAgain = () => {
    if (!open) return;
    onUnlocked?.();
  };

  return (
    <div
      ref={rootRef}
      className={`ux u067${open ? " is-open" : ""}`}
      data-opus-lockout="1"
    >
      <div
        className="u067-dial"
        role="timer"
        aria-live="off"
        aria-label={open ? "Hết thời gian khóa" : `Còn ${label}`}
        style={{ ["--p" as string]: progress.toFixed(4) }}
      >
        <svg viewBox="0 0 168 168" aria-hidden="true">
          <circle className="t" cx="84" cy="84" r="78" />
          <circle className="p" cx="84" cy="84" r="78" pathLength={100} />
        </svg>
        <span className="u067-ticks" aria-hidden="true" />
        <span className="u067-lock" aria-hidden="true">
          <svg viewBox="0 0 62 70">
            <path
              className="u067-sh"
              d="M16 32V22a15 15 0 0 1 30 0v10"
            />
            <rect className="u067-bd" x="6" y="30" width="50" height="38" rx="10" />
            <circle className="u067-kh" cx="31" cy="47" r="5" />
            <rect className="u067-kh" x="29" y="49" width="4" height="9" rx="2" />
          </svg>
        </span>
        <span className="u067-time" aria-hidden="true">
          {timeHtml.map((item, i) =>
            item.kind === "sep" ? (
              <b key={i}>{item.v}</b>
            ) : (
              <span key={i} style={{ ["--d" as string]: item.v }}>
                {Array.from({ length: 10 }, (_, n) => (
                  <i key={n}>{n}</i>
                ))}
              </span>
            )
          )}
        </span>
      </div>

      <div className="u067-t" aria-live="polite">
        <h3 className="a">Tạm khóa đăng nhập</h3>
        <h3 className="b">Có thể thử lại</h3>
      </div>
      <p className="u067-p">
        {open ? (
          <>
            Vì bảo mật, hãy kiểm tra lại
            <br />
            mật khẩu trước khi đăng nhập.
          </>
        ) : (
          <>
            Đã khóa sau {failCount} lần sai mật khẩu.
            <br />
            Đăng nhập lại khi hết thời gian đếm.
          </>
        )}
      </p>
      <div className="u067-acts">
        <button
          type="button"
          className="u067-b u067-in"
          aria-disabled={!open}
          disabled={!open}
          onClick={tryAgain}
        >
          Đăng nhập lại
        </button>
        <button
          type="button"
          className={`u067-b u067-mail${mailSent ? " sent" : ""}`}
          onClick={() => {
            setMailSent(true);
            onRecoverInstead?.();
          }}
        >
          {mailSent ? "Chuyển sang khôi phục PIN…" : "Khôi phục bằng PIN"}
        </button>
      </div>

      <style jsx global>{`
.u067 {
  --ux-page: var(--background, #f8fafc);
  --ux-surface: var(--surface, #fff);
  --ux-surface-2: var(--surface-elevated, #f1f5f9);
  --ux-surface-3: #eae7e1;
  --ux-ink: var(--foreground, #0f172a);
  --ux-ink-2: var(--foreground-muted, #475569);
  --ux-ink-3: var(--foreground-subtle, #8e8a97);
  --ux-line: var(--border, rgba(22, 21, 27, 0.09));
  --ux-line-2: rgba(22, 21, 27, 0.17);
  --ux-accent: #6a57f2;
  --ux-mint: #119c72;
  --ux-warn: #d6731e;
  --ux-shadow-strong: rgba(40, 30, 80, 0.3);
  --ux-spring: cubic-bezier(0.34, 1.45, 0.64, 1);
  position: relative;
  width: 100%;
  max-width: 340px;
  min-height: 460px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px 24px;
  border-radius: 30px;
  background: var(--ux-surface);
  box-shadow: 0 0 0 1px var(--ux-line), 0 30px 60px -36px var(--ux-shadow-strong);
  overflow: hidden;
  text-align: center;
  margin: 0 auto;
  color: var(--ux-ink);
  font-family: inherit;
}
html[data-theme="dark"] .u067,
html.dark .u067 {
  --ux-page: var(--background, #07080d);
  --ux-surface: var(--surface, #13141c);
  --ux-surface-2: var(--surface-elevated, #1a1b25);
  --ux-surface-3: #252632;
  --ux-ink: var(--foreground, #f4f0e8);
  --ux-ink-2: rgba(244, 240, 232, 0.68);
  --ux-ink-3: rgba(244, 240, 232, 0.42);
  --ux-line: rgba(255, 255, 255, 0.08);
  --ux-line-2: rgba(255, 255, 255, 0.16);
  --ux-accent: #b7a4ff;
  --ux-mint: #7ee8c0;
  --ux-warn: #ffb26b;
  --ux-shadow-strong: rgba(0, 0, 0, 0.72);
}
.u067 *,
.u067 *::before,
.u067 *::after {
  box-sizing: border-box;
}
.u067-dial {
  position: relative;
  width: 168px;
  height: 168px;
  flex: none;
}
.u067-dial > svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.u067-dial circle {
  fill: none;
  stroke-width: 8;
}
.u067-dial .t {
  stroke: var(--ux-surface-3);
}
.u067-dial .p {
  stroke: var(--ux-warn);
  stroke-linecap: round;
  stroke-dasharray: 100;
  stroke-dashoffset: calc(100 - var(--p, 1) * 100);
  transition: stroke 0.4s;
}
.u067.is-open .u067-dial .p {
  stroke: var(--ux-mint);
}
.u067-ticks {
  position: absolute;
  inset: 16px;
  border-radius: 50%;
  background: repeating-conic-gradient(
    var(--ux-line-2) 0 1deg,
    transparent 1deg 15deg
  );
  -webkit-mask: radial-gradient(
    circle,
    transparent 62%,
    #000 63%,
    #000 68%,
    transparent 69%
  );
  mask: radial-gradient(
    circle,
    transparent 62%,
    #000 63%,
    #000 68%,
    transparent 69%
  );
}
.u067-lock {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 62px;
  height: 70px;
  margin: -40px 0 0 -31px;
}
.u067-lock svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.u067-sh {
  fill: none;
  stroke: var(--ux-ink);
  stroke-width: 6;
  stroke-linecap: round;
  transform-origin: 46px 30px;
  transition: transform 0.7s var(--ux-spring);
}
.u067.is-open .u067-sh {
  transform: translateY(-8px) rotate(28deg);
}
.u067-bd {
  fill: var(--ux-ink);
  transition: fill 0.4s;
}
.u067.is-open .u067-bd {
  fill: var(--ux-mint);
}
.u067-kh {
  fill: var(--ux-surface);
}
.u067-time {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 30px;
  display: flex;
  justify-content: center;
  font-size: 15px;
  font-weight: 850;
  font-variant-numeric: tabular-nums;
  color: var(--ux-ink-2);
}
.u067-time span,
.u067-time b {
  display: flex;
  flex-direction: column;
  height: 20px;
  overflow: hidden;
  font-weight: inherit;
}
.u067-time i {
  display: block;
  font-style: normal;
  line-height: 20px;
  transform: translateY(calc(var(--d) * -20px));
  transition: transform 0.45s var(--ux-spring);
}
.u067-time b {
  line-height: 20px;
}
.u067-t {
  position: relative;
  height: 30px;
  width: 100%;
  margin: 22px 0 6px;
}
.u067-t h3 {
  margin: 0;
  font-size: 22px;
  font-weight: 850;
  letter-spacing: -0.045em;
}
.u067-t > * {
  position: absolute;
  left: 0;
  right: 0;
  transition: opacity 0.35s, transform 0.5s var(--ux-spring);
}
.u067-t .b {
  opacity: 0;
  transform: translateY(10px);
}
.u067.is-open .u067-t .a {
  opacity: 0;
  transform: translateY(-10px);
}
.u067.is-open .u067-t .b {
  opacity: 1;
  transform: none;
}
.u067-p {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ux-ink-3);
}
.u067-acts {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: auto;
}
.u067-b {
  height: 52px;
  border: 0;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 760;
  cursor: pointer;
  transition: transform 0.3s var(--ux-spring), background-color 0.4s, color 0.4s,
    opacity 0.3s;
}
.u067-b:active {
  transform: scale(0.97);
}
.u067-b:focus-visible {
  outline: 2px solid var(--ux-accent);
  outline-offset: 2px;
}
.u067-in {
  background: var(--ux-surface-2);
  color: var(--ux-ink-3);
}
.u067-in[aria-disabled="false"]:not(:disabled) {
  background: var(--ux-ink);
  color: var(--ux-page);
}
.u067-in:disabled {
  cursor: not-allowed;
}
.u067-mail {
  background: none;
  box-shadow: inset 0 0 0 1.5px var(--ux-line-2);
  color: var(--ux-ink);
}
.u067-mail.sent {
  color: var(--ux-mint);
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ux-mint) 50%, transparent);
}
@media (prefers-reduced-motion: reduce) {
  .u067-sh,
  .u067-t > *,
  .u067-time i,
  .u067-dial .p {
    transition: none !important;
  }
}
      `}</style>
    </div>
  );
}
