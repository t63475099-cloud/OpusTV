"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  CODE_LANGUAGES,
  fileNameFor,
  type CodeLangId,
  getLangMeta,
} from "./codeLanguages";

export interface CodeFile {
  id: string;
  name: string;
  langId: CodeLangId;
  content: string;
  updatedAt: number;
}

interface CodeState {
  files: CodeFile[];
  openIds: string[];
  activeId: string | null;
  sidebarOpen: boolean;
  createFile: (langId: CodeLangId, name?: string) => string;
  updateContent: (id: string, content: string) => void;
  renameFile: (id: string, name: string) => void;
  deleteFile: (id: string) => void;
  openFile: (id: string) => void;
  closeTab: (id: string) => void;
  setActive: (id: string | null) => void;
  setSidebarOpen: (v: boolean) => void;
  getActive: () => CodeFile | null;
}

function uid() {
  return `f_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function seedFiles(): CodeFile[] {
  const now = Date.now();
  return [
    {
      id: "welcome-ts",
      name: "welcome.ts",
      langId: "typescript",
      content: getLangMeta("typescript").template,
      updatedAt: now,
    },
  ];
}

export const useCodeStore = create<CodeState>()(
  persist(
    (set, get) => ({
      files: seedFiles(),
      openIds: ["welcome-ts"],
      activeId: "welcome-ts",
      sidebarOpen: true,

      createFile: (langId, name) => {
        const meta = getLangMeta(langId);
        const id = uid();
        const finalName = name?.trim() || fileNameFor(langId, `untitled_${get().files.length + 1}`);
        const file: CodeFile = {
          id,
          name: finalName.includes(".") ? finalName : `${finalName}.${meta.ext}`,
          langId,
          content: meta.template,
          updatedAt: Date.now(),
        };
        set((s) => ({
          files: [...s.files, file],
          openIds: s.openIds.includes(id) ? s.openIds : [...s.openIds, id],
          activeId: id,
        }));
        return id;
      },

      updateContent: (id, content) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, content, updatedAt: Date.now() } : f
          ),
        })),

      renameFile: (id, name) =>
        set((s) => ({
          files: s.files.map((f) =>
            f.id === id ? { ...f, name: name.trim() || f.name, updatedAt: Date.now() } : f
          ),
        })),

      deleteFile: (id) =>
        set((s) => {
          const files = s.files.filter((f) => f.id !== id);
          const openIds = s.openIds.filter((x) => x !== id);
          let activeId = s.activeId;
          if (activeId === id) {
            activeId = openIds[openIds.length - 1] || files[0]?.id || null;
          }
          return { files, openIds, activeId };
        }),

      openFile: (id) =>
        set((s) => ({
          openIds: s.openIds.includes(id) ? s.openIds : [...s.openIds, id],
          activeId: id,
        })),

      closeTab: (id) =>
        set((s) => {
          const openIds = s.openIds.filter((x) => x !== id);
          const activeId =
            s.activeId === id ? openIds[openIds.length - 1] || null : s.activeId;
          return { openIds, activeId };
        }),

      setActive: (id) => set({ activeId: id }),
      setSidebarOpen: (v) => set({ sidebarOpen: v }),

      getActive: () => {
        const s = get();
        return s.files.find((f) => f.id === s.activeId) || null;
      },
    }),
    { name: "opus-code-workspace-v1" }
  )
);

export { CODE_LANGUAGES };
