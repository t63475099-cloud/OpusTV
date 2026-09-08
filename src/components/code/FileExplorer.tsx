"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode2,
  FilePlus,
  Folder,
  FolderPlus,
  Trash2,
  Upload,
  Download,
  Pencil,
} from "lucide-react";
import { CODE_LANGUAGES, getLangMeta, type CodeLangId } from "@/lib/codeLanguages";
import { useCodeStore, type FsNode } from "@/lib/codeStore";
import { cn } from "@/lib/utils";

function FileIcon({ node }: { node: FsNode }) {
  if (node.kind === "folder") {
    return <Folder className="h-4 w-4 text-amber-400/90 shrink-0" />;
  }
  const meta = getLangMeta(node.langId || "javascript");
  return (
    <span
      className="inline-flex h-4 min-w-4 items-center justify-center rounded text-[9px] font-bold text-black shrink-0 px-0.5"
      style={{ background: meta.color }}
      title={meta.label}
    >
      {meta.icon.slice(0, 2)}
    </span>
  );
}

function TreeNode({
  node,
  depth,
}: {
  node: FsNode;
  depth: number;
}) {
  const expandedIds = useCodeStore((s) => s.expandedIds);
  const activeId = useCodeStore((s) => s.activeId);
  const dirtyIds = useCodeStore((s) => s.dirtyIds);
  const toggleExpand = useCodeStore((s) => s.toggleExpand);
  const openFile = useCodeStore((s) => s.openFile);
  const getChildren = useCodeStore((s) => s.getChildren);
  const renameNode = useCodeStore((s) => s.renameNode);
  const deleteNode = useCodeStore((s) => s.deleteNode);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(node.name);

  const kids = node.kind === "folder" ? getChildren(node.id) : [];
  const open = expandedIds.includes(node.id);
  const dirty = dirtyIds.includes(node.id);

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded pr-1 text-[13px] cursor-pointer select-none",
          "transition-colors duration-200",
          activeId === node.id ? "bg-[#37373d] text-white" : "text-zinc-300 hover:bg-white/5"
        )}
        style={{ paddingLeft: 8 + depth * 12 }}
        onClick={() => {
          if (node.kind === "folder") toggleExpand(node.id);
          else openFile(node.id);
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setName(node.name);
          setRenaming(true);
        }}
      >
        {node.kind === "folder" ? (
          open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
          )
        ) : (
          <span className="w-3.5" />
        )}
        <FileIcon node={node} />
        {renaming ? (
          <input
            autoFocus
            className="min-w-0 flex-1 bg-[#3c3c3c] text-white text-xs px-1 py-0.5 rounded outline-none border border-[#007acc]"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={() => {
              renameNode(node.id, name);
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                renameNode(node.id, name);
                setRenaming(false);
              }
              if (e.key === "Escape") setRenaming(false);
            }}
          />
        ) : (
          <span className="min-w-0 flex-1 truncate py-1">
            {node.name}
            {dirty && node.kind === "file" ? (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-white/80" />
            ) : null}
          </span>
        )}
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            setName(node.name);
            setRenaming(true);
          }}
          title="Đổi tên"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Xóa ${node.name}?`)) deleteNode(node.id);
          }}
          title="Xóa"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      {node.kind === "folder" && open &&
        kids.map((c) => <TreeNode key={c.id} node={c} depth={depth + 1} />)}
    </div>
  );
}

export default function FileExplorer() {
  const getChildren = useCodeStore((s) => s.getChildren);
  const createFile = useCodeStore((s) => s.createFile);
  const createFolder = useCodeStore((s) => s.createFolder);
  const importFiles = useCodeStore((s) => s.importFiles);
  const getFile = useCodeStore((s) => s.getFile);
  const activeId = useCodeStore((s) => s.activeId);
  const [langMenu, setLangMenu] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);

  const roots = getChildren(null);

  const downloadActive = () => {
    const f = activeId ? getFile(activeId) : null;
    if (!f || f.kind !== "file") return;
    const blob = new Blob([f.content || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col bg-[#252526] text-[#cccccc]">
      <div className="flex items-center gap-0.5 border-b border-[#2b2b2b] px-2 py-1.5">
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 px-1">
          Explorer
        </span>
        <button
          type="button"
          title="File mới"
          className="relative rounded p-1.5 hover:bg-white/10"
          onClick={() => setLangMenu((v) => !v)}
        >
          <FilePlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Thư mục mới"
          className="rounded p-1.5 hover:bg-white/10"
          onClick={() => {
            const name = prompt("Tên thư mục", "new-folder");
            if (name) createFolder(null, name);
          }}
        >
          <FolderPlus className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Tải file lên"
          className="rounded p-1.5 hover:bg-white/10"
          onClick={() => uploadRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Tải file đang mở"
          className="rounded p-1.5 hover:bg-white/10"
          onClick={downloadActive}
        >
          <Download className="h-4 w-4" />
        </button>
        <input
          ref={uploadRef}
          type="file"
          multiple
          className="hidden"
          onChange={async (e) => {
            const list = e.target.files;
            if (!list?.length) return;
            const parsed: { name: string; content: string }[] = [];
            for (const file of Array.from(list)) {
              parsed.push({ name: file.name, content: await file.text() });
            }
            importFiles(parsed, null);
            e.target.value = "";
          }}
        />
      </div>

      {langMenu && (
        <div className="mx-2 mt-2 max-h-52 overflow-y-auto rounded border border-white/10 bg-[#1e1e1e] p-1 shadow-xl z-20">
          <p className="px-2 py-1 text-[10px] uppercase text-zinc-500">Ngôn ngữ</p>
          {CODE_LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              type="button"
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-white/10"
              onClick={() => {
                createFile(null, lang.id as CodeLangId);
                setLangMenu(false);
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ background: lang.color }}
              />
              {lang.label}
              <span className="ml-auto text-[10px] text-zinc-500">.{lang.ext}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {roots.map((n) => (
          <TreeNode key={n.id} node={n} depth={0} />
        ))}
        {!roots.length && (
          <p className="px-3 py-4 text-xs text-zinc-500">Workspace trống — tạo file mới.</p>
        )}
      </div>
    </div>
  );
}
