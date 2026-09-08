"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { getLangMeta } from "@/lib/codeLanguages";
import { analyzeCode } from "@/lib/codeDiagnostics";
import { useCodeStore } from "@/lib/codeStore";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-zinc-500">
      Đang tải editor…
    </div>
  ),
});

function isTouchMobile() {
  if (typeof window === "undefined") return false;
  return window.innerWidth < 768 || ("ontouchstart" in window && navigator.maxTouchPoints > 0);
}

export default function CodeEditor() {
  const activeId = useCodeStore((s) => s.activeId);
  const nodes = useCodeStore((s) => s.nodes);
  const updateContent = useCodeStore((s) => s.updateContent);
  const markSaved = useCodeStore((s) => s.markSaved);

  const active = nodes.find((n) => n.id === activeId && n.kind === "file") || null;
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastValueRef = useRef("");
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const sync = () => setMobile(isTouchMobile());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  useEffect(() => {
    (window as unknown as { __opusCodeEditor?: Monaco.editor.IStandaloneCodeEditor | null }).__opusCodeEditor =
      editorRef.current;
    return () => {
      (window as unknown as { __opusCodeEditor?: Monaco.editor.IStandaloneCodeEditor | null }).__opusCodeEditor =
        null;
    };
  }, [active?.id]);

  const applyMarkers = useCallback((content: string, langId: string) => {
    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (!monaco || !model) return;
    const diags = analyzeCode(content, langId);
    monaco.editor.setModelMarkers(
      model,
      "opus-code",
      diags.map((d) => ({
        severity: monaco.MarkerSeverity.Warning,
        message: d.message,
        startLineNumber: d.startLineNumber,
        startColumn: d.startColumn,
        endLineNumber: d.endLineNumber,
        endColumn: d.endColumn,
      }))
    );
  }, []);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    (window as unknown as { __opusCodeEditor?: Monaco.editor.IStandaloneCodeEditor }).__opusCodeEditor =
      editor;

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
      ],
      colors: {
        "editor.background": "#1e1e1e",
        "editor.foreground": "#d4d4d4",
        "editorLineNumber.foreground": "#858585",
        "editor.selectionBackground": "#264f78",
      },
    });
    monaco.editor.setTheme("opus-dark");

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });

    // Mobile: TẮT HOÀN TOÀN Monaco suggest (triệt spam) — dùng MobileSuggest custom
    if (isTouchMobile()) {
      editor.updateOptions({
        quickSuggestions: false,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: "off",
        acceptSuggestionOnCommitCharacter: false,
        wordBasedSuggestions: "off",
        parameterHints: { enabled: false },
        snippetSuggestions: "none",
        tabCompletion: "off",
        suggest: { showWords: false, showSnippets: false, preview: false },
      });
      // Đóng widget nếu Monaco cố mở
      const kill = () => {
        try {
          const c = editor.getContribution?.("editor.contrib.suggestController") as
            | { cancelSuggestWidget?: () => void; stop?: () => void }
            | undefined;
          c?.cancelSuggestWidget?.();
        } catch {
          /* */
        }
      };
      editor.onDidChangeCursorPosition(kill);
      editor.onDidType?.(kill as never);
      editor.onKeyDown(kill);
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const id = useCodeStore.getState().activeId;
      if (id) markSaved(id);
    });

    if (active) applyMarkers(active.content || "", active.langId || "javascript");
    lastValueRef.current = active?.content || "";
  };

  useEffect(() => {
    if (!active) return;
    lastValueRef.current = active.content || "";
    const t = setTimeout(
      () => applyMarkers(active.content || "", active.langId || "javascript"),
      80
    );
    return () => clearTimeout(t);
  }, [active?.id, active?.langId, applyMarkers, active]);

  const editorOptions = useMemo(() => {
    if (mobile) {
      return {
        fontSize: 15,
        fontFamily: "Consolas, 'Courier New', monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on" as const,
        lineNumbers: "on" as const,
        renderLineHighlight: "line" as const,
        smoothScrolling: true,
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        padding: { top: 8 },
        formatOnPaste: false,
        matchBrackets: "near" as const,
        // Triệt suggest Monaco
        quickSuggestions: false as const,
        suggestOnTriggerCharacters: false,
        acceptSuggestionOnEnter: "off" as const,
        acceptSuggestionOnCommitCharacter: false,
        wordBasedSuggestions: "off" as const,
        parameterHints: { enabled: false },
        snippetSuggestions: "none" as const,
        tabCompletion: "off" as const,
        suggest: {
          showWords: false,
          showSnippets: false,
          showKeywords: false,
          preview: false,
          selectionMode: "never" as const,
        },
        autoClosingBrackets: "never" as const,
        autoClosingQuotes: "never" as const,
        autoSurround: "never" as const,
        autoClosingDelete: "never" as const,
        autoClosingOvertype: "never" as const,
        hover: { enabled: false },
        links: false,
        contextmenu: true,
        accessibilitySupport: "off" as const,
        mouseWheelZoom: false,
      };
    }
    // Desktop: Monaco IntelliSense đầy đủ
    return {
      fontSize: 14,
      fontFamily: "Consolas, 'Courier New', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      wordWrap: "on" as const,
      lineNumbers: "on" as const,
      renderLineHighlight: "line" as const,
      smoothScrolling: true,
      bracketPairColorization: { enabled: true },
      guides: { bracketPairs: true, indentation: true },
      padding: { top: 8 },
      formatOnPaste: true,
      matchBrackets: "always" as const,
      quickSuggestions: { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: true,
      acceptSuggestionOnEnter: "on" as const,
      acceptSuggestionOnCommitCharacter: true,
      wordBasedSuggestions: "currentDocument" as const,
      parameterHints: { enabled: true },
      snippetSuggestions: "inline" as const,
      tabCompletion: "on" as const,
      autoClosingBrackets: "languageDefined" as const,
      autoClosingQuotes: "languageDefined" as const,
      hover: { enabled: true },
      links: true,
      contextmenu: true,
      accessibilitySupport: "off" as const,
    };
  }, [mobile]);

  if (!active) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-[#1e1e1e] text-zinc-500 text-sm">
        <FileHint />
        <p>Chọn hoặc tạo file để bắt đầu</p>
      </div>
    );
  }

  const meta = getLangMeta(active.langId || "javascript");

  return (
    <div className="relative h-full min-h-0 w-full opacity-100 transition-opacity duration-300">
      <MonacoEditor
        key={active.id}
        height="100%"
        language={meta.monaco}
        path={active.name}
        value={active.content || ""}
        theme="opus-dark"
        onMount={onMount}
        onChange={(v) => {
          if (v === undefined) return;
          if (mobile) {
            const prev = lastValueRef.current || "";
            const delta = Math.abs(v.length - prev.length);
            if (delta > 5000) return;
            if (delta > 150 && isSpamPattern(v.slice(-300))) return;
          }
          lastValueRef.current = v;
          updateContent(active.id, v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => {
            applyMarkers(v, active.langId || "javascript");
            window.dispatchEvent(new Event("opus-code-suggest-refresh"));
          }, 200);
        }}
        options={editorOptions}
      />
    </div>
  );
}

function isSpamPattern(chunk: string): boolean {
  if (chunk.length < 60) return false;
  const compact = chunk.replace(/\s/g, "");
  if (compact.length < 40) return false;
  for (let n = 1; n <= 3; n++) {
    const unit = compact.slice(0, n);
    if (!unit) continue;
    const parts = compact.split(unit);
    if (parts.length > 20) return true;
  }
  return false;
}

function FileHint() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="opacity-40">
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M14 2v6h6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
