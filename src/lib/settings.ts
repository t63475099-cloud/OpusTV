"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  name: string;
  /** UID 10 số */
  uid?: string;
  /** Giới thiệu ngắn */
  bio?: string;
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
  uid: "",
  bio: "",
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
        const n = name.trim().slice(0, 80);
        if (!n) return;
        set((s) => ({
          profile: {
            ...s.profile,
            name: n,
            email: email?.trim() || s.profile.email,
            loggedIn: true,
            verified: !!s.profile.verified,
            avatar: s.profile.avatar || undefined,
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
  { id: "lq:airi-1", label: "Airi · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/04999ff87145b9005694ffd78e1530a660017059a8fc11.jpg" },
  { id: "lq:airi-2", label: "Airi · Ninja Xanh Lá", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ed61d00fb8c65dc7784322d012b2f3f25965e9f49b4121.jpg" },
  { id: "lq:aleister-1", label: "Aleister · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/aleister-00-1.jpg" },
  { id: "lq:aleister-2", label: "Aleister · Thiếu Niên Hắc Ám", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/fce1d984d1d72596a44ce17027b7976b59d1ad0da78481.jpg" },
  { id: "lq:alice-1", label: "Alice · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/9b84b7e2b3f71361cc8d0178afb6696e58462fa5aeb001.png" },
  { id: "lq:alice-2", label: "Alice · Nhà chiêm tinh", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/4994ed2f082a8bc5a271789f5629e0e058462f5b49ff31.png" },
  { id: "lq:allain-1", label: "Allain · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d0ca908065803d3600f0faa0dd7ac14d5ef1fa85a63c51.jpg" },
  { id: "lq:allain-2", label: "Allain · Kirito Hắc kiếm sĩ", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f7696367c10acf27c7b75ce22bf5a8f05f08440a8ccb31.jpg" },
  { id: "lq:amily-1", label: "Amily · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7cf166510b07a9996810020bc87d806a5b88ea3110ca91.jpg" },
  { id: "lq:amily-2", label: "Amily · Đặc cảnh NYPD", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/58922be4a508108552db403fb6c031295b88ea54d7b741.jpg" },
  { id: "lq:annette-1", label: "Annette · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5f93999a6586945b8d85258d67cee9195ef60dbbd2b5f1.jpg" },
  { id: "lq:annette-2", label: "Annette · Nữ quản ga", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/59029df87e4ff703efca1a8a0223ea4d5ef60dda9e94c1.jpg" },
  { id: "lq:aoi-1", label: "Aoi · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f1db425eba8ea88e5d4d8427c1706bcf6100183de1cc11.jpeg" },
  { id: "lq:aoi-2", label: "Aoi · Sát Thủ Đô Thị", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/eca3db4934c452261e4ad5e0b3b20e8f6100223be0c7f1-e1718875931797.png" },
  { id: "lq:arduin-1", label: "Arduin · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d2fbd3a426cf020c1e2e6ad564e50e8c59bb7ee41553e1.jpg" },
  { id: "lq:arduin-2", label: "Arduin · Cận Vệ Hoàng Gia", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/cae93a1b59ff9cf28c81a1c420b00a5559bb7ef7c91e81.jpg" },
  { id: "lq:arthur-1", label: "Arthur · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/06/Honeyview_Arthur_111-e1718875297358.jpg" },
  { id: "lq:arthur-2", label: "Arthur · Lãnh chúa xương", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5ef7c0a31ffd7d33b5d796204e1db83059df131e7f0531.jpg" },
  { id: "lq:arum-1", label: "Arum · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5951b4834461108d446792cdddb7168b5afeba8707aeb1.jpg" },
  { id: "lq:arum-2", label: "Arum · Thú Vệ Cổ Mộ", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/2bde7de66143c8b9653a24096e0a6b5a5afebb2bb70a61.jpg" },
  { id: "lq:astrid-1", label: "Astrid · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/15b20fb97ed730bbcffba74eec32be4659e02338a0d1d1.jpg" },
  { id: "lq:astrid-2", label: "Astrid · Bạch Kiếm Tiểu Thư", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/e9ba2dd34a3052af56b8d833c7152b1359e0234e1fc611.jpg" },
  { id: "lq:ata-1", label: "Ata · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/206f1bf38f4e3caf5dcf853618e17a1f5e57c057965c71.jpg" },
  { id: "lq:ata-2", label: "Ata · Tân thủy thủ", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3016655774a3bd05fc47594e28f701075e57c0f3d9a561.jpg" },
  { id: "lq:aya-1", label: "Aya · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/8decfe0a19adf4c0db504a34dedb271e658d3f1133b0a1.jpg" },
  { id: "lq:aya-2", label: "Aya · Hoạt náo viên", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ea4408de26b25e684372f0298d838837658d3f25dcd591-e1718875827517.jpg" },
  { id: "lq:azzenka-1", label: "Azzen’Ka · Azzen'Ka", url: "https://lienquan.garena.vn/wp-content/uploads/2025/10/azzenka-icon.jpg" },
  { id: "lq:azzenka-2", label: "Azzen’Ka · Azzen'Ka Linh Hồn Lữ Khách", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/0ffd9626a663ebad9045e6cdcfdee438597b602420d5b1.jpg" },
  { id: "lq:baldum-1", label: "Baldum · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d9c34b86f1ad89c132e316672bfcd7f55b6bb975c08761.jpg" },
  { id: "lq:baldum-2", label: "Baldum · chú thợ ống nước", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/496ccdce3726050c01c8122dea65ddd15b6bba1b414441.jpg" },
  { id: "lq:bijan-1", label: "Bijan · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/0c8d05c3314999644164ba2ea4fd6ef8658d51ffba5451-e1718875595956.jpg" },
  { id: "lq:bijan-2", label: "Bijan · Chiến binh sa mạc", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/10779dce454486485ebbb483f96737c965968a5bf2a5f1-e1718875410681.jpg" },
  { id: "lq:billow-1", label: "Billow · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2025/01/59900-1-1.jpg" },
  { id: "lq:billow-2", label: "Billow · Thiên Tướng - Độ Ách", url: "https://lienquan.garena.vn/wp-content/uploads/2025/01/59901-1.jpg" },
  { id: "lq:biron-1", label: "Biron · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/10/biron-artwork-1.jpg" },
  { id: "lq:biron-2", label: "Biron · Yuji Itadori", url: "https://lienquan.garena.vn/wp-content/uploads/2024/10/59702-1.jpg" },
  { id: "lq:bolt-baron-1", label: "Bolt Baron · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/11/bolt-baron.jpg" },
  { id: "lq:bolt-baron-2", label: "Bolt Baron · Thiên Phủ - Tư Mệnh", url: "https://lienquan.garena.vn/wp-content/uploads/2024/11/59802-1.jpg" },
  { id: "lq:bonnie-1", label: "Bonnie · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b58d66475d3c6eb1d37ceaeee655c4e3658d4ead4b0db1-e1718875641276.jpg" },
  { id: "lq:bonnie-2", label: "Bonnie · Thỏ ma quái", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f656415cb0b7f59567e49fa4255869fe659688318ba8c1-e1718875615982.jpg" },
  { id: "lq:bright-1", label: "Bright · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/4afa684bad6a0a9c3bed7199921968de5fc55aa90a4c51.jpg" },
  { id: "lq:bright-2", label: "Bright · Soái ca thánh điện", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/894f58b3afe16f50d9885abce55df31a5fc55abae63871.jpg" },
  { id: "lq:butterfly-1", label: "Butterfly · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/594f025c153d363cb992cd9d6f77d3905f0ed5819ffd61.jpg" },
  { id: "lq:butterfly-2", label: "Butterfly · Thủy thủ", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ac8137f34f98d5fa6989b05e8b91ce6a583ff89eeb0f91.png" },
  { id: "lq:capheny-1", label: "Capheny · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f3c1c5a6dfdc7610f57568f84b7075d85ca5c237e77991.jpg" },
  { id: "lq:capheny-2", label: "Capheny · Hầu gái", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/9b4c86ba8f3227429dbd5d3a183afbe85ca5c248c0d4b1.jpg" },
  { id: "lq:celica-1", label: "Celica · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5c7448ebdafee8605d0006eb3045c0845d6fa763462c11.jpg" },
  { id: "lq:celica-2", label: "Celica · Nữ cao bồi", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/7861440ff10d0e01a085e35afdb849fb5d6fa7747ef271.jpg" },
  { id: "lq:charlotte-1", label: "Charlotte · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/20600s.jpg" },
  { id: "lq:charlotte-2", label: "Charlotte · Hexsword", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/20601s.jpg" },
  { id: "lq:chaugnar-1", label: "Chaugnar · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/113_120.jpg" },
  { id: "lq:chaugnar-2", label: "Chaugnar · Ác Mộng Sinh Hóa", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/25fb7638a4b2cd9306e99cc1fc67e8f658cf626892af51.jpg" },
  { id: "lq:cresht-1", label: "Cresht · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/795198870c5e6cfb68023c3fd65eb3bd5c49387676fe21.jpg" },
  { id: "lq:cresht-2", label: "Cresht · Thợ sửa cáp", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/1e69b5b59bf63865b011ec3fe292870e589978710997f1.jpg" },
  { id: "lq:darcy-1", label: "D’Arcy · D'arcy", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/c545d29232eefe7a4d455fa68e7a60305c61059833fe21.jpg" },
  { id: "lq:darcy-2", label: "D’Arcy · D'arcy Nam tước", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/269e80e7dd8b02a502622b1657b965cb5c6105d5c18f01.jpg" },
  { id: "lq:dextra-1", label: "Dextra · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/f6eb117d5a3dbb00aeaba0d20c16090f5fc5245fa1dc41.jpg" },
  { id: "lq:dextra-2", label: "Dextra · Chiến binh quyến rũ", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ec901355109e2b0474bef102cef743965fc524cf832b51.jpg" },
  { id: "lq:dirak-1", label: "Dirak · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/ab0b68ebd2e8df3116d91231ec0e55fc5e16e1f05c8701-1.jpg" },
  { id: "lq:dirak-2", label: "Dirak · Cảnh vệ bầu trời", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b09b18011a25828e323874458798a1325e16e2167ca201.jpg" },
  { id: "lq:dolia-1", label: "Dolia · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/15900s.jpg" },
  { id: "lq:dolia-2", label: "Dolia · Hoa tiêu đại dương", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/15901s.jpg" },
  { id: "lq:dyadia-1", label: "Dyadia · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2026/01/SeaTalk_IMG_20260119_104427.jpg" },
  { id: "lq:dieu-thuyen-1", label: "Điêu Thuyền · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3168dfb2fc31f95f3a735fccc752acfa5d2564561eadc1.jpg" },
  { id: "lq:dieu-thuyen-2", label: "Điêu Thuyền · Nữ Vương Anh Đào", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/fe4472ec761123c1d9db517741631bc05ef5bdcac9c8a1.jpg" },
  { id: "lq:11596-1", label: "Edras · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2025/10/edrashead-2.jpg" },
  { id: "lq:elandorr-1", label: "Eland’orr · Eland'orr", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d5592bb2109b1367451f11bb876a58ce5db1778ed43411.jpg" },
  { id: "lq:elandorr-2", label: "Eland’orr · Eland'orr Soái tặc", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/2a77f7161612f671e52b016ad6e176d05db1779faca701.jpg" },
  { id: "lq:elsu-1", label: "Elsu · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/fec52948b2886e191fa03b45047ae6e45bc98f98341211.jpg" },
  { id: "lq:elsu-2", label: "Elsu · Mafia", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b4df1c0fa5e24e16da5a9c9541bf50b95bc98fca9bba71.jpg" },
  { id: "lq:enzo-1", label: "Enzo · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/829bb771c29c1cc0bd2019cab9e101ec5d149a83802c51.jpg" },
  { id: "lq:enzo-2", label: "Enzo · Phẩm chất quý tộc", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/a4848c6e366c2e4fbf6519379b41afcc5d149a956719d1.jpg" },
  { id: "lq:erin-1", label: "Erin · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d283b5fb9c1b8f7d86a8b189e123361765af7b2c5f3dd1-e1718875535623.jpg" },
  { id: "lq:erin-2", label: "Erin · Mộc tinh linh", url: "https://lienquan.garena.vn/wp-content/uploads/2024/07/56701s.jpg" },
  { id: "lq:errol-1", label: "Errol · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/3d7beab0904b2c5dc6f1962b565bbde35cc136d356ef31.jpg" },
  { id: "lq:errol-2", label: "Errol · Vượt ngục", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/49cd968039d46b7fb5ea43c9a0af694a5cc136dd21fab1.jpg" },
  { id: "lq:fennik-1", label: "Fennik · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/99ed6c82e2b81364cd83f9af4f6f8c195860e29cc74741.jpg" },
  { id: "lq:fennik-2", label: "Fennik · Nhà thám hiểm", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/25175f5edb65931ec15fca3b631850735860e4bd97ebd1.jpg" },
  { id: "lq:florentino-1", label: "Florentino · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/62cda115a78344fc4fa5154881c9da255c25f64ee994d1.jpg" },
  { id: "lq:florentino-2", label: "Florentino · Vũ kiếm sư", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/db3ef663c12e5b2af2933f609aba74795c25f6691e1091.jpg" },
  { id: "lq:flowborn-2-1", label: "Flowborn · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2026/04/IMG-SQR-0150x0150-080149-22.jpg" },
  { id: "lq:flowborn-1", label: "Flowborn · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2026/04/IMG-SQR-0150x0150-080151-ket-thuc2.jpg" },
  { id: "lq:gildur-1", label: "Gildur", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/10800_B40-1.jpg" },
  { id: "lq:gildur-2", label: "Gildur · phượt thủ", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5bd246adef798cea7e93b0dd0643ea175910307d6456b1.jpg" },
  { id: "lq:goverra-1", label: "Goverra · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2025/07/goverra-11.jpg" },
  { id: "lq:goverra-2", label: "Goverra · Kỳ Nghỉ Hoàn Mỹ", url: "https://lienquan.garena.vn/wp-content/uploads/2025/07/305961head.jpg" },
  { id: "lq:grakk-1", label: "Grakk · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/b97aa4b462e0760bfd23530126d6f84a58535af7e39321.png" },
  { id: "lq:grakk-2", label: "Grakk · Chàng gấu tuyết", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/5b3330c7afaf8eeaa1ca092045c3c0195ef5ea4c847a81.jpg" },
  { id: "lq:hayate-1", label: "Hayate · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d0c33087d442efacbb2b543cee4527c45c8f29a4ceeb81.jpg" },
  { id: "lq:hayate-2", label: "Hayate · Bạch ảnh", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/d36947e14ceaa3c38ee7bb42666c56565c8f320e1539c1.jpg" },
  { id: "lq:heino-1", label: "Heino · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2025/04/heino-1.jpg" },
  { id: "lq:heino-2", label: "Heino · Scout Regiment", url: "https://lienquan.garena.vn/wp-content/uploads/2025/04/305632head.jpg" },
  { id: "lq:helen-1", label: "Helen · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/c93a06dd5962e709f155a42a5d8f4a38658d379314e4c1.jpg" },
  { id: "lq:helen-2", label: "Helen · Ngủ trong rừng", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/c8c72a677876c0fa2db4a1489ecef2df658d37a7d2a2f1.jpg" },
  { id: "lq:iggy-1", label: "Iggy · Mặc định", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/6ac7db04e9ac98ca09584ce0b326d28260feffae703b91-e1718875984116.jpeg" },
  { id: "lq:iggy-2", label: "Iggy · Tiểu Hoàng Đế", url: "https://lienquan.garena.vn/wp-content/uploads/2024/05/98a09df1429833f936ba2c9c0f70296d61001eb02361d1-e1718875970500.png" },
];

/** Kho khung viền avatar kiểu game (overlay SVG /frames/*.svg) */
/** Khung viền + hiệu ứng (effect dùng trong UserAvatar) */
/** 4 khung viền tròn động (CSS thuần) */
export type FrameEffect = string;

export const AVATAR_FRAMES: {
  id: string;
  label: string;
  /** CSS class suffix: ab-frame--{css} */
  css: string;
  group: string;
}[] = [
  { id: "frame:none", label: "Không", css: "none", group: "none" },
  { id: "frame:conic-rainbow", label: "Conic Rainbow Spin", css: "spin-rainbow", group: "Fantasy" },
  { id: "frame:celestial-halo", label: "Celestial Halo", css: "halo-white", group: "Fantasy" },
  { id: "frame:flame-ring", label: "Flame Ring Aura", css: "flame", group: "Fantasy" },
  { id: "frame:mystic-frost", label: "Mystic Frost", css: "frost", group: "Fantasy" },
  { id: "frame:galaxy-nebula", label: "Galaxy Nebula", css: "galaxy", group: "Fantasy" },
  { id: "frame:spirit-orb", label: "Spirit Orb Pulse", css: "spirit", group: "Fantasy" },
  { id: "frame:emerald-forest", label: "Emerald Forest", css: "emerald", group: "Fantasy" },
  { id: "frame:mythic-lightning", label: "Mythic Lightning", css: "lightning", group: "Fantasy" },
  { id: "frame:solar-eclipse", label: "Solar Eclipse", css: "solar", group: "Fantasy" },
  { id: "frame:lunar-eclipse", label: "Lunar Eclipse", css: "lunar", group: "Fantasy" },
  { id: "frame:emp-pulse", label: "Electro Magnetic", css: "emp", group: "Cyber" },
  { id: "frame:neon-flicker", label: "Neon Flicker", css: "neon-flicker", group: "Cyber" },
  { id: "frame:digital-matrix", label: "Digital Matrix", css: "matrix", group: "Cyber" },
  { id: "frame:red-laser", label: "Red Laser Scan", css: "laser", group: "Cyber" },
  { id: "frame:radio-wave", label: "Radio Wave Echo", css: "radio", group: "Cyber" },
  { id: "frame:optical-fiber", label: "Optical Fiber", css: "fiber", group: "Cyber" },
  { id: "frame:plasma-jet", label: "Plasma Jet", css: "plasma", group: "Cyber" },
  { id: "frame:circuit-board", label: "Circuit Board", css: "circuit", group: "Cyber" },
  { id: "frame:reactor-core", label: "Reactor Core", css: "reactor", group: "Cyber" },
  { id: "frame:xray-scan", label: "X-Ray Scanner", css: "xray", group: "Cyber" },
  { id: "frame:solid-gold", label: "Solid Gold", css: "gold", group: "Luxury" },
  { id: "frame:platinum-sweep", label: "Platinum Sweep", css: "platinum", group: "Luxury" },
  { id: "frame:antique-bronze", label: "Antique Bronze", css: "bronze", group: "Luxury" },
  { id: "frame:diamond-sparkle", label: "Diamond Sparkle", css: "diamond", group: "Luxury" },
  { id: "frame:rose-gold", label: "Rose Gold", css: "rose-gold", group: "Luxury" },
  { id: "frame:sterling-silver", label: "Sterling Silver", css: "silver", group: "Luxury" },
  { id: "frame:titanium-alloy", label: "Titanium Alloy", css: "titanium", group: "Luxury" },
  { id: "frame:gold-marble", label: "Gold Vein Marble", css: "marble", group: "Luxury" },
  { id: "frame:crystal-prism", label: "Crystal Prism", css: "prism", group: "Luxury" },
  { id: "frame:royal-crown", label: "Royal Crown", css: "crown", group: "Luxury" },
  { id: "frame:magma-flow", label: "Magma Flow", css: "magma", group: "Nature" },
  { id: "frame:ocean-wave", label: "Ocean Wave", css: "ocean", group: "Nature" },
  { id: "frame:tornado-vortex", label: "Tornado Vortex", css: "tornado", group: "Nature" },
  { id: "frame:quartz-crystal", label: "Quartz Crystal", css: "quartz", group: "Nature" },
  { id: "frame:mystic-fog", label: "Mystic Fog", css: "fog", group: "Nature" },
  { id: "frame:meteor-shower", label: "Meteor Shower", css: "meteor", group: "Nature" },
  { id: "frame:cherry-blossom", label: "Cherry Blossom", css: "sakura", group: "Nature" },
  { id: "frame:phoenix-ash", label: "Phoenix Ash", css: "phoenix", group: "Nature" },
  { id: "frame:northern-lights", label: "Northern Lights", css: "aurora", group: "Nature" },
  { id: "frame:desert-sand", label: "Desert Sandstorm", css: "sand", group: "Nature" },
  { id: "frame:bronze-tier", label: "Bronze Tier", css: "tier-bronze", group: "Rank" },
  { id: "frame:silver-tier", label: "Silver Tier", css: "tier-silver", group: "Rank" },
  { id: "frame:gold-tier", label: "Gold Conqueror", css: "tier-gold", group: "Rank" },
  { id: "frame:platinum-tier", label: "Platinum Elite", css: "tier-plat", group: "Rank" },
  { id: "frame:diamond-tier", label: "Diamond Master", css: "tier-diamond", group: "Rank" },
  { id: "frame:challenger", label: "Challenger Legend", css: "tier-challenger", group: "Rank" },
  { id: "frame:liquid-glass", label: "Liquid Glass Pure", css: "glass-pure", group: "Rank" },
  { id: "frame:frosted-glass", label: "Frosted Glass", css: "glass-frost", group: "Rank" },
  { id: "frame:infinity-mirror", label: "Infinity Mirror", css: "infinity", group: "Rank" },
  { id: "frame:blackhole", label: "Cosmic Blackhole", css: "blackhole", group: "Rank" },
];

export function getAvatarFrame(frameId?: string) {
  return AVATAR_FRAMES.find((f) => f.id === frameId) || AVATAR_FRAMES[0];
}

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

