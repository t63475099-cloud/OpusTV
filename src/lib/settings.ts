"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
  avatarPosition?: string;
<<<<<<< HEAD
  /** id khung viền avatar */
  avatarFrame?: string;
=======
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
  /** Tài khoản đã xác thực (tích xanh) */
  verified?: boolean;
  loggedIn: boolean;
}

export type SeekSec = 1 | 5 | 10 | 20 | 30;
export type QualityPref = "auto" | "1080" | "720" | "480";
export type FillMode = "contain" | "cover";
export type CardSize = "s" | "m" | "l";
export type ThemeAccent = "red" | "blue" | "violet" | "emerald";

export interface AppSettings {
  // Playback
  autoPlayNext: boolean;
  autoPlayStart: boolean;
  defaultQuality: QualityPref;
  seekSeconds: SeekSec;
  defaultSpeed: number;
  rememberSpeed: boolean;
  muteOnStart: boolean;
  doubleTapSeek: boolean;
  fillMode: FillMode;
  hideControlsMs: number;
  showQualityBadge: boolean;
  showTimeCode: boolean;
  // Display
  reducedMotion: boolean;
  compactCards: boolean;
  cardSize: CardSize;
  accent: ThemeAccent;
  showContinueRow: boolean;
  showKoreanRow: boolean;
  showHorrorRow: boolean;
  denseHome: boolean;
  blurBanner: boolean;
  // UX
  confirmClearData: boolean;
  hapticFeedback: boolean;
  stickyNav: boolean;
  searchSuggest: boolean;
  voiceSearch: boolean;
  keyboardShortcuts: boolean;
  // Privacy / data
  saveHistory: boolean;
  saveFavorites: boolean;
  anonymousMode: boolean;
  // Accessibility
  largeText: boolean;
  highContrast: boolean;
  reduceTransparency: boolean;
  // Player chrome
  alwaysShowControls: boolean;
  centerPlayButton: boolean;
  bottomProgress: boolean;
  volumeRemember: boolean;
  // Misc
  language: "vi" | "en";
  openInNewTab: boolean;
  prefetchRows: boolean;
  offlineHint: boolean;
  debugOverlay: boolean;
  autoSkipIntro: boolean;
  autoSkipOutro: boolean;
  resumePrompt: boolean;
  showBufferingSpinner: boolean;
  smoothSeek: boolean;
  loopEpisode: boolean;
  pauseOnHide: boolean;
  pauseOnBlur: boolean;
  preloadNextEpisode: boolean;
  showEpisodeTitleOnPause: boolean;
  miniPlayer: boolean;
  cinemaMode: boolean;
  ambientMode: boolean;
  showWatermark: boolean;
  captureFrame: boolean;
  copyLinkButton: boolean;
  shareButton: boolean;
  downloadHint: boolean;
  serverAutoSwitch: boolean;
  preferDubServer: boolean;
  preferSubServer: boolean;
  showServerName: boolean;
  episodeGrid: boolean;
  episodeListCompact: boolean;
  markWatchedEpisode: boolean;
  hideWatchedBadge: boolean;
  relatedSidebar: boolean;
  relatedAutoplay: boolean;
  commentsPlaceholder: boolean;
  liveChatPlaceholder: boolean;
  notifyNewEpisode: boolean;
  dailyPick: boolean;
  trendingBadge: boolean;
  newBadge: boolean;
  hdBadge: boolean;
  ageGate: boolean;
  blurPosterSensitive: boolean;
  reduceDataMode: boolean;
  lowPowerMode: boolean;
  autoQualityWifiOnly: boolean;
  blockCellularHd: boolean;
  showNetworkHint: boolean;
  retryOnError: boolean;
  errorDetail: boolean;
  analyticsLocal: boolean;
  watchTimeStats: boolean;
  favoriteLimit: boolean;
  historyLimit: boolean;
  clearOnLogout: boolean;
  syncProfileLocal: boolean;
  showAvatarNavbar: boolean;
  showSettingsIcon: boolean;
  showSearchIconMobile: boolean;
  categoryChips: boolean;
  bannerAutoplay: boolean;
  bannerDots: boolean;
  rowSeeAll: boolean;
  skeletonLoading: boolean;
  infiniteScrollList: boolean;
  paginationButtons: boolean;
  filterYear: boolean;
  filterCountry: boolean;
  filterType: boolean;
  sortByNew: boolean;
  sortByView: boolean;
  hoverPreview: boolean;
  soundOnHover: boolean;
  focusOutline: boolean;
  screenReaderHints: boolean;
  captionsButton: boolean;
  audioTrackButton: boolean;
  nightModeSchedule: boolean;
  trueBlackOled: boolean;
  roundedCorners: boolean;
  shadowCards: boolean;
  gridGapTight: boolean;
  maxWidthWide: boolean;
  centerContent: boolean;
  footerLinks: boolean;
  brandWatermarkNav: boolean;
  holidayTheme: boolean;
  confettiOnFavorite: boolean;
  toastNotifications: boolean;
  quietToasts: boolean;
  confirmExitFullscreen: boolean;
  lockOrientationFs: boolean;
  keepScreenAwake: boolean;
  batterySaverPause: boolean;
  thermalThrottle: boolean;
  experimentalUi: boolean;
  betaPlayer: boolean;
  legacyPlayer: boolean;
  forceHlsJs: boolean;
  nativeHlsSafari: boolean;
  corsProxyHint: boolean;
  mirrorApi: boolean;
  cacheApiResponses: boolean;
  staleWhileRevalidate: boolean;
  devMockData: boolean;
  logPlayerEvents: boolean;
  showBuildInfo: boolean;
}

interface SettingsState {
  profile: UserProfile;
  settings: AppSettings;
  login: (name: string, email?: string) => void;
  logout: () => void;
  updateProfile: (partial: Partial<UserProfile>) => void;
  setAvatar: (avatar: string, position?: string) => void;
  setAvatarPosition: (pos: string) => void;
  updateSettings: (partial: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const defaultProfile: UserProfile = {
  name: "",
  email: "",
  avatar: undefined,
  avatarPosition: "50% 50%",
<<<<<<< HEAD
  avatarFrame: "frame:none",
=======
>>>>>>> bfc4389b26b054ca295033c265ef42066122495a
  verified: false,
  loggedIn: false,
};

export const defaultSettings: AppSettings = {
  autoPlayNext: true,
  autoPlayStart: true,
  defaultQuality: "auto",
  seekSeconds: 10,
  defaultSpeed: 1,
  rememberSpeed: true,
  muteOnStart: false,
  doubleTapSeek: true,
  fillMode: "cover",
  hideControlsMs: 3200,
  showQualityBadge: true,
  showTimeCode: true,
  reducedMotion: false,
  compactCards: false,
  cardSize: "m",
  accent: "red",
  showContinueRow: true,
  showKoreanRow: true,
  showHorrorRow: true,
  denseHome: false,
  blurBanner: false,
  confirmClearData: true,
  hapticFeedback: true,
  stickyNav: true,
  searchSuggest: true,
  voiceSearch: true,
  keyboardShortcuts: true,
  saveHistory: true,
  saveFavorites: true,
  anonymousMode: false,
  largeText: false,
  highContrast: false,
  reduceTransparency: false,
  alwaysShowControls: false,
  centerPlayButton: true,
  bottomProgress: true,
  volumeRemember: true,
  language: "vi",
  openInNewTab: false,
  prefetchRows: true,
  offlineHint: true,
  debugOverlay: false,
  autoSkipIntro: true,
  autoSkipOutro: false,
  resumePrompt: true,
  showBufferingSpinner: true,
  smoothSeek: true,
  loopEpisode: false,
  pauseOnHide: true,
  pauseOnBlur: false,
  preloadNextEpisode: true,
  showEpisodeTitleOnPause: true,
  miniPlayer: true,
  cinemaMode: false,
  ambientMode: false,
  showWatermark: false,
  captureFrame: true,
  copyLinkButton: true,
  shareButton: true,
  downloadHint: true,
  serverAutoSwitch: true,
  preferDubServer: false,
  preferSubServer: true,
  showServerName: true,
  episodeGrid: true,
  episodeListCompact: false,
  markWatchedEpisode: true,
  hideWatchedBadge: false,
  relatedSidebar: true,
  relatedAutoplay: false,
  commentsPlaceholder: false,
  liveChatPlaceholder: false,
  notifyNewEpisode: false,
  dailyPick: true,
  trendingBadge: true,
  newBadge: true,
  hdBadge: true,
  ageGate: true,
  blurPosterSensitive: false,
  reduceDataMode: false,
  lowPowerMode: false,
  autoQualityWifiOnly: false,
  blockCellularHd: false,
  showNetworkHint: true,
  retryOnError: true,
  errorDetail: false,
  analyticsLocal: false,
  watchTimeStats: true,
  favoriteLimit: false,
  historyLimit: true,
  clearOnLogout: false,
  syncProfileLocal: true,
  showAvatarNavbar: true,
  showSettingsIcon: true,
  showSearchIconMobile: true,
  categoryChips: true,
  bannerAutoplay: true,
  bannerDots: true,
  rowSeeAll: true,
  skeletonLoading: true,
  infiniteScrollList: true,
  paginationButtons: true,
  filterYear: true,
  filterCountry: true,
  filterType: true,
  sortByNew: true,
  sortByView: false,
  hoverPreview: false,
  soundOnHover: false,
  focusOutline: true,
  screenReaderHints: true,
  captionsButton: true,
  audioTrackButton: false,
  nightModeSchedule: false,
  trueBlackOled: true,
  roundedCorners: true,
  shadowCards: false,
  gridGapTight: false,
  maxWidthWide: true,
  centerContent: true,
  footerLinks: true,
  brandWatermarkNav: true,
  holidayTheme: false,
  confettiOnFavorite: false,
  toastNotifications: true,
  quietToasts: false,
  confirmExitFullscreen: false,
  lockOrientationFs: true,
  keepScreenAwake: true,
  batterySaverPause: false,
  thermalThrottle: false,
  experimentalUi: false,
  betaPlayer: false,
  legacyPlayer: false,
  forceHlsJs: true,
  nativeHlsSafari: true,
  corsProxyHint: true,
  mirrorApi: false,
  cacheApiResponses: true,
  staleWhileRevalidate: true,
  devMockData: false,
  logPlayerEvents: false,
  showBuildInfo: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      profile: { ...defaultProfile },
      settings: { ...defaultSettings },
      login: (name, email) => {
        const n = name.trim().slice(0, 40);
        if (!n) return;
        set((s) => ({
          profile: {
            ...s.profile,
            name: n,
            email: email?.trim() || s.profile.email,
            loggedIn: true,
            verified: true,
            avatar: s.profile.avatar || `preset:${(n.charCodeAt(0) % 6) + 1}`,
          },
        }));
      },
      logout: () => set({ profile: { ...defaultProfile } }),
      updateProfile: (partial) =>
        set((s) => ({ profile: { ...s.profile, ...partial } })),
      setAvatar: (avatar, position) =>
        set((s) => ({
          profile: {
            ...s.profile,
            avatar,
            avatarPosition: position || s.profile.avatarPosition || "50% 50%",
          },
        })),
      setAvatarPosition: (pos) =>
        set((s) => ({ profile: { ...s.profile, avatarPosition: pos } })),
      updateSettings: (partial) =>
        set((s) => ({ settings: { ...s.settings, ...partial } })),
      resetSettings: () => set({ settings: { ...defaultSettings } }),
    }),
    { name: "opustv-settings" }
  )
);

/** Kho màu / gradient avatar có sẵn */
export const AVATAR_PRESETS = [
  { id: "preset:1", label: "Hồng đỏ", gradient: "from-red-500 to-rose-700" },
  { id: "preset:2", label: "Tím", gradient: "from-violet-500 to-purple-800" },
  { id: "preset:3", label: "Xanh biển", gradient: "from-cyan-400 to-blue-700" },
  { id: "preset:4", label: "Cam", gradient: "from-amber-400 to-orange-700" },
  { id: "preset:5", label: "Ngọc", gradient: "from-emerald-400 to-teal-800" },
  { id: "preset:6", label: "Hồng", gradient: "from-pink-400 to-fuchsia-800" },
  { id: "preset:7", label: "Vàng", gradient: "from-yellow-300 to-amber-600" },
  { id: "preset:8", label: "Xanh lá", gradient: "from-lime-400 to-green-700" },
  { id: "preset:9", label: "Indigo", gradient: "from-indigo-400 to-indigo-900" },
  { id: "preset:10", label: "Sky", gradient: "from-sky-300 to-sky-700" },
  { id: "preset:11", label: "Sunset", gradient: "from-orange-400 via-rose-500 to-purple-700" },
  { id: "preset:12", label: "Neon", gradient: "from-fuchsia-500 via-purple-500 to-cyan-400" },
  { id: "preset:13", label: "Midnight", gradient: "from-slate-600 to-slate-950" },
  { id: "preset:14", label: "Coral", gradient: "from-rose-300 to-red-600" },
  { id: "preset:15", label: "Mint", gradient: "from-teal-200 to-emerald-600" },
  { id: "preset:16", label: "Gold", gradient: "from-amber-200 via-yellow-400 to-orange-600" },
];

/** Kho khung viền avatar kiểu game (overlay SVG /frames/*.svg) */
export const AVATAR_FRAMES: { id: string; label: string; src: string | null }[] = [
  { id: "frame:none", label: "Không", src: null },
  { id: "frame:top1", label: "TOP1 Vàng", src: "/frames/top1.svg" },
  { id: "frame:top2", label: "TOP2 Xanh", src: "/frames/top2.svg" },
  { id: "frame:top3", label: "TOP3 Đỏ", src: "/frames/top3.svg" },
  { id: "frame:ice", label: "Băng tinh", src: "/frames/ice.svg" },
  { id: "frame:darklord", label: "Ma vương", src: "/frames/darklord.svg" },
  { id: "frame:knight", label: "Bạch kỵ sĩ", src: "/frames/knight.svg" },
  { id: "frame:dragon", label: "Long hoàng", src: "/frames/dragon.svg" },
  { id: "frame:myth", label: "Thần thoại", src: "/frames/myth.svg" },
  { id: "frame:jade", label: "Ngọc bích", src: "/frames/jade.svg" },
  { id: "frame:flame", label: "Hỏa diệm", src: "/frames/flame.svg" },
  { id: "frame:void", label: "Hư không", src: "/frames/void.svg" },
];

export function isPresetAvatar(avatar?: string) {
  return !!avatar?.startsWith("preset:");
}

export function presetGradient(avatar?: string) {
  const p = AVATAR_PRESETS.find((x) => x.id === avatar);
  return p?.gradient || AVATAR_PRESETS[0].gradient;
}

export function getAvatarFrame(frameId?: string) {
  return AVATAR_FRAMES.find((f) => f.id === frameId) || AVATAR_FRAMES[0];
}
