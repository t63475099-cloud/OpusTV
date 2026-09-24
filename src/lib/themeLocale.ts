"use client";

/**
 * Theme + Locale — persist localStorage, cross-tab, no reset on reload.
 * Keys: opus_theme, opus_locale
 */

export type ThemeMode = "dark" | "light" | "system";
export type LocaleCode = "vi" | "en";

export const THEME_KEY = "opus_theme";
export const LOCALE_KEY = "opus_locale";

export const THEME_OPTIONS: { value: ThemeMode; labelVi: string; labelEn: string }[] = [
  { value: "dark", labelVi: "Tối", labelEn: "Dark" },
  { value: "light", labelVi: "Sáng", labelEn: "Light" },
  { value: "system", labelVi: "Theo thiết bị", labelEn: "System" },
];

export const LOCALE_OPTIONS: { value: LocaleCode; label: string; native: string }[] = [
  { value: "vi", label: "Tiếng Việt", native: "Tiếng Việt" },
  { value: "en", label: "English", native: "English" },
];

export function readTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    /* */
  }
  return "dark";
}

export function readLocale(): LocaleCode {
  if (typeof window === "undefined") return "vi";
  try {
    const v = localStorage.getItem(LOCALE_KEY);
    if (v === "en" || v === "vi") return v;
  } catch {
    /* */
  }
  return "vi";
}

export function resolveTheme(mode: ThemeMode): "dark" | "light" {
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  if (typeof window !== "undefined" && window.matchMedia) {
    try {
      if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
    } catch {
      /* */
    }
  }
  return "dark";
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const resolved = resolveTheme(mode);
  document.documentElement.setAttribute("data-theme", resolved);
  document.documentElement.style.colorScheme = resolved;
  try {
    localStorage.setItem(THEME_KEY, mode);
  } catch {
    /* */
  }
}

export function applyLocale(locale: LocaleCode) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.setAttribute("data-locale", locale);
  try {
    localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    /* */
  }
}

/** Inline script for <head> — runs before paint (anti-FOUC) */
export const THEME_LOCALE_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_KEY}')||'dark';var r=t;if(t==='system'){r=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}else if(t!=='light'&&t!=='dark'){r='dark';}document.documentElement.setAttribute('data-theme',r);document.documentElement.style.colorScheme=r;var l=localStorage.getItem('${LOCALE_KEY}')||'vi';if(l!=='en'&&l!=='vi')l='vi';document.documentElement.lang=l;document.documentElement.setAttribute('data-locale',l);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

type Dict = Record<string, string>;

const VI: Dict = {
  "profile.title": "Hồ sơ",
  "profile.edit": "Sửa hồ sơ",
  "profile.uid": "UID",
  "profile.verify": "Xác minh",
  "profile.balance": "Số dư",
  "profile.coins": "xu",
  "profile.vip": "VIP",
  "profile.level": "Lv.",
  "profile.streak": "Chuỗi ngày",
  "profile.noBio": "Chưa có tiểu sử",
  "profile.tab.services": "Dịch vụ",
  "profile.tab.frames": "Khung ảnh",
  "profile.tab.security": "Bảo mật",
  "profile.info": "Thông tin",
  "profile.displayName": "Tên hiển thị",
  "profile.bio": "Tiểu sử",
  "profile.saveName": "Lưu tên",
  "profile.saveBio": "Lưu tiểu sử",
  "profile.pin": "Mã PIN khôi phục",
  "profile.pinHint": "6 chữ số",
  "profile.show": "Hiện",
  "profile.hide": "Ẩn",
  "profile.savePin": "Lưu PIN",
  "profile.inbox": "Hộp thư",
  "profile.openInbox": "Mở hộp thư",
  "profile.logout": "Đăng xuất",
  "profile.theme": "Giao diện",
  "profile.language": "Ngôn ngữ",
  "profile.theme.dark": "Tối",
  "profile.theme.light": "Sáng",
  "profile.theme.system": "Theo thiết bị",
  "profile.synced": "Đã đồng bộ",
  "profile.savedName": "Đã lưu tên",
  "profile.savedBio": "Đã lưu tiểu sử",
  "profile.savedPin": "Đã lưu mã PIN",
  "profile.copiedUid": "Đã sao chép UID",
  "profile.frameChanged": "Đã đổi khung",
  "profile.avatarUpdated": "Đã cập nhật ảnh",
  "event.title": "Sự kiện",
  "event.coins": "Xu hiện có",
  "event.streak": "Chuỗi ngày",
  "event.missionsDone": "Nhiệm vụ",
  "event.tab.missions": "Nhiệm vụ",
  "event.tab.shop": "Cửa hàng",
  "event.tab.inventory": "Kho đồ",
  "event.tab.pass": "Pass",
  "event.spin": "Vòng quay",
  "event.spinNow": "Quay ngay",
  "event.spinning": "Đang quay…",
  "event.checkin": "Điểm danh",
  "event.claim": "Nhận",
  "event.claimed": "Đã nhận",
  "svc.film": "Opus Film",
  "svc.film.desc": "Xem phim",
  "svc.event": "Sự kiện",
  "svc.event.desc": "Xu & nhiệm vụ",
  "svc.chat": "Opus Chat",
  "svc.chat.desc": "Tin nhắn",
  "svc.code": "Opus Code",
  "svc.code.desc": "Lập trình",
  "svc.fav": "Yêu thích",
  "svc.fav.desc": "Phim đã lưu",
  "svc.settings": "Cài đặt",
  "svc.settings.desc": "Tùy chọn",
};

const EN: Dict = {
  "profile.title": "Profile",
  "profile.edit": "Edit profile",
  "profile.uid": "UID",
  "profile.verify": "Verify",
  "profile.balance": "Balance",
  "profile.coins": "coins",
  "profile.vip": "VIP",
  "profile.level": "Lv.",
  "profile.streak": "Day streak",
  "profile.noBio": "No bio yet",
  "profile.tab.services": "Services",
  "profile.tab.frames": "Frames",
  "profile.tab.security": "Security",
  "profile.info": "Info",
  "profile.displayName": "Display name",
  "profile.bio": "Bio",
  "profile.saveName": "Save name",
  "profile.saveBio": "Save bio",
  "profile.pin": "Recovery PIN",
  "profile.pinHint": "6 digits",
  "profile.show": "Show",
  "profile.hide": "Hide",
  "profile.savePin": "Save PIN",
  "profile.inbox": "Inbox",
  "profile.openInbox": "Open inbox",
  "profile.logout": "Log out",
  "profile.theme": "Appearance",
  "profile.language": "Language",
  "profile.theme.dark": "Dark",
  "profile.theme.light": "Light",
  "profile.theme.system": "System",
  "profile.synced": "Synced",
  "profile.savedName": "Name saved",
  "profile.savedBio": "Bio saved",
  "profile.savedPin": "PIN saved",
  "profile.copiedUid": "UID copied",
  "profile.frameChanged": "Frame updated",
  "profile.avatarUpdated": "Photo updated",
  "event.title": "Events",
  "event.coins": "Coins",
  "event.streak": "Streak",
  "event.missionsDone": "Missions",
  "event.tab.missions": "Missions",
  "event.tab.shop": "Shop",
  "event.tab.inventory": "Bag",
  "event.tab.pass": "Pass",
  "event.spin": "Lucky spin",
  "event.spinNow": "Spin",
  "event.spinning": "Spinning…",
  "event.checkin": "Check-in",
  "event.claim": "Claim",
  "event.claimed": "Claimed",
  "svc.film": "Opus Film",
  "svc.film.desc": "Watch",
  "svc.event": "Events",
  "svc.event.desc": "Coins & tasks",
  "svc.chat": "Opus Chat",
  "svc.chat.desc": "Messages",
  "svc.code": "Opus Code",
  "svc.code.desc": "Coding",
  "svc.fav": "Favorites",
  "svc.fav.desc": "Saved",
  "svc.settings": "Settings",
  "svc.settings.desc": "Options",
};

const DICTS: Record<LocaleCode, Dict> = { vi: VI, en: EN };

export function translate(locale: LocaleCode, key: string): string {
  return DICTS[locale]?.[key] || DICTS.vi[key] || key;
}
