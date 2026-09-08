"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ClipboardPaste,
  Code2,
  Files,
  PanelLeft,
  PanelLeftClose,
  Play,
  SquareTerminal,
  Trash2,
  Lightbulb,
} from "lucide-react";
import { useCodeStore } from "@/lib/codeStore";
import { getLangMeta } from "@/lib/codeLanguages";
import { runCode } from "@/lib/codeRunner";
import { cn } from "@/lib/utils";
import FileExplorer from "./FileExplorer";
import EditorTabs from "./EditorTabs";
import CodeEditor from "./CodeEditor";
import TerminalPanel from "./TerminalPanel";
import MobileSuggest from "./MobileSuggest";
import FloatingLivePreview from "./FloatingLivePreview";

export default function OpusCodeLayout() {
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const sidebarOpen = useCodeStore((s) => s.sidebarOpen);
  const setSidebarOpen = useCodeStore((s) => s.setSidebarOpen);
  const explorerWidth = useCodeStore((s) => s.explorerWidth);
  const setExplorerWidth = useCodeStore((s) => s.setExplorerWidth);
  const terminalOpen = useCodeStore((s) => s.terminalOpen);
  const setTerminalOpen = useCodeStore((s) => s.setTerminalOpen);
  const activeId = useCodeStore((s) => s.activeId);
  const getFile = useCodeStore((s) => s.getFile);
  const getPath = useCodeStore((s) => s.getPath);
  const running = useCodeStore((s) => s.running);
  const setRunning = useCodeStore((s) => s.setRunning);
  const addTermLine = useCodeStore((s) => s.addTermLine);
  const setPreviewHtml = useCodeStore((s) => s.setPreviewHtml);
  const setCanvasVisible = useCodeStore((s) => s.setCanvasVisible);
  const setTurtleCode = useCodeStore((s) => s.setTurtleCode);
  const setTerminalHeight = useCodeStore((s) => s.setTerminalHeight);
  const markSaved = useCodeStore((s) => s.markSaved);
  const updateContent = useCodeStore((s) => s.updateContent);

  useEffect(() => {
    setMounted(true);
    const mq = () => setIsMobile(window.innerWidth < 768);
    mq();
    window.addEventListener("resize", mq);
    return () => window.removeEventListener("resize", mq);
  }, []);

  // Mobile: đóng explorer khi chọn file
  useEffect(() => {
    if (isMobile && activeId) setSidebarOpen(false);
  }, [activeId, isMobile, setSidebarOpen]);



  const onSuggestMobile = useCallback(() => {
    const open = (window as unknown as { __opusOpenSuggest?: () => void }).__opusOpenSuggest;
    if (open) open();
    else {
      const ed = (window as unknown as { __opusCodeEditor?: { focus?: () => void } }).__opusCodeEditor;
      ed?.focus?.();
      window.dispatchEvent(new Event("opus-code-suggest-refresh"));
    }
  }, []);

  const onPasteMobile = useCallback(async () => {
    const file = activeId ? getFile(activeId) : null;
    if (!file || file.kind !== "file") return;
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      const ed = (window as unknown as { __opusCodeEditor?: { getSelection?: () => unknown; executeEdits?: (s: string, e: unknown[]) => void; getModel?: () => { getValue: () => string } | null; focus?: () => void } }).__opusCodeEditor;
      if (ed?.executeEdits && ed.getSelection) {
        const sel = ed.getSelection();
        ed.executeEdits("opus-paste", [{ range: sel as never, text, forceMoveMarkers: true }]);
        const model = ed.getModel?.();
        if (model) updateContent(file.id, model.getValue());
        ed.focus?.();
      } else {
        updateContent(file.id, (file.content || "") + text);
      }
    } catch {
      // Fallback prompt if clipboard denied
      const text = window.prompt("Dán nội dung vào đây:");
      if (text != null) {
        const ed = (window as unknown as { __opusCodeEditor?: { getValue?: () => string; setValue?: (v: string) => void } }).__opusCodeEditor;
        if (ed?.setValue && ed.getValue) {
          ed.setValue(ed.getValue() + text);
          updateContent(file.id, ed.getValue());
        } else {
          updateContent(file.id, (file.content || "") + text);
        }
      }
    }
  }, [activeId, getFile, updateContent]);

  const onClearMobile = useCallback(() => {
    const file = activeId ? getFile(activeId) : null;
    if (!file || file.kind !== "file") return;
    if (!window.confirm("Xóa toàn bộ nội dung file này?")) return;
    const ed = (window as unknown as { __opusCodeEditor?: { setValue?: (v: string) => void } }).__opusCodeEditor;
    ed?.setValue?.("");
    updateContent(file.id, "");
  }, [activeId, getFile, updateContent]);

  const onRun = useCallback(async () => {
    const file = activeId ? getFile(activeId) : null;
    if (!file || file.kind !== "file") {
      addTermLine({ kind: "err", text: "Không có file đang mở để chạy." });
      setTerminalOpen(true);
      return;
    }
    // Ưu tiên đuôi file .py → python (tránh langId sai / file cũ)
    const langId =
      /\.py$/i.test(file.name) ? "python" : file.langId || "javascript";
    setTerminalOpen(true);
    setPreviewHtml(null);
    setCanvasVisible(false);
    setTurtleCode(null);
    addTermLine({ kind: "cmd", text: `run ${file.name}` });
    setRunning(true);
    try {
      const result = await runCode(langId as any, file.content || "", file.name);
      for (const line of result.lines) {
        addTermLine(line);
      }
      // Tự nhận diện output:
      //  - Canvas (Python Turtle) → Live Preview nổi + Terminal log gọn
      //  - HTML/CSS/JS web        → Live Preview nổi + Terminal log gọn
      //  - Console / biên dịch    → chỉ Terminal (không mở hộp Preview)
      if (result.turtleMode && result.turtleCode) {
        setPreviewHtml(null);
        setCanvasVisible(true);
        setTurtleCode(result.turtleCode);
        setTerminalHeight(Math.min(160, Math.max(120, window.innerHeight * 0.18)));
        markSaved(file.id);
        return;
      }
      if (result.htmlPreview) {
        setCanvasVisible(false);
        setTurtleCode(null);
        setPreviewHtml(result.htmlPreview);
        setTerminalHeight(Math.min(160, Math.max(120, window.innerHeight * 0.18)));
      } else {
        setPreviewHtml(null);
        setCanvasVisible(false);
        setTurtleCode(null);
        setTerminalHeight(Math.max(200, Math.min(360, window.innerHeight * 0.32)));
      }
      markSaved(file.id);
    } catch (e) {
      addTermLine({
        kind: "err",
        text: e instanceof Error ? e.message : String(e),
      });
    } finally {
      // Turtle giữ running=true tới khi Skulpt xong
      const st = useCodeStore.getState();
      if (!st.turtleCode) setRunning(false);
    }
  }, [
    activeId,
    getFile,
    addTermLine,
    setTerminalOpen,
    setRunning,
    setPreviewHtml,
    setCanvasVisible,
    setTurtleCode,
    setTerminalHeight,
    markSaved,
  ]);

  if (!mounted) {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-[#1e1e1e] text-zinc-500 text-sm">
        Đang mở Opus Code…
      </div>
    );
  }

  const active = activeId ? getFile(activeId) : null;
  const meta = active?.langId ? getLangMeta(active.langId) : null;

  return (
    <div
      className="opus-code-shell fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#1e1e1e] text-[#cccccc]"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      {/* Top toolbar */}
      <header className="relative z-[90] flex h-11 shrink-0 items-center gap-2 border-b border-[#2b2b2b] bg-[#3c3c3c] px-2 sm:px-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded text-zinc-200 hover:bg-white/10 md:hidden"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Explorer"
        >
          {sidebarOpen ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </button>
        <Link
          href="/"
          className="flex h-8 items-center gap-1 rounded-md px-1.5 text-zinc-300 hover:bg-white/10 hover:text-white"
          title="Về OpusFilm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden text-xs sm:inline">Film</span>
        </Link>
        <Code2 className="hidden h-5 w-5 text-sky-400 sm:block" />
        <span className="text-sm font-semibold text-white tracking-tight">Opus Code</span>
        <span className="hidden text-xs text-zinc-400 sm:inline truncate max-w-[40vw]">
          {active ? getPath(active.id) : "workspace"}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-zinc-200 hover:bg-white/10 md:hidden"
            onClick={onSuggestMobile}
            title="Gợi ý code"
            aria-label="Gợi ý"
          >
            <Lightbulb className="h-4 w-4 text-amber-300" />
            <span className="text-[11px]">Gợi ý</span>
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-zinc-200 hover:bg-white/10 md:hidden"
            onClick={() => void onPasteMobile()}
            title="Dán"
            aria-label="Dán"
          >
            <ClipboardPaste className="h-4 w-4" />
            <span className="text-[11px]">Dán</span>
          </button>
          <button
            type="button"
            className="flex h-8 items-center gap-1 rounded-md px-2 text-xs text-zinc-200 hover:bg-white/10 md:hidden"
            onClick={onClearMobile}
            title="Xóa nội dung"
            aria-label="Xóa"
          >
            <Trash2 className="h-4 w-4" />
            <span className="text-[11px]">Xóa</span>
          </button>
          <button
            type="button"
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-2 text-xs transition-colors",
              terminalOpen ? "bg-white/15 text-white" : "text-zinc-300 hover:bg-white/10"
            )}
          >
            <SquareTerminal className="h-4 w-4" />
            <span className="hidden sm:inline">Terminal</span>
          </button>
          <button
            type="button"
            onClick={() => void onRun()}
            disabled={running}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold text-white shadow",
              "bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all duration-500",
              "disabled:opacity-60 disabled:pointer-events-none"
            )}
          >
            <Play className="h-4 w-4 fill-white" />
            {running ? "Running…" : "Run"}
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop activity bar */}
        <div className="hidden w-12 shrink-0 flex-col items-center border-r border-[#2b2b2b] bg-[#333333] py-2 md:flex">
          <button
            type="button"
            title="Explorer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded",
              sidebarOpen ? "text-white border-l-2 border-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <Files className="h-5 w-5" />
          </button>
          <button
            type="button"
            title="Terminal"
            onClick={() => setTerminalOpen(!terminalOpen)}
            className={cn(
              "mt-1 flex h-10 w-10 items-center justify-center rounded",
              terminalOpen ? "text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            <SquareTerminal className="h-5 w-5" />
          </button>
        </div>

        {/* Explorer — drawer mobile / resizable desktop */}
        {isMobile && sidebarOpen && (
          <button
            type="button"
            className="absolute inset-0 z-[85] bg-black/50 md:hidden"
            aria-label="Đóng explorer"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          data-opus-panel
          className={cn(
            "z-[86] flex shrink-0 flex-col border-r border-[#2b2b2b] bg-[#252526] overflow-hidden",
            "transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isMobile
              ? cn(
                  "absolute inset-y-0 left-0 w-[min(86vw,300px)] shadow-2xl",
                  sidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
                )
              : cn(sidebarOpen ? "opacity-100" : "w-0 opacity-0 border-0")
          )}
          style={!isMobile && sidebarOpen ? { width: explorerWidth } : undefined}
        >
          <div className="min-h-0 flex-1 overflow-hidden">
            <FileExplorer />
          </div>
        </aside>

        {/* Desktop splitter */}
        {!isMobile && sidebarOpen && (
          <div
            className="hidden w-1 shrink-0 cursor-col-resize bg-transparent hover:bg-[#007acc]/50 md:block"
            onMouseDown={(e) => {
              const startX = e.clientX;
              const startW = explorerWidth;
              const onMove = (ev: MouseEvent) => {
                setExplorerWidth(startW + (ev.clientX - startX));
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            }}
          />
        )}

        {/* Main editor column */}
        <div className="relative z-[70] flex min-w-0 flex-1 flex-col overflow-hidden">
          <EditorTabs />
          <div className="min-h-0 flex-1 overflow-hidden">
            <CodeEditor />
            <MobileSuggest />
          </div>
          <TerminalPanel />
      <FloatingLivePreview />
        </div>
      </div>

      {/* Status bar */}
      <footer className="relative z-[90] flex h-6 shrink-0 items-center justify-between border-t border-[#007acc] bg-[#007acc] px-3 text-[11px] text-white">
        <span className="flex items-center gap-3 truncate">
          <span className="font-medium">Opus Code</span>
          {meta && <span className="opacity-90">{meta.label}</span>}
          {active && <span className="opacity-80 truncate">{active.name}</span>}
        </span>
        <span className="opacity-90 shrink-0">UTF-8 · LF · Spaces: 2</span>
      </footer>
    </div>
  );
}
