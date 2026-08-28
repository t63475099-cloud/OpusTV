"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  useSettingsStore,
  AVATAR_PRESETS,
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
  | "avatar"
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
    avatar: "Avatar",
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
            <RowLink
              icon={<User className="w-5 h-5" />}
              label="Tài khoản"
              desc={profile.loggedIn ? profile.name : "Đăng nhập & đồng bộ đa thiết bị"}
              onClick={() => go("account")}
            />
            <RowLink
              icon={<Camera className="w-5 h-5" />}
              label="Avatar"
              desc="Ảnh đại diện & căn chỉnh"
              onClick={() => go("avatar")}
            />

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
          <>

            <Link
              href="/tai-khoan"
              className="mx-4 mb-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-red-600/20 via-rose-600/10 to-orange-500/10 px-4 py-3.5 text-sm text-white backdrop-blur-md hover:border-red-500/40 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>
                <span className="font-semibold block">Đăng nhập / Đăng ký (Neon)</span>
                <span className="text-xs text-zinc-400">Đồng bộ Android · iPhone · PC · không mất dữ liệu</span>
              </span>
              <span className="text-red-400 text-xs font-medium shrink-0">Mở →</span>
            </Link>

          <div className="px-4 py-4 space-y-4">
            {profile.loggedIn ? (
              <>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#212121]">
                  <UserAvatar profile={profile} size={52} ring />
                  <div className="min-w-0">
                    <p className="text-white font-medium truncate">{profile.name}</p>
                    {profile.email && (
                      <p className="text-sm text-[#aaa] truncate">{profile.email}</p>
                    )}
                  </div>
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#212121] rounded-xl px-4 py-3 text-white text-sm outline-none border border-transparent focus:border-[#3ea6ff]"
                  placeholder="Tên hiển thị"
                />
                <button
                  type="button"
                  onClick={() => updateProfile({ name: name.trim().slice(0, 40) })}
                  className="px-4 py-2 rounded-full bg-[#272727] text-sm text-white"
                >
                  Lưu tên
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-2 text-red-400 text-sm"
                >
                  <LogOut className="w-4 h-4" /> Đăng xuất
                </button>
              </>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  login(name, email);
                }}
                className="space-y-3"
              >
                <p className="text-sm text-[#aaa]">Tên hiển thị local trên máy này (không đồng bộ cloud).</p>
                <Link
                  href="/tai-khoan"
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-red-600 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-red-600/30 hover:brightness-110 transition duration-300"
                >
                  Đăng nhập / Đăng ký tài khoản thật
                </Link>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tên *"
                  required
                  className="w-full bg-[#212121] rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (tuỳ chọn)"
                  className="w-full bg-[#212121] rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Đăng nhập nhanh
                </button>
              </form>
            )}
          </div>
          </>
        )}

        {section === "avatar" && (
          <div className="px-4 py-4 space-y-4">
            {!profile.loggedIn ? (
              <p className="text-sm text-[#aaa]">Đăng nhập để chỉnh avatar.</p>
            ) : (
              <>
                <div className="flex justify-center">
                  <UserAvatar profile={profile} size={96} ring />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="px-4 py-2 rounded-full bg-white text-black text-sm font-medium"
                  >
                    Tải ảnh
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarPosition("50% 35%")}
                    className="px-4 py-2 rounded-full bg-[#272727] text-white text-sm inline-flex items-center gap-1"
                  >
                    <Crosshair className="w-3.5 h-3.5" /> Tự căn
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file || !file.type.startsWith("image/")) return;
                    if (file.size > 2 * 1024 * 1024) {
                      alert("Ảnh tối đa 2MB");
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => setAvatar(reader.result as string, "50% 50%");
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }} />
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  {AVATAR_PRESETS.map((pr) => (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => setAvatar(pr.id)}
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${pr.gradient} ring-2 ${
                        profile.avatar === pr.id ? "ring-white" : "ring-transparent"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {section === "playback" && (
          <>
            <Toggle label="Tự phát tập tiếp theo" checked={settings.autoPlayNext} onChange={(v) => set({ autoPlayNext: v })} />
            <Toggle label="Tự phát khi mở tập" checked={settings.autoPlayStart} onChange={(v) => set({ autoPlayStart: v })} />
            <Toggle label="Chạm đôi để tua" checked={settings.doubleTapSeek !== false} onChange={(v) => set({ doubleTapSeek: v })} />
            <ChipGroup
              label="Thời gian tua"
              value={settings.seekSeconds ?? 10}
              options={[1, 5, 10, 20, 30].map((n) => ({ value: n as 1|5|10|20|30, label: `${n}s` }))}
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
          </>
        )}

        {section === "player" && (
          <>
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
