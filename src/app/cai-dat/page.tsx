"use client";

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
  | "about";

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
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition text-left border-b border-[#272727]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-white">{label}</p>
        {desc && <p className="text-xs text-[#aaa] mt-0.5 leading-snug">{desc}</p>}
      </div>
      <div
        className={`w-11 h-6 rounded-full relative shrink-0 transition ${
          checked ? "bg-blue-500" : "bg-[#3f3f3f]"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
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
      className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-white/5 transition text-left border-b border-[#272727]"
    >
      <span className="text-[#f1f1f1] shrink-0 w-6 flex justify-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] text-white">{label}</p>
        {desc && <p className="text-xs text-[#aaa] mt-0.5">{desc}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-[#717171] shrink-0" />
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
    <div className="px-4 py-3 border-b border-[#272727]">
      <p className="text-sm text-[#aaa] mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-full text-sm transition ${
              value === o.value
                ? "bg-white text-black font-medium"
                : "bg-[#272727] text-white"
            }`}
          >
            {o.label}
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

  const set = updateSettings;

  if (!mounted) {
    return <div className="min-h-screen pt-[7.25rem] lg:pt-20" />;
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
  };

  return (
    <div className="min-h-screen pt-[6.5rem] lg:pt-16 pb-24 max-w-xl mx-auto animate-fade-up">
      {/* Header như YouTube */}
      <div className="sticky top-14 lg:top-16 z-30 flex items-center gap-3 px-3 py-3 glass-nav border-b border-white/10">
        {section !== "root" ? (
          <button
            type="button"
            onClick={() => go("root")}
            className="p-2 -ml-1 rounded-full hover:bg-white/10 text-white"
            aria-label="Quay lại"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        ) : (
          <Link href="/" className="p-2 -ml-1 rounded-full hover:bg-white/10 text-white" aria-label="Home">
            <ChevronLeft className="w-6 h-6" />
          </Link>
        )}
        <h1 className="text-xl font-semibold text-white">{titleMap[section]}</h1>
      </div>

      <div className="bg-[#0f0f0f]">
        {section === "root" && (
          <>
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-[#aaa] uppercase tracking-wide">
              Tài khoản
            </p>
            <Link
              href="/tai-khoan"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition border-b border-white/5"
            >
              <span className="text-zinc-400"><User className="w-5 h-5" /></span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm text-white">Tài khoản</span>
                <span className="block text-xs text-[#aaa] truncate">
                  {profile.loggedIn ? profile.name : "Đăng nhập"}
                </span>
              </span>
              <span className="text-zinc-500 text-sm">→</span>
            </Link>

            <p className="px-4 pt-5 pb-2 text-xs font-semibold text-[#aaa] uppercase tracking-wide">
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

            <p className="px-4 pt-5 pb-2 text-xs font-semibold text-[#aaa] uppercase tracking-wide">
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
              icon={<Info className="w-5 h-5" />}
              label="Giới thiệu OpusTV"
              onClick={() => go("about")}
            />
          </>
        )}

        {section === "account" && (
          <div className="px-4 py-6">
            <Link
              href="/tai-khoan"
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-red-600/25 via-rose-600/15 to-transparent px-4 py-4 text-white transition hover:border-red-500/40 active:scale-[0.99]"
            >
              <span className="font-semibold">
                {profile.loggedIn ? "Hồ sơ của bạn" : "Đăng nhập / Đăng ký"}
              </span>
              <span className="text-sm text-red-300">Mở →</span>
            </Link>
          </div>
        )}

        {section === "player" && (
          <>
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
          </>
        )}

        {section === "display" && (
          <>
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
          </>
        )}

        {section === "home" && (
          <>
            <Toggle label="Hàng Tiếp tục xem" checked={settings.showContinueRow !== false} onChange={(v) => set({ showContinueRow: v })} />
            <Toggle label="Hàng Phim Hàn" checked={settings.showKoreanRow !== false} onChange={(v) => set({ showKoreanRow: v })} />
            <Toggle label="Hàng Kinh dị" checked={settings.showHorrorRow !== false} onChange={(v) => set({ showHorrorRow: v })} />
          </>
        )}

        {section === "language" && (
          <ChipGroup
            label="Ngôn ngữ giao diện"
            value={settings.language || "vi"}
            options={[
              { value: "vi" as const, label: "Tiếng Việt" },
              { value: "en" as const, label: "English" },
            ]}
            onChange={(v) => set({ language: v })}
          />
        )}

        {section === "notify" && (
          <>
            <Toggle label="Thông báo toast" checked={settings.toastNotifications !== false} onChange={(v) => set({ toastNotifications: v })} />
            <Toggle label="Ít thông báo hơn" checked={!!settings.quietToasts} onChange={(v) => set({ quietToasts: v })} />
          </>
        )}

        {section === "ux" && (
          <>
            <Toggle label="Gợi ý tìm kiếm" checked={settings.searchSuggest !== false} onChange={(v) => set({ searchSuggest: v })} />
            <Toggle label="Tìm bằng giọng nói" checked={settings.voiceSearch !== false} onChange={(v) => set({ voiceSearch: v })} />
            <Toggle label="Phím tắt bàn phím (PC)" checked={settings.keyboardShortcuts !== false} onChange={(v) => set({ keyboardShortcuts: v })} />
          </>
        )}

        {section === "privacy" && (
          <>
            <Toggle label="Lưu lịch sử xem" checked={settings.saveHistory !== false} onChange={(v) => set({ saveHistory: v })} />
            <Toggle label="Lưu yêu thích" checked={settings.saveFavorites !== false} onChange={(v) => set({ saveFavorites: v })} />
            <Toggle label="Ẩn danh (không ghi lịch sử mới)" checked={!!settings.anonymousMode} onChange={(v) => set({ anonymousMode: v })} />
          </>
        )}

        {section === "a11y" && (
          <>
            <Toggle label="Chữ lớn hơn" checked={!!settings.largeText} onChange={(v) => set({ largeText: v })} />
            <Toggle label="Tăng tương phản" checked={!!settings.highContrast} onChange={(v) => set({ highContrast: v })} />
            <Toggle label="Giảm chuyển động" checked={!!settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
          </>
        )}

        {section === "data" && (
          <div className="px-4 py-4 space-y-3">
            <Link href="/lich-su" className="flex justify-between py-3 border-b border-[#272727] text-white text-sm">
              Lịch sử xem <span className="text-[#aaa]">{historyLen}</span>
            </Link>
            <Link href="/yeu-thich" className="flex justify-between py-3 border-b border-[#272727] text-white text-sm">
              Yêu thích <span className="text-[#aaa]">{favLen}</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (!settings.confirmClearData || confirm("Xóa lịch sử?")) clearHistory();
              }}
              className="flex items-center gap-2 text-sm text-[#aaa]"
            >
              <Trash2 className="w-4 h-4" /> Xóa lịch sử
            </button>
            <button
              type="button"
              onClick={() => {
                if (!settings.confirmClearData || confirm("Xóa yêu thích?")) clearFav();
              }}
              className="flex items-center gap-2 text-sm text-[#aaa]"
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
          <div className="max-h-[70vh] overflow-y-auto">
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

        {section === "about" && (
          <div className="px-4 py-6 text-sm text-[#aaa] space-y-2">
            <p className="text-white font-medium text-base">OpusTV</p>
            <p>Xem phim · Opus Music · Cài đặt cá nhân trên thiết bị.</p>
            <p className="text-xs">Dữ liệu (lịch sử, yêu thích, profile) lưu local trên máy bạn.</p>
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
