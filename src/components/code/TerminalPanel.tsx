"use client";

import { useEffect, useRef, useState } from "react";
import { Eraser, Maximize2, Minimize2, X, Send } from "lucide-react";
import { useCodeStore } from "@/lib/codeStore";
import { cn } from "@/lib/utils";

export default function TerminalPanel() {
  const open = useCodeStore((s) => s.terminalOpen);
  const height = useCodeStore((s) => s.terminalHeight);
  const lines = useCodeStore((s) => s.terminalLines);
  const previewHtml = useCodeStore((s) => s.previewHtml);
  const canvasVisible = useCodeStore((s) => s.canvasVisible);
  const awaitingInput = useCodeStore((s) => s.awaitingInput);
  const inputPrompt = useCodeStore((s) => s.inputPrompt);
  const setTerminalOpen = useCodeStore((s) => s.setTerminalOpen);
  const setTerminalHeight = useCodeStore((s) => s.setTerminalHeight);
  const clearTerminal = useCodeStore((s) => s.clearTerminal);
  const setPreviewHtml = useCodeStore((s) => s.setPreviewHtml);
  const setCanvasVisible = useCodeStore((s) => s.setCanvasVisible);
  const setTurtleCode = useCodeStore((s) => s.setTurtleCode);
  const submitTerminalInput = useCodeStore((s) => s.submitTerminalInput);
  const cancelTerminalInput = useCodeStore((s) => s.cancelTerminalInput);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ y: number; h: number } | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, previewHtml, canvasVisible, awaitingInput]);

  useEffect(() => {
    if (awaitingInput) {
      setDraft("");
      const t = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(t);
    }
  }, [awaitingInput]);

  if (!open) return null;

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!awaitingInput) return;
    submitTerminalInput(draft);
    setDraft("");
  };

  return (
    <div
      data-opus-terminal
      className={cn(
        "flex shrink-0 flex-col border-t border-[#2b2b2b] bg-[#0c0c0c] text-[13px]",
        "transition-[height] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      )}
      style={{ height }}
    >
      <div
        className="h-1.5 cursor-row-resize bg-[#1e1e1e] hover:bg-[#007acc]/60"
        onMouseDown={(e) => {
          dragRef.current = { y: e.clientY, h: height };
          const onMove = (ev: MouseEvent) => {
            if (!dragRef.current) return;
            const dy = dragRef.current.y - ev.clientY;
            setTerminalHeight(dragRef.current.h + dy);
          };
          const onUp = () => {
            dragRef.current = null;
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
          };
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        }}
        onTouchStart={(e) => {
          const y = e.touches[0].clientY;
          dragRef.current = { y, h: height };
        }}
        onTouchMove={(e) => {
          if (!dragRef.current) return;
          const dy = dragRef.current.y - e.touches[0].clientY;
          setTerminalHeight(dragRef.current.h + dy);
        }}
      />
      <div className="flex items-center gap-2 border-b border-[#2b2b2b] bg-[#1e1e1e] px-2 py-1">
        <span className="text-xs font-medium text-zinc-300">Terminal</span>
        <span className="text-[10px] text-zinc-500">opus@code:~$</span>
        {awaitingInput && (
          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-200">
            Đang chờ nhập
          </span>
        )}
        {canvasVisible && (
          <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] text-rose-300">
            Canvas
          </span>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
            title="Xóa log"
            onClick={() => {
              if (awaitingInput) cancelTerminalInput();
              clearTerminal();
              setPreviewHtml(null);
              setCanvasVisible(false);
              setTurtleCode(null);
            }}
          >
            <Eraser className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
            title={height > 320 ? "Thu nhỏ" : "Mở rộng"}
            onClick={() => setTerminalHeight(height > 320 ? 180 : 480)}
          >
            {height > 320 ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
          <button
            type="button"
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
            title="Đóng"
            onClick={() => {
              if (awaitingInput) cancelTerminalInput();
              setTerminalOpen(false);
              setCanvasVisible(false);
              setTurtleCode(null);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-auto px-3 py-2 font-mono text-[12px] leading-relaxed"
        >
          {lines.map((l) => (
            <div
              key={l.id}
              className={cn(
                l.kind === "err" && "text-red-400",
                l.kind === "info" && "text-emerald-400/90",
                l.kind === "cmd" && "text-sky-300",
                l.kind === "out" && "text-zinc-100"
              )}
            >
              {l.kind === "cmd" ? (
                <>
                  <span className="text-emerald-400">opus@code</span>
                  <span className="text-zinc-500">:</span>
                  <span className="text-sky-400">~$</span> {l.text}
                </>
              ) : (
                l.text
              )}
            </div>
          ))}
          {!awaitingInput && (
            <div className="text-emerald-400/80">
              opus@code<span className="text-zinc-500">:</span>
              <span className="text-sky-400">~$</span>
              <span className="ml-1 animate-pulse">▌</span>
            </div>
          )}
        </div>

        {/* Ô nhập liệu khi chương trình chờ ReadLine / input */}
        {awaitingInput && (
          <form
            onSubmit={onSubmit}
            className="flex shrink-0 items-center gap-2 border-t border-[#2b2b2b] bg-[#121212] px-2 py-2"
          >
            <span className="hidden text-[11px] text-zinc-500 sm:inline max-w-[40%] truncate">
              {inputPrompt || "Nhập:"}
            </span>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập giá trị rồi Enter…"
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0c0c0c] px-3 py-2 font-mono text-xs text-white outline-none focus:border-sky-500/50"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <button
              type="submit"
              className="flex h-9 items-center gap-1 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              <Send className="h-3.5 w-3.5" />
              Gửi
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
