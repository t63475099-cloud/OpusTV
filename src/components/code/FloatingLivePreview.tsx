"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

/** Game / phím điều khiển → hiện D-pad */
function needsDpad(code: string | null | undefined): boolean {
  if (!code) return false;
  return (
    /\.onkey\s*\(/.test(code) ||
    /\.onkeypress\s*\(/.test(code) ||
    /\bturtle\.onkey\b/.test(code) ||
    /\blisten\s*\(/.test(code) ||
    /["'](?:Up|Down|Left|Right|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|w|a|s|d)["']/.test(
      code
    )
  );
}

type PreviewKind = "html" | "canvas";

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

  const [userClosed, setUserClosed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [canvasReady, setCanvasReady] = useState(false);
  const runLock = useRef(false);
  const lastTurtleRef = useRef<string | null>(null);

  const kind: PreviewKind | null = previewHtml
    ? "html"
    : canvasVisible
      ? "canvas"
      : null;

  const showDpad = useMemo(
    () => needsDpad(turtleCode || lastTurtleRef.current),
    [turtleCode]
  );

  // Session mới (Run lại) → mở lại panel
  useEffect(() => {
    if (kind) {
      setUserClosed(false);
      requestAnimationFrame(() => setVisible(true));
      setExpanded(false);
      if (kind === "html") setIframeKey((k) => k + 1);
    } else {
      setVisible(false);
      setCanvasReady(false);
    }
  }, [kind, previewHtml, canvasVisible]);

  useEffect(() => {
    if (turtleCode) lastTurtleRef.current = turtleCode;
  }, [turtleCode]);

  useEffect(() => {
    if (kind !== "canvas") {
      setCanvasReady(false);
      return;
    }
    const id = requestAnimationFrame(() => setCanvasReady(true));
    return () => cancelAnimationFrame(id);
  }, [kind]);

  // Turtle chạy độc lập — đóng panel không hủy
  useEffect(() => {
    if (kind !== "canvas" || !canvasReady || !turtleCode || runLock.current) return;
    let cancelled = false;
    runLock.current = true;
    setRunning(true);
    const code = turtleCode;

    (async () => {
      addTermLine({
        kind: "info",
        text: usesTurtle(code) ? "Turtle canvas" : "Python",
      });
      const result = await runPythonWithSkulpt({
        code,
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
          kind: result.ok ? "info" : "err",
          text: result.ok ? `Xong · ${result.durationMs} ms` : `Lỗi · ${result.durationMs} ms`,
        });
        // Chỉ xóa turtleCode khi chạy xong — không phụ thuộc panel
        setTurtleCode(null);
        setRunning(false);
        runLock.current = false;
      }
    })();

    return () => {
      // Hủy chỉ khi đổi code / tắt canvas mode — không khi ẩn UI
      cancelled = true;
      runLock.current = false;
    };
  }, [kind, canvasReady, turtleCode, addTermLine, setRunning, setTurtleCode]);

  /** Chỉ ẩn UI — Terminal / turtle vẫn chạy */
  const closeUi = useCallback(() => {
    setVisible(false);
    setUserClosed(true);
  }, []);

  useEffect(() => {
    if (!kind || userClosed) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeUi();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, userClosed, closeUi]);

  // Canvas DOM luôn mount khi canvasVisible để turtle không mất target khi ẩn panel

  const mountCanvas = canvasVisible;
  if (!kind) return null;

  const title =
    kind === "html" ? "Live Preview · HTML" : "Live Preview · Python / Canvas";

  const recentOut = terminalLines
    .filter((l) => l.kind === "out" || l.kind === "err" || l.kind === "info")
    .slice(-8);

  // Ẩn UI nhưng không unmount — turtle/terminal không bị cắt
  return (
    <div
      className={cn(
        "fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6",
        "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        userClosed
          ? "pointer-events-none invisible opacity-0"
          : "opacity-100"
      )}
      style={{
        paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
      }}
      aria-hidden={userClosed}
    >
      <button
        type="button"
        aria-label="Đóng preview"
        tabIndex={userClosed ? -1 : 0}
        className="absolute inset-0 bg-black/55 backdrop-blur-[6px]"
        onClick={closeUi}
      />

      <div
        role="dialog"
        aria-label={title}
        style={{ willChange: "transform, opacity" }}
        className={cn(
          "relative z-10 flex flex-col overflow-hidden",
          "rounded-2xl border border-white/10",
          "bg-[#0d1117]/95 shadow-[0_25px_80px_rgba(0,0,0,0.65)]",
          "backdrop-blur-xl",
          expanded
            ? "h-[min(100dvh-1.5rem,900px)] w-[min(100vw-1rem,1200px)]"
            : "h-[min(72dvh,560px)] w-[min(100vw-1.5rem,720px)] sm:h-[min(78dvh,640px)]"
        )}
      >
        <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 bg-[#161b22]/90 px-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/90" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/90" />
          </div>
          <span className="ml-2 truncate text-xs font-semibold text-zinc-200">
            {title}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            {kind === "html" && (
              <button
                type="button"
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
                title="Tải lại"
                onClick={() => setIframeKey((k) => k + 1)}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
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
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white"
              title="Đóng (Terminal vẫn chạy)"
              onClick={closeUi}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col bg-[#0a0a0a]">
          {kind === "html" && previewHtml && (
            <iframe
              key={iframeKey}
              title="Live Preview"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              className="absolute inset-0 h-full w-full border-0 bg-white"
              srcDoc={previewHtml}
            />
          )}

          {kind === "canvas" && (
            <>
              <div
                id={TURTLE_TARGET_ID}
                className="min-h-0 w-full flex-1 overflow-hidden"
              />
              {showDpad && (
                <div className="shrink-0 border-t border-white/10 bg-[#12151a] px-3 py-3">
                  <div className="mb-2 flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Gamepad2 className="h-3.5 w-3.5" />
                    Điều khiển
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
                </div>
              )}
              {recentOut.length > 0 && (
                <div className="max-h-20 shrink-0 overflow-auto border-t border-white/5 bg-black/40 px-2 py-1 font-mono text-[10px] text-zinc-400">
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
            </>
          )}
        </div>

        <div className="flex h-8 shrink-0 items-center justify-between border-t border-white/10 bg-[#161b22]/80 px-3 text-[10px] text-zinc-500">
          <span>Opus Code</span>
          <span className="flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Esc đóng · Terminal vẫn chạy
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
