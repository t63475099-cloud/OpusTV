"use client";

import { CODE_TEMPLATES } from "@/lib/codeTemplates";
import { useCodeStore } from "@/lib/codeStore";
import type { CodeLangId } from "@/lib/codeLanguages";

const LANG_MAP: Record<string, CodeLangId> = {
  python: "python",
  javascript: "javascript",
  typescript: "typescript",
  html: "html",
  css: "css",
  cpp: "cpp",
  rust: "rust",
  c: "c",
};

export default function CodeTemplatesSelect() {
  return (
    <select
      className="text-xs rounded-lg bg-black/40 border border-white/10 text-zinc-300 px-2 py-1.5 max-w-[160px] transition duration-500"
      defaultValue=""
      title="Chèn mẫu code"
      onChange={(e) => {
        const id = e.target.value;
        e.target.value = "";
        if (!id) return;
        const tpl = CODE_TEMPLATES.find((x) => x.id === id);
        if (!tpl) return;
        const langId = LANG_MAP[tpl.lang] || "javascript";
        const st = useCodeStore.getState();
        const fileId = st.createFile(null, langId, `mau-${Date.now().toString(36)}`);
        st.updateContent(fileId, tpl.code);
      }}
    >
      <option value="">Mẫu code…</option>
      {CODE_TEMPLATES.map((t) => (
        <option key={t.id} value={t.id}>
          {t.title}
        </option>
      ))}
    </select>
  );
}
