import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  getSessionUser,
  listSessionsForUser,
  revokeSessionById,
  revokeOtherSessions,
  revokeAllSessions,
  destroySession,
  cookieOptions,
} from "@/lib/session";

/** GET — danh sách phiên đăng nhập còn hiệu lực */
export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || null;
    const list = await listSessionsForUser(user.userId, token);
    return NextResponse.json({
      ok: true,
      sessions: list,
      currentSessionId: list.find((s) => s.isCurrent)?.id ?? null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

/**
 * POST body:
 *  { action: "revoke", sessionId: number }
 *  { action: "revoke_others" }
 *  { action: "revoke_all" }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || "";
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "revoke") {
      const sessionId = Number(body.sessionId);
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        return NextResponse.json({ ok: false, error: "sessionId không hợp lệ" }, { status: 400 });
      }
      const list = await listSessionsForUser(user.userId, token);
      const target = list.find((s) => s.id === sessionId);
      if (!target) {
        return NextResponse.json({ ok: false, error: "Không tìm thấy phiên" }, { status: 404 });
      }
      await revokeSessionById(user.userId, sessionId);
      // Nếu tự thu hồi phiên hiện tại → xóa cookie
      if (target.isCurrent) {
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
      await revokeOtherSessions(user.userId, token);
      return NextResponse.json({ ok: true });
    }

    if (action === "revoke_all") {
      await revokeAllSessions(user.userId);
      if (token) await destroySession(token);
      const res = NextResponse.json({ ok: true, loggedOut: true });
      res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
      return res;
    }

    return NextResponse.json({ ok: false, error: "action không hỗ trợ" }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
