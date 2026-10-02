/**
 * Deployments + release notes store (Neon)
 */

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";
import type {
  ChangelogGroups,
  DeployStatus,
  DeploymentWithNotes,
  SystemDeployment,
  SystemReleaseNote,
} from "@/lib/deploy/types";
import { EMPTY_CHANGELOG } from "@/lib/deploy/types";
import { withDbRetry } from "@/lib/system/store";

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

let ensured = false;

export async function ensureDeployTables() {
  if (ensured) return;
  await withDbRetry(async () => {
    const sql = db();
    await sql`
      CREATE TABLE IF NOT EXISTS system_deployments (
        id UUID PRIMARY KEY,
        vercel_deployment_id VARCHAR(128) NOT NULL UNIQUE,
        vercel_url VARCHAR(512) NOT NULL DEFAULT '',
        git_commit_sha VARCHAR(64) NOT NULL DEFAULT '',
        git_branch VARCHAR(128) NOT NULL DEFAULT '',
        build_duration_ms INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'STAGED_PREVIEW',
        raw_deploy_meta JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deployed_at TIMESTAMPTZ,
        promoted_at TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS system_deployments_status_idx ON system_deployments (status)`;
    await sql`CREATE INDEX IF NOT EXISTS system_deployments_created_idx ON system_deployments (created_at DESC)`;
    await sql`
      CREATE TABLE IF NOT EXISTS system_release_notes (
        id UUID PRIMARY KEY,
        deployment_id UUID NOT NULL REFERENCES system_deployments(id) ON DELETE CASCADE,
        version_tag VARCHAR(64) NOT NULL DEFAULT '',
        title VARCHAR(256) NOT NULL DEFAULT '',
        generated_changelog JSONB NOT NULL DEFAULT '{}'::jsonb,
        customized_markdown TEXT NOT NULL DEFAULT '',
        is_broadcasted BOOLEAN NOT NULL DEFAULT FALSE,
        published_by VARCHAR(128),
        published_at TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS system_release_notes_dep_idx ON system_release_notes (deployment_id)`;
  });
  ensured = true;
}

function mapDeploy(r: Record<string, unknown>): SystemDeployment {
  return {
    id: String(r.id),
    vercelDeploymentId: String(r.vercel_deployment_id || ""),
    vercelUrl: String(r.vercel_url || ""),
    gitCommitSha: String(r.git_commit_sha || ""),
    gitBranch: String(r.git_branch || ""),
    buildDurationMs: Number(r.build_duration_ms || 0),
    status: String(r.status || "STAGED_PREVIEW") as DeployStatus,
    rawDeployMeta: (r.raw_deploy_meta || {}) as Record<string, unknown>,
    createdAt: String(r.created_at || ""),
    deployedAt: r.deployed_at ? String(r.deployed_at) : null,
    promotedAt: r.promoted_at ? String(r.promoted_at) : null,
  };
}

function mapNote(r: Record<string, unknown>): SystemReleaseNote {
  const gen = (r.generated_changelog || {}) as Partial<ChangelogGroups>;
  return {
    id: String(r.id),
    deploymentId: String(r.deployment_id),
    versionTag: String(r.version_tag || ""),
    title: String(r.title || ""),
    generatedChangelog: {
      features: Array.isArray(gen.features) ? gen.features.map(String) : [],
      performance: Array.isArray(gen.performance) ? gen.performance.map(String) : [],
      fixes: Array.isArray(gen.fixes) ? gen.fixes.map(String) : [],
      security: Array.isArray(gen.security) ? gen.security.map(String) : [],
    },
    customizedMarkdown: String(r.customized_markdown || ""),
    isBroadcasted: !!r.is_broadcasted,
    publishedBy: r.published_by ? String(r.published_by) : null,
    publishedAt: r.published_at ? String(r.published_at) : null,
  };
}

export async function upsertStagedDeployment(input: {
  vercelDeploymentId: string;
  vercelUrl: string;
  gitCommitSha: string;
  gitBranch: string;
  buildDurationMs: number;
  rawMeta: Record<string, unknown>;
  changelog: ChangelogGroups;
  versionTag: string;
  title: string;
  markdown: string;
}): Promise<{ deployment: SystemDeployment; note: SystemReleaseNote; created: boolean }> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    const existing = await sql`
      SELECT id FROM system_deployments
      WHERE vercel_deployment_id = ${input.vercelDeploymentId}
      LIMIT 1
    `;
    if (existing.length) {
      const id = String((existing[0] as { id: string }).id);
      await sql`
        UPDATE system_deployments SET
          vercel_url = ${input.vercelUrl},
          git_commit_sha = ${input.gitCommitSha},
          git_branch = ${input.gitBranch},
          build_duration_ms = ${input.buildDurationMs},
          raw_deploy_meta = ${JSON.stringify(input.rawMeta)}::jsonb,
          deployed_at = NOW()
        WHERE id = ${id}::uuid
      `;
      const rows = await sql`SELECT * FROM system_deployments WHERE id = ${id}::uuid LIMIT 1`;
      const notes = await sql`
        SELECT * FROM system_release_notes WHERE deployment_id = ${id}::uuid LIMIT 1
      `;
      let note: SystemReleaseNote;
      if (notes.length) {
        await sql`
          UPDATE system_release_notes SET
            generated_changelog = ${JSON.stringify(input.changelog)}::jsonb,
            customized_markdown = ${input.markdown},
            title = ${input.title},
            version_tag = ${input.versionTag}
          WHERE deployment_id = ${id}::uuid
        `;
        const n2 = await sql`
          SELECT * FROM system_release_notes WHERE deployment_id = ${id}::uuid LIMIT 1
        `;
        note = mapNote(n2[0] as Record<string, unknown>);
      } else {
        const nid = randomUUID();
        await sql`
          INSERT INTO system_release_notes (
            id, deployment_id, version_tag, title, generated_changelog, customized_markdown
          ) VALUES (
            ${nid}::uuid, ${id}::uuid, ${input.versionTag}, ${input.title},
            ${JSON.stringify(input.changelog)}::jsonb, ${input.markdown}
          )
        `;
        const n2 = await sql`SELECT * FROM system_release_notes WHERE id = ${nid}::uuid`;
        note = mapNote(n2[0] as Record<string, unknown>);
      }
      return { deployment: mapDeploy(rows[0] as Record<string, unknown>), note, created: false };
    }

    const id = randomUUID();
    await sql`
      INSERT INTO system_deployments (
        id, vercel_deployment_id, vercel_url, git_commit_sha, git_branch,
        build_duration_ms, status, raw_deploy_meta, deployed_at
      ) VALUES (
        ${id}::uuid, ${input.vercelDeploymentId}, ${input.vercelUrl},
        ${input.gitCommitSha}, ${input.gitBranch}, ${input.buildDurationMs},
        'STAGED_PREVIEW', ${JSON.stringify(input.rawMeta)}::jsonb, NOW()
      )
    `;
    const nid = randomUUID();
    await sql`
      INSERT INTO system_release_notes (
        id, deployment_id, version_tag, title, generated_changelog, customized_markdown
      ) VALUES (
        ${nid}::uuid, ${id}::uuid, ${input.versionTag}, ${input.title},
        ${JSON.stringify(input.changelog)}::jsonb, ${input.markdown}
      )
    `;
    const rows = await sql`SELECT * FROM system_deployments WHERE id = ${id}::uuid`;
    const notes = await sql`SELECT * FROM system_release_notes WHERE id = ${nid}::uuid`;
    return {
      deployment: mapDeploy(rows[0] as Record<string, unknown>),
      note: mapNote(notes[0] as Record<string, unknown>),
      created: true,
    };
  });
}

export async function listDeployments(limit = 20): Promise<DeploymentWithNotes[]> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    const lim = Math.min(50, Math.max(1, limit));
    const rows = await sql`
      SELECT * FROM system_deployments ORDER BY created_at DESC LIMIT ${lim}
    `;
    const out: DeploymentWithNotes[] = [];
    for (const row of rows as Record<string, unknown>[]) {
      const d = mapDeploy(row);
      const notes = await sql`
        SELECT * FROM system_release_notes WHERE deployment_id = ${d.id}::uuid LIMIT 1
      `;
      out.push({
        ...d,
        releaseNote: notes.length ? mapNote(notes[0] as Record<string, unknown>) : null,
      });
    }
    return out;
  });
}

export async function getActiveProduction(): Promise<DeploymentWithNotes | null> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    const rows = await sql`
      SELECT * FROM system_deployments
      WHERE status = 'ACTIVE_PRODUCTION'
      ORDER BY promoted_at DESC NULLS LAST
      LIMIT 1
    `;
    if (!rows.length) return null;
    const d = mapDeploy(rows[0] as Record<string, unknown>);
    const notes = await sql`
      SELECT * FROM system_release_notes WHERE deployment_id = ${d.id}::uuid LIMIT 1
    `;
    return {
      ...d,
      releaseNote: notes.length ? mapNote(notes[0] as Record<string, unknown>) : null,
    };
  });
}

export async function getLatestStaged(): Promise<DeploymentWithNotes | null> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    const rows = await sql`
      SELECT * FROM system_deployments
      WHERE status = 'STAGED_PREVIEW'
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (!rows.length) return null;
    const d = mapDeploy(rows[0] as Record<string, unknown>);
    const notes = await sql`
      SELECT * FROM system_release_notes WHERE deployment_id = ${d.id}::uuid LIMIT 1
    `;
    return {
      ...d,
      releaseNote: notes.length ? mapNote(notes[0] as Record<string, unknown>) : null,
    };
  });
}

export async function updateReleaseMarkdown(
  deploymentId: string,
  markdown: string,
  title?: string
): Promise<SystemReleaseNote | null> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    if (title) {
      await sql`
        UPDATE system_release_notes SET
          customized_markdown = ${markdown},
          title = ${title}
        WHERE deployment_id = ${deploymentId}::uuid
      `;
    } else {
      await sql`
        UPDATE system_release_notes SET customized_markdown = ${markdown}
        WHERE deployment_id = ${deploymentId}::uuid
      `;
    }
    const notes = await sql`
      SELECT * FROM system_release_notes WHERE deployment_id = ${deploymentId}::uuid LIMIT 1
    `;
    return notes.length ? mapNote(notes[0] as Record<string, unknown>) : null;
  });
}

export async function promoteDeployment(
  deploymentId: string,
  publishedBy: string
): Promise<{ ok: boolean; error?: string; deployment?: SystemDeployment; note?: SystemReleaseNote }> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    const rows = await sql`
      SELECT * FROM system_deployments WHERE id = ${deploymentId}::uuid LIMIT 1
    `;
    if (!rows.length) return { ok: false, error: "Không tìm thấy deployment" };
    const target = mapDeploy(rows[0] as Record<string, unknown>);

    await sql`
      UPDATE system_deployments SET status = 'SUPERSEDED'
      WHERE status = 'ACTIVE_PRODUCTION' AND id <> ${deploymentId}::uuid
    `;
    await sql`
      UPDATE system_deployments SET
        status = 'ACTIVE_PRODUCTION',
        promoted_at = NOW()
      WHERE id = ${deploymentId}::uuid
    `;
    await sql`
      UPDATE system_release_notes SET
        is_broadcasted = TRUE,
        published_by = ${publishedBy.slice(0, 80)},
        published_at = NOW()
      WHERE deployment_id = ${deploymentId}::uuid
    `;
    const updated = await sql`SELECT * FROM system_deployments WHERE id = ${deploymentId}::uuid`;
    const notes = await sql`
      SELECT * FROM system_release_notes WHERE deployment_id = ${deploymentId}::uuid LIMIT 1
    `;
    return {
      ok: true,
      deployment: mapDeploy(updated[0] as Record<string, unknown>),
      note: notes.length ? mapNote(notes[0] as Record<string, unknown>) : undefined,
    };
  });
}

export async function rollbackToPrevious(
  publishedBy: string
): Promise<{ ok: boolean; error?: string; deployment?: SystemDeployment }> {
  await ensureDeployTables();
  return withDbRetry(async () => {
    const sql = db();
    const current = await sql`
      SELECT * FROM system_deployments WHERE status = 'ACTIVE_PRODUCTION' LIMIT 1
    `;
    if (!current.length) return { ok: false, error: "Không có bản production hiện tại" };
    const cur = mapDeploy(current[0] as Record<string, unknown>);
    const prev = await sql`
      SELECT * FROM system_deployments
      WHERE id <> ${cur.id}::uuid
        AND status IN ('SUPERSEDED', 'ACTIVE_PRODUCTION', 'ROLLED_BACK')
      ORDER BY promoted_at DESC NULLS LAST, created_at DESC
      LIMIT 1
    `;
    if (!prev.length) return { ok: false, error: "Không có bản trước để rollback" };
    const p = mapDeploy(prev[0] as Record<string, unknown>);
    await sql`
      UPDATE system_deployments SET status = 'ROLLED_BACK' WHERE id = ${cur.id}::uuid
    `;
    await sql`
      UPDATE system_deployments SET
        status = 'ACTIVE_PRODUCTION',
        promoted_at = NOW()
      WHERE id = ${p.id}::uuid
    `;
    await sql`
      UPDATE system_release_notes SET
        is_broadcasted = TRUE,
        published_by = ${`rollback:${publishedBy}`.slice(0, 80)},
        published_at = NOW()
      WHERE deployment_id = ${p.id}::uuid
    `;
    const rows = await sql`SELECT * FROM system_deployments WHERE id = ${p.id}::uuid`;
    return { ok: true, deployment: mapDeploy(rows[0] as Record<string, unknown>) };
  });
}

/** In-memory SSE hub for release events */
export type ReleasePayload = {
  kind: "SYSTEM_RELEASE_PUBLISHED";
  deploymentId: string;
  versionTag: string;
  title: string;
  markdown: string;
  changelog: ChangelogGroups;
  vercelUrl: string;
  gitCommitSha: string;
  at: string;
};

type Listener = (p: ReleasePayload) => void;
const hub = new Set<Listener>();

export function subscribeRelease(fn: Listener): () => void {
  hub.add(fn);
  return () => {
    hub.delete(fn);
  };
}

export function broadcastSystemRelease(p: ReleasePayload) {
  for (const fn of hub) {
    try {
      fn(p);
    } catch {
      /* */
    }
  }
}

export async function waitRelease(timeoutMs = 25000): Promise<ReleasePayload | null> {
  return new Promise((resolve) => {
    let done = false;
    const t = setTimeout(() => {
      if (done) return;
      done = true;
      unsub();
      resolve(null);
    }, timeoutMs);
    const unsub = subscribeRelease((p) => {
      if (done) return;
      done = true;
      clearTimeout(t);
      unsub();
      resolve(p);
    });
  });
}

export function changelogToMarkdown(
  title: string,
  versionTag: string,
  c: ChangelogGroups
): string {
  const lines: string[] = [`# ${title}`, `**${versionTag}**`, ""];
  if (c.features.length) {
    lines.push("## 🚀 Tính năng mới & Nâng cấp");
    c.features.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  if (c.performance.length) {
    lines.push("## ⚡ Tối ưu hiệu năng");
    c.performance.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  if (c.fixes.length) {
    lines.push("## 🛠️ Sửa lỗi & Ổn định");
    c.fixes.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  if (c.security.length) {
    lines.push("## 🛡️ Bảo mật & Hạ tầng");
    c.security.forEach((x) => lines.push(`- ${x}`));
    lines.push("");
  }
  return lines.join("\n").trim();
}

export function heuristicChangelog(
  files: string[],
  commitMessage: string
): ChangelogGroups {
  const c: ChangelogGroups = {
    features: [],
    performance: [],
    fixes: [],
    security: [],
  };
  const msg = (commitMessage || "").toLowerCase();
  const joined = files.map((f) => f.toLowerCase()).join(" ");

  if (/feat|feature|add|thêm|mới/.test(msg)) {
    c.features.push(
      commitMessage.trim() || "Bổ sung tính năng mới trên nền tảng."
    );
  }
  if (/fix|bug|sửa|hotfix|patch/.test(msg)) {
    c.fixes.push(commitMessage.trim() || "Khắc phục lỗi ổn định hệ thống.");
  }
  if (/perf|optim|tối ưu|speed|cache/.test(msg) || /cache|isr/.test(joined)) {
    c.performance.push("Tối ưu tải trang và phản hồi giao diện.");
  }
  if (
    /security|auth|middleware|admin|secret|bảo mật/.test(msg) ||
    /middleware|admin|auth/.test(joined)
  ) {
    c.security.push("Củng cố kiểm soát truy cập và cấu hình an toàn.");
  }
  if (/su-kien|event|wheel|coin|xu/.test(joined)) {
    c.features.push("Cập nhật hệ thống sự kiện / vòng quay / xu.");
  }
  if (/board-home|admin/.test(joined)) {
    c.features.push("Nâng cấp trung tâm quản trị Admin Board.");
  }
  if (/deploy|system|maint/.test(joined)) {
    c.security.push("Cập nhật hạ tầng vận hành và cổng phát hành.");
  }
  if (
    !c.features.length &&
    !c.performance.length &&
    !c.fixes.length &&
    !c.security.length
  ) {
    c.features.push(
      commitMessage.trim() ||
        "Bản cập nhật hệ thống đã sẵn sàng trên môi trường xem trước."
    );
  }
  return c;
}

export { EMPTY_CHANGELOG };
