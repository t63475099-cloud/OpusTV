"use client";

import { X } from "lucide-react";
import { getLangMeta } from "@/lib/codeLanguages";
import { useCodeStore } from "@/lib/codeStore";
import { cn } from "@/lib/utils";

export default function EditorTabs() {
  const openIds = useCodeStore((s) => s.openIds);
  const nodes = useCodeStore((s) => s.nodes);
  const activeId = useCodeStore((s) => s.activeId);
  const dirtyIds = useCodeStore((s) => s.dirtyIds);
  const setActive = useCodeStore((s) => s.setActive);
  const closeTab = useCodeStore((s) => s.closeTab);

  const openFiles = openIds
    .map((id) => nodes.find((n) => n.id === id && n.kind === "file"))
    .filter(Boolean);

  return (
    <div className="flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-[#2b2b2b] bg-[#252526] scrollbar-hide">
      {openFiles.map((f) => {
        if (!f) return null;
        const active = f.id === activeId;
        const dirty = dirtyIds.includes(f.id);
        const meta = getLangMeta(f.langId || "javascript");
        return (
          <button
            key={f.id}
            type="button"
            onClick={() => setActive(f.id)}
            className={cn(
              "group relative flex max-w-[180px] items-center gap-1.5 border-r border-[#2b2b2b] px-3 text-xs",
              "transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              active
                ? "bg-[#1e1e1e] text-white"
                : "bg-[#2d2d2d] text-zinc-400 hover:text-zinc-200"
            )}
          >
            {active && (
              <span className="absolute inset-x-0 top-0 h-0.5 bg-[#007acc]" />
            )}
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{ background: meta.color }}
            />
            <span className="truncate">{f.name}</span>
            {dirty ? (
              <span className="h-1.5 w-1.5 rounded-full bg-white/90 shrink-0" />
            ) : (
              <span className="w-1.5" />
            )}
            <span
              role="button"
              tabIndex={0}
              className="rounded p-0.5 opacity-50 hover:opacity-100 hover:bg-white/10"
              onClick={(e) => {
                e.stopPropagation();
                closeTab(f.id);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.stopPropagation();
                  closeTab(f.id);
                }
              }}
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
      {!openFiles.length && (
        <div className="flex items-center px-3 text-xs text-zinc-500">Không có tab</div>
      )}
    </div>
  );
}
