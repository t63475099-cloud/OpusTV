import { NextRequest, NextResponse } from "next/server";
import { destroySession, SESSION_COOKIE, cookieOptions } from "@/lib/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      await destroySession(token);
    } catch {
      /* ignore */
    }
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieOptions(0), maxAge: 0 });
  return res;
}
