/**
 * Generate structured Vietnamese product changelog from deploy context.
 * Uses OPENAI_API_KEY / GROK_API_KEY / XAI_API_KEY when available;
 * falls back to heuristic analysis (no raw commit dump).
 */

import type { ChangelogGroups } from "@/lib/deploy/types";
import { heuristicChangelog } from "@/lib/deploy/store";

export async function generateAiChangelog(input: {
  commitMessage: string;
  commitSha: string;
  branch: string;
  files: string[];
}): Promise<ChangelogGroups> {
  const files = (input.files || []).slice(0, 80);
  const fallback = heuristicChangelog(files, input.commitMessage);

  const apiKey =
    process.env.OPENAI_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    process.env.AI_API_KEY ||
    "";

  if (!apiKey) return fallback;

  const base =
    process.env.OPENAI_BASE_URL ||
    (process.env.XAI_API_KEY ? "https://api.x.ai/v1" : "https://api.openai.com/v1");
  const model =
    process.env.AI_CHANGELOG_MODEL ||
    (process.env.XAI_API_KEY ? "grok-2-latest" : "gpt-4o-mini");

  const system = `Bạn là biên tập viên release notes sản phẩm web xem phim (OpusFilm).
Viết tiếng Việt chuẩn, văn phong sản phẩm, rõ ràng, không copy nguyên commit message.
Trả về JSON thuần với 4 mảng string:
{"features":[],"performance":[],"fixes":[],"security":[]}
Mỗi mục 1 câu ngắn mô tả giá trị cho người dùng. Không markdown.`;

  const user = `Branch: ${input.branch}
Commit SHA: ${input.commitSha}
Commit message (tham khảo, KHÔNG copy nguyên): ${input.commitMessage.slice(0, 500)}
Files changed:
${files.slice(0, 40).join("\n") || "(không có danh sách file)"}`;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content || "";
    const parsed = JSON.parse(raw) as Partial<ChangelogGroups>;
    return {
      features: Array.isArray(parsed.features)
        ? parsed.features.map(String).filter(Boolean)
        : fallback.features,
      performance: Array.isArray(parsed.performance)
        ? parsed.performance.map(String).filter(Boolean)
        : fallback.performance,
      fixes: Array.isArray(parsed.fixes)
        ? parsed.fixes.map(String).filter(Boolean)
        : fallback.fixes,
      security: Array.isArray(parsed.security)
        ? parsed.security.map(String).filter(Boolean)
        : fallback.security,
    };
  } catch {
    return fallback;
  }
}
