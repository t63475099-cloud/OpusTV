"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CodePrefsState {
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
  setFontSize: (n: number) => void;
  setWordWrap: (v: boolean) => void;
  setMinimap: (v: boolean) => void;
}

export const useCodePrefsStore = create<CodePrefsState>()(
  persist(
    (set) => ({
      fontSize: 14,
      wordWrap: true,
      minimap: false,
      setFontSize: (n) => set({ fontSize: Math.min(24, Math.max(11, n)) }),
      setWordWrap: (v) => set({ wordWrap: v }),
      setMinimap: (v) => set({ minimap: v }),
    }),
    { name: "opus-code-prefs" }
  )
);
