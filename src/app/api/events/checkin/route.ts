import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { serverCheckIn } from "@/lib/eventServerState";

export const dynamic = "force-dynamic";

/**
 * POST /api/events/checkin
 * Body: { expectedVersion?: number }
 * Server clock (Asia/Ho_Chi_Minh) — not client local day
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const expectedVersion =
      body.expectedVersion != null ? Number(body.expectedVersion) : undefined;

    const result = await serverCheckIn(
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
      coins: result.coins,
      message: result.message,
      state: result.state,
      version: result.state?.version,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    console.error("checkin", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
