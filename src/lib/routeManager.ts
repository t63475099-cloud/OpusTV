/**
 * Smart routing for Opus sub-apps.
 * Nested page → section home.
 * Section home → stay (browser history) — only logo / "Cổng" returns to portal.
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

export function markEnterSection(section: Exclude<OpusSection, "portal">) {
  try {
    sessionStorage.setItem(KEY_SECTION, section);
  } catch {
    /* */
  }
}

export function clearSectionMark() {
  try {
    sessionStorage.removeItem(KEY_SECTION);
  } catch {
    /* */
  }
}

export function getActiveSection(): OpusSection {
  if (typeof window === "undefined") return "portal";
  const p = window.location.pathname;
  if (p === "/" || p === "") return "portal";
  if (p.startsWith("/tin-nhan")) return "chat";
  if (p.startsWith("/code")) return "code";
  if (p.startsWith("/nhac")) return "music";
  if (p.startsWith("/su-kien")) return "pass";
  if (
    p.startsWith("/home") ||
    p.startsWith("/phim") ||
    p.startsWith("/the-loai") ||
    p.startsWith("/danh-sach") ||
    p.startsWith("/tim-kiem") ||
    p.startsWith("/yeu-thich") ||
    p.startsWith("/lich-su") ||
    p.startsWith("/quoc-gia")
  )
    return "film";
  try {
    const s = sessionStorage.getItem(KEY_SECTION) as OpusSection | null;
    if (s && s !== "portal") return s;
  } catch {
    /* */
  }
  return "portal";
}

export function isSectionRoot(pathname: string): boolean {
  return Object.values(SECTION_HOME).some(
    (r) => pathname === r || pathname === r + "/"
  );
}

/**
 * Back target:
 * - Nested under a section → that section's home
 * - Already on section home → null (use browser history / stay)
 * - Portal → null
 */
export function resolveSmartBack(pathname: string): string | null {
  const section = getActiveSection();
  if (section === "portal") return null;

  const home = SECTION_HOME[section];
  if (!isSectionRoot(pathname)) return home;

  // On section home: do NOT force portal — leave history alone
  return null;
}

export function portalHref(section: Exclude<OpusSection, "portal">): string {
  return SECTION_HOME[section];
}
