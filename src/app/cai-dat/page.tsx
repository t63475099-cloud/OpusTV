"use client";

import OfflineDownloads from "@/components/OfflineDownloads";
import {
  THEME_OPTIONS,
  applyTheme,
  readTheme,
  type ThemeMode,
} from "@/lib/themeLocale";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSettingsStore,
  isPresetAvatar,
  defaultSettings,
  type AppSettings,
} from "@/lib/settings";
import UserAvatar from "@/components/UserAvatar";
import { useHistoryStore } from "@/lib/history";
import { useFavoritesStore } from "@/lib/favorites";
import {
  User,
  LogIn,
  LogOut,
  Palette,
  Play,
  Database,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Camera,
  Crosshair,
  Settings2,
  Gauge,
  Accessibility,
  Shield,
  LayoutGrid,
  Sparkles,
  Bell,
  Globe,
  Clock,
  Lock,
  Info,
  HelpCircle,
} from "lucide-react";

type Section =
  | "root"
  | "account"
  | "playback"
  | "player"
  | "display"
  | "home"
  | "ux"
  | "privacy"
  | "a11y"
  | "data"
  | "more"
  | "language"
  | "notify"
  | "about" | "legal";


/** Đã tắt ambient liquid glass */
function SettingsAmbientCanvas() {
  return null;
}

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border last:border-0 hover:bg-surface-elevated transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-[0.99]"
    >
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-[15px] leading-snug text-foreground">{label}</p>
        {desc && (
          <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-foreground-muted">{desc}</p>
        )}
      </div>
      <span
        role="switch"
        aria-checked={checked}
        className={[
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full p-0.5",
          "transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
          checked
            ? "bg-primary"
            : "bg-surface-elevated border border-border",
        ].join(" ")}
      >
        <span
          className={[
            "pointer-events-none block h-6 w-6 rounded-full bg-primary-foreground shadow-sm",
            "transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            checked ? "translate-x-5" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );
}

function RowLink({
  icon,
  label,
  desc,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  desc?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 border-b border-border px-4 py-3.5 text-left last:border-0 hover:bg-surface-elevated"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] leading-snug text-foreground">{label}</p>
        {desc && <p className="text-xs text-foreground-muted/90 mt-0.5 leading-snug line-clamp-2">{desc}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-foreground-subtle shrink-0 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:text-foreground-muted" />
    </button>
  );
}

function ChipGroup<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="border-b border-border px-4 py-3 last:border-0">
      <p className="mb-2 text-sm text-foreground-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              value === o.value
                ? "border-primary bg-primary font-medium text-primary-foreground"
                : "border-border bg-surface-elevated text-foreground hover:bg-surface"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}


function ThemeModePicker() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  useEffect(() => {
    setMode(readTheme());
  }, []);
  return (
    <div className="border-b border-border px-4 py-3 last:border-0">
      <p className="mb-2 text-sm text-foreground-muted">Sáng / Tối</p>
      <div className="flex flex-wrap gap-2">
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setMode(o.value);
              applyTheme(o.value);
            }}
            className={
              "rounded-lg border px-3 py-2 text-sm font-medium ui-border-contrast " +
              (mode === o.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface-elevated text-foreground")
            }
          >
            {o.labelVi}
          </button>
        ))}
      </div>
    </div>
  );
}

function applyDomFlags(s: AppSettings) {
  if (typeof document === "undefined") return;
  const h = document.documentElement;
  h.classList.toggle("reduce-motion", s.reducedMotion);
  h.classList.toggle("yt-dense", s.denseHome);
  h.classList.toggle("yt-large-text", s.largeText);
  h.classList.toggle("yt-high-contrast", s.highContrast);
  h.classList.toggle("yt-reduce-transparency", s.reduceTransparency);
  h.dataset.accent = s.accent;
}

const MORE_KEYS: { key: keyof AppSettings; label: string }[] = [
  { key: "autoSkipIntro", label: "Tự bỏ qua intro" },
  { key: "autoSkipOutro", label: "Tự bỏ qua outro" },
  { key: "resumePrompt", label: "Hỏi tiếp tục xem dở" },
  { key: "pauseOnHide", label: "Tạm dừng khi chuyển tab" },
  { key: "serverAutoSwitch", label: "Tự đổi server khi lỗi" },
  { key: "preferSubServer", label: "Ưu tiên server phụ đề" },
  { key: "preferDubServer", label: "Ưu tiên server lồng tiếng" },
  { key: "showContinueRow", label: "Hàng Tiếp tục xem" },
  { key: "showKoreanRow", label: "Hàng Phim Hàn" },
  { key: "showHorrorRow", label: "Hàng Kinh dị" },
  { key: "searchSuggest", label: "Gợi ý tìm kiếm" },
  { key: "voiceSearch", label: "Tìm bằng giọng nói" },
  { key: "saveHistory", label: "Lưu lịch sử xem" },
  { key: "saveFavorites", label: "Lưu yêu thích" },
  { key: "anonymousMode", label: "Chế độ ẩn danh" },
  { key: "toastNotifications", label: "Thông báo toast" },
  { key: "trueBlackOled", label: "Nền đen OLED" },
  { key: "roundedCorners", label: "Bo góc thẻ phim" },
  { key: "cacheApiResponses", label: "Cache API" },
  { key: "forceHlsJs", label: "Luôn dùng hls.js" },
];

function SettingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as Section | null;
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<Section>("root");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const profile = useSettingsStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const login = useSettingsStore((s) => s.login);
  const logout = useSettingsStore((s) => s.logout);
  const updateProfile = useSettingsStore((s) => s.updateProfile);
  const setAvatar = useSettingsStore((s) => s.setAvatar);
  const setAvatarPosition = useSettingsStore((s) => s.setAvatarPosition);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const clearHistory = useHistoryStore((s) => s.clear);
  const clearFav = useFavoritesStore((s) => s.clear);
  const historyLen = useHistoryStore((s) => s.history.length);
  const favLen = useFavoritesStore((s) => s.favorites.length);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (tabParam && tabParam !== "root") setSection(tabParam);
  }, [tabParam]);
  useEffect(() => {
    if (profile.loggedIn) {
      setName(profile.name);
      setEmail(profile.email || "");
    }
  }, [profile]);
  useEffect(() => {
    if (mounted) applyDomFlags(settings);
  }, [mounted, settings]);

  const go = (s: Section) => {
    setSection(s);
    if (s === "root") router.replace("/cai-dat");
    else router.replace(`/cai-dat?tab=${s}`);
  };

  const set = (partial: Partial<AppSettings>) => {
    updateSettings(partial);
    // Áp dụng ngay (DOM + lang) — tránh toggle “không hoạt động”
    const next = { ...useSettingsStore.getState().settings, ...partial };
    applyDomFlags(next);
    if (partial.language) {
      try {
        document.documentElement.lang = partial.language;
        document.documentElement.dataset.lang = partial.language;
      } catch {}
    }
  };

  if (!mounted) {
    return <div className="min-h-screen w-full pt-[max(1rem,env(safe-area-inset-top,0px))]" />;
  }

  const titleMap: Record<Section, string> = {
    root: "Cài đặt",
    account: "Tài khoản",
    playback: "Phát video",
    player: "Giao diện player",
    display: "Giao diện",
    home: "Trang chủ",
    ux: "Trải nghiệm",
    privacy: "Quyền riêng tư",
    a11y: "Trợ năng",
    data: "Dữ liệu",
    more: "Tính năng thêm",
    language: "Ngôn ngữ",
    notify: "Thông báo",
    about: "Giới thiệu",
    legal: "Chính sách & Điều khoản",
  };

  return (
    <div className="relative min-h-screen w-full bg-background text-foreground pt-[max(1rem,env(safe-area-inset-top,0px))] pb-28">
      <style jsx global>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div className="sticky top-2 z-30 mx-auto mt-2 flex w-[calc(100%-1.5rem)] max-w-xl items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3 ui-border-contrast">
        {section !== "root" ? (
          <button
            type="button"
            onClick={() => go("root")}
            className="-ml-1 rounded-full p-2 text-foreground hover:bg-surface-elevated"
            aria-label="Back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <Link href="/" className="-ml-1 rounded-full p-2 text-foreground hover:bg-surface-elevated" aria-label="Home">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{titleMap[section]}</h1>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-xl px-3 mt-3 space-y-3 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
        {section === "root" && (
          <div className="space-y-3 animate-[fadeUp_0.5s_ease]">
            <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                Tài khoản
              </p>
              <Link
                href="/tai-khoan"
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-elevated transition-all duration-500"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground">
                  <User className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-foreground">Tài khoản</span>
                  <span className="block truncate text-xs text-foreground-muted">
                    {profile.loggedIn ? profile.name : "Đăng nhập"}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 text-foreground-subtle" />
              </Link>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                Phát & giao diện
              </p>
              <RowLink
                icon={<Play className="w-5 h-5" />}
                label="Phát video"
                desc="Tua, chất lượng, khung hình"
                onClick={() => go("playback")}
              />
              <RowLink
                icon={<Gauge className="w-5 h-5" />}
                label="Giao diện player"
                desc="Thanh điều khiển, thời gian"
                onClick={() => go("player")}
              />
              <RowLink
                icon={<Palette className="w-5 h-5" />}
                label="Giao diện"
                desc="Giao diện, mật độ, màu"
                onClick={() => go("display")}
              />
              <RowLink
                icon={<LayoutGrid className="w-5 h-5" />}
                label="Trang chủ"
                desc="Các hàng phim hiển thị"
                onClick={() => go("home")}
              />
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
              <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground-muted">
                Chung
              </p>
              <RowLink
                icon={<Globe className="w-5 h-5" />}
                label="Ngôn ngữ"
                onClick={() => go("language")}
              />
              <RowLink
                icon={<Bell className="w-5 h-5" />}
                label="Thông báo"
                onClick={() => go("notify")}
              />
              <RowLink
                icon={<Sparkles className="w-5 h-5" />}
                label="Trải nghiệm"
                desc="Tìm kiếm, phím tắt, toast"
                onClick={() => go("ux")}
              />
              <RowLink
                icon={<Shield className="w-5 h-5" />}
                label="Quyền riêng tư"
                onClick={() => go("privacy")}
              />
              <RowLink
                icon={<Accessibility className="w-5 h-5" />}
                label="Trợ năng"
                onClick={() => go("a11y")}
              />
              <RowLink
                icon={<Database className="w-5 h-5" />}
                label="Dữ liệu trên máy"
                desc={`Lịch sử ${historyLen} · Yêu thích ${favLen}`}
                onClick={() => go("data")}
              />
              <RowLink
                icon={<Settings2 className="w-5 h-5" />}
                label="Tính năng thêm"
                desc="Nhiều tùy chọn nâng cao"
                onClick={() => go("more")}
              />
              <RowLink
                icon={<Shield className="w-5 h-5" />}
                label="Chính sách & Điều khoản"
                onClick={() => go("legal")}
              />
              <Link
                href="/ho-tro"
                className="group w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-elevated transition-all duration-500 text-left border-b border-border"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-elevated text-foreground">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] text-foreground">Hỗ trợ & FAQ</span>
                  <span className="block text-xs text-foreground-muted mt-0.5">Câu hỏi thường gặp</span>
                </span>
                <ChevronRight className="w-5 h-5 text-foreground-subtle" />
              </Link>
              <RowLink
                icon={<Info className="w-5 h-5" />}
                label="Giới thiệu"
                onClick={() => go("about")}
              />
            </div>
          </div>
        )}

        {section === "account" && (
          <div className="px-4 py-6 rounded-2xl border border-border bg-surface  shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500">
            <Link
              href="/tai-khoan"
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-r from-red-600/25 via-rose-600/15 to-transparent px-4 py-4 text-foreground transition hover:border-red-500/40 active:scale-[0.99]"
            >
              <span className="font-semibold">
                {profile.loggedIn ? "Hồ sơ của bạn" : "Đăng nhập / Đăng ký"}
              </span>
              <span className="text-sm text-red-300">Mở →</span>
            </Link>
          </div>
        )}


        {section === "playback" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Tự phát khi mở tập" checked={settings.autoPlayStart !== false} onChange={(v) => set({ autoPlayStart: v })} />
            <Toggle label="Tự chuyển tập tiếp theo" checked={settings.autoPlayNext !== false} onChange={(v) => set({ autoPlayNext: v })} />
            <Toggle label="Chạm đôi để tua" checked={settings.doubleTapSeek !== false} onChange={(v) => set({ doubleTapSeek: v })} />
            <Toggle label="Tắt tiếng lúc bắt đầu" checked={!!settings.muteOnStart} onChange={(v) => set({ muteOnStart: v })} />
            <Toggle label="Nhớ tốc độ phát" checked={settings.rememberSpeed !== false} onChange={(v) => set({ rememberSpeed: v })} />
            <ChipGroup
              label="Thời gian tua"
              value={settings.seekSeconds ?? 10}
              options={[1, 5, 10, 20, 30].map((n) => ({ value: n as 1 | 5 | 10 | 20 | 30, label: `${n}s` }))}
              onChange={(v) => set({ seekSeconds: v })}
            />
            <ChipGroup
              label="Chất lượng mặc định"
              value={settings.defaultQuality || "auto"}
              options={[
                { value: "auto" as const, label: "Tự động" },
                { value: "1080" as const, label: "1080p" },
                { value: "720" as const, label: "720p" },
                { value: "480" as const, label: "480p" },
              ]}
              onChange={(v) => set({ defaultQuality: v })}
            />
            <ChipGroup
              label="Tốc độ phát mặc định"
              value={settings.defaultSpeed ?? 1}
              options={[0.75, 1, 1.25, 1.5, 2].map((n) => ({ value: n, label: `${n}x` }))}
              onChange={(v) => set({ defaultSpeed: v })}
            />
            <ChipGroup
              label="Khung hình fullscreen"
              value={settings.fillMode || "cover"}
              options={[
                { value: "cover" as const, label: "Lấp đầy" },
                { value: "contain" as const, label: "Giữ tỷ lệ" },
              ]}
              onChange={(v) => set({ fillMode: v })}
            />
            <Toggle label="Tự bỏ qua intro" checked={!!settings.autoSkipIntro} onChange={(v) => set({ autoSkipIntro: v })} />
            <Toggle label="Tự bỏ qua outro" checked={!!settings.autoSkipOutro} onChange={(v) => set({ autoSkipOutro: v })} />
            <Toggle label="Hỏi tiếp tục xem dở" checked={settings.resumePrompt !== false} onChange={(v) => set({ resumePrompt: v })} />
            <Toggle label="Chuyển server tự động khi lỗi" checked={settings.serverAutoSwitch !== false} onChange={(v) => set({ serverAutoSwitch: v })} />
          </div>
        )}

        {section === "player" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Tự phát khi mở tập" checked={settings.autoPlayStart} onChange={(v) => set({ autoPlayStart: v })} />
            <Toggle label="Chạm đôi để tua" checked={settings.doubleTapSeek !== false} onChange={(v) => set({ doubleTapSeek: v })} />
            <ChipGroup
              label="Thời gian tua"
              value={settings.seekSeconds ?? 10}
              options={[1, 5, 10, 20, 30].map((n) => ({ value: n as 1 | 5 | 10 | 20 | 30, label: `${n}s` }))}
              onChange={(v) => set({ seekSeconds: v })}
            />
            <ChipGroup
              label="Chất lượng mặc định"
              value={settings.defaultQuality}
              options={[
                { value: "auto" as const, label: "Tự động" },
                { value: "1080" as const, label: "1080p" },
                { value: "720" as const, label: "720p" },
                { value: "480" as const, label: "480p" },
              ]}
              onChange={(v) => set({ defaultQuality: v })}
            />
            <ChipGroup
              label="Khung hình fullscreen"
              value={settings.fillMode || "cover"}
              options={[
                { value: "cover" as const, label: "Lấp đầy" },
                { value: "contain" as const, label: "Giữ tỷ lệ" },
              ]}
              onChange={(v) => set({ fillMode: v })}
            />
            <Toggle label="Luôn hiện điều khiển" checked={!!settings.alwaysShowControls} onChange={(v) => set({ alwaysShowControls: v })} />
            <Toggle label="Nút Play giữa" checked={settings.centerPlayButton !== false} onChange={(v) => set({ centerPlayButton: v })} />
            <Toggle label="Hiện mã thời gian" checked={settings.showTimeCode !== false} onChange={(v) => set({ showTimeCode: v })} />
            <ChipGroup
              label="Ẩn điều khiển sau"
              value={settings.hideControlsMs || 3200}
              options={[
                { value: 2000, label: "2s" },
                { value: 3200, label: "3.2s" },
                { value: 5000, label: "5s" },
              ]}
              onChange={(v) => set({ hideControlsMs: v })}
            />
          </div>
        )}

        {section === "display" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <ThemeModePicker />
            <Toggle label="Giao diện dày (YouTube)" checked={!!settings.denseHome} onChange={(v) => set({ denseHome: v })} />
            <Toggle label="Giảm chuyển động" checked={!!settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
            <Toggle label="Card phim gọn" checked={!!settings.compactCards} onChange={(v) => set({ compactCards: v })} />
            <ChipGroup
              label="Màu nhấn"
              value={settings.accent || "red"}
              options={[
                { value: "red" as const, label: "Đỏ" },
                { value: "blue" as const, label: "Xanh" },
                { value: "violet" as const, label: "Tím" },
                { value: "emerald" as const, label: "Lục" },
              ]}
              onChange={(v) => set({ accent: v })}
            />
          </div>
        )}

        {section === "home" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Hàng Tiếp tục xem" checked={settings.showContinueRow !== false} onChange={(v) => set({ showContinueRow: v })} />
            <Toggle label="Hàng Phim Hàn" checked={settings.showKoreanRow !== false} onChange={(v) => set({ showKoreanRow: v })} />
            <Toggle label="Hàng Kinh dị" checked={settings.showHorrorRow !== false} onChange={(v) => set({ showHorrorRow: v })} />
          </div>
        )}

        {section === "language" && (
          <div className="px-4 py-3 space-y-3 overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
            <p className="text-sm text-foreground-muted">Chọn ngôn ngữ giao diện. Áp dụng ngay trên toàn site.</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { value: "vi", label: "Tiếng Việt" },
                  { value: "en", label: "English" },
                  { value: "zh", label: "中文" },
                  { value: "ko", label: "한국어" },
                  { value: "ja", label: "日本語" },
                  { value: "th", label: "ไทย" },
                  { value: "fr", label: "Français" },
                  { value: "es", label: "Español" },
                  { value: "id", label: "Indonesia" },
                  { value: "pt", label: "Português" },
                ] as const
              ).map((o) => {
                const active = (settings.language || "vi") === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      set({ language: o.value });
                      try {
                        document.documentElement.lang = o.value;
                        document.documentElement.dataset.lang = o.value;
                      } catch {}
                    }}
                    className={
                      "rounded-xl px-3 py-3 text-sm text-left border transition-all duration-500 " +
                      (active
                        ? "border-primary bg-primary font-semibold text-primary-foreground"
                        : "border-border bg-surface text-foreground hover:bg-surface-elevated")
                    }
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {section === "notify" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Thông báo toast" checked={settings.toastNotifications !== false} onChange={(v) => set({ toastNotifications: v })} />
            <Toggle label="Ít thông báo hơn" checked={!!settings.quietToasts} onChange={(v) => set({ quietToasts: v })} />
          </div>
        )}

        {section === "ux" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Gợi ý tìm kiếm" checked={settings.searchSuggest !== false} onChange={(v) => set({ searchSuggest: v })} />
            <Toggle label="Tìm bằng giọng nói" checked={settings.voiceSearch !== false} onChange={(v) => set({ voiceSearch: v })} />
            <Toggle label="Phím tắt bàn phím (PC)" checked={settings.keyboardShortcuts !== false} onChange={(v) => set({ keyboardShortcuts: v })} />
          </div>
        )}

        {section === "privacy" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Lưu lịch sử xem" checked={settings.saveHistory !== false} onChange={(v) => set({ saveHistory: v })} />
            <Toggle label="Lưu yêu thích" checked={settings.saveFavorites !== false} onChange={(v) => set({ saveFavorites: v })} />
            <Toggle label="Ẩn danh (không ghi lịch sử mới)" checked={!!settings.anonymousMode} onChange={(v) => set({ anonymousMode: v })} />
          </div>
        )}

        {section === "a11y" && (
          <div className="overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast animate-[fadeUp_0.5s_ease]">
            <Toggle label="Chữ lớn hơn" checked={!!settings.largeText} onChange={(v) => set({ largeText: v })} />
            <Toggle label="Tăng tương phản" checked={!!settings.highContrast} onChange={(v) => set({ highContrast: v })} />
            <Toggle label="Giảm chuyển động" checked={!!settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
          </div>
        )}

        {section === "data" && (
          <div className="px-4 py-4 space-y-3 overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
            <OfflineDownloads />
            <Link href="/lich-su" className="flex justify-between py-3 border-b border-border text-foreground text-sm">
              Lịch sử xem <span className="text-foreground-muted">{historyLen}</span>
            </Link>
            <Link href="/yeu-thich" className="flex justify-between py-3 border-b border-border text-foreground text-sm">
              Yêu thích <span className="text-foreground-muted">{favLen}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!settings.confirmClearData || confirm("Xóa lịch sử?")) clearHistory();
              }}
              className="flex items-center gap-2 text-sm text-foreground-muted"
            >
              <Trash2 className="w-4 h-4" /> Xóa lịch sử
            </button>
            <button
              type="button"
              onClick={() => {
                if (!settings.confirmClearData || confirm("Xóa yêu thích?")) clearFav();
              }}
              className="flex items-center gap-2 text-sm text-foreground-muted"
            >
              <Trash2 className="w-4 h-4" /> Xóa yêu thích
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Khôi phục cài đặt mặc định?")) {
                  resetSettings();
                  applyDomFlags(defaultSettings);
                }
              }}
              className="text-sm text-red-400 underline"
            >
              Khôi phục mặc định
            </button>
          </div>
        )}

        {section === "more" && (
          <div className="max-h-[70vh] overflow-y-auto rounded-2xl border border-border bg-surface  shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all duration-500">
            {MORE_KEYS.map((f) => (
              <Toggle
                key={f.key}
                label={f.label}
                checked={Boolean((settings as unknown as Record<string, unknown>)[f.key])}
                onChange={(v) => set({ [f.key]: v } as Partial<AppSettings>)}
              />
            ))}
          </div>
        )}

        {section === "legal" && (
          <div className="px-2 py-2 space-y-1 overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
            <Link
              href="/ho-tro"
              className="flex justify-between items-center px-3 py-3.5 rounded-xl hover:bg-surface-elevated text-sm text-foreground"
            >
              Hỗ trợ & FAQ
              <span className="text-foreground-subtle">›</span>
            </Link>
            <Link
              href="/dieu-khoan"
              className="flex justify-between items-center px-3 py-3.5 rounded-xl hover:bg-surface-elevated text-sm text-foreground"
            >
              Điều khoản sử dụng
              <span className="text-foreground-subtle">›</span>
            </Link>
            <Link
              href="/dieu-khoan#bao-mat"
              className="flex justify-between items-center px-3 py-3.5 rounded-xl hover:bg-surface-elevated text-sm text-foreground"
            >
              Chính sách bảo mật
              <span className="text-foreground-subtle">›</span>
            </Link>
            <p className="px-3 pt-2 text-xs text-foreground-subtle leading-relaxed">
              Áp dụng khi bạn tạo và dùng tài khoản trên trang này.
            </p>
          </div>
        )}

        {section === "about" && (
          <div className="px-4 py-6 text-sm text-foreground-muted space-y-2 overflow-hidden rounded-xl border border-border bg-surface ui-border-contrast">
            <p className="text-foreground font-medium text-base">OpusFilm</p>
            <p className="text-xs text-foreground-subtle">Phiên bản web</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-20" />}>
      <SettingsInner />
    </Suspense>
  );
}
