"use client";

import { SystemControlTab } from "@/components/admin/SystemControlTab";
import { ProjectSandboxPreview } from "@/components/admin/ProjectSandboxPreview";
import type { BoardTheme } from "./adminUi";
import { boardTokens, btn } from "./adminUi";

export function SystemAiTab({
  theme,
  adminSecret,
  onAction,
}: {
  theme: BoardTheme;
  adminSecret: string;
  onAction: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const t = boardTokens(theme);
  return (
    <div className="space-y-4">
      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Cổng AI (ENV)</h3>
        <p className={`mt-1 text-xs ${t.muted}`}>
          Gemini / DeepSeek / OpenAI — chỉ cấu hình qua biến môi trường, không lưu key trên UI.
        </p>
        <ul className={`mt-2 space-y-1 text-sm ${t.muted}`}>
          <li>GEMINI_API_KEY / OPENAI_API_KEY / DEEPSEEK_API_KEY</li>
        </ul>
      </section>

      <section className={`rounded-xl border p-4 ${t.surface}`}>
        <h3 className="text-sm font-semibold">Dọn dữ liệu AI / cache</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            className={`${btn.compact} ${btn.ban}`}
            onClick={() => {
              const c = window.prompt('Gõ CONFIRM để xóa metadata AI');
              if (c === "CONFIRM") void onAction({ action: "purge_ai_metadata" });
            }}
          >
            Quét & xóa metadata AI
          </button>
          <button
            type="button"
            className={`${btn.compact} ${btn.ban}`}
            onClick={() => {
              const c = window.prompt("Gõ CONFIRM để xóa cache AI");
              if (c === "CONFIRM") void onAction({ action: "purge_ai_cache" });
            }}
          >
            Xóa cache AI
          </button>
          <button
            type="button"
            className={`${btn.compact} ${btn.ghost}`}
            onClick={() => {
              const c = window.prompt("Gõ CONFIRM để dọn orphan");
              if (c === "CONFIRM") void onAction({ action: "clean_orphans" });
            }}
          >
            Dọn orphan
          </button>
        </div>
      </section>

      <SystemControlTab secret={adminSecret} theme={theme} />
      <ProjectSandboxPreview secret={adminSecret} theme={theme} />
    </div>
  );
}
