import { NextResponse } from "next/server";
import { getSystemConfig } from "@/lib/system/store";
import { SCHEMA_VERSION } from "@/lib/system/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/system/version
 * Client poll. Đồng bộ cookie bảo trì toàn hệ thống từ DB + build sau deploy.
 */
export async function GET() {
  try {
    let maintenanceMode = false;
    let maintenanceMessage = "";
    let maintenanceUntil: string | null = null;
    let panicLockdown = false;
    let featureFlags: Record<string, boolean> = {};
    let schemaVersion = SCHEMA_VERSION;
    let buildId =
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_BUILD_ID ||
      process.env.VERCEL_DEPLOYMENT_ID ||
      "dev";

    try {
      const cfg = await getSystemConfig();
      maintenanceMode = cfg.maintenanceMode;
      maintenanceMessage = cfg.maintenanceMessage || "";
      maintenanceUntil = cfg.maintenanceUntil;
      panicLockdown = cfg.panicLockdown;
      featureFlags = cfg.featureFlags as unknown as Record<string, boolean>;
      schemaVersion = cfg.schemaVersion;
      if (!process.env.VERCEL_GIT_COMMIT_SHA && cfg.buildId) {
        buildId = cfg.buildId;
      }
    } catch {
      /* DB cold */
    }

    const res = NextResponse.json({
      ok: true,
      buildId,
      schemaVersion,
      maintenanceMode,
      maintenanceMessage,
      maintenanceUntil,
      panicLockdown,
      featureFlags,
      ts: Date.now(),
    });

    if (maintenanceMode) {
      res.cookies.set("opus_maint_mode", "1", {
        path: "/",
        maxAge: 60 * 60 * 24,
        sameSite: "lax",
        httpOnly: false,
      });
    } else {
      res.cookies.set("opus_maint_mode", "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }
    res.headers.set("Cache-Control", "no-store, max-age=0");
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
