import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  getSessionUser,
  destroySession,
  cookieOptions,
} from "@/lib/session";
import {
  listLiveSessions,
  revokeOtherSessionsRemote,
  revokeSessionRemote,
  validateSession,
  ensureRealtimeSchema,
  broadcastAccountUpdate,
} from "@/lib/session/store";

export const dynamic = "force-dynamic";

/** GET — live device list */
export async function GET() {
  try {
    await ensureRealtimeSchema();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || null;
    const list = await listLiveSessions(user.userId, token);
    return NextResponse.json({
      ok: true,
      sessions: list,
      devices: list,
      currentSessionId: list.find((s) => s.isCurrentDevice)?.sessionId ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST
 *  { action: "revoke", sessionId }
 *  { action: "revoke_others" }
 *  { action: "revoke_all" }
 *  { action: "heartbeat" }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureRealtimeSchema();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || "";
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    const validated = await validateSession(token);
    if (!validated.ok) {
      const res = NextResponse.json(
        { ok: false, error: "Phiên không hợp lệ", reason: validated.reason },
        { status: 401 }
      );
      res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
      return res;
    }

    if (action === "revoke" || action === "revoke_session") {
      const sessionId = Number(body.sessionId);
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return NextResponse.json({ ok: false, error: "sessionId không hợp lệ" }, { status: 400 });
      }
      const r = await revokeSessionRemote(user.userId, sessionId, validated.sessionId);
      if (!r.ok) {
        return NextResponse.json({ ok: false, error: r.error }, { status: 404 });
      }
      if (sessionId === validated.sessionId) {
        if (token) await destroySession(token);
        const res = NextResponse.json({ ok: true, loggedOut: true });
        res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
        return res;
      }
      return NextResponse.json({ ok: true });
    }

    if (action === "revoke_others") {
      if (!token) {
        return NextResponse.json({ ok: false, error: "Không có phiên hiện tại" }, { status: 400 });
      }
      const r = await revokeOtherSessionsRemote(user.userId, token);
      return NextResponse.json({ ok: true, revoked: r.revoked });
    }

    if (action === "revoke_all") {
      const list = await listLiveSessions(user.userId, token);
      for (const s of list) {
        await revokeSessionRemote(user.userId, s.sessionId, validated.sessionId);
      }
      if (token) await destroySession(token);
      await broadcastAccountUpdate(user.userId, "FORCE_LOGOUT", {
        message: "Đăng xuất tất cả thiết bị",
        bumpVersion: true,
      });
      const res = NextResponse.json({ ok: true, loggedOut: true });
      res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
      return res;
    }

    if (action === "heartbeat") {
      return NextResponse.json({
        ok: true,
        sessionId: validated.sessionId,
        ts: Date.now(),
      });
    }

    return NextResponse.json({ ok: false, error: "action không hỗ trợ" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/** DELETE ?sessionId= | ?others=1 */
export async function DELETE(req: NextRequest) {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value || "";
  const sessionId = Number(req.nextUrl.searchParams.get("sessionId") || 0);
  const others = req.nextUrl.searchParams.get("others") === "1";

  if (others) {
    const synthetic = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ action: "revoke_others" }),
    });
    return POST(synthetic);
  }

  if (sessionId > 0) {
    const synthetic = new NextRequest(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({ action: "revoke", sessionId }),
    });
    return POST(synthetic);
  }

  return NextResponse.json({ ok: false, error: "Thiếu sessionId hoặc others=1" }, { status: 400 });
}
