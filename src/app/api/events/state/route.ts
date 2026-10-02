import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { getOrCreateEventState } from "@/lib/eventServerState";

export const dynamic = "force-dynamic";

/** GET — snapshot server-authoritative event state */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const state = await getOrCreateEventState(user.userId, user.username);
    return NextResponse.json({ ok: true, state, version: state.version });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
