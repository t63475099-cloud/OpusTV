"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  email?: string;
  avatar?: string;
  avatarPosition?: string;
  /** id khung viền avatar */
  avatarFrame?: string;
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
  avatarFrame: "frame:none",
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

/** Kho avatar tướng Liên Quân Mobile (ảnh chính thức Garena) */
export const AVATAR_PRESETS: { id: string; label: string; url: string }[] = [
  { id: "lq:airi", label: "Airi", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/04999ff87145b9005694ffd78e1530a660017059a8fc11.jpg" },
  { id: "lq:aleister", label: "Aleister", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/15600.jpg" },
  { id: "lq:alice", label: "Alice", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b9dd8e24c0fbad107475f6e31f5e36365847d373da15b1.png" },
  { id: "lq:allain", label: "Allain", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3aa1f0f335f87801117dbfa1d69b072b5ef1f1c297fe21.jpg" },
  { id: "lq:amily", label: "Amily", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/65b8d8e674af00ee4ecbb4030e8fac385b88ea13824d31.jpg" },
  { id: "lq:annette", label: "Annette", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/17f4f562b9121128b4aff9e7b41644185f041e77964551.jpg" },
  { id: "lq:aoi", label: "Aoi", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f1db425eba8ea88e5d4d8427c1706bcf6100183de1cc11.jpeg" },
  { id: "lq:arduin", label: "Arduin", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/8ac7305489de39cfaa10eb13f5a7824559bb7d0c7f2cc1.jpg" },
  { id: "lq:arthur", label: "Arthur", url: "https://lienquan.garena.vn/wp-content/uploads/2024/06/Honeyview_Arthur_111-e1718875297358.jpg" },
  { id: "lq:arum", label: "Arum", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7faf7c96faeb8721b936e323becb57265afea9c3c8b281.jpg" },
  { id: "lq:astrid", label: "Astrid", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/91a969152f4340611e12e4eeb96a9aa259e021a48fbe91.jpg" },
  { id: "lq:ata", label: "Ata", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/71f7a36c0dd250ce0affeffcf14360f45e57c0420b4b61.jpg" },
  { id: "lq:aya", label: "Aya", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d4510fa53f153c5e259543597c96bb88658d3efcbcd0f1.jpg" },
  { id: "lq:azzenka", label: "Azzen’Ka", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/12700_B51-1.jpg" },
  { id: "lq:baldum", label: "Baldum", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/e751e70db18557783c2d23c9e5383e095b6bb947482b11.jpg" },
  { id: "lq:bijan", label: "Bijan", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/856d30cb10953b9480dce5c5470bf81c658d50d87305a1.jpg" },
  { id: "lq:billow", label: "Billow", url: "https://lienquan.garena.vn/wp-content/uploads/2025/01/59900-2.jpg" },
  { id: "lq:biron", label: "Biron", url: "https://lienquan.garena.vn/wp-content/uploads/2024/10/biron-artwork-1.jpg" },
  { id: "lq:bolt-baron", label: "Bolt Baron", url: "https://lienquan.garena.vn/wp-content/uploads/2024/11/bolt-baron-225.jpg" },
  { id: "lq:bonnie", label: "Bonnie", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a2ed1b1815df9c719e4f9b4be5eb3a74658d4cd7d3ef61.jpg" },
  { id: "lq:bright", label: "Bright", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/0045a9d59dc140647f4fa67b446c732c5fc55919650441.jpg" },
  { id: "lq:butterfly", label: "Butterfly", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/769a9fe6cb9b9725127a094bb6dd36545f0ed6543592e1.jpg" },
  { id: "lq:capheny", label: "Capheny", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5c3212f3d7a6f95ad04a309d4d1f340a5ca5c222bda911.jpg" },
  { id: "lq:celica", label: "Celica", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/194741793e21d4392965d4d63515e78b5d6fa738d07e61.jpg" },
  { id: "lq:charlotte", label: "Charlotte", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/20600s.jpg" },
  { id: "lq:chaugnar", label: "Chaugnar", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3eb3c69cef807c5706a98cc4b799619b5b3456990e6501.jpg" },
  { id: "lq:cresht", label: "Cresht", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/04b0a1140d89b8ef0cd4a655753bbb895c4938662bc9f1.jpg" },
  { id: "lq:dextra", label: "Dextra", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/38f3158929eb4b95500db65559e52d525fc5244a521d11.jpg" },
  { id: "lq:dirak", label: "Dirak", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ab0b68ebd2e8df3116d91231ec0e55fc5e16e1f05c8701-1.jpg" },
  { id: "lq:dolia", label: "Dolia", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/15900s.jpg" },
  { id: "lq:dyadia", label: "Dyadia", url: "https://lienquan.garena.vn/wp-content/uploads/2026/01/SeaTalk_IMG_20260119_104427.jpg" },
  { id: "lq:darcy", label: "D’Arcy", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/903191ed8212c2c6c91f1f6f0a677a565c6102d8ecf4a1.jpg" },
  { id: "lq:11596", label: "Edras", url: "https://lienquan.garena.vn/wp-content/uploads/2025/10/edrashead-2.jpg" },
  { id: "lq:elandorr", label: "Eland’orr", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/060f8e35db2f7fb1be51d7e5bdd1724a5db174d49d9de1.jpg" },
  { id: "lq:elsu", label: "Elsu", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/449789489494c0f108a3db5db3098e585bc98d17e666b1.jpg" },
  { id: "lq:enzo", label: "Enzo", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/81d7c827262287ce87639f3bfa048f5a5d149a6d571091.jpg" },
  { id: "lq:erin", label: "Erin", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a1d3b1c36a643cb6d58c704139a2c24d65af7afac34cb1.jpg" },
  { id: "lq:errol", label: "Errol", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5067bb53ba6435e11cc8777645d8de115cc136a9ca3b31.jpg" },
  { id: "lq:fennik", label: "Fennik", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ab3f51a9731ffa085fd56a87139b8a775860e26837e191.jpg" },
  { id: "lq:florentino", label: "Florentino", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/9527c1cbad1c0656d0a4adf1dcec38e35c25f62d77d671.jpg" },
  { id: "lq:flowborn-2", label: "Flowborn", url: "https://lienquan.garena.vn/wp-content/uploads/2026/04/IMG-SQR-0200x0200-080148-2.jpg" },
  { id: "lq:flowborn", label: "Flowborn", url: "https://lienquan.garena.vn/wp-content/uploads/2026/04/IMG-SQR-0200x0200-080150-ket-thuc.jpg" },
  { id: "lq:gildur", label: "Gildur", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/10800_B40-1.jpg" },
  { id: "lq:goverra", label: "Goverra", url: "https://lienquan.garena.vn/wp-content/uploads/2025/07/goverra-1.jpg" },
  { id: "lq:grakk", label: "Grakk", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/040403525e2882c0e3a6794c31976c89585357ba19a351.png" },
  { id: "lq:hayate", label: "Hayate", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/02c8e3d1db8ee8f32913b478884f33e05c8f254a7686f1.jpg" },
  { id: "lq:heino", label: "Heino", url: "https://lienquan.garena.vn/wp-content/uploads/2025/04/heino-2.jpg" },
  { id: "lq:helen", label: "Helen", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/e645dfa331fa48d593b33352e1f8030e636e1b3e19b951.jpg" },
  { id: "lq:iggy", label: "Iggy", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b4563fbfd5756caeea04b7ef488ee39f60fffd803e9ab1.jpeg" },
  { id: "lq:ignis", label: "Ignis", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a2c0e8ef7742c926f9bb10fbab12b03d5970da7009dc11.jpg" },
  { id: "lq:ilumia", label: "Ilumia", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7ae8bcd437d0787c9f3bb9aa54907ede5ef5e858aff141.jpg" },
  { id: "lq:ishar", label: "Ishar", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/1009dcdfe78de2f6bc7fbdaea21cabc05df2198341d451.jpg" },
  { id: "lq:jinna", label: "Jinna", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f3b0dc924b34f76c9265adb57758817a5b752794c417a1.jpg" },
  { id: "lq:kahlii", label: "Kahlii", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/fe313975ef498b33a7bf995a05d6f8b75847d42a599181.png" },
  { id: "lq:kaine", label: "Kaine", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/bb649e26633a61d78f7147d56c0828c6658d3bb600ae01.jpg" },
  { id: "lq:keera", label: "Keera", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/8491520381ab2a66489a6c5e1ec98e785e452a5c9fd3c1.jpg" },
  { id: "lq:kilgroth", label: "Kil’Groth", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/4dd76a3f07965ade3c71b89874b64b935a29291ca4a111.gif" },
  { id: "lq:kriknak", label: "Kriknak", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/0dac2ca73eb28c03de2e43f85e868df458e710b5baeb41.png" },
  { id: "lq:krixi", label: "Krixi", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7f04b1fd7f0520dd1ccbd1caad6faf1a5847d3f72e85b1.png" },
  { id: "lq:krizzix", label: "Krizzix", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a7e49f01ef9804d479cb6537a9b51dee5db6c75c945151.png" },
  { id: "lq:lauriel", label: "Lauriel", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/18d4327ac2e366a736a060be082bbbef5943917dab8d81.jpg" },
  { id: "lq:laville", label: "Laville", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/c30059d2dc46ed31b72a4b02aa9e61f75eb136829228d1.jpg" },
  { id: "lq:liliana", label: "Liliana", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/28b06811cb721a8ecb28d6a1db401e745a9fd3a39ae401.jpg" },
  { id: "lq:lindis", label: "Lindis", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/4b2928793044600d4ca60ec95fb31f205a73d88927ca01.jpg" },
  { id: "lq:lorion", label: "Lorion", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/dab2c45af3206cd0ac30b450357aa8ce5fc5264d71f451.jpg" },
  { id: "lq:lumburr", label: "Lumburr", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/119dc57d5a3a59b520b93a42301ffb135e7dedbf1c28a1.jpg" },
  { id: "lq:lu-bo", label: "Lữ Bố", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ecbf2434edb2b16cc0d5b286a88ab4335d2565110472b1.jpg" },
  { id: "lq:maloch", label: "Maloch", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/752c4c954aa4a8f05a1b0be72aa5dc895c0def4d435aa1.jpg" },
  { id: "lq:marja", label: "Marja", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/1303e95b29e784888ae02d97848aed775b2b84e0372771.jpg" },
  { id: "lq:max", label: "Max", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/18000_B52-1.jpg" },
  { id: "lq:mganga", label: "Mganga", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/053654897539713c86a745376bc8e8125d25652cf33f01.jpg" },
  { id: "lq:mina", label: "Mina", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/09d93eb47007482254115f99686694d25847d3e83fdf41.png" },
  { id: "lq:ming", label: "Ming", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/58ba051be8f5ab56c0ea840ceb29c489658d529e847cf1.jpg" },
  { id: "lq:moren", label: "Moren", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/acqqwc-1.jpg" },
  { id: "lq:murad", label: "Murad", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7dba55e7f433ab78ac6bd2cdfeec13495983e122346461.jpg" },
  { id: "lq:nakroth", label: "Nakroth", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/c7b840bdacd7e5a8b83af72ccd9ca1815ec64fdc5ffeb1.jpg" },
  { id: "lq:natalya", label: "Natalya", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a450850337d6a5d19250b1d1e39692f15eccc530c915e1.jpg" },
  { id: "lq:ngo-khong", label: "Ngộ Không", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/aea009bf921dd684d19ee76c0c1441215ef5c39d1bd6b1.jpg" },
  { id: "lq:omega", label: "Omega", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/cb7b811e7978882aefac079de6c93daf5fbcc5716f8ad1.jpg" },
  { id: "lq:omen", label: "Omen", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/00a78d4f7222a428cd06b45252f88a565a73df2c56ad81.jpg" },
  { id: "lq:ormarr", label: "Ormarr", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/fd2a04f2b129ef58988f2d311eac83e45b6d0919e7d901.jpg" },
  { id: "lq:paine", label: "Paine", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/47861c6d53d72d0dbea2d1dba0b0e0365e8ade6f180931.jpg" },
  { id: "lq:preyta", label: "Preyta", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f2f8893606262e7c0547c4f47f670995590bf38eabfc81.jpg" },
  { id: "lq:qi", label: "Qi", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/6da178e8a2c2871aeb856bec0f669ccd5d5684e01acd31.jpg" },
  { id: "lq:quillen", label: "Quillen", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f6004ed060dcff380fc5b13574986bbc5bf778bc905561.jpg" },
  { id: "lq:raz", label: "Raz", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/6b79035779ab9195c76d91b3f2e7ca79591e6857831601.jpg" },
  { id: "lq:richter", label: "Richter", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/e6e08d2cc322676442cf420e4aefb6d85bd7d7620754b1.jpg" },
  { id: "lq:rouie", label: "Rouie", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7f7ce6b3593a8ea52de5fa3be55469f85eb1402d093b71.jpg" },
  { id: "lq:rourke", label: "Rourke", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/749d47479eb9744d656b5e7c59f213555b1914bf90d291.jpg" },
  { id: "lq:roxie", label: "Roxie", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/51400-1.jpg" },
  { id: "lq:ryoma", label: "Ryoma", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/2f3fe854b98e664415c024a1e9f0396259d9b9ddb39921.jpg" },
  { id: "lq:sephera", label: "Sephera", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/eef053fb25793d536185559e8bf5a82d5c132caaa102e1.jpg" },
  { id: "lq:sinestrea", label: "Sinestrea", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/680ef284724e077237f33cfc2d8fa72d5fa194bad60f31.jpg" },
  { id: "lq:skud", label: "Skud", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/2b128ebef47ab5a8a2ae9d3db754cd585ee5e21149f621.jpg" },
  { id: "lq:slimz", label: "Slimz", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/122fe2fc229ca42dcbe6946db07ccd435b345a87702a11.png" },
  { id: "lq:stuart", label: "Stuart", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/aaba7b63f6e2f5577fbb3465925c8026658d3d704767f1.jpg" },
  { id: "lq:superman", label: "Superman", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3310a88f1a679a6940e2f6e0da287c415a02b6ac709e01.jpg" },
  { id: "lq:taara", label: "Taara", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f69423f533b12cbcd8ab15a7127e1e445e79e0b77e4ec1.jpg" },
  { id: "lq:tachi", label: "Tachi", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ea94a6f76e867283974c8ced9d3aa2c5658d3150230cf1.jpg" },
  { id: "lq:tamyn", label: "Tamyn", url: "https://lienquan.garena.vn/wp-content/uploads/2026/07/SeaTalk_IMG_20260722_163230-1.jpg" },
  { id: "lq:teemee", label: "TeeMee", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d048143eef92ff2734c99f53b46e19db5a4dabef8a0fe1.jpg" },
  { id: "lq:teeri", label: "Teeri", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3499773a79087475e48194e0fd02e27d658d428c2cbe51.jpg" },
  { id: "lq:telannas", label: "Tel’Annas", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5064b1bbcb8dcac94f88292537d6c35459e96577aa90c1.jpg" },
  { id: "lq:thane", label: "Thane", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/71e488144b7dc9f13d40321ce0556efc5847d39f2071a1.png" },
  { id: "lq:the-flash", label: "The Flash", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/dbb8d783c711cc0d2961e72cc8ed122c5ad9685dd58c11.jpg" },
  { id: "lq:thorne", label: "Thorne", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/dd8031b80a4fc5978cdd4886a65a6eb35f5070fd5d0221.jpg" },
  { id: "lq:toro", label: "Toro", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ffd2c29391b67831e97a0b16534a65d45ef5921c2bcb41.jpg" },
  { id: "lq:trieu-van", label: "Triệu Vân", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d7088075d6e144e11f476782718320865d256521539c41.jpg" },
  { id: "lq:tulen", label: "Tulen", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/07210c9e529faa7766ba324bd86b75165a81722f3eab81.jpg" },
  { id: "lq:valhein", label: "Valhein", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/4b36c6e5e2d1ce9dd9e2841d2902043c5ee04efeb2f2d1.jpg" },
  { id: "lq:veera", label: "Veera", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/82a7e1d31f6b20d3faa502e1a215b76c6595119091e7a2-e1718879982854.jpg" },
  { id: "lq:veres", label: "Veres", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/46c5f246040b9e750779aa41ffcbeaa15c3f06d63ce241.jpg" },
  { id: "lq:violet", label: "Violet", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f91d8c95b3b0c11c6fe5b8ac20e48cbd5d25650254d571.jpg" },
  { id: "lq:volkath", label: "Volkath", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/219b09a656af5274629409109ea2802d5d9472fe58bd81.jpg" },
  { id: "lq:wiro", label: "Wiro", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/61015ea8f83c0a833833297bb927ccd35be3c4834cd261.jpg" },
  { id: "lq:wisp", label: "Wisp", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f3a7fe63c79a26ea789064ea3361781f5aec0b6084aa01.jpg" },
  { id: "lq:wonder-woman", label: "Wonder Woman", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/108ae03944a6aa1eb4313a2baa64efcd5a0e6c1551db11.jpg" },
  { id: "lq:xeniel", label: "Xeniel", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a56369ce162e24700689527a54d89b755a179e8628f391.jpg" },
  { id: "lq:yan", label: "Yan", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f9471319a98fac8dce266dc86cd1efea658d4042ae0051.jpg" },
  { id: "lq:yena", label: "Yena", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/61fa157164bf9d99e65bf40b802fb5745cfe1cd72c4671.jpg" },
  { id: "lq:yorn", label: "Yorn", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/44086d0bc26a170b21038a7cbf9413365c4938b95b2f91.jpg" },
  { id: "lq:yue", label: "Yue", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3ee26051086fee856dc6df74811e9e35658d4142ce14c1.jpg" },
  { id: "lq:ybneth", label: "Y’bneth", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/173809566ede28d1fee0731e43a1912c5b98deb97c82f1.jpg" },
  { id: "lq:zata", label: "Zata", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/fcd5c439a7cc37896ab98d568b662bec5ec66637da75d1.jpg" },
  { id: "lq:zephys", label: "Zephys", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/zephys-1.jpg" },
  { id: "lq:zill", label: "Zill", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b1a6c37ad9558ac5767e25ded5b6fcf759966ca7c1d431.jpg" },
  { id: "lq:zip", label: "Zip", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/e0f8f382d1be41adc8947bf1b849479b5d3823c7418f71.jpg" },
  { id: "lq:zuka", label: "Zuka", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d5166c51f37b444810f2ae3df056920d5c4938c59a4821.jpg" },
  { id: "lq:dieu-thuyen", label: "Điêu Thuyền", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d93ee5059a95c391548419e69b6b9d1a5d2564f4eba891.jpg" },
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
  return !!avatar?.startsWith("preset:") || !!avatar?.startsWith("lq:");
}

export function getLqAvatarUrl(avatar?: string): string | null {
  if (!avatar?.startsWith("lq:")) return null;
  const p = AVATAR_PRESETS.find((x) => x.id === avatar);
  return p?.url || null;
}

/** @deprecated — chỉ còn dùng cho preset màu cũ */
export function presetGradient(avatar?: string) {
  return "from-zinc-600 to-zinc-800";
}

export function getAvatarFrame(frameId?: string) {
  return AVATAR_FRAMES.find((f) => f.id === frameId) || AVATAR_FRAMES[0];
}
