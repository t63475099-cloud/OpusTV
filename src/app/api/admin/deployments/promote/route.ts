import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  broadcastSystemRelease,
  ensureDeployTables,
  promoteDeployment,
  rollbackToPrevious,
} from "@/lib/deploy/store";
import { adminSecretFromRequest, isAdminSecretValid } from "@/lib/adminEngine";
import { appendAuditLog } from "@/lib/system/store";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

export async function POST(req: NextRequest) {
  const secret = adminSecretFromRequest(req.headers, req.nextUrl.searchParams);
  if (!isAdminSecretValid(secret)) return unauthorized();

  try {
    await ensureDeployTables();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "promote");
    const publishedBy = String(body.adminId || "admin").slice(0, 80);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";

    if (action === "rollback") {
      const result = await rollbackToPrevious(publishedBy);
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      try {
        revalidatePath("/", "layout");
        revalidatePath("/su-kien");
      } catch {
        /* */
      }
      await appendAuditLog(
        "deploy_rollback",
        { deploymentId: result.deployment?.id },
        publishedBy,
        ip
      );
      return NextResponse.json({ ok: true, deployment: result.deployment });
    }

    const deploymentId = String(body.deploymentId || "");
    if (!deploymentId) {
      return NextResponse.json({ ok: false, error: "Thiếu deploymentId" }, { status: 400 });
    }

    const result = await promoteDeployment(deploymentId, publishedBy);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }

    try {
      revalidatePath("/", "layout");
      revalidatePath("/su-kien");
      revalidatePath("/tai-khoan");
    } catch {
      /* */
    }

    const note = result.note;
    const dep = result.deployment!;
    const payload = {
      kind: "SYSTEM_RELEASE_PUBLISHED" as const,
      deploymentId: dep.id,
      versionTag: note?.versionTag || dep.gitCommitSha.slice(0, 7),
      title: note?.title || "Bản cập nhật mới",
      markdown: note?.customizedMarkdown || "",
      changelog: note?.generatedChangelog || {
        features: [],
        performance: [],
        fixes: [],
        security: [],
      },
      vercelUrl: dep.vercelUrl,
      gitCommitSha: dep.gitCommitSha,
      at: new Date().toISOString(),
    };
    broadcastSystemRelease(payload);

    await appendAuditLog(
      "deploy_promote",
      { deploymentId: dep.id, versionTag: payload.versionTag },
      publishedBy,
      ip
    );

    return NextResponse.json({
      ok: true,
      deployment: dep,
      note,
      release: payload,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
