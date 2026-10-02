import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import {
  getSystemConfig,
  updateSystemConfig,
  listAuditLogs,
  appendAuditLog,
  ensureSystemTables,
} from "@/lib/system/store";
import { adminSecretFromRequest, isAdminSecretValid } from "@/lib/adminEngine";
import type { FeatureFlags } from "@/lib/system/types";

export const dynamic = "force-dynamic";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
}

function requireAdmin(req: NextRequest) {
  return isAdminSecretValid(adminSecretFromRequest(req.headers, req.nextUrl.searchParams));
}

function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "0.0.0.0"
  );
}

export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await ensureSystemTables();
    const config = await getSystemConfig(true);
    const logs = await listAuditLogs(
      Math.min(100, Number(req.nextUrl.searchParams.get("limit") || 40)),
      req.nextUrl.searchParams.get("action") || undefined
    );
    return NextResponse.json({ ok: true, config, logs });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST actions:
 *  - set_maintenance
 *  - set_flags
 *  - panic_on / panic_off  (panic_on requires confirm: EMERGENCY_LOCKDOWN)
 *  - revalidate
 *  - set_build_id
 */
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) return unauthorized();
  try {
    await ensureSystemTables();
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    const adminId = String(body.adminId || "admin").slice(0, 80);
    const ip = clientIp(req);

    if (action === "set_maintenance") {
      const on = !!body.enabled;
      const message = String(body.message || "").slice(0, 300);
      let until: string | null = null;
      if (body.untilHours != null && Number(body.untilHours) > 0) {
        until = new Date(
          Date.now() + Number(body.untilHours) * 3600000
        ).toISOString();
      } else if (body.until) {
        until = String(body.until);
      }
      const config = await updateSystemConfig(
        {
          maintenanceMode: on,
          maintenanceMessage: message,
          maintenanceUntil: until,
        },
        { adminId, ip, action: on ? "maintenance_on" : "maintenance_off" }
      );
      return NextResponse.json({ ok: true, config });
    }

    if (action === "set_flags") {
      const flags = (body.flags || {}) as Partial<FeatureFlags>;
      const config = await updateSystemConfig(
        { featureFlags: flags },
        { adminId, ip, action: "feature_flags" }
      );
      return NextResponse.json({ ok: true, config });
    }

    if (action === "panic_on") {
      if (String(body.confirm || "") !== "EMERGENCY_LOCKDOWN") {
        return NextResponse.json(
          { ok: false, error: "Gõ EMERGENCY_LOCKDOWN để xác nhận" },
          { status: 400 }
        );
      }
      const config = await updateSystemConfig(
        { panicLockdown: true },
        { adminId, ip, action: "panic_on" }
      );
      // revoke non-admin sessions best-effort
      try {
        const { neon } = await import("@neondatabase/serverless");
        const url = process.env.DATABASE_URL;
        if (url) {
          const sql = neon(url);
          await sql`
            UPDATE sessions SET revoked_at = NOW(), expires_at = NOW()
            WHERE revoked_at IS NULL
          `;
        }
      } catch {
        /* */
      }
      return NextResponse.json({ ok: true, config, message: "Lockdown bật" });
    }

    if (action === "panic_off") {
      const config = await updateSystemConfig(
        { panicLockdown: false },
        { adminId, ip, action: "panic_off" }
      );
      return NextResponse.json({ ok: true, config });
    }

    if (action === "revalidate") {
      const paths = Array.isArray(body.paths)
        ? (body.paths as string[])
        : ["/", "/su-kien", "/tai-khoan"];
      const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];
      for (const p of paths) {
        try {
          revalidatePath(String(p));
        } catch {
          /* */
        }
      }
      for (const t of tags) {
        try {
          revalidateTag(String(t));
        } catch {
          /* */
        }
      }
      await appendAuditLog("revalidate", { paths, tags }, adminId, ip);
      return NextResponse.json({ ok: true, paths, tags });
    }

    if (action === "set_build_id") {
      const buildId = String(body.buildId || "").slice(0, 64);
      const config = await updateSystemConfig(
        { buildId },
        { adminId, ip, action: "set_build_id" }
      );
      return NextResponse.json({ ok: true, config });
    }

    return NextResponse.json({ ok: false, error: `action không hỗ trợ: ${action}` }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
