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
    ("ontouchstart" in window && navigator.maxTouchPoints > 0)
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
        "editorSuggestWidget.background": "#252526",
        "editorSuggestWidget.border": "#454545",
        "editorSuggestWidget.selectedBackground": "#04395e",
      },
    });
    monaco.editor.setTheme("opus-dark");

    // Giữ diagnostics TS/JS nhẹ trên mobile
    const noSem = isTouchMobile();
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: noSem,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: noSem,
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
      strict: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      noEmit: true,
      allowJs: true,
      checkJs: false,
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const id = useCodeStore.getState().activeId;
      if (id) markSaved(id);
    });

    // Mobile: mở gợi ý bằng Ctrl+Space / nút — không auto-accept khi gõ
    if (isTouchMobile()) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
        editor.trigger("opus", "editor.action.triggerSuggest", {});
      });
    }

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

  /**
   * Mobile: bật IntelliSense giống VS Code nhưng chống spam:
   * - Có quickSuggestions + trigger characters
   * - KHÔNG accept bằng commit character (tránh lặp mlml…)
   * - Tắt word-based suggestions (nguồn spam chính trên soft keyboard)
   * - suggest delay dài hơn một chút
   */
  const editorOptions = useMemo(() => {
    return {
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
      // --- IntelliSense (VS Code style) ---
      quickSuggestions: {
        other: true,
        comments: false,
        strings: false,
      },
      suggestOnTriggerCharacters: true,
      // Quan trọng: không tự nhận gợi ý khi gõ dấu / chữ → chống spam mobile
      acceptSuggestionOnCommitCharacter: false,
      acceptSuggestionOnEnter: "on" as const,
      // Word-based hay gây lặp ký tự trên IME điện thoại
      wordBasedSuggestions: "off" as const,
      parameterHints: { enabled: true },
      snippetSuggestions: "inline" as const,
      tabCompletion: "on" as const,
      suggestSelection: "first" as const,
      suggestFontSize: mobile ? 14 : 13,
      suggestLineHeight: mobile ? 26 : 22,
      // Delay trước khi hiện gợi ý (ms) — mobile chậm hơn để ổn định
      // (Monaco không có option delay trực tiếp; dùng suggest.show*)
      suggest: {
        showWords: false,
        showSnippets: true,
        showKeywords: true,
        showClasses: true,
        showFunctions: true,
        showVariables: true,
        showProperties: true,
        showValues: true,
        showColors: true,
        preview: false,
        insertMode: "replace" as const,
        filterGraceful: true,
        localityBonus: true,
        shareSuggestSelections: false,
        selectionMode: "always" as const,
      },
      // Auto-close nhẹ: desktop full, mobile chỉ trước khoảng trắng
      autoClosingBrackets: mobile ? ("beforeWhitespace" as const) : ("languageDefined" as const),
      autoClosingQuotes: mobile ? ("beforeWhitespace" as const) : ("languageDefined" as const),
      autoSurround: mobile ? ("never" as const) : ("languageDefined" as const),
      autoClosingDelete: "auto" as const,
      autoClosingOvertype: "auto" as const,
      hover: { enabled: !mobile, delay: 400 },
      links: true,
      contextmenu: true,
      accessibilitySupport: "off" as const,
      // Touch scroll mượt
      mouseWheelZoom: !mobile,
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
          // Chống glitch spam: nhảy quá nhiều ký tự trong 1 lần trên mobile
          if (mobile) {
            const prev = lastValueRef.current || "";
            const delta = Math.abs(v.length - prev.length);
            // Soft keyboard spam thường thêm hàng nghìn ký tự lặp trong 1 event
            if (delta > 8000) {
              return;
            }
            // Phát hiện pattern lặp ngắn (vd mlmlml…)
            if (delta > 200 && isSpamPattern(v.slice(Math.max(0, v.length - 400)))) {
              return;
            }
          }
          lastValueRef.current = v;
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

/** Chuỗi lặp 1–3 ký tự chiếm phần lớn → spam */
function isSpamPattern(chunk: string): boolean {
  if (chunk.length < 80) return false;
  const sample = chunk.slice(-120);
  // lặp 2 ký tự
  if (/^([a-zA-Z0-9<>/]{1,3})\1{20,}$/.test(sample.replace(/\s/g, ""))) return true;
  const compact = sample.replace(/\s/g, "");
  if (compact.length < 60) return false;
  const unit = compact.slice(0, 2);
  if (unit.length && compact.split(unit).length > 25) return true;
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
