import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lịch đóng/mở web theo giờ Việt Nam (UTC+7):
 * - Đóng: 23:00 → 06:59
 * - Mở:   07:00 → 22:59
 *
 * Tắt lịch: Vercel env SITE_SCHEDULE=off
 * Bỏ qua tạm (admin): ?bypass=YOUR_SECRET hoặc cookie site_bypass
 *   (env SCHEDULE_BYPASS_SECRET, mặc định opus-open)
 */
function getVietnamHourMinute(): { hour: number; minute: number; label: string } {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "0";
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  const label = `${get("day")}/${get("month")}/${get("year")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} GMT+7`;
  return { hour, minute, label };
}

/** true = đang trong khung đóng cửa (23:00–06:59) */
function isClosedNow(): boolean {
  const { hour } = getVietnamHourMinute();
  return hour >= 23 || hour < 7;
}

export function middleware(request: NextRequest) {
  const method = request.method;
  // Cho phép POST các API auth / social / search
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

  // Luôn cho qua trang bảo trì + static
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

  // Admin mở tạm bằng ?bypass=...
  if (bypassQuery === secret) {
    const res = NextResponse.next();
    res.cookies.set("site_bypass", secret, {
      path: "/",
      maxAge: 60 * 60 * 12, // 12 giờ
      httpOnly: true,
      sameSite: "lax",
    });
    return res;
  }

  if (!scheduleOff && isClosedNow() && !hasBypass) {
    // API: trả JSON 503
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        {
          error: "closed",
          message: "Website tạm dừng 23:00–07:00 (giờ VN). Mở lại lúc 07:00.",
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
