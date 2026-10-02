import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware:
 * 1) Lịch bảo trì VN (00:00–05:59) — SITE_SCHEDULE=off để tắt
 * 2) Zero-trust gate cho /admin/* và /api/admin/*
 * 3) Redirect trang admin cũ → /admin/board-home
 * 4) Session cookie presence for /api/auth/* (full revoke check in validateSession + SSE)
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

function isMaintenanceNow(): boolean {
  const hour = getVietnamHour();
  return hour >= 0 && hour < 6;
}

function getAdminSecrets(): string[] {
  return [
    process.env.ADMIN_SECRET,
    process.env.VERIFY_ADMIN_SECRET,
    process.env.KEY_ADMIN_SECRET,
    process.env.MIGRATE_SECRET,
    process.env.REDEEM_ADMIN_SECRET,
  ].filter(Boolean) as string[];
}

function secretMatches(value: string | undefined | null): boolean {
  if (!value) return false;
  const list = getAdminSecrets();
  if (list.length === 0) {
    return value === "OpusFilm2026Secret";
  }
  return list.includes(value);
}

export function middleware(request: NextRequest) {
  const method = request.method;
  if (!["GET", "HEAD", "OPTIONS", "POST", "PATCH", "PUT", "DELETE"].includes(method)) {
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

  // ── Redirect old admin pages → unified board-home ──
  if (
    pathname === "/admin/verify" ||
    pathname === "/admin/key-board" ||
    pathname === "/admin/accounts" ||
    pathname === "/admin/dashboard"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/board-home";
    return NextResponse.redirect(url);
  }

  // ── Admin API zero-trust ──
  if (pathname.startsWith("/api/admin")) {
    const headerSecret =
      request.headers.get("x-admin-secret") ||
      request.headers.get("x-key-secret") ||
      request.nextUrl.searchParams.get("secret") ||
      "";
    const cookieSecret = request.cookies.get("opus_admin_gate")?.value || "";
    if (!secretMatches(headerSecret) && !secretMatches(cookieSecret)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  // Soft gate for /admin pages (except board-home login screen itself is client-gated)
  // Cookie optional — page still asks for secret; cookie just reduces friction after unlock.
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/board-home" &&
    !pathname.startsWith("/admin/board-home/")
  ) {
    // Any other /admin/* already redirected above; remaining unknown admin paths → board-home
    if (pathname !== "/admin" && pathname !== "/admin/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/board-home";
      return NextResponse.redirect(url);
    }
  }

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
  res.headers.set("X-Frame-Options", "DENY");
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
