"use client";

import { useEffect, useRef } from "react";
import { Eraser, Maximize2, Minimize2, X } from "lucide-react";
import { useCodeStore } from "@/lib/codeStore";
import { cn } from "@/lib/utils";

export default function TerminalPanel() {
  const open = useCodeStore((s) => s.terminalOpen);
  const height = useCodeStore((s) => s.terminalHeight);
  const lines = useCodeStore((s) => s.terminalLines);
  const previewHtml = useCodeStore((s) => s.previewHtml);
  const canvasVisible = useCodeStore((s) => s.canvasVisible);
  const setTerminalOpen = useCodeStore((s) => s.setTerminalOpen);
  const setTerminalHeight = useCodeStore((s) => s.setTerminalHeight);
  const clearTerminal = useCodeStore((s) => s.clearTerminal);
  const setPreviewHtml = useCodeStore((s) => s.setPreviewHtml);
  const setCanvasVisible = useCodeStore((s) => s.setCanvasVisible);
  const setTurtleCode = useCodeStore((s) => s.setTurtleCode);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; h: number } | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [lines, previewHtml, canvasVisible]);

  if (!open) return null;


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
              setTerminalOpen(false);
              setCanvasVisible(false);
              setTurtleCode(null);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
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
          <div className="text-emerald-400/80">
            opus@code<span className="text-zinc-500">:</span>
            <span className="text-sky-400">~$</span>
            <span className="ml-1 animate-pulse">▌</span>
          </div>
        </div>


      </div>
    </div>
  );
}
