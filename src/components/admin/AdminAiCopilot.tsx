"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";

type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tools?: Array<{ name: string; result: unknown }>;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

type Props = {
  adminSecret: string;
  unlocked: boolean;
};

const SUGGEST = [
  "Thống kê hệ thống",
  "Liệt kê 15 acc gần nhất",
  "Tạo 5 acc prefix test_",
  "Xóa 10 acc prefix test_ (confirm)",
  "Lịch sử bulk create",
];

/** Render text: bảng mono + markdown đơn giản */
function RichText({ text }: { text: string }) {
  const blocks = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.startsWith("```") && block.endsWith("```")) {
          const inner = block.replace(/^```\w*\n?/, "").replace(/```$/, "");
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-black/40 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-emerald-200/90"
            >
              {inner.trimEnd()}
            </pre>
          );
        }
        // Detect plain table lines (has | and ---)
        const lines = block.split("\n");
        const looksTable =
          lines.filter((l) => l.includes("|")).length >= 2 &&
          lines.some((l) => /[-+]{3,}/.test(l) || l.split("|").length >= 3);
        if (looksTable) {
          return (
            <pre
              key={i}
              className="overflow-x-auto rounded-lg bg-black/40 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-sky-100/90 whitespace-pre"
            >
              {block.trimEnd()}
            </pre>
          );
        }
        return (
          <div
            key={i}
            className="whitespace-pre-wrap break-words text-[13px] leading-relaxed"
          >
            {block}
          </div>
        );
      })}
    </div>
  );
}

function ToolPanel({
  tools,
}: {
  tools: Array<{ name: string; result: unknown }>;
}) {
  return (
    <div className="mt-2 space-y-1.5 border-t border-slate-700/60 pt-2">
      {tools.map((t, i) => {
        const r = t.result as {
          summary?: string;
          table?: string;
          error?: string;
          ok?: boolean;
        };
        return (
          <details
            key={i}
            className="rounded-lg bg-slate-900/80 text-[11px] text-slate-400"
            open={!!r?.table}
          >
            <summary className="cursor-pointer px-2 py-1.5 font-semibold text-emerald-400/90">
              {r?.ok === false ? "⚠" : "✓"} {t.name}
              {r?.summary ? ` — ${r.summary}` : ""}
            </summary>
            {r?.table ? (
              <pre className="max-h-48 overflow-auto px-2 pb-2 font-mono text-[10px] leading-relaxed text-slate-300 whitespace-pre">
                {r.table}
              </pre>
            ) : (
              <pre className="max-h-32 overflow-auto px-2 pb-2 text-[10px] text-slate-500">
                {JSON.stringify(t.result, null, 2)}
              </pre>
            )}
          </details>
        );
      })}
    </div>
  );
}

export function AdminAiCopilot({ adminSecret, unlocked }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "hi",
      role: "assistant",
      content:
        "Admin Copilot sẵn sàng.\n• Tạo / xóa acc theo prefix\n• Liệt kê & tìm user\n• Đổi role, phát thưởng, thống kê\nGõ lệnh tự nhiên hoặc chọn gợi ý.",
    },
  ]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [msgs, open, busy]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!unlocked) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [unlocked]);

  const send = useCallback(
    async (textIn?: string) => {
      const text = (textIn ?? input).trim();
      if (!text || busy || !adminSecret) return;
      setInput("");
      setBusy(true);
      setMsgs((m) => [...m, { id: uid(), role: "user", content: text }]);
      try {
        const history = msgs
          .filter((x) => x.role === "user" || x.role === "assistant")
          .map((x) => ({ role: x.role, content: x.content }));
        const res = await fetch("/api/admin/ai-copilot", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-admin-secret": adminSecret,
          },
          body: JSON.stringify({ message: text, history }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          setMsgs((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              content:
                String(data.error || `Lỗi ${res.status}`) +
                (res.status === 401 ? " — kiểm tra admin secret." : ""),
            },
          ]);
        } else {
          setMsgs((m) => [
            ...m,
            {
              id: uid(),
              role: "assistant",
              content: String(data.reply || ""),
              tools: Array.isArray(data.tools) ? data.tools : undefined,
            },
          ]);
        }
      } catch {
        setMsgs((m) => [
          ...m,
          { id: uid(), role: "assistant", content: "Lỗi mạng. Thử lại." },
        ]);
      } finally {
        setBusy(false);
        inputRef.current?.focus();
      }
    },
    [adminSecret, busy, input, msgs]
  );

  if (!unlocked || !adminSecret) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 left-5 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        title="Admin AI Copilot (Ctrl+J)"
        aria-label={open ? "Đóng AI Copilot" : "Mở AI Copilot"}
        aria-expanded={open}
      >
        {open ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
      </button>

      {open ? (
        <div
          className="fixed bottom-20 left-5 z-[80] flex w-[min(100vw-2rem,440px)] flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl"
          style={{ maxHeight: "min(620px, calc(100vh - 5.5rem))" }}
          role="dialog"
          aria-label="Admin AI Copilot"
        >
          <header className="flex items-center gap-2 border-b border-slate-800 px-3 py-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20 text-violet-300">
              <Bot className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-slate-100">
                Admin AI Copilot
              </div>
              <div className="text-[11px] text-slate-500">
                9 tools · bảng cột · Ctrl+J
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
            style={{ minHeight: 220 }}
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`max-w-[98%] rounded-xl px-3 py-2 ${
                  m.role === "user"
                    ? "ml-auto bg-violet-600 text-white"
                    : "mr-auto bg-slate-800/90 text-slate-100"
                }`}
              >
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap break-words text-[13px]">
                    {m.content}
                  </div>
                ) : (
                  <RichText text={m.content} />
                )}
                {m.tools && m.tools.length > 0 ? (
                  <ToolPanel tools={m.tools} />
                ) : null}
              </div>
            ))}
            {busy ? (
              <div className="mr-auto flex items-center gap-2 rounded-xl bg-slate-800/90 px-3 py-2 text-xs text-slate-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Đang gọi tool / Gemini…
              </div>
            ) : null}
          </div>

          {!busy ? (
            <div className="flex flex-wrap gap-1.5 border-t border-slate-800/80 px-3 py-2">
              {SUGGEST.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300 hover:border-violet-500/50 hover:text-violet-200"
                  onClick={() => void send(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex gap-2 border-t border-slate-800 p-2.5">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              disabled={busy}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Vd: Xóa 10 acc prefix test_ confirm"
              className="min-h-[40px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="button"
              disabled={busy || !input.trim()}
              onClick={() => void send()}
              className="flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40"
              aria-label="Gửi"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
