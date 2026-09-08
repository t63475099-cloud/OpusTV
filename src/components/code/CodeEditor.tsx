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
  return (
    window.innerWidth < 768 ||
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  );
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
  const [mobile, setMobile] = useState(false);

  useEffect(() => {
    const sync = () => setMobile(isTouchMobile());
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);

  // Expose editor API cho thanh công cụ mobile (paste / clear)
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

    // Mobile: tắt widget gợi ý / spam accept
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
        suggest: {
          showWords: false,
          showSnippets: false,
          preview: false,
          selectionMode: "never",
        },
      });
      // Đóng suggest nếu lỡ mở
      editor.onDidChangeCursorSelection(() => {
        try {
          const suggest = editor.getContribution?.("editor.contrib.suggestController") as
            | { cancelSuggestWidget?: () => void }
            | undefined;
          suggest?.cancelSuggestWidget?.();
        } catch {
          /* ignore */
        }
      });
    }

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const id = useCodeStore.getState().activeId;
      if (id) markSaved(id);
    });
    if (active) applyMarkers(active.content || "", active.langId || "javascript");
  };

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(
      () => applyMarkers(active.content || "", active.langId || "javascript"),
      80
    );
    return () => clearTimeout(t);
  }, [active?.id, active?.langId, applyMarkers, active]);

  const editorOptions = useMemo(() => {
    const base = {
      fontSize: mobile ? 15 : 14,
      fontFamily: "Consolas, 'Courier New', monospace",
      minimap: { enabled: !mobile },
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
      matchBrackets: "always" as const,
      // Mobile: tắt auto-suggest / auto-close gây spam ký tự
      quickSuggestions: mobile
        ? false
        : { other: true, comments: false, strings: false },
      suggestOnTriggerCharacters: !mobile,
      acceptSuggestionOnEnter: mobile ? ("off" as const) : ("on" as const),
      acceptSuggestionOnCommitCharacter: !mobile,
      wordBasedSuggestions: mobile ? ("off" as const) : ("currentDocument" as const),
      parameterHints: { enabled: !mobile },
      snippetSuggestions: mobile ? ("none" as const) : ("inline" as const),
      tabCompletion: mobile ? ("off" as const) : ("on" as const),
      autoClosingBrackets: mobile ? ("never" as const) : ("languageDefined" as const),
      autoClosingQuotes: mobile ? ("never" as const) : ("languageDefined" as const),
      autoSurround: mobile ? ("never" as const) : ("languageDefined" as const),
      autoClosingDelete: "never" as const,
      autoClosingOvertype: "never" as const,
      hover: { enabled: !mobile },
      links: !mobile,
      contextmenu: true,
      accessibilitySupport: "off" as const,
    };
    return base;
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
    <div className="h-full min-h-0 w-full opacity-100 transition-opacity duration-300">
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
          // Chặn content spam quá dài bất thường trên 1 dòng (mobile glitch)
          if (mobile && v.length > 200_000) return;
          updateContent(active.id, v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(
            () => applyMarkers(v, active.langId || "javascript"),
            300
          );
        }}
        options={editorOptions}
      />
    </div>
  );
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
