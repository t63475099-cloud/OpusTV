import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware:
 * - Bảo trì động (cookie opus_maint_mode=1 do /api/system/version đồng bộ từ DB)
 *   Admin (opus_admin_gate / x-admin-bypass / /admin*) KHÔNG bị ép /bao-tri
 *   User còn lại → /bao-tri
 * - Zero-trust /api/admin + redirect admin cũ → board-home
 * - ĐÃ XÓA lịch bảo trì tự động 00:00–06:00
 */

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
  if (list.length === 0) return value === "OpusFilm2026Secret";
  return list.includes(value);
}

function isAdminBypass(request: NextRequest): boolean {
  if (secretMatches(request.cookies.get("opus_admin_gate")?.value)) return true;
  if (request.cookies.get("x-admin-bypass")?.value === "1") return true;
  const path = request.nextUrl.pathname;
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) return true;
  return false;
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

  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/board-home" &&
    !pathname.startsWith("/admin/board-home/")
  ) {
    if (pathname !== "/admin" && pathname !== "/admin/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/board-home";
      return NextResponse.redirect(url);
    }
  }

  // Luôn cho qua: trang bảo trì, static, system API, cron
  if (
    pathname.startsWith("/bao-tri") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api/system") ||
    pathname.startsWith("/api/cron")
  ) {
    return NextResponse.next();
  }

  // Bảo trì động — cookie được /api/system/version set từ DB cho mọi client
  const dynMaint = request.cookies.get("opus_maint_mode")?.value === "1";
  if (dynMaint && !isAdminBypass(request)) {
    const isStream =
      pathname.includes(".m3u8") ||
      pathname.startsWith("/api/stream") ||
      pathname.startsWith("/api/phim");
    if (!isStream) {
      if (pathname.startsWith("/api")) {
        return NextResponse.json(
          { error: "maintenance", message: "Hệ thống đang bảo trì" },
          { status: 503 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/bao-tri";
      url.search = "";
      return NextResponse.redirect(url);
    }
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
