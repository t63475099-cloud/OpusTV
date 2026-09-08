"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Gamepad2,
  Maximize2,
  Minimize2,
  RefreshCw,
  X,
} from "lucide-react";
import { useCodeStore } from "@/lib/codeStore";
import {
  dispatchArrowKey,
  runPythonWithSkulpt,
  usesTurtle,
} from "@/lib/skulptRunner";
import { cn } from "@/lib/utils";

const TURTLE_TARGET_ID = "opus-turtle-canvas-float";

type PreviewKind = "html" | "canvas" | "output";

export default function FloatingLivePreview() {
  const previewHtml = useCodeStore((s) => s.previewHtml);
  const canvasVisible = useCodeStore((s) => s.canvasVisible);
  const turtleCode = useCodeStore((s) => s.turtleCode);
  const terminalLines = useCodeStore((s) => s.terminalLines);
  const setPreviewHtml = useCodeStore((s) => s.setPreviewHtml);
  const setCanvasVisible = useCodeStore((s) => s.setCanvasVisible);
  const setTurtleCode = useCodeStore((s) => s.setTurtleCode);
  const setRunning = useCodeStore((s) => s.setRunning);
  const addTermLine = useCodeStore((s) => s.addTermLine);

  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const runLock = useRef(false);

  const kind: PreviewKind | null = previewHtml
    ? "html"
    : canvasVisible
      ? "canvas"
      : null;

  // Mở khi có HTML hoặc Canvas; đóng khi cả hai null
  useEffect(() => {
    if (kind) {
      requestAnimationFrame(() => setVisible(true));
      setExpanded(false);
      if (kind === "html") setIframeKey((k) => k + 1);
    } else {
      setVisible(false);
      setCanvasReady(false);
    }
  }, [kind, previewHtml, canvasVisible]);

  // Chạy turtle trong khung nổi
  useEffect(() => {
    if (kind !== "canvas") {
      setCanvasReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setCanvasReady(true));
    return () => cancelAnimationFrame(id);
  }, [kind]);

  useEffect(() => {
    if (kind !== "canvas" || !canvasReady || !turtleCode || runLock.current) return;
    let cancelled = false;
    runLock.current = true;
    setRunning(true);

    (async () => {
      addTermLine({
        kind: "info",
        text: usesTurtle(turtleCode)
          ? "Skulpt · Python Turtle — Live Preview"
          : "Skulpt · Python — Live Preview",
      });
      const result = await runPythonWithSkulpt({
        code: turtleCode,
        turtleTargetId: TURTLE_TARGET_ID,
        onOutput: (text) => {
          if (cancelled) return;
          for (const row of text.split("\n")) {
            if (row.length) addTermLine({ kind: "out", text: row });
          }
        },
        onError: (text) => {
          if (!cancelled) addTermLine({ kind: "err", text });
        },
      });
      if (!cancelled) {
        addTermLine({
          kind: "info",
          text: result.ok
            ? `Xong · ${result.durationMs} ms`
            : `Lỗi · ${result.durationMs} ms`,
        });
        setTurtleCode(null);
        setRunning(false);
        runLock.current = false;
      }
    })();

    return () => {
      cancelled = true;
      runLock.current = false;
    };
  }, [kind, canvasReady, turtleCode, addTermLine, setRunning, setTurtleCode]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => {
      setPreviewHtml(null);
      setCanvasVisible(false);
      setTurtleCode(null);
    }, 320);
  }, [setPreviewHtml, setCanvasVisible, setTurtleCode]);

  useEffect(() => {
    if (!kind) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, close]);

  if (!kind) return null;

  const title =
    kind === "html"
      ? "Live Preview · HTML"
      : kind === "canvas"
        ? "Live Preview · Python / Canvas"
        : "Live Preview";

  const recentOut = terminalLines
    .filter((l) => l.kind === "out" || l.kind === "err" || l.kind === "info")
    .slice(-12);

  return (
    <div
      className={cn(
        "fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
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

      <div
        role="dialog"
        aria-label={title}
        style={{ willChange: "transform, opacity" }}
        className={cn(
          "relative z-10 flex flex-col overflow-hidden",
          "rounded-2xl border border-white/10",
          "bg-[#0d1117]/95 shadow-[0_25px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(255,255,255,0.06)]",
          "backdrop-blur-xl",
          "transition-all duration-500 ease-[cubic-bezier(0.34,1.2,0.64,1)]",
          visible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4",
          expanded
            ? "w-[min(100vw-1rem,1200px)] h-[min(100dvh-1.5rem,900px)]"
            : "w-[min(100vw-1.5rem,720px)] h-[min(72dvh,560px)] sm:h-[min(78dvh,640px)]"
        )}
      >
        {/* Title bar — giống hộp tối bo góc */}
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[#161b22]/90 px-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
          </div>
          <span className="ml-2 truncate text-xs font-semibold tracking-wide text-zinc-200">
            {title}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            {kind === "html" && (
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-400 transition-colors duration-500 hover:bg-white/10 hover:text-white"
                title="Tải lại"
                onClick={() => setIframeKey((k) => k + 1)}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-500 hover:bg-white/10 hover:text-white"
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
              className="rounded-lg p-2 text-zinc-400 transition-colors duration-500 hover:bg-white/10 hover:text-white"
              title="Đóng"
              onClick={close}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="relative flex min-h-0 flex-1 flex-col bg-[#0a0a0a]">
          {kind === "html" && previewHtml && (
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
          )}

          {kind === "canvas" && (
            <>
              <div
                id={TURTLE_TARGET_ID}
                className="min-h-0 flex-1 w-full overflow-hidden"
              />
              {/* D-pad */}
              <div className="shrink-0 border-t border-white/10 bg-[#12151a] px-3 py-3">
                <div className="mb-2 flex items-center gap-1.5 text-[10px] text-zinc-500">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Điều khiển · phím mũi tên / D-pad
                </div>
                <div className="mx-auto grid w-[140px] grid-cols-3 gap-1.5">
                  <span />
                  <PadBtn
                    label="Lên"
                    onPress={() => dispatchArrowKey("up", "down")}
                    onRelease={() => dispatchArrowKey("up", "up")}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </PadBtn>
                  <span />
                  <PadBtn
                    label="Trái"
                    onPress={() => dispatchArrowKey("left", "down")}
                    onRelease={() => dispatchArrowKey("left", "up")}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </PadBtn>
                  <span className="flex items-center justify-center">
                    <span className="h-3 w-3 rounded-full bg-zinc-700" />
                  </span>
                  <PadBtn
                    label="Phải"
                    onPress={() => dispatchArrowKey("right", "down")}
                    onRelease={() => dispatchArrowKey("right", "up")}
                  >
                    <ArrowRight className="h-5 w-5" />
                  </PadBtn>
                  <span />
                  <PadBtn
                    label="Xuống"
                    onPress={() => dispatchArrowKey("down", "down")}
                    onRelease={() => dispatchArrowKey("down", "up")}
                  >
                    <ArrowDown className="h-5 w-5" />
                  </PadBtn>
                  <span />
                </div>
                {recentOut.length > 0 && (
                  <div className="mt-2 max-h-16 overflow-auto rounded-lg bg-black/40 px-2 py-1 font-mono text-[10px] text-zinc-400">
                    {recentOut.map((l) => (
                      <div
                        key={l.id}
                        className={cn(
                          l.kind === "err" && "text-red-400",
                          l.kind === "info" && "text-emerald-400/80"
                        )}
                      >
                        {l.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

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

function PadBtn({
  children,
  label,
  onPress,
  onRelease,
}: {
  children: React.ReactNode;
  label: string;
  onPress: () => void;
  onRelease: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "flex h-11 items-center justify-center rounded-xl",
        "border border-white/10 bg-[#1c2128] text-zinc-200",
        "transition-all duration-500 active:scale-95 active:bg-[#2a313c]",
        "select-none touch-manipulation"
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        onPress();
      }}
      onPointerUp={(e) => {
        e.preventDefault();
        onRelease();
      }}
      onPointerLeave={onRelease}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </button>
  );
}
