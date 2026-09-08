"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExternalLink,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCodeStore } from "@/lib/codeStore";
import { cn } from "@/lib/utils";

export default function FloatingLivePreview() {
  const previewHtml = useCodeStore((s) => s.previewHtml);
  const setPreviewHtml = useCodeStore((s) => s.setPreviewHtml);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewHtml) {
      // mount rồi animate vào
      requestAnimationFrame(() => setVisible(true));
      setExpanded(false);
      setIframeKey((k) => k + 1);
    } else {
      setVisible(false);
    }
  }, [previewHtml]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setPreviewHtml(null), 320);
  }, [setPreviewHtml]);

  useEffect(() => {
    if (!previewHtml) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewHtml, close]);

  if (!previewHtml) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6",
        "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Đóng preview"
        className={cn(
          "absolute inset-0 bg-black/55 backdrop-blur-[6px]",
          "transition-opacity duration-500",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={close}
      />

      {/* Floating card — giống hộp code tối bo góc */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Live Preview"
        className={cn(
          "relative z-10 flex flex-col overflow-hidden",
          "rounded-2xl border border-white/10",
          "bg-[#0d1117]/95 shadow-[0_25px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)]",
          "backdrop-blur-xl",
          "transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]",
          visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-4",
          expanded
            ? "w-[min(100vw-1rem,1200px)] h-[min(100dvh-1.5rem,900px)]"
            : "w-[min(100vw-1.5rem,720px)] h-[min(72dvh,560px)] sm:h-[min(75dvh,620px)]"
        )}
      >
        {/* Title bar */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[#161b22]/90 px-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
          </div>
          <span className="ml-2 text-xs font-semibold tracking-wide text-zinc-200">
            Live Preview
          </span>
          <span className="hidden text-[10px] text-zinc-500 sm:inline">HTML / CSS / JS</span>
          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              title="Tải lại"
              onClick={() => setIframeKey((k) => k + 1)}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              title={expanded ? "Thu nhỏ" : "Phóng to"}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-300 hover:bg-white/10 hover:text-white"
              title="Đóng"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="relative min-h-0 flex-1 bg-[#0a0a0a]">
          <iframe
            key={iframeKey}
            title="Opus Code Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            className={cn(
              "absolute inset-0 h-full w-full border-0 bg-white",
              "transition-opacity duration-500",
              visible ? "opacity-100" : "opacity-0"
            )}
            srcDoc={previewHtml}
          />
        </div>

        {/* Footer status */}
        <div className="flex h-8 shrink-0 items-center justify-between border-t border-white/10 bg-[#161b22]/80 px-3 text-[10px] text-zinc-500">
          <span>Opus Code · Live Preview</span>
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Esc để đóng
          </span>
        </div>
      </div>
    </div>
  );
}
