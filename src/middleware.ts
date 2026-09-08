import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lịch đóng/mở theo giờ Việt Nam (Asia/Ho_Chi_Minh):
 * - Bảo trì: 00:00 → 05:59
 * - Mở:      06:00 → 23:59
 *
 * Tắt lịch: env SITE_SCHEDULE=off
 * Bypass: ?bypass=SECRET (env SCHEDULE_BYPASS_SECRET, mặc định opus-open)
 */
function getVietnamHour(): number {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value || "0");
}

/** true = 00:00–05:59 giờ VN */
function isMaintenanceNow(): boolean {
  const hour = getVietnamHour();
  return hour >= 0 && hour < 6;
}

export function middleware(request: NextRequest) {
  const method = request.method;
  if (!["GET", "HEAD", "OPTIONS", "POST"].includes(method)) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
    }
  }

  if (request.nextUrl.search.length > 512) {
    return NextResponse.json({ error: "Query too long" }, { status: 414 });
  }

  const q = request.nextUrl.searchParams.get("q");
  if (q && q.length > 120) {
    const url = request.nextUrl.clone();
    url.searchParams.set("q", q.slice(0, 120));
    return NextResponse.redirect(url);
  }

  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/bao-tri") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const scheduleOff = process.env.SITE_SCHEDULE === "off";
  const secret = process.env.SCHEDULE_BYPASS_SECRET || "opus-open";
  const bypassQuery = request.nextUrl.searchParams.get("bypass");
  const bypassCookie = request.cookies.get("site_bypass")?.value;
  const hasBypass = bypassQuery === secret || bypassCookie === secret;

  if (bypassQuery === secret) {
    const res = NextResponse.next();
    res.cookies.set("site_bypass", secret, {
      path: "/",
      maxAge: 60 * 60 * 12,
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  if (!scheduleOff && isMaintenanceNow() && !hasBypass) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        {
          error: "closed",
          message: "Website bảo trì 00:00–06:00 (giờ VN). Mở lại lúc 06:00.",
          timezone: "Asia/Ho_Chi_Minh",
        },
        { status: 503 }
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/bao-tri";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
