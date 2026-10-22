"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Palette,
  Play,
  Settings2,
  Bell,
  HelpCircle,
  LogIn,
  LogOut,
  KeyRound,
  Globe,
  Trash2,
  ChevronRight,
} from "lucide-react";
import OfflineDownloads from "@/components/OfflineDownloads";
import { VipCountdownCard } from "@/components/vip/VipCountdownCard";
import UserAvatar from "@/components/UserAvatar";
import {
  THEME_OPTIONS,
  applyTheme,
  applyLocale,
  readTheme,
  type ThemeMode,
  type LocaleCode,
} from "@/lib/themeLocale";
import { useI18n, setAppLanguage } from "@/hooks/useI18n";
import { LOCALE_LIST } from "@/lib/i18n/types";
import {
  useSettingsStore,
  type AppSettings,
} from "@/lib/settings";
import { useAccountStore } from "@/lib/account";
import { useHistoryStore } from "@/lib/history";
import { useFavoritesStore } from "@/lib/favorites";
import { cn } from "@/lib/utils";

type TabId =
  | "account"
  | "appearance"
  | "playback"
  | "general"
  | "notify"
  | "support";

const TABS: { id: TabId; label: string; icon: typeof User }[] = [
  { id: "account", label: "Tài khoản", icon: User },
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "playback", label: "Phát & Giao diện", icon: Play },
  { id: "general", label: "Cài đặt chung", icon: Settings2 },
  { id: "notify", label: "Thông báo", icon: Bell },
  { id: "support", label: "Hỗ trợ", icon: HelpCircle },
];

function applyDomFlags(s: AppSettings) {
  if (typeof document === "undefined") return;
  const h = document.documentElement;
  h.classList.toggle("reduce-motion", !!s.reducedMotion);
  h.classList.toggle("yt-dense", !!s.denseHome);
  h.classList.toggle("yt-large-text", !!s.largeText);
  h.classList.toggle("yt-high-contrast", !!s.highContrast);
  h.classList.toggle("yt-reduce-transparency", !!s.reduceTransparency);
  if (s.accent) h.dataset.accent = s.accent;
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
    <div className="flex items-center gap-3 px-1 py-3.5 border-b border-white/5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{label}</p>
        {desc ? (
          <p className="mt-0.5 text-xs text-foreground-muted">{desc}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors duration-200",
          checked ? "bg-indigo-500" : "bg-zinc-600/80"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

function SegmentedTheme() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  useEffect(() => {
    setMode(readTheme());
  }, []);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Giao diện</p>
      <p className="text-xs text-foreground-muted">Áp dụng toàn website</p>
      <div
        className="flex rounded-xl border border-white/10 bg-[#0e0f14] p-1"
        role="group"
        aria-label="Chọn giao diện"
      >
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setMode(o.value);
              applyTheme(o.value);
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              mode === o.value
                ? "bg-indigo-600 text-white shadow"
                : "text-foreground-muted hover:text-foreground"
            )}
          >
            {o.labelVi}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="animate-in fade-in duration-300">
      <h2 className="mb-4 text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="rounded-3xl border border-white/5 bg-[#13141C] p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function SettingsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabId | null;
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<TabId>("account");

  const profile = useSettingsStore((s) => s.profile);
  const settings = useSettingsStore((s) => s.settings);
  const logoutSettings = useSettingsStore((s) => s.logout);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetSettings = useSettingsStore((s) => s.resetSettings);
  const clearHistory = useHistoryStore((s) => s.clear);
  const clearFav = useFavoritesStore((s) => s.clear);
  const historyLen = useHistoryStore((s) => s.history.length);
  const favLen = useFavoritesStore((s) => s.favorites.length);
  const accountUser = useAccountStore((s) => s.username);
  const accountLogout = useAccountStore((s) => s.logout);
  const { t, locale } = useI18n();

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (
      tabParam &&
      TABS.some((x) => x.id === tabParam)
    ) {
      setTab(tabParam);
    }
  }, [tabParam]);
  useEffect(() => {
    if (mounted) applyDomFlags(settings);
  }, [mounted, settings]);

  const go = useCallback(
    (id: TabId) => {
      setTab(id);
      router.replace(`/cai-dat?tab=${id}`, { scroll: false });
    },
    [router]
  );

  const set = useCallback(
    (partial: Partial<AppSettings>) => {
      updateSettings(partial);
      const next = { ...useSettingsStore.getState().settings, ...partial };
      applyDomFlags(next);
      if (partial.language) {
        setAppLanguage(partial.language as LocaleCode);
        applyLocale(partial.language as LocaleCode);
      }
    },
    [updateSettings]
  );

  const displayName = useMemo(() => {
    if (profile.name?.trim()) return profile.name.trim();
    if (accountUser) return accountUser;
    return "Khách";
  }, [profile.name, accountUser]);

  const uid = useMemo(() => {
    const u = (profile as { uid?: string }).uid || "";
    return u || "—";
  }, [profile]);

  const onLogout = () => {
    try {
      logoutSettings();
    } catch {
      /* */
    }
    try {
      accountLogout?.();
    } catch {
      /* */
    }
    router.push("/tai-khoan");
  };

  if (!mounted) {
    return (
      <div className="min-h-[60vh] bg-background pt-[max(1rem,env(safe-area-inset-top,0px))]" />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-foreground pb-24 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
      <div className="mx-auto flex max-w-5xl gap-0 px-3 sm:px-4 md:gap-6 md:px-6">
        {/* Sidebar */}
        <aside className="hidden w-[280px] shrink-0 md:block">
          <div className="sticky top-20 space-y-1 rounded-3xl border border-white/5 bg-[#13141C] p-3">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-foreground-muted">
              Cài đặt
            </p>
            {TABS.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors",
                    active
                      ? "bg-indigo-600/15 text-indigo-300"
                      : "text-foreground-muted hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Mobile tab strip */}
        <div className="mb-3 flex w-full gap-1 overflow-x-auto pb-1 md:hidden">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold",
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-[#13141C] text-foreground-muted border border-white/5"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <main className="min-w-0 flex-1 space-y-4 pb-8">
          {tab === "account" && (
            <Panel title="Tài khoản">
              <div className="space-y-4">
                <VipCountdownCard
                  onActivate={() => router.push("/mua-key")}
                />

                <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0e0f14] p-4">
                  <UserAvatar size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{displayName}</p>
                    <p className="font-mono text-xs text-foreground-muted">
                      UID: {uid}
                    </p>
                    {accountUser ? (
                      <p className="text-xs text-foreground-muted">@{accountUser}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/tai-khoan"
                    className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" strokeWidth={1.75} />
                      {profile.loggedIn || accountUser
                        ? "Hồ sơ / Đăng nhập"
                        : "Đăng nhập / Đăng ký"}
                    </span>
                    <ChevronRight className="h-4 w-4 text-foreground-muted" />
                  </Link>
                  <Link
                    href="/mua-key"
                    className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4" strokeWidth={1.75} />
                      Mua Key
                    </span>
                    <ChevronRight className="h-4 w-4 text-foreground-muted" />
                  </Link>
                  {(profile.loggedIn || accountUser) && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-3 text-sm text-rose-400 hover:bg-rose-500/10"
                    >
                      <LogOut className="h-4 w-4" strokeWidth={1.75} />
                      Đăng xuất
                    </button>
                  )}
                </div>
              </div>
            </Panel>
          )}

          {tab === "appearance" && (
            <Panel title="Giao diện">
              <div className="space-y-6">
                <SegmentedTheme />
                <div>
                  <p className="mb-2 text-sm font-medium text-foreground">Ngôn ngữ</p>
                  <div className="flex flex-wrap gap-2">
                    {LOCALE_LIST.map((loc) => (
                      <button
                        key={loc.value}
                        type="button"
                        onClick={() => {
                          set({ language: loc.value as LocaleCode });
                          setAppLanguage(loc.value as LocaleCode);
                          applyLocale(loc.value as LocaleCode);
                        }}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs font-medium",
                          locale === loc.value
                            ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                            : "border-white/10 text-foreground-muted hover:bg-white/5"
                        )}
                      >
                        {loc.label}
                      </button>
                    ))}
                  </div>
                </div>
                <Toggle
                  label="Chữ lớn"
                  checked={!!settings.largeText}
                  onChange={(v) => set({ largeText: v })}
                />
                <Toggle
                  label="Tương phản cao"
                  checked={!!settings.highContrast}
                  onChange={(v) => set({ highContrast: v })}
                />
                <Toggle
                  label="Giảm chuyển động"
                  checked={!!settings.reducedMotion}
                  onChange={(v) => set({ reducedMotion: v })}
                />
                <Toggle
                  label="Nền đen OLED"
                  checked={!!settings.trueBlackOled}
                  onChange={(v) => set({ trueBlackOled: v })}
                />
              </div>
            </Panel>
          )}

          {tab === "playback" && (
            <Panel title="Phát & Giao diện">
              <Toggle
                label="Tự phát khi mở tập"
                checked={settings.autoPlayStart !== false}
                onChange={(v) => set({ autoPlayStart: v })}
              />
              <Toggle
                label="Tự chuyển tập tiếp theo"
                checked={settings.autoPlayNext !== false}
                onChange={(v) => set({ autoPlayNext: v })}
              />
              <Toggle
                label="Chạm đôi để tua"
                checked={settings.doubleTapSeek !== false}
                onChange={(v) => set({ doubleTapSeek: v })}
              />
              <Toggle
                label="Tắt tiếng lúc bắt đầu"
                checked={!!settings.muteOnStart}
                onChange={(v) => set({ muteOnStart: v })}
              />
              <Toggle
                label="Nhớ tốc độ phát"
                checked={settings.rememberSpeed !== false}
                onChange={(v) => set({ rememberSpeed: v })}
              />
              <Toggle
                label="Tự bỏ qua intro"
                checked={!!settings.autoSkipIntro}
                onChange={(v) => set({ autoSkipIntro: v })}
              />
              <Toggle
                label="Tạm dừng khi chuyển tab"
                checked={!!settings.pauseOnHide}
                onChange={(v) => set({ pauseOnHide: v })}
              />
              <div className="mt-3 space-y-1">
                <p className="text-xs text-foreground-muted">Thời gian tua (giây)</p>
                <div className="flex flex-wrap gap-2">
                  {([5, 10, 20, 30] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set({ seekSeconds: n })}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs font-medium",
                        (settings.seekSeconds ?? 10) === n
                          ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                          : "border-white/10 text-foreground-muted"
                      )}
                    >
                      {n}s
                    </button>
                  ))}
                </div>
              </div>
            </Panel>
          )}

          {tab === "general" && (
            <Panel title="Cài đặt chung">
              <Toggle
                label="Hàng Tiếp tục xem"
                checked={settings.showContinueRow !== false}
                onChange={(v) => set({ showContinueRow: v })}
              />
              <Toggle
                label="Lưu lịch sử xem"
                checked={settings.saveHistory !== false}
                onChange={(v) => set({ saveHistory: v })}
              />
              <Toggle
                label="Lưu yêu thích"
                checked={settings.saveFavorites !== false}
                onChange={(v) => set({ saveFavorites: v })}
              />
              <Toggle
                label="Gợi ý tìm kiếm"
                checked={settings.searchSuggest !== false}
                onChange={(v) => set({ searchSuggest: v })}
              />
              <Toggle
                label="Bo góc thẻ phim"
                checked={settings.roundedCorners !== false}
                onChange={(v) => set({ roundedCorners: v })}
              />
              <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
                <p className="text-xs text-foreground-muted">
                  Lịch sử: {historyLen} · Yêu thích: {favLen}
                </p>
                <button
                  type="button"
                  onClick={() => clearHistory()}
                  className="flex items-center gap-2 text-sm text-rose-400 hover:underline"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  Xóa lịch sử xem
                </button>
                <button
                  type="button"
                  onClick={() => clearFav()}
                  className="flex items-center gap-2 text-sm text-rose-400 hover:underline"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  Xóa yêu thích
                </button>
                <button
                  type="button"
                  onClick={() => resetSettings()}
                  className="flex items-center gap-2 text-sm text-foreground-muted hover:underline"
                >
                  Đặt lại cài đặt mặc định
                </button>
              </div>
              <div className="mt-4 border-t border-white/5 pt-4">
                <OfflineDownloads />
              </div>
            </Panel>
          )}

          {tab === "notify" && (
            <Panel title="Thông báo">
              <Toggle
                label="Thông báo toast"
                desc="Hiện thông báo nhỏ góc màn hình"
                checked={settings.toastNotifications !== false}
                onChange={(v) => set({ toastNotifications: v })}
              />
              <Toggle
                label="Ít thông báo hơn"
                checked={!!settings.quietToasts}
                onChange={(v) => set({ quietToasts: v })}
              />
              <Toggle
                label="Chế độ ẩn danh"
                desc="Hạn chế lưu hành vi xem"
                checked={!!settings.anonymousMode}
                onChange={(v) => set({ anonymousMode: v })}
              />
            </Panel>
          )}

          {tab === "support" && (
            <Panel title="Hỗ trợ">
              <div className="space-y-1">
                <Link
                  href="/dieu-khoan"
                  className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                >
                  Điều khoản sử dụng
                  <ChevronRight className="h-4 w-4 text-foreground-muted" />
                </Link>
                <Link
                  href="/chinh-sach"
                  className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                >
                  Chính sách bảo mật
                  <ChevronRight className="h-4 w-4 text-foreground-muted" />
                </Link>
                <div className="px-2 py-3 text-xs text-foreground-muted">
                  <p className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5" strokeWidth={1.75} />
                    OpusFilm · {t("settings.title")}
                  </p>
                </div>
              </div>
            </Panel>
          )}
        </main>
      </div>
    </div>
  );
}

export default function CaiDatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] bg-background pt-8 text-center text-sm text-foreground-muted">
          Đang tải…
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}
