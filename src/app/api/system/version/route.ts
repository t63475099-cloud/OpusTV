import { NextResponse } from "next/server";
import { getSystemConfig } from "@/lib/system/store";
import { SCHEMA_VERSION } from "@/lib/system/types";

export const dynamic = "force-dynamic";

/** Lightweight version probe for client (60s poll) */
export async function GET() {
  try {
    let maintenanceMode = false;
    let panicLockdown = false;
    let featureFlags = {};
    let schemaVersion = SCHEMA_VERSION;
    let buildId =
      process.env.VERCEL_GIT_COMMIT_SHA ||
      process.env.NEXT_PUBLIC_BUILD_ID ||
      "dev";
    try {
      const cfg = await getSystemConfig();
      maintenanceMode = cfg.maintenanceMode;
      panicLockdown = cfg.panicLockdown;
      featureFlags = cfg.featureFlags;
      schemaVersion = cfg.schemaVersion;
      if (cfg.buildId) buildId = cfg.buildId;
    } catch {
      /* DB cold — still return build id */
    }
    return NextResponse.json({
      ok: true,
      buildId,
      schemaVersion,
      maintenanceMode,
      panicLockdown,
      featureFlags,
      ts: Date.now(),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
