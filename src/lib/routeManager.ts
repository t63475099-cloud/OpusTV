export type OpusSection =
  | "film"
  | "chat"
  | "code"
  | "music"
  | "pass"
  | "settings"
  | "account"
  | "portal";

export const SECTION_HOME: Record<Exclude<OpusSection, "portal">, string> = {
  film: "/home",
  chat: "/tin-nhan",
  code: "/code",
  music: "/nhac",
  pass: "/su-kien",
  settings: "/cai-dat",
  account: "/tai-khoan",
};

const KEY_SECTION = "opus-nav-section";
const KEY_LOCK = "opus-section-lock";

export function markEnterSection(section: Exclude<OpusSection, "portal">) {
  try {
    sessionStorage.setItem(KEY_SECTION, section);
    sessionStorage.setItem(KEY_LOCK, "1");
  } catch {
    /* */
  }
}

/** Cho phép về Hub (khi user bấm Cổng / logo portal) */
export function allowPortalReturn() {
  try {
    sessionStorage.removeItem(KEY_LOCK);
    sessionStorage.setItem(KEY_SECTION, "portal");
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
    p.startsWith("/cai-dat") ||
    p.startsWith("/hop-thu") ||
    p.startsWith("/chinh-sach") ||
    p.startsWith("/dieu-khoan") ||
    p.startsWith("/faq") ||
    p.startsWith("/ho-tro")
  )
    return "settings";
  if (p.startsWith("/tai-khoan") || p.startsWith("/u/")) return "account";
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

export function resolveSmartBack(pathname: string): string | null {
  const section = getActiveSection();
  if (section === "portal") return null;
  const home = SECTION_HOME[section as keyof typeof SECTION_HOME];
  if (!home) return null;
  if (!isSectionRoot(pathname)) return home;
  return null;
}

export function portalHref(section: Exclude<OpusSection, "portal">): string {
  return SECTION_HOME[section];
}
