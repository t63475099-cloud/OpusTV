import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import LanguageSync from "@/components/LanguageSync";
import SyncBootstrap from "@/components/SyncBootstrap";
import ScrollNavFab from "@/components/ScrollNavFab";
import Sidebar from "@/components/Sidebar";
import GlassDock from "@/components/GlassDock";
import FloatingMiniPlayer from "@/components/FloatingMiniPlayer";
import AmbientBackdrop from "@/components/AmbientBackdrop";
import GsapScrollProvider from "@/components/GsapScrollProvider";
import ChromeGuard from "@/components/ChromeGuard";
import BehaviorMonitor from "@/components/BehaviorMonitor";
import OpusPreloader from "@/components/OpusPreloader";
import SmartBack from "@/components/ecosystem/SmartBack";
import SectionRouteGuard from "@/components/ecosystem/SectionRouteGuard";
import PwaRegister from "@/components/PwaRegister";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  title: {
    default: "OpusFilm - Xem phim online",
    template: `%s | ${APP_NAME}`,
  },
  description: "Xem phim, nghe nhạc trên OpusFilm.",
  keywords: ["opusfilm", "xem phim"],
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "OpusTV",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full min-h-[100dvh] flex flex-col bg-[#0a0a0f] text-zinc-100 relative overflow-x-clip overflow-y-auto">
        <AmbientBackdrop />
        <OpusPreloader oncePerSession />
        <PwaRegister />
        <GsapScrollProvider>
          <LanguageSync />
          <SyncBootstrap />
          <ChromeGuard />
          <BehaviorMonitor />
          <ScrollNavFab />
          <SmartBack />
          <SectionRouteGuard />
          <Navbar />
          <GlassDock />
          <div data-shell="1" className="flex flex-1 w-full max-w-[1920px] mx-auto">
            <Sidebar />
            <main className="flex-1 min-w-0 w-full overflow-x-clip">{children}</main>
          </div>
          <FloatingMiniPlayer />
          <footer className="border-t border-white/10 py-8 px-4 text-center text-zinc-500 text-sm mt-8 pb-[max(2rem,env(safe-area-inset-bottom))] bg-black/20 backdrop-blur-md">
            <p className="font-semibold text-zinc-300">{APP_NAME}</p>
            <p className="mt-1 text-xs text-zinc-500">{APP_TAGLINE}</p>
          </footer>
        </GsapScrollProvider>
      </body>
    </html>
  );
}
