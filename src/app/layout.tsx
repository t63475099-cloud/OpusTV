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
  title: {
    default: "OpusTV — Unified Entertainment Ecosystem",
    template: `%s | ${APP_NAME}`,
  },
  description: "OpusTV — Unified Entertainment Ecosystem.",
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
