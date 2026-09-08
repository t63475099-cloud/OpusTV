"use client";

import { useCallback, useEffect, useRef } from "react";
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

export default function CodeEditor() {
  const activeId = useCodeStore((s) => s.activeId);
  const nodes = useCodeStore((s) => s.nodes);
  const updateContent = useCodeStore((s) => s.updateContent);
  const markSaved = useCodeStore((s) => s.markSaved);

  const active = nodes.find((n) => n.id === activeId && n.kind === "file") || null;
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeId) markSaved(activeId);
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
          updateContent(active.id, v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => applyMarkers(v, active.langId || "javascript"), 250);
        }}
        options={{
          fontSize: 14,
          fontFamily: "Consolas, 'Courier New', monospace",
          minimap: { enabled: typeof window !== "undefined" && window.innerWidth >= 768 },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          lineNumbers: "on",
          renderLineHighlight: "line",
          smoothScrolling: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          padding: { top: 8 },
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          autoClosingBrackets: "always",
          autoClosingQuotes: "always",
          formatOnPaste: true,
          matchBrackets: "always",
        }}
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
