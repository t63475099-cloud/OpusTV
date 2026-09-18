/**
 * Smart routing stack for Opus sub-apps.
 * Portal → section root → deep page.
 * Browser/UI back from deep → section root; from section root → portal.
 */

export type OpusSection = "film" | "chat" | "code" | "music" | "pass" | "portal";

export const SECTION_HOME: Record<Exclude<OpusSection, "portal">, string> = {
  film: "/home",
  chat: "/tin-nhan",
  code: "/code",
  music: "/nhac",
  pass: "/su-kien",
};

const KEY_SECTION = "opus-nav-section";
const KEY_FROM_PORTAL = "opus-nav-from-portal";

export function markEnterSection(section: Exclude<OpusSection, "portal">) {
  try {
    sessionStorage.setItem(KEY_SECTION, section);
    sessionStorage.setItem(KEY_FROM_PORTAL, "1");
  } catch {
    /* */
  }
}

export function getActiveSection(): OpusSection {
  try {
    const s = sessionStorage.getItem(KEY_SECTION) as OpusSection | null;
    if (s && s !== "portal") return s;
  } catch {
    /* */
  }
  if (typeof window === "undefined") return "portal";
  const p = window.location.pathname;
  if (p.startsWith("/tin-nhan")) return "chat";
  if (p.startsWith("/code")) return "code";
  if (p.startsWith("/nhac")) return "music";
  if (p.startsWith("/su-kien")) return "pass";
  if (p.startsWith("/home") || p.startsWith("/phim") || p.startsWith("/the-loai") || p.startsWith("/danh-sach") || p.startsWith("/tim-kiem"))
    return "film";
  return "portal";
}

/** True when path is a section root (not a nested detail). */
export function isSectionRoot(pathname: string): boolean {
  const roots = Object.values(SECTION_HOME);
  return roots.some((r) => pathname === r || pathname === r + "/");
}

/**
 * Resolve where "Back" should go.
 * - Nested under film/chat/… → section home
 * - Already on section home & entered from portal → /
 * - Else → browser history back or /
 */
export function resolveSmartBack(pathname: string): string {
  const section = getActiveSection();
  if (section === "portal") return "/";

  const home = SECTION_HOME[section];
  if (!isSectionRoot(pathname)) return home;

  try {
    if (sessionStorage.getItem(KEY_FROM_PORTAL) === "1") {
      sessionStorage.removeItem(KEY_FROM_PORTAL);
      return "/";
    }
  } catch {
    /* */
  }
  return "/";
}

export function portalHref(section: Exclude<OpusSection, "portal">): string {
  return SECTION_HOME[section];
}
