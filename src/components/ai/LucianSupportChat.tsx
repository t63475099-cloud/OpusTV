/* Lucian UX/UI Prompt #215 · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/#215 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Msg =
  | {
      id: string;
      kind: "bot" | "me" | "ag";
      text: string;
      article?: { title: string; hint: string; href?: string };
    }
  | { id: string; kind: "sys"; text: string }
  | { id: string; kind: "typing" };

const QK = [
  "Cách xem phim / tìm kiếm?",
  "VIP và kích hoạt key?",
  "Nói chuyện với người hỗ trợ",
] as const;

const AN: Array<{
  text: string;
  article: { title: string; hint: string; href: string };
}> = [
  {
    text: "Vào Trang chủ để duyệt phim, dùng ô tìm kiếm trên đầu trang, hoặc mở Thể loại. Chạm poster để xem tập.",
    article: {
      title: "Hướng dẫn xem phim",
      hint: "Bài hỗ trợ · 2 phút",
      href: "/ho-tro",
    },
  },
  {
    text: "Gói VIP mở khóa nội dung giới hạn. Nhập key hoặc giftcode trong Cài đặt / Tài khoản. Một số tính năng Event đang Sắp ra mắt.",
    article: {
      title: "VIP & kích hoạt",
      hint: "Bài hỗ trợ · 2 phút",
      href: "/ho-tro",
    },
  },
];

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Bỏ markdown * thừa từ Gemini cho dễ đọc trong bubble */
function cleanReply(s: string) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

export function LucianSupportChat() {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "hi",
      kind: "bot",
      text: "Xin chào! Chọn nhanh bên dưới hoặc gõ câu hỏi.",
    },
  ]);
  const [busy, setBusy] = useState(false);
  const [chipsHidden, setChipsHidden] = useState(false);
  const [input, setInput] = useState("");
  const msRef = useRef<HTMLDivElement>(null);
  const firstChipRef = useRef<HTMLButtonElement>(null);
  const lnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const delay = useCallback(
    (ms: number, fn: () => void) => {
      const t = setTimeout(fn, reduced ? 0 : ms);
      timers.current.push(t);
    },
    [reduced]
  );

  useEffect(() => {
    return () => timers.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (!open || !msRef.current) return;
    const el = msRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [msgs, open, busy]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const setOpenSafe = (v: boolean) => {
    setOpen(v);
    if (v) {
      delay(350, () => {
        if (!chipsHidden) firstChipRef.current?.focus({ preventScroll: true });
        else inputRef.current?.focus({ preventScroll: true });
      });
    } else {
      lnRef.current?.focus();
    }
  };

  const askChip = (i: number) => {
    if (busy) return;
    setBusy(true);
    setChipsHidden(true);
    setMsgs((m) => [...m, { id: uid(), kind: "me", text: QK[i] }]);
    const tyId = uid();
    delay(300, () => setMsgs((m) => [...m, { id: tyId, kind: "typing" }]));
    delay(1300, () => {
      setMsgs((m) => m.filter((x) => x.id !== tyId));
      if (i < 2) {
        const a = AN[i];
        setMsgs((m) => [
          ...m,
          {
            id: uid(),
            kind: "bot",
            text: a.text,
            article: a.article,
          },
        ]);
      } else {
        setMsgs((m) => [
          ...m,
          { id: uid(), kind: "sys", text: "Minji đã tham gia chat" },
        ]);
        delay(600, () => {
          setMsgs((m) => [
            ...m,
            {
              id: uid(),
              kind: "ag",
              text: "Chào bạn, mình là Minji (hỗ trợ OpusFilm). Bạn cần hỗ trợ gì?",
            },
          ]);
        });
      }
      setBusy(false);
      delay(100, () => inputRef.current?.focus({ preventScroll: true }));
    });
  };

  const sendFree = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setChipsHidden(true);
    setBusy(true);
    setMsgs((m) => [...m, { id: uid(), kind: "me", text }]);
    const tyId = uid();
    delay(200, () => setMsgs((m) => [...m, { id: tyId, kind: "typing" }]));
    try {
      const history = msgs
        .filter(
          (x): x is Extract<Msg, { kind: "bot" | "me" | "ag" }> =>
            x.kind === "bot" || x.kind === "me" || x.kind === "ag"
        )
        .map((x) => ({
          role: x.kind === "me" ? ("user" as const) : ("assistant" as const),
          content: x.text,
        }));
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, path }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        data.ok && data.reply
          ? cleanReply(String(data.reply))
          : String(data.error || "Không kết nối được hỗ trợ. Thử lại sau.");
      setMsgs((m) => {
        const next = m.filter((x) => x.id !== tyId);
        return [...next, { id: uid(), kind: "bot", text: reply }];
      });
    } catch {
      setMsgs((m) => {
        const next = m.filter((x) => x.id !== tyId);
        return [
          ...next,
          { id: uid(), kind: "bot", text: "Lỗi mạng. Vui lòng thử lại." },
        ];
      });
    } finally {
      setBusy(false);
      delay(50, () => inputRef.current?.focus({ preventScroll: true }));
    }
  };

  if (path.startsWith("/admin")) return null;

  return (
    <div
      className={`ux u215${open ? " is-open" : ""}`}
      data-opus-support-chat="1"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) setOpenSafe(false);
      }}
    >
      {/* Backdrop — chỉ khi mở */}
      {open ? (
        <button
          type="button"
          className="u215-bd"
          aria-label="Đóng chat"
          onClick={() => setOpenSafe(false)}
        />
      ) : null}

      {/* Panel giữa màn hình */}
      <div
        className="u215-wg"
        role="dialog"
        aria-hidden={!open}
        aria-modal={open}
        aria-label="Hỗ trợ OpusFilm"
      >
        <div className="u215-wh">
          <div className="u215-wh-row">
            <div className="u215-fs" aria-hidden="true">
              <i style={{ background: "#F9A8D4" }}>O</i>
              <i style={{ background: "#A5B4FC" }}>P</i>
              <i style={{ background: "#FDE68A" }}>M</i>
            </div>
            <button
              type="button"
              className="u215-x"
              aria-label="Đóng"
              tabIndex={open ? 0 : -1}
              onClick={() => setOpenSafe(false)}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </button>
          </div>
          <b>OpusFilm hỗ trợ bạn</b>
          <small>Thường phản hồi trong vài phút</small>
        </div>

        <div className="u215-ms" ref={msRef} aria-live="polite">
          {msgs.map((m) => {
            if (m.kind === "typing") {
              return (
                <div key={m.id} className="u215-ty" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              );
            }
            if (m.kind === "sys") {
              return (
                <div key={m.id} className="u215-sy">
                  {m.text}
                </div>
              );
            }
            const cls =
              m.kind === "me" ? "me" : m.kind === "ag" ? "ag" : "bt";
            return (
              <div key={m.id} className={`u215-b ${cls}`}>
                <div className="u215-b-txt">{m.text}</div>
                {"article" in m && m.article ? (
                  <div className="u215-ar">
                    <i aria-hidden="true" />
                    <div>
                      <b>{m.article.title}</b>
                      <small>{m.article.hint}</small>
                      {m.article.href ? (
                        <Link href={m.article.href} className="u215-ar-link">
                          Xem bài hỗ trợ
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {!chipsHidden ? (
          <div className="u215-qs">
            {QK.map((q, i) => (
              <button
                key={q}
                ref={i === 0 ? firstChipRef : undefined}
                type="button"
                className="u215-qk"
                disabled={busy}
                tabIndex={open ? 0 : -1}
                onClick={() => askChip(i)}
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}

        <div className="u215-ip">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void sendFree();
              }
            }}
            placeholder="Nhập tin nhắn…"
            aria-label="Tin nhắn"
            tabIndex={open ? 0 : -1}
            disabled={busy}
          />
          <button
            type="button"
            className="u215-send"
            tabIndex={open ? 0 : -1}
            disabled={busy || !input.trim()}
            onClick={() => void sendFree()}
            aria-label="Gửi"
          >
            Gửi
          </button>
        </div>
      </div>

      {/* Launcher — giữ góc dưới phải */}
      <button
        ref={lnRef}
        type="button"
        className="u215-ln"
        aria-label={open ? "Đóng chat" : "Mở chat hỗ trợ"}
        aria-expanded={open}
        onClick={() => setOpenSafe(!open)}
      >
        <svg className="c" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 5.5h16v10.5H10l-5 3.5V16H4z"
            fill="currentColor"
          />
        </svg>
        <svg className="x" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </button>

      <style jsx global>{`
.u215 {
  --ux-page: var(--background, #f8fafc);
  --ux-surface: var(--surface, #fff);
  --ux-surface-2: var(--surface-elevated, #f1f5f9);
  --ux-ink: var(--foreground, #0f172a);
  --ux-ink-2: var(--foreground-muted, #475569);
  --ux-ink-3: var(--foreground-subtle, #94a3b8);
  --ux-line: var(--border, rgba(15, 23, 42, 0.09));
  --ux-accent: #6a57f2;
  --ux-shadow-strong: rgba(40, 30, 80, 0.35);
  --ux-grad: linear-gradient(120deg, #7b61ff, #3d8bff 55%, #1fb89a);
  position: fixed;
  z-index: 55;
  inset: 0;
  pointer-events: none;
  font-family: inherit;
  color: var(--ux-ink);
}
html[data-theme="dark"] .u215,
html.dark .u215 {
  --ux-page: var(--background, #07080d);
  --ux-surface: var(--surface, #13141c);
  --ux-surface-2: var(--surface-elevated, #1a1b25);
  --ux-ink: var(--foreground, #f4f0e8);
  --ux-ink-2: var(--foreground-muted, rgba(244, 240, 232, 0.68));
  --ux-ink-3: var(--foreground-subtle, rgba(244, 240, 232, 0.42));
  --ux-line: var(--border, rgba(255, 255, 255, 0.08));
  --ux-accent: #b7a4ff;
  --ux-shadow-strong: rgba(0, 0, 0, 0.72);
  --ux-grad: linear-gradient(120deg, #b7a4ff, #7db4ff 55%, #a5f2d3);
}
.u215 *,
.u215 *::before,
.u215 *::after {
  box-sizing: border-box;
}

/* Backdrop giữa màn hình */
.u215-bd {
  pointer-events: auto;
  position: fixed;
  inset: 0;
  z-index: 1;
  border: 0;
  margin: 0;
  padding: 0;
  cursor: pointer;
  background: rgba(8, 10, 18, 0.55);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  animation: u215-fade 0.25s ease;
}
@keyframes u215-fade {
  from {
    opacity: 0;
  }
}

/* Launcher — giữ nguyên góc dưới phải */
.u215-ln {
  pointer-events: auto;
  position: fixed;
  z-index: 3;
  right: max(0.75rem, env(safe-area-inset-right));
  bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 50%;
  background: var(--ux-accent);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  box-shadow: 0 14px 28px -10px var(--ux-accent);
  transition: transform 0.3s cubic-bezier(0.3, 1.6, 0.5, 1);
}
.u215-ln svg {
  position: absolute;
  width: 24px;
  height: 24px;
  transition: transform 0.35s cubic-bezier(0.3, 1.5, 0.5, 1), opacity 0.2s;
}
.u215-ln .x {
  transform: rotate(-90deg) scale(0.5);
  opacity: 0;
}
.u215.is-open .u215-ln .c {
  transform: rotate(90deg) scale(0.5);
  opacity: 0;
}
.u215.is-open .u215-ln .x {
  transform: none;
  opacity: 1;
}
.u215-ln:active {
  transform: scale(0.92);
}

/* Panel — lớn, giữa màn hình */
.u215-wg {
  pointer-events: none;
  position: fixed;
  z-index: 2;
  left: 50%;
  top: 50%;
  width: min(440px, calc(100vw - 1.5rem));
  height: min(620px, calc(100vh - 2rem - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px)));
  max-height: 90dvh;
  display: flex;
  flex-direction: column;
  border-radius: 22px;
  background: var(--ux-surface);
  box-shadow:
    0 0 0 1px var(--ux-line),
    0 30px 60px -20px var(--ux-shadow-strong);
  overflow: hidden;
  transform: translate(-50%, -46%) scale(0.92);
  opacity: 0;
  transition:
    transform 0.45s cubic-bezier(0.3, 1.15, 0.4, 1),
    opacity 0.25s;
}
.u215.is-open .u215-wg {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 480px) {
  .u215-wg {
    width: calc(100vw - 1rem);
    height: min(78dvh, calc(100dvh - 5.5rem - env(safe-area-inset-bottom, 0px)));
    border-radius: 18px;
  }
}

.u215-wh {
  flex: none;
  padding: 16px 16px 14px;
  background: var(--ux-grad);
  color: #fff;
}
.u215-wh-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.u215-fs {
  display: flex;
}
.u215-fs i {
  width: 28px;
  height: 28px;
  margin-right: -7px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
  display: grid;
  place-items: center;
  font-style: normal;
  font-size: 11px;
  font-weight: 850;
  color: #111;
}
.u215-x {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  display: grid;
  place-items: center;
  cursor: pointer;
  flex: none;
}
.u215-x:hover {
  background: rgba(255, 255, 255, 0.28);
}
.u215-wh b {
  display: block;
  margin-top: 10px;
  font-size: 16px;
  font-weight: 900;
}
.u215-wh small {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 3px;
  font-size: 11px;
  font-weight: 700;
  opacity: 0.92;
}
.u215-wh small::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
}

/* Vùng tin nhắn — cuộn được */
.u215-ms {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 14px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--ux-ink-3) transparent;
}
.u215-ms::-webkit-scrollbar {
  width: 6px;
}
.u215-ms::-webkit-scrollbar-thumb {
  background: var(--ux-ink-3);
  border-radius: 99px;
}

.u215-b {
  max-width: 92%;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.5;
  font-weight: 600;
  animation: u215-in 0.35s cubic-bezier(0.3, 1.4, 0.5, 1) backwards;
}
@keyframes u215-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
  }
}
.u215-b-txt {
  white-space: pre-wrap;
  word-break: break-word;
}
.u215-b.bt {
  align-self: flex-start;
  background: var(--ux-surface-2);
  border-bottom-left-radius: 5px;
  color: var(--ux-ink);
}
.u215-b.me {
  align-self: flex-end;
  background: var(--ux-accent);
  color: #fff;
  border-bottom-right-radius: 5px;
}
.u215-b.ag {
  align-self: flex-start;
  background: color-mix(in srgb, #ec4899 12%, var(--ux-surface));
  border-bottom-left-radius: 5px;
  color: var(--ux-ink);
}
.u215-ty {
  align-self: flex-start;
  display: flex;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  border-bottom-left-radius: 5px;
  background: var(--ux-surface-2);
}
.u215-ty i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ux-ink-3);
  animation: u215-dt 1s ease-in-out infinite;
}
.u215-ty i:nth-child(2) {
  animation-delay: 0.15s;
}
.u215-ty i:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes u215-dt {
  30% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}
.u215-ar {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  border-radius: 10px;
  background: var(--ux-surface);
  box-shadow: inset 0 0 0 1px var(--ux-line);
  text-align: left;
}
.u215-ar i {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: linear-gradient(135deg, #a5b4fc, #f0abfc);
}
.u215-ar b {
  display: block;
  font-size: 12px;
  font-weight: 850;
  color: var(--ux-ink);
}
.u215-ar small {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--ux-ink-3);
}
.u215-ar-link {
  display: inline-block;
  margin-top: 4px;
  font-size: 11px;
  font-weight: 800;
  color: var(--ux-accent);
  text-decoration: none;
}
.u215-sy {
  align-self: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--ux-surface-2);
  font-size: 11px;
  font-weight: 800;
  color: var(--ux-ink-3);
  animation: u215-in 0.35s backwards;
}

.u215-qs {
  flex: none;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 14px 10px;
  justify-content: flex-end;
}
.u215-qk {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: var(--ux-surface);
  box-shadow: inset 0 0 0 1.5px color-mix(in srgb, var(--ux-accent) 50%, transparent);
  color: var(--ux-accent);
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: opacity 0.2s;
}
.u215-qk:disabled {
  opacity: 0.35;
  cursor: default;
}

.u215-ip {
  flex: none;
  display: flex;
  gap: 8px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid var(--ux-line);
  background: var(--ux-surface);
}
.u215-ip input {
  flex: 1;
  min-width: 0;
  height: 40px;
  padding: 0 14px;
  border: 0;
  border-radius: 12px;
  background: var(--ux-surface-2);
  color: var(--ux-ink);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  outline: none;
}
.u215-send {
  height: 40px;
  padding: 0 16px;
  border: 0;
  border-radius: 12px;
  background: var(--ux-accent);
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}
.u215-send:disabled {
  opacity: 0.4;
  cursor: default;
}
.u215 button:focus-visible {
  outline: 2px solid var(--ux-accent);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .u215-wg,
  .u215-ln svg,
  .u215-bd {
    transition: none;
    animation: none;
  }
  .u215-b,
  .u215-sy {
    animation: none;
  }
  .u215-ty i {
    animation: none;
  }
}
      `}</style>
    </div>
  );
}
