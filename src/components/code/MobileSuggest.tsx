"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

const KIND_ICON: Record<SuggestItem["kind"], string> = {
  keyword: "K",
  tag: "T",
  snippet: "S",
  property: "P",
  function: "F",
};

const KIND_COLOR: Record<SuggestItem["kind"], string> = {
  keyword: "bg-purple-600 text-white",
  tag: "bg-sky-600 text-white",
  snippet: "bg-rose-600 text-white",
  property: "bg-emerald-600 text-white",
  function: "bg-amber-500 text-black",
};

export default function MobileSuggest() {
  const activeId = useCodeStore((s) => s.activeId);
  const getFile = useCodeStore((s) => s.getFile);
  const updateContent = useCodeStore((s) => s.updateContent);
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const lockRef = useRef(0);

  const placeNearCursor = useCallback(() => {
    const ed = getEditor();
    if (!ed) return null;
    const position = ed.getPosition();
    if (!position) return null;
    try {
      const coords = ed.getScrolledVisiblePosition(position);
      if (!coords) return null;
      const dom = ed.getDomNode();
      if (!dom) return null;
      const rect = dom.getBoundingClientRect();
      const lineHeight = coords.height || 20;
      let top = rect.top + coords.top + lineHeight + 4;
      let left = rect.left + coords.left;
      const maxW = Math.min(320, window.innerWidth - 16);
      if (left + maxW > window.innerWidth - 8) left = window.innerWidth - maxW - 8;
      if (left < 8) left = 8;
      // Nếu sát đáy màn hình → hiện phía trên cursor
      const approxH = Math.min(280, window.innerHeight * 0.4);
      if (top + approxH > window.innerHeight - 12) {
        top = rect.top + coords.top - approxH - 4;
      }
      if (top < 8) top = 8;
      return { top, left, width: maxW };
    } catch {
      return null;
    }
  }, []);

  const refresh = useCallback(
    (force = false) => {
      const ed = getEditor();
      const file = activeId ? getFile(activeId) : null;
      if (!ed || !file || file.kind !== "file") {
        setItems([]);
        setOpen(false);
        return;
      }
      const model = ed.getModel();
      const position = ed.getPosition();
      if (!model || !position) return;

      const offset = model.getOffsetAt(position);
      const full = model.getValue();
      const before = full.slice(0, offset);
      const { prefix: pre } = extractPrefix(before);
      const last = before.slice(-1);
      const trigger =
        force ||
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
      if (!list.length) {
        setItems([]);
        setOpen(false);
        return;
      }
      setItems(list);
      setActiveIdx(0);
      const p = placeNearCursor();
      setPos(p);
      setOpen(true);
    },
    [activeId, getFile, placeNearCursor]
  );

  useEffect(() => {
    const onRefresh = () => refresh(false);
    const id = window.setInterval(() => {
      if (document.hidden) return;
      // chỉ refresh khi editor focus
      const ed = getEditor();
      const focused = ed?.hasTextFocus?.() ?? false;
      if (focused) refresh(false);
    }, 320);
    window.addEventListener("opus-code-suggest-refresh", onRefresh);
    window.addEventListener("resize", onRefresh);
    return () => {
      clearInterval(id);
      window.removeEventListener("opus-code-suggest-refresh", onRefresh);
      window.removeEventListener("resize", onRefresh);
    };
  }, [refresh]);

  useEffect(() => {
    (window as unknown as { __opusOpenSuggest?: () => void }).__opusOpenSuggest = () => {
      refresh(true);
    };
    return () => {
      delete (window as unknown as { __opusOpenSuggest?: () => void }).__opusOpenSuggest;
    };
  }, [refresh]);

  useLayoutEffect(() => {
    if (!open) return;
    const p = placeNearCursor();
    if (p) setPos(p);
  }, [open, items, placeNearCursor]);

  const apply = (item: SuggestItem) => {
    const now = Date.now();
    if (now - lockRef.current < 350) return;
    lockRef.current = now;

    const ed = getEditor();
    const file = activeId ? getFile(activeId) : null;
    if (!ed || !file) return;
    const model = ed.getModel();
    const position = ed.getPosition();
    if (!model || !position) return;

    const offset = model.getOffsetAt(position);
    const full = model.getValue();
    const before = full.slice(0, offset);
    const after = full.slice(offset);
    const { startOffset } = extractPrefix(before);

    const newBefore = before.slice(0, startOffset) + item.insert;
    const next = newBefore + after;
    const newOffset = newBefore.length;

    ed.pushUndoStop();
    model.setValue(next);
    const newPos = model.getPositionAt(Math.min(newOffset, next.length));
    ed.setPosition(newPos);
    ed.revealPositionInCenterIfOutsideViewport(newPos);
    ed.focus();
    ed.pushUndoStop();
    updateContent(file.id, next);
    setOpen(false);
    setItems([]);
  };

  if (!open || !items.length || !pos) return null;

  return (
    <div
      ref={listRef}
      className="fixed z-[200] overflow-hidden rounded-md border border-[#454545] bg-[#252526] shadow-2xl md:hidden animate-[opus-fade-rise_0.5s_cubic-bezier(0.22,1,0.36,1)_both]"
      style={{
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: "min(42vh, 280px)",
      }}
      role="listbox"
      aria-label="Gợi ý code"
    >
      {/* Header giống Monaco */}
      <div className="flex items-center justify-between border-b border-[#3c3c3c] bg-[#2d2d2d] px-2 py-1">
        <span className="text-[10px] text-zinc-400 tracking-wide">Suggestions</span>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-[10px] text-zinc-500 hover:bg-white/10 hover:text-white"
          onPointerDown={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          Esc
        </button>
      </div>
      <ul className="max-h-[min(38vh,250px)] overflow-auto overscroll-contain py-0.5">
        {items.map((it, i) => (
          <li key={it.label + it.insert + i}>
            <button
              type="button"
              role="option"
              aria-selected={i === activeIdx}
              className={cn(
                "flex w-full items-center gap-2 px-2 py-2 text-left",
                i === activeIdx ? "bg-[#04395e]" : "active:bg-[#2a2d2e]"
              )}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveIdx(i);
                apply(it);
              }}
              onPointerEnter={() => setActiveIdx(i)}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold",
                  KIND_COLOR[it.kind]
                )}
              >
                {KIND_ICON[it.kind]}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-[#cccccc] font-medium">
                  {it.label}
                </span>
                {it.detail && (
                  <span className="block truncate text-[10px] text-[#6a9955]">{it.detail}</span>
                )}
              </span>
              <span className="shrink-0 text-[10px] text-zinc-600 uppercase">{it.kind}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-[#3c3c3c] bg-[#2d2d2d] px-2 py-1 text-[10px] text-zinc-500">
        Chạm để chèn · {items.length} gợi ý
      </div>
    </div>
  );
}
