"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  defaultFileName,
  getLangMeta,
  langFromFileName,
  type CodeLangId,
} from "./codeLanguages";

export type NodeKind = "file" | "folder";

export interface FsNode {
  id: string;
  name: string;
  kind: NodeKind;
  parentId: string | null;
  langId?: CodeLangId;
  content?: string;
  updatedAt: number;
}

export interface TermLine {
  id: string;
  kind: "cmd" | "out" | "err" | "info" | "html";
  text: string;
  html?: string;
  ts: number;
}

interface CodeState {
  nodes: FsNode[];
  openIds: string[];
  activeId: string | null;
  dirtyIds: string[];
  expandedIds: string[];
  sidebarOpen: boolean;
  terminalOpen: boolean;
  terminalHeight: number;
  explorerWidth: number;
  terminalLines: TermLine[];
  running: boolean;
  previewHtml: string | null;
  /** Hiện khung Canvas / Turtle */
  canvasVisible: boolean;
  /** Code Python chờ Canvas mount rồi chạy Skulpt */
  turtleCode: string | null;
  /** Terminal đang chờ người dùng nhập (ReadLine / input) */
  awaitingInput: boolean;
  inputPrompt: string;
  /** resolver nội bộ cho Promise nhập liệu */
  _inputResolver: ((value: string) => void) | null;

  requestTerminalInput: (prompt?: string) => Promise<string>;
  submitTerminalInput: (value: string) => void;
  cancelTerminalInput: () => void;

  createFile: (parentId: string | null, langId: CodeLangId, name?: string) => string;
  createFolder: (parentId: string | null, name?: string) => string;
  updateContent: (id: string, content: string) => void;
  markSaved: (id: string) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  openFile: (id: string) => void;
  closeTab: (id: string) => void;
  setActive: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  setSidebarOpen: (v: boolean) => void;
  setTerminalOpen: (v: boolean) => void;
  setTerminalHeight: (h: number) => void;
  setExplorerWidth: (w: number) => void;
  addTermLine: (line: Omit<TermLine, "id" | "ts">) => void;
  clearTerminal: () => void;
  setRunning: (v: boolean) => void;
  setPreviewHtml: (html: string | null) => void;
  setCanvasVisible: (v: boolean) => void;
  setTurtleCode: (code: string | null) => void;
  importFiles: (files: { name: string; content: string }[], parentId?: string | null) => void;
  getChildren: (parentId: string | null) => FsNode[];
  getFile: (id: string) => FsNode | undefined;
  getPath: (id: string) => string;
}

function uid(prefix = "n") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function seed(): FsNode[] {
  const now = Date.now();
  return [
    {
      id: "folder_src",
      name: "src",
      kind: "folder",
      parentId: null,
      updatedAt: now,
    },
    {
      id: "file_welcome",
      name: "welcome.ts",
      kind: "file",
      parentId: "folder_src",
      langId: "typescript",
      content: getLangMeta("typescript").template,
      updatedAt: now,
    },
  ];
}

function collectDescendants(nodes: FsNode[], id: string): string[] {
  const kids = nodes.filter((n) => n.parentId === id);
  const ids = [id];
  for (const k of kids) ids.push(...collectDescendants(nodes, k.id));
  return ids;
}

export const useCodeStore = create<CodeState>()(
  persist(
    (set, get) => ({
      nodes: seed(),
      openIds: ["file_welcome"],
      activeId: "file_welcome",
      dirtyIds: [],
      expandedIds: ["folder_src"],
      sidebarOpen: true,
      terminalOpen: false,
      terminalHeight: 220,
      explorerWidth: 240,
      terminalLines: [
        {
          id: "boot",
          kind: "info",
          text: "Terminal.",
          ts: Date.now(),
        },
      ],
      running: false,
      previewHtml: null,
      canvasVisible: false,
      turtleCode: null,
      awaitingInput: false,
      inputPrompt: "",
      _inputResolver: null,

      requestTerminalInput: (prompt) => {
        const p = (prompt || "").trim();
        if (p) {
          get().addTermLine({ kind: "out", text: p.endsWith(" ") ? p : p + " " });
        }
        return new Promise<string>((resolve) => {
          set({
            awaitingInput: true,
            inputPrompt: prompt || "",
            terminalOpen: true,
            _inputResolver: resolve,
          });
        });
      },

      submitTerminalInput: (value) => {
        const resolver = get()._inputResolver;
        const text = String(value ?? "");
        set({
          awaitingInput: false,
          inputPrompt: "",
          _inputResolver: null,
        });
        get().addTermLine({ kind: "cmd", text: text });
        resolver?.(text);
      },

      cancelTerminalInput: () => {
        const resolver = get()._inputResolver;
        set({
          awaitingInput: false,
          inputPrompt: "",
          _inputResolver: null,
          running: false,
        });
        resolver?.("");
      },

      createFile: (parentId, langId, name) => {
        const meta = getLangMeta(langId);
        const id = uid("file");
        const fileCount = get().nodes.filter((n) => n.kind === "file").length;
        const finalName = name?.trim() || defaultFileName(langId, fileCount + 1);
        const node: FsNode = {
          id,
          name: finalName.includes(".") ? finalName : `${finalName}.${meta.ext}`,
          kind: "file",
          parentId,
          langId,
          content: meta.template,
          updatedAt: Date.now(),
        };
        set((s) => ({
          nodes: [...s.nodes, node],
          openIds: [...s.openIds, id],
          activeId: id,
          dirtyIds: s.dirtyIds.filter((x) => x !== id),
          expandedIds:
            parentId && !s.expandedIds.includes(parentId)
              ? [...s.expandedIds, parentId]
              : s.expandedIds,
          sidebarOpen: true,
        }));
        return id;
      },

      createFolder: (parentId, name) => {
        const id = uid("folder");
        const node: FsNode = {
          id,
          name:
            name?.trim() ||
            `folder-${get().nodes.filter((n) => n.kind === "folder").length + 1}`,
          kind: "folder",
          parentId,
          updatedAt: Date.now(),
        };
        set((s) => ({
          nodes: [...s.nodes, node],
          expandedIds: [...s.expandedIds, id],
        }));
        return id;
      },

      updateContent: (id, content) =>
        set((s) => ({
          nodes: s.nodes.map((n) =>
            n.id === id ? { ...n, content, updatedAt: Date.now() } : n
          ),
          dirtyIds: s.dirtyIds.includes(id) ? s.dirtyIds : [...s.dirtyIds, id],
        })),

      markSaved: (id) =>
        set((s) => ({ dirtyIds: s.dirtyIds.filter((x) => x !== id) })),

      renameNode: (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set((s) => ({
          nodes: s.nodes.map((n) => {
            if (n.id !== id) return n;
            const langId = n.kind === "file" ? langFromFileName(trimmed) : n.langId;
            return { ...n, name: trimmed, langId, updatedAt: Date.now() };
          }),
        }));
      },

      deleteNode: (id) =>
        set((s) => {
          const removeIds = new Set(collectDescendants(s.nodes, id));
          const nodes = s.nodes.filter((n) => !removeIds.has(n.id));
          const openIds = s.openIds.filter((x) => !removeIds.has(x));
          let activeId = s.activeId;
          if (activeId && removeIds.has(activeId)) {
            activeId = openIds[openIds.length - 1] || null;
          }
          return {
            nodes,
            openIds,
            activeId,
            dirtyIds: s.dirtyIds.filter((x) => !removeIds.has(x)),
            expandedIds: s.expandedIds.filter((x) => !removeIds.has(x)),
          };
        }),

      openFile: (id) =>
        set((s) => {
          const node = s.nodes.find((n) => n.id === id && n.kind === "file");
          if (!node) return s;
          return {
            openIds: s.openIds.includes(id) ? s.openIds : [...s.openIds, id],
            activeId: id,
          };
        }),

      closeTab: (id) =>
        set((s) => {
          const openIds = s.openIds.filter((x) => x !== id);
          const activeId =
            s.activeId === id ? openIds[openIds.length - 1] || null : s.activeId;
          return { openIds, activeId };
        }),

      setActive: (id) => set({ activeId: id }),

      toggleExpand: (id) =>
        set((s) => ({
          expandedIds: s.expandedIds.includes(id)
            ? s.expandedIds.filter((x) => x !== id)
            : [...s.expandedIds, id],
        })),

      setSidebarOpen: (v) => set({ sidebarOpen: v }),
      setTerminalOpen: (v) => set({ terminalOpen: v }),
      setTerminalHeight: (h) =>
        set({ terminalHeight: Math.min(480, Math.max(120, h)) }),
      setExplorerWidth: (w) =>
        set({ explorerWidth: Math.min(420, Math.max(160, w)) }),

      addTermLine: (line) =>
        set((s) => ({
          terminalLines: [
            ...s.terminalLines.slice(-200),
            { ...line, id: uid("term"), ts: Date.now() },
          ],
        })),

      clearTerminal: () => set({ terminalLines: [] }),
      setRunning: (v) => set({ running: v }),
      setPreviewHtml: (html) => set({ previewHtml: html }),
      setCanvasVisible: (v) => set({ canvasVisible: v }),
      setTurtleCode: (code) => set({ turtleCode: code }),

      importFiles: (list, parentId = null) => {
        const now = Date.now();
        const added: FsNode[] = list.map((f) => {
          const langId = langFromFileName(f.name);
          return {
            id: uid("file"),
            name: f.name,
            kind: "file" as const,
            parentId,
            langId,
            content: f.content,
            updatedAt: now,
          };
        });
        set((s) => ({
          nodes: [...s.nodes, ...added],
          openIds: [...s.openIds, ...added.map((a) => a.id)],
          activeId: added[added.length - 1]?.id || s.activeId,
        }));
      },

      getChildren: (parentId) => {
        return get()
          .nodes.filter((n) => n.parentId === parentId)
          .sort((a, b) => {
            if (a.kind !== b.kind) return a.kind === "folder" ? -1 : 1;
            return a.name.localeCompare(b.name);
          });
      },

      getFile: (id) => get().nodes.find((n) => n.id === id),

      getPath: (id) => {
        const parts: string[] = [];
        let cur = get().nodes.find((n) => n.id === id);
        while (cur) {
          parts.unshift(cur.name);
          cur = cur.parentId
            ? get().nodes.find((n) => n.id === cur!.parentId)
            : undefined;
        }
        return parts.join("/");
      },
    }),
    {
      name: "opus-code-workspace-v2",
      partialize: (s) => ({
        nodes: s.nodes,
        openIds: s.openIds,
        activeId: s.activeId,
        dirtyIds: s.dirtyIds,
        expandedIds: s.expandedIds,
        explorerWidth: s.explorerWidth,
        terminalHeight: s.terminalHeight,
      }),
    }
  )
);
