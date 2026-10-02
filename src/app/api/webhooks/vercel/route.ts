import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { generateAiChangelog } from "@/lib/deploy/aiChangelog";
import {
  changelogToMarkdown,
  ensureDeployTables,
  upsertStagedDeployment,
} from "@/lib/deploy/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.VERCEL_WEBHOOK_SECRET || "";
  if (!secret) {
    // Dev: allow if no secret configured
    return process.env.NODE_ENV !== "production";
  }
  if (!signature) return false;
  try {
    const expected = createHmac("sha1", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(signature.replace(/^sha1=/, ""));
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function fetchVercelDeployment(deploymentId: string) {
  const token = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN || "";
  if (!token || !deploymentId) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(
      `https://api.vercel.com/v13/deployments/${encodeURIComponent(deploymentId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchChangedFiles(deploymentId: string): Promise<string[]> {
  const token = process.env.VERCEL_AUTH_TOKEN || process.env.VERCEL_TOKEN || "";
  if (!token) return [];
  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments/${encodeURIComponent(deploymentId)}/files`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    const files: string[] = [];
    const walk = (nodes: unknown) => {
      if (!Array.isArray(nodes)) return;
      for (const n of nodes) {
        if (!n || typeof n !== "object") continue;
        const o = n as Record<string, unknown>;
        if (typeof o.name === "string" && o.type === "file") files.push(o.name);
        if (Array.isArray(o.children)) walk(o.children);
      }
    };
    walk(data);
    return files.slice(0, 100);
  } catch {
    return [];
  }
}

/**
 * POST /api/webhooks/vercel
 * Vercel Dashboard → Project Settings → Webhooks → deployment.succeeded
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature =
      req.headers.get("x-vercel-signature") ||
      req.headers.get("x-vercel-signature-256");

    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody || "{}") as Record<string, unknown>;
    const type = String(payload.type || payload.event || "");
    const payloadData = (payload.payload || payload) as Record<string, unknown>;
    const deployment =
      (payloadData.deployment as Record<string, unknown>) ||
      payloadData ||
      {};

    const state = String(
      deployment.readyState || deployment.state || payloadData.target || ""
    ).toUpperCase();
    const isSuccess =
      type.includes("deployment.succeeded") ||
      type === "deployment.succeeded" ||
      state === "READY" ||
      state === "SUCCEEDED";

    if (!isSuccess && type && !type.includes("succeeded") && !type.includes("ready")) {
      return NextResponse.json({ ok: true, skipped: true, type });
    }

    const vercelDeploymentId = String(
      deployment.id || deployment.uid || payloadData.id || ""
    );
    if (!vercelDeploymentId) {
      return NextResponse.json({ ok: false, error: "Missing deployment id" }, { status: 400 });
    }

    await ensureDeployTables();

    let meta = deployment;
    const detailed = await fetchVercelDeployment(vercelDeploymentId);
    if (detailed) meta = { ...deployment, ...detailed };

    const vercelUrl = String(
      meta.url
        ? meta.url.startsWith("http")
          ? meta.url
          : `https://${meta.url}`
        : meta.alias || ""
    );
    const git =
      (meta.meta as Record<string, unknown>) ||
      (meta.gitSource as Record<string, unknown>) ||
      {};
    const gitCommitSha = String(
      git.githubCommitSha ||
        git.commitSha ||
        meta.gitCommitSha ||
        meta.sourceGitCommitSha ||
        ""
    );
    const gitBranch = String(
      git.githubCommitRef || git.ref || meta.gitBranch || "main"
    );
    const commitMessage = String(
      git.githubCommitMessage || meta.gitCommitMessage || meta.name || "Deploy"
    );
    const createdAt = Number(meta.createdAt || meta.buildingAt || Date.now());
    const readyAt = Number(meta.ready || meta.readyAt || Date.now());
    const buildDurationMs = Math.max(0, readyAt - createdAt);

    const files = await fetchChangedFiles(vercelDeploymentId);
    const changelog = await generateAiChangelog({
      commitMessage,
      commitSha: gitCommitSha,
      branch: gitBranch,
      files,
    });

    const short = gitCommitSha.slice(0, 7) || vercelDeploymentId.slice(0, 8);
    const versionTag = `v-${short}`;
    const title = `Bản cập nhật ${versionTag}`;
    const markdown = changelogToMarkdown(title, versionTag, changelog);

    const result = await upsertStagedDeployment({
      vercelDeploymentId,
      vercelUrl,
      gitCommitSha,
      gitBranch,
      buildDurationMs,
      rawMeta: meta,
      changelog,
      versionTag,
      title,
      markdown,
    });

    return NextResponse.json({
      ok: true,
      created: result.created,
      deploymentId: result.deployment.id,
      status: result.deployment.status,
      versionTag,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    console.error("vercel-webhook", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** Manual probe */
export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "/api/webhooks/vercel",
    events: ["deployment.succeeded"],
  });
}
