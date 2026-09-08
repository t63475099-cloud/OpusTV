"use client";

import { useCallback, useEffect, useState } from "react";
import type * as Monaco from "monaco-editor";
import { getSuggestions, extractPrefix, type SuggestItem } from "@/lib/codeSuggest";
import { useCodeStore } from "@/lib/codeStore";
import { cn } from "@/lib/utils";

type EditorLike = Monaco.editor.IStandaloneCodeEditor;

function getEditor(): EditorLike | null {
  return (
    (window as unknown as { __opusCodeEditor?: EditorLike }).__opusCodeEditor || null
  );
}

export default function MobileSuggest() {
  const activeId = useCodeStore((s) => s.activeId);
  const getFile = useCodeStore((s) => s.getFile);
  const updateContent = useCodeStore((s) => s.updateContent);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [prefix, setPrefix] = useState("");

  const refresh = useCallback(() => {
    const ed = getEditor();
    const file = activeId ? getFile(activeId) : null;
    if (!ed || !file || file.kind !== "file") {
      setItems([]);
      setOpen(false);
      return;
    }
    const model = ed.getModel();
    const pos = ed.getPosition();
    if (!model || !pos) return;

    const offset = model.getOffsetAt(pos);
    const full = model.getValue();
    const before = full.slice(0, offset);
    const { prefix: pre } = extractPrefix(before);
    setPrefix(pre);

    // Chỉ gợi ý khi có trigger hữu ích
    const last = before.slice(-1);
    const trigger =
      /[a-zA-Z0-9_.<$#-]/.test(last) ||
      before.trimEnd().endsWith("<") ||
      before.endsWith(".");

    if (!trigger) {
      setItems([]);
      setOpen(false);
      return;
    }

    const lang = file.langId || "javascript";
    const list = getSuggestions(lang, pre, before);
    setItems(list);
    setOpen(list.length > 0);
  }, [activeId, getFile]);

  useEffect(() => {
    // Poll nhẹ theo thay đổi store + interval ngắn khi mobile
    const id = window.setInterval(refresh, 280);
    window.addEventListener("opus-code-suggest-refresh", refresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("opus-code-suggest-refresh", refresh);
    };
  }, [refresh]);

  // Expose mở thủ công từ toolbar
  useEffect(() => {
    (window as unknown as { __opusOpenSuggest?: () => void }).__opusOpenSuggest = () => {
      refresh();
      setOpen(true);
    };
    return () => {
      delete (window as unknown as { __opusOpenSuggest?: () => void }).__opusOpenSuggest;
    };
  }, [refresh]);

  const apply = (item: SuggestItem) => {
    const ed = getEditor();
    const file = activeId ? getFile(activeId) : null;
    if (!ed || !file) return;
    const model = ed.getModel();
    const pos = ed.getPosition();
    if (!model || !pos) return;

    const offset = model.getOffsetAt(pos);
    const full = model.getValue();
    const before = full.slice(0, offset);
    const after = full.slice(offset);
    const { prefix: pre, startOffset } = extractPrefix(before);

    // Xóa prefix đang gõ, chèn insert một lần duy nhất
    let insertText = item.insert;
    // Nếu đang gõ sau "<" và insert là tag đầy đủ
    if (before.endsWith("<") && item.kind === "tag" && !insertText.startsWith("<")) {
      // prefix rỗng, keep
    } else if (/<[a-z0-9]*$/i.test(before) && item.kind === "tag") {
      // đã có < + prefix → chỉ thay phần prefix
    }

    const newBefore = before.slice(0, startOffset) + insertText;
    const next = newBefore + after;
    const newOffset = newBefore.length;

    // Chặn double-fire trong 400ms
    const lock = (window as unknown as { __opusSuggestLock?: number }).__opusSuggestLock || 0;
    if (Date.now() - lock < 400) return;
    (window as unknown as { __opusSuggestLock?: number }).__opusSuggestLock = Date.now();

    ed.pushUndoStop();
    model.setValue(next);
    const newPos = model.getPositionAt(Math.min(newOffset, next.length));
    ed.setPosition(newPos);
    ed.focus();
    ed.pushUndoStop();
    updateContent(file.id, next);
    setOpen(false);
    setItems([]);
  };

  if (!open || items.length === 0) return null;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-[95] max-h-[38vh] overflow-auto border-t border-[#454545] bg-[#1e1e1e]/98 backdrop-blur-md shadow-[0_-8px_24px_rgba(0,0,0,0.45)] md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#333]">
        <span className="text-[11px] text-zinc-400">
          Gợi ý{prefix ? `: “${prefix}”` : ""}
        </span>
        <button
          type="button"
          className="text-[11px] text-zinc-400 px-2 py-1 rounded hover:bg-white/10"
          onClick={() => setOpen(false)}
        >
          Đóng
        </button>
      </div>
      <ul className="py-1">
        {items.map((it) => (
          <li key={it.label + it.insert}>
            <button
              type="button"
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2.5 text-left active:bg-[#04395e]",
                "border-b border-white/5 last:border-0"
              )}
              onPointerDown={(e) => {
                // pointerdown + preventDefault tránh bàn phím spam thêm ký tự
                e.preventDefault();
                e.stopPropagation();
                apply(it);
              }}
            >
              <span
                className={cn(
                  "text-[10px] font-bold uppercase w-8 shrink-0",
                  it.kind === "tag" && "text-sky-400",
                  it.kind === "keyword" && "text-purple-400",
                  it.kind === "function" && "text-amber-300",
                  it.kind === "property" && "text-emerald-400",
                  it.kind === "snippet" && "text-rose-400"
                )}
              >
                {it.kind.slice(0, 3)}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-white font-medium truncate">{it.label}</span>
                {it.detail && (
                  <span className="block text-[10px] text-zinc-500 truncate">{it.detail}</span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
