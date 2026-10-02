import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { serverWheelSpin } from "@/lib/eventServerState";
import { isPanicOrFeatureBlocked } from "@/lib/system/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const gate = await isPanicOrFeatureBlocked("FEATURE_SPIN");
    if (gate.blocked) {
      return NextResponse.json(
        {
          ok: false,
          error:
            gate.reason === "EMERGENCY_LOCKDOWN"
              ? "Hệ thống tạm khóa giao dịch"
              : "Tính năng đang bảo trì nâng cấp",
        },
        { status: 503 }
      );
    }
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const expectedVersion =
      body.expectedVersion != null ? Number(body.expectedVersion) : undefined;

    const result = await serverWheelSpin(
      user.userId,
      user.username,
      expectedVersion
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error,
          conflict: !!result.conflict,
          state: result.state,
          version: result.state?.version,
        },
        { status: result.conflict ? 409 : 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      label: result.label,
      message: result.message,
      state: result.state,
      version: result.state?.version,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    console.error("wheel-spin", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
