"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  Code2,
  FilePlus,
  Files,
  FolderOpen,
  PanelLeftClose,
  PanelLeft,
  X,
  Trash2,
  ChevronRight,
} from "lucide-react";
import type { OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { CODE_LANGUAGES, getLangMeta, type CodeLangId } from "@/lib/codeLanguages";
import { useCodeStore } from "@/lib/codeStore";
import { analyzeCode } from "@/lib/codeDiagnostics";
import { cn } from "@/lib/utils";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-zinc-400">
      Đang tải editor…
    </div>
  ),
});

export default function OpusCodeIDE() {
  const files = useCodeStore((s) => s.files);
  const openIds = useCodeStore((s) => s.openIds);
  const activeId = useCodeStore((s) => s.activeId);
  const sidebarOpen = useCodeStore((s) => s.sidebarOpen);
  const createFile = useCodeStore((s) => s.createFile);
  const updateContent = useCodeStore((s) => s.updateContent);
  const deleteFile = useCodeStore((s) => s.deleteFile);
  const openFile = useCodeStore((s) => s.openFile);
  const closeTab = useCodeStore((s) => s.closeTab);
  const setActive = useCodeStore((s) => s.setActive);
  const setSidebarOpen = useCodeStore((s) => s.setSidebarOpen);

  const [newMenu, setNewMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const diagTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const active = useMemo(
    () => files.find((f) => f.id === activeId) || null,
    [files, activeId]
  );

  const openFiles = useMemo(
    () => openIds.map((id) => files.find((f) => f.id === id)).filter(Boolean),
    [openIds, files]
  );

  const applyMarkers = useCallback(
    (content: string, langId: string, model?: Monaco.editor.ITextModel | null) => {
      const monaco = monacoRef.current;
      const ed = editorRef.current;
      const m = model || ed?.getModel();
      if (!monaco || !m) return;

      // JS/TS/CSS/HTML: Monaco built-in validators already mark errors (red).
      // Our layer adds yellow warnings for all languages.
      const diags = analyzeCode(content, langId);
      const markers: Monaco.editor.IMarkerData[] = diags.map((d) => ({
        severity: monaco.MarkerSeverity.Warning,
        message: d.message,
        startLineNumber: d.startLineNumber,
        startColumn: d.startColumn,
        endLineNumber: d.endLineNumber,
        endColumn: d.endColumn,
      }));
      monaco.editor.setModelMarkers(m, "opus-code", markers);
    },
    []
  );

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Theme giống VS Code Dark+
    monaco.editor.defineTheme("opus-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "C586C0" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "type", foreground: "4EC9B0" },
        { token: "function", foreground: "DCDCAA" },
        { token: "variable", foreground: "9CDCFE" },
        { token: "tag", foreground: "569CD6" },
        { token: "attribute.name", foreground: "9CDCFE" },
        { token: "attribute.value", foreground: "CE9178" },
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editorCursor.foreground": "#aeafad",
        "editor.selectionBackground": "#264f78",
        "editor.inactiveSelectionBackground": "#3a3d41",
        "editorIndentGuide.background1": "#404040",
        "editorGutter.background": "#1e1e1e",
      },
    });
    monaco.editor.setTheme("opus-dark");

    // TS/JS: bật diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      strict: true,
    });

    if (active) {
      applyMarkers(active.content, active.langId, editor.getModel());
    }
  };

  const onChange = (value?: string) => {
    if (!activeId || value === undefined) return;
    updateContent(activeId, value);
    if (diagTimer.current) clearTimeout(diagTimer.current);
    diagTimer.current = setTimeout(() => {
      const f = useCodeStore.getState().files.find((x) => x.id === activeId);
      if (f) applyMarkers(value, f.langId);
    }, 280);
  };

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => applyMarkers(active.content, active.langId), 100);
    return () => clearTimeout(t);
  }, [active?.id, active?.langId, applyMarkers, active]);

  if (!mounted) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center bg-[#1e1e1e] text-zinc-400">
        Đang mở Opus Code…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] min-h-[420px] w-full overflow-hidden bg-[#1e1e1e] text-[#cccccc]">
      {/* Activity bar */}
      <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-[#2b2b2b] bg-[#333333] py-2">
        <button
          type="button"
          title="Explorer"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded transition-colors duration-300",
            sidebarOpen ? "text-white border-l-2 border-white" : "text-zinc-400 hover:text-white"
          )}
        >
          <Files className="h-5 w-5" />
        </button>
        <button
          type="button"
          title="File mới"
          onClick={() => setNewMenu((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded text-zinc-400 transition-colors duration-300 hover:text-white"
        >
          <FilePlus className="h-5 w-5" />
        </button>
        <div className="mt-auto pb-2">
          <Code2 className="h-5 w-5 text-zinc-500" />
        </div>
      </div>

      {/* Sidebar explorer */}
      <div
        className={cn(
          "flex shrink-0 flex-col border-r border-[#2b2b2b] bg-[#252526] transition-[width,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden",
          sidebarOpen ? "w-[220px] opacity-100" : "w-0 opacity-0"
        )}
      >
        <div className="flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="h-3.5 w-3.5" /> Explorer
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 hover:bg-white/10"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </button>
        </div>

        {newMenu && (
          <div className="mx-2 mb-2 max-h-48 overflow-y-auto rounded border border-white/10 bg-[#1e1e1e] p-1 shadow-xl">
            <p className="px-2 py-1 text-[10px] uppercase text-zinc-500">Ngôn ngữ mới</p>
            {CODE_LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  createFile(lang.id as CodeLangId);
                  setNewMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-white/10"
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: lang.color }}
                />
                {lang.label}
                <span className="ml-auto text-[10px] text-zinc-500">.{lang.ext}</span>
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-1 pb-3">
          <p className="px-2 py-1 text-[11px] text-zinc-500">OPUS CODE</p>
          {files.map((f) => {
            const meta = getLangMeta(f.langId);
            const activeRow = f.id === activeId;
            return (
              <div
                key={f.id}
                className={cn(
                  "group flex items-center gap-1 rounded px-1.5 py-1 text-xs cursor-pointer",
                  activeRow ? "bg-[#37373d] text-white" : "hover:bg-white/5 text-zinc-300"
                )}
                onClick={() => openFile(f.id)}
              >
                <ChevronRight className="h-3 w-3 opacity-40 shrink-0" />
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ background: meta.color }}
                />
                <span className="min-w-0 flex-1 truncate">{f.name}</span>
                <button
                  type="button"
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Xóa ${f.name}?`)) deleteFile(f.id);
                  }}
                >
                  <Trash2 className="h-3 w-3 text-zinc-400" />
                </button>
              </div>
            );
          })}
          {files.length === 0 && (
            <p className="px-3 py-4 text-xs text-zinc-500">Chưa có file. Bấm + để tạo.</p>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Tabs */}
        <div className="flex h-9 shrink-0 items-end overflow-x-auto border-b border-[#2b2b2b] bg-[#252526] scrollbar-hide">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex h-9 w-9 items-center justify-center text-zinc-400 hover:text-white"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}
          {openFiles.map((f) => {
            if (!f) return null;
            const isA = f.id === activeId;
            return (
              <div
                key={f.id}
                className={cn(
                  "group flex h-9 max-w-[160px] items-center gap-1.5 border-r border-[#2b2b2b] px-3 text-xs cursor-pointer",
                  isA
                    ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]"
                    : "bg-[#2d2d2d] text-zinc-400 hover:text-zinc-200"
                )}
                onClick={() => setActive(f.id)}
              >
                <span className="truncate">{f.name}</span>
                <button
                  type="button"
                  className="rounded p-0.5 opacity-60 hover:opacity-100 hover:bg-white/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(f.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Monaco */}
        <div className="min-h-0 flex-1">
          {active ? (
            <MonacoEditor
              key={active.id}
              height="100%"
              language={getLangMeta(active.langId).monaco}
              path={active.name}
              value={active.content}
              theme="opus-dark"
              onMount={onMount}
              onChange={onChange}
              options={{
                fontSize: 14,
                fontFamily: "Consolas, 'Courier New', monospace",
                minimap: { enabled: true, scale: 1 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                tabSize: 2,
                wordWrap: "on",
                lineNumbers: "on",
                renderLineHighlight: "line",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                bracketPairColorization: { enabled: true },
                guides: { bracketPairs: true, indentation: true },
                padding: { top: 8 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                parameterHints: { enabled: true },
                formatOnPaste: true,
                autoClosingBrackets: "always",
                autoClosingQuotes: "always",
                matchBrackets: "always",
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-[#1e1e1e] text-zinc-500">
              <Code2 className="h-12 w-12 opacity-40" />
              <p className="text-sm">Opus Code</p>
              <p className="text-xs opacity-70">Tạo file mới để bắt đầu viết code</p>
              <button
                type="button"
                onClick={() => setNewMenu(true)}
                className="mt-2 rounded-lg bg-[#0e639c] px-4 py-2 text-sm text-white hover:bg-[#1177bb]"
              >
                Tạo file
              </button>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex h-6 shrink-0 items-center justify-between border-t border-[#007acc] bg-[#007acc] px-3 text-[11px] text-white">
          <span className="flex items-center gap-3">
            <span>Opus Code</span>
            {active && (
              <>
                <span className="opacity-80">{getLangMeta(active.langId).label}</span>
                <span className="opacity-70">{active.name}</span>
              </>
            )}
          </span>
          <span className="opacity-90">UTF-8 · LF · Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}
