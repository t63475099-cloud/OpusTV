import { NextRequest, NextResponse } from "next/server";
import { createSnapshot, appendAuditLog, ensureSystemTables } from "@/lib/system/store";
import { adminSecretFromRequest, isAdminSecretValid } from "@/lib/adminEngine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = adminSecretFromRequest(req.headers, req.nextUrl.searchParams);
  if (!isAdminSecretValid(secret)) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }
  try {
    await ensureSystemTables();
    const snapshot = await createSnapshot();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    await appendAuditLog("snapshot_export", { size: JSON.stringify(snapshot).length }, "admin", ip);
    const body = JSON.stringify(snapshot, null, 2);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="opus-snapshot-${Date.now()}.json"`,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
