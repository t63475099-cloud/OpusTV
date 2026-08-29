"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
  avatarPosition?: string;
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

export const AVATAR_PRESETS = [
  { id: "preset:1", gradient: "from-red-500 to-rose-700" },
  { id: "preset:2", gradient: "from-violet-500 to-purple-800" },
  { id: "preset:3", gradient: "from-cyan-400 to-blue-700" },
  { id: "preset:4", gradient: "from-amber-400 to-orange-700" },
  { id: "preset:5", gradient: "from-emerald-400 to-teal-800" },
  { id: "preset:6", gradient: "from-pink-400 to-fuchsia-800" },
];

export function isPresetAvatar(avatar?: string) {
  return !!avatar?.startsWith("preset:");
}

export function presetGradient(avatar?: string) {
  const p = AVATAR_PRESETS.find((x) => x.id === avatar);
  return p?.gradient || AVATAR_PRESETS[0].gradient;
}
