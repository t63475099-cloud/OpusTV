import { NextRequest, NextResponse } from "next/server";
import {
  ensureDeployTables,
  getActiveProduction,
  getLatestStaged,
  listDeployments,
  updateReleaseMarkdown,
  upsertStagedDeployment,
  changelogToMarkdown,
  heuristicChangelog,
} from "@/lib/deploy/store";
import { adminSecretFromRequest, isAdminSecretValid } from "@/lib/adminEngine";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

function requireAdmin(req: NextRequest) {
  return isAdminSecretValid(
    adminSecretFromRequest(req.headers, req.nextUrl.searchParams)
  );
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await ensureDeployTables();
    const limit = Number(req.nextUrl.searchParams.get("limit") || 15);
    const [list, active, staged] = await Promise.all([
      listDeployments(limit),
      getActiveProduction(),
      getLatestStaged(),
    ]);
    return NextResponse.json({ ok: true, deployments: list, active, staged });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST actions: save_markdown | register_manual (ghi nhận deploy hiện tại thủ công)
 */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await ensureDeployTables();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "save_markdown") {
      const deploymentId = String(body.deploymentId || "");
      const markdown = String(body.markdown || "");
      const title = body.title != null ? String(body.title) : undefined;
      if (!deploymentId) {
        return NextResponse.json({ ok: false, error: "Thiếu deploymentId" }, { status: 400 });
      }
      const note = await updateReleaseMarkdown(deploymentId, markdown, title);
      return NextResponse.json({ ok: true, note });
    }

    if (action === "register_manual") {
      const sha =
        process.env.VERCEL_GIT_COMMIT_SHA ||
        String(body.gitCommitSha || `manual-${Date.now()}`);
      const url =
        String(body.vercelUrl || "") ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
      const branch = String(body.gitBranch || process.env.VERCEL_GIT_COMMIT_REF || "main");
      const msg = String(body.commitMessage || "Manual staged register");
      const files = Array.isArray(body.files) ? (body.files as string[]) : [];
      const changelog = heuristicChangelog(files, msg);
      const short = sha.slice(0, 7);
      const versionTag = `v-${short}`;
      const title = `Bản cập nhật ${versionTag}`;
      const markdown = changelogToMarkdown(title, versionTag, changelog);
      const result = await upsertStagedDeployment({
        vercelDeploymentId: String(body.vercelDeploymentId || `manual-${sha}`),
        vercelUrl: url,
        gitCommitSha: sha,
        gitBranch: branch,
        buildDurationMs: Number(body.buildDurationMs || 0),
        rawMeta: { source: "manual", ...(body.meta || {}) },
        changelog,
        versionTag,
        title,
        markdown,
      });
      return NextResponse.json({
        ok: true,
        deployment: result.deployment,
        note: result.note,
        created: result.created,
      });
    }

    return NextResponse.json({ ok: false, error: `action không hỗ trợ: ${action}` }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
