"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Minimize2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Msg = { id: string; role: "user" | "assistant"; content: string };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AiAssistantWidget() {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Xin chào! Tôi là trợ lý OpusFilm. Bạn cần hỗ trợ xem phim, VIP, tài khoản hay tìm kiếm gì không?",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Không hiện trên admin
  const hidden = path.startsWith("/admin");

  useEffect(() => {
    if (open && !minimized) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open, minimized, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const userMsg: Msg = { id: uid(), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setLoading(true);
    try {
      const history = [...messages, userMsg]
        .filter((x) => x.id !== "welcome")
        .map((x) => ({ role: x.role, content: x.content }));
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, path }),
      });
      const data = await res.json().catch(() => ({}));
      const reply =
        data.ok && data.reply
          ? String(data.reply)
          : String(data.error || "Không kết nối được trợ lý. Thử lại sau.");
      setMessages((m) => [
        ...m,
        { id: uid(), role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "assistant",
          content: "Lỗi mạng. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, messages, path]);

  if (hidden) return null;

  return (
    <div
      className="pointer-events-none fixed z-[55] flex flex-col items-end gap-2"
      style={{
        right: "max(0.75rem, env(safe-area-inset-right))",
        bottom: "calc(5.25rem + env(safe-area-inset-bottom, 0px))",
      }}
      data-opus-ai-assistant="1"
    >
      {open && !minimized ? (
        <div
          className={cn(
            "pointer-events-auto flex w-[min(100vw-1.5rem,360px)] flex-col overflow-hidden rounded-2xl",
            "border border-border bg-surface/95 shadow-2xl backdrop-blur-xl ui-border-contrast",
            "max-h-[min(70vh,520px)]"
          )}
        >
          <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bot className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                Trợ lý OpusFilm
              </p>
              <p className="truncate text-[11px] text-foreground-muted">
                CSKH · Hỗ trợ xem phim & tài khoản
              </p>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
              onClick={() => setMinimized(true)}
              aria-label="Thu nhỏ"
            >
              <Minimize2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </header>

          <div className="flex-1 space-y-2.5 overflow-y-auto px-3 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-surface-elevated text-foreground border border-border rounded-bl-md"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading ? (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-border bg-surface-elevated px-3 py-2">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-foreground-muted [animation-delay:300ms]" />
                </div>
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Nhập câu hỏi…"
                className="max-h-24 min-h-[40px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-foreground-subtle focus:ring-2 focus:ring-primary/30"
                disabled={loading}
              />
              <button
                type="button"
                disabled={loading || !input.trim()}
                onClick={() => void send()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-40"
                aria-label="Gửi"
              >
                <Send className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={cn(
          "pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full",
          "border border-border bg-primary text-primary-foreground shadow-lg",
          "hover:scale-105 active:scale-95 transition-transform"
        )}
        onClick={() => {
          if (open && minimized) {
            setMinimized(false);
          } else if (open) {
            setOpen(false);
          } else {
            setOpen(true);
            setMinimized(false);
          }
        }}
        aria-label="Trợ lý AI"
      >
        <MessageCircle className="h-5 w-5" strokeWidth={1.75} />
      </button>
    </div>
  );
}
