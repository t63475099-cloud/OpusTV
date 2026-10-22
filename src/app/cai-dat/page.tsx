"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useSettingsStore, type AppSettings } from "@/lib/settings";
import { useAccountStore } from "@/lib/account";
import { useHistoryStore } from "@/lib/history";
import { useFavoritesStore } from "@/lib/favorites";

type TabId =
  | "account"
  | "appearance"
  | "playback"
  | "general"
  | "notify"
  | "support";

const TABS: { id: TabId; label: string }[] = [
  { id: "account", label: "Tài khoản" },
  { id: "appearance", label: "Giao diện" },
  { id: "playback", label: "Phát & Giao diện" },
  { id: "general", label: "Cài đặt chung" },
  { id: "notify", label: "Thông báo" },
  { id: "support", label: "Hỗ trợ" },
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
    <div className="flex items-center gap-3 border-b border-white/5 py-3.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-zinc-100">{label}</p>
        {desc ? <p className="mt-0.5 text-xs text-zinc-400">{desc}</p> : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={
          "relative h-7 w-12 shrink-0 rounded-full transition-colors " +
          (checked ? "bg-indigo-500" : "bg-zinc-600")
        }
      >
        <span
          className={
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </button>
    </div>
  );
}

function SegmentedTheme() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setMode(readTheme());
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="h-12 rounded-xl border border-white/10 bg-[#0e0f14]" aria-hidden />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-zinc-100">Giao diện</p>
      <p className="text-xs text-zinc-400">Áp dụng toàn website</p>
      <div className="flex rounded-xl border border-white/10 bg-[#0e0f14] p-1" role="group">
        {THEME_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => {
              setMode(o.value);
              applyTheme(o.value);
            }}
            className={
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors " +
              (mode === o.value
                ? "bg-indigo-600 text-white"
                : "text-zinc-400 hover:text-zinc-200")
            }
          >
            {o.labelVi}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-zinc-50">{title}</h2>
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
  const { locale } = useI18n();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (tabParam && TABS.some((x) => x.id === tabParam)) {
      setTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (!mounted) return;
    applyDomFlags(settings);
  }, [
    mounted,
    settings.reducedMotion,
    settings.denseHome,
    settings.largeText,
    settings.highContrast,
    settings.reduceTransparency,
    settings.accent,
  ]);

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

  const uid = profile.uid?.trim() || "—";

  const onLogout = () => {
    try {
      logoutSettings();
    } catch {
      /* */
    }
    try {
      void accountLogout?.();
    } catch {
      /* */
    }
    router.push("/tai-khoan");
  };

  if (!mounted) {
    return (
      <div className="min-h-[60vh] bg-[#0a0a0f] pt-8 text-center text-sm text-zinc-500">
        Đang tải cài đặt…
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0f] pb-24 pt-4 text-zinc-100">
      <div className="mx-auto flex max-w-5xl gap-0 px-3 sm:px-4 md:gap-6 md:px-6">
        <aside className="hidden w-[280px] shrink-0 md:block">
          <div className="sticky top-20 space-y-1 rounded-3xl border border-white/5 bg-[#13141C] p-3">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Cài đặt
            </p>
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className={
                    "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium " +
                    (active
                      ? "bg-indigo-600/15 text-indigo-300"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100")
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </aside>

        <div className="mb-3 flex w-full gap-1 overflow-x-auto pb-1 md:hidden">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => go(item.id)}
                className={
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold " +
                  (active
                    ? "bg-indigo-600 text-white"
                    : "border border-white/5 bg-[#13141C] text-zinc-400")
                }
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <main className="min-w-0 flex-1 space-y-4 pb-8">
          {tab === "account" && (
            <Panel title="Tài khoản">
              <div className="space-y-4">
                <VipCountdownCard onActivate={() => router.push("/mua-key")} />

                <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-[#0e0f14] p-4">
                  <UserAvatar size={56} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold">{displayName}</p>
                    <p className="font-mono text-xs text-zinc-400">UID: {uid}</p>
                    {accountUser ? (
                      <p className="text-xs text-zinc-500">@{accountUser}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1">
                  <Link
                    href="/tai-khoan"
                    className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                  >
                    <span>
                      {profile.loggedIn || accountUser
                        ? "Hồ sơ / Đăng nhập"
                        : "Đăng nhập / Đăng ký"}
                    </span>
                    <span className="text-zinc-500">→</span>
                  </Link>
                  <Link
                    href="/mua-key"
                    className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                  >
                    <span>Mua Key</span>
                    <span className="text-zinc-500">→</span>
                  </Link>
                  {(profile.loggedIn || accountUser) && (
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full rounded-xl px-2 py-3 text-left text-sm text-rose-400 hover:bg-rose-500/10"
                    >
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
                  <p className="mb-2 text-sm font-medium text-zinc-100">Ngôn ngữ</p>
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
                        className={
                          "rounded-lg border px-3 py-1.5 text-xs font-medium " +
                          (locale === loc.value
                            ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                            : "border-white/10 text-zinc-400 hover:bg-white/5")
                        }
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
                <p className="text-xs text-zinc-400">Thời gian tua (giây)</p>
                <div className="flex flex-wrap gap-2">
                  {([5, 10, 20, 30] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set({ seekSeconds: n })}
                      className={
                        "rounded-lg border px-3 py-1.5 text-xs font-medium " +
                        ((settings.seekSeconds ?? 10) === n
                          ? "border-indigo-500 bg-indigo-600/20 text-indigo-300"
                          : "border-white/10 text-zinc-400")
                      }
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
                <p className="text-xs text-zinc-500">
                  Lịch sử: {historyLen} · Yêu thích: {favLen}
                </p>
                <button
                  type="button"
                  onClick={() => clearHistory()}
                  className="block text-sm text-rose-400 hover:underline"
                >
                  Xóa lịch sử xem
                </button>
                <button
                  type="button"
                  onClick={() => clearFav()}
                  className="block text-sm text-rose-400 hover:underline"
                >
                  Xóa yêu thích
                </button>
                <button
                  type="button"
                  onClick={() => resetSettings()}
                  className="block text-sm text-zinc-400 hover:underline"
                >
                  Đặt lại cài đặt mặc định
                </button>
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
                  <span className="text-zinc-500">→</span>
                </Link>
                <Link
                  href="/chinh-sach"
                  className="flex items-center justify-between rounded-xl px-2 py-3 text-sm hover:bg-white/5"
                >
                  Chính sách bảo mật
                  <span className="text-zinc-500">→</span>
                </Link>
                <p className="px-2 py-3 text-xs text-zinc-500">OpusFilm · Cài đặt</p>
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
        <div className="min-h-[60vh] bg-[#0a0a0f] pt-8 text-center text-sm text-zinc-500">
          Đang tải…
        </div>
      }
    >
      <SettingsInner />
    </Suspense>
  );
}
