import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SyncBootstrap from "@/components/SyncBootstrap";
import Sidebar from "@/components/Sidebar";
import FloatingMiniPlayer from "@/components/FloatingMiniPlayer";
import SupportChatbot from "@/components/SupportChatbot";
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
    default: `${APP_NAME} - ${APP_TAGLINE}`,
    template: `%s | ${APP_NAME}`,
  },
  description:
    "OpusFilm — xem phim online theo sở thích: bộ, lẻ, Hàn, hành động, tình cảm, kinh dị và nhiều thể loại khác.",
  keywords: ["opusfilm", "xem phim online", "phim bộ", "phim lẻ", "phim hàn", "phim hành động"],
  robots: {
    index: true,
    follow: true,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="vi" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0f0f0f] text-zinc-100">
        <>
          <SyncBootstrap />
          <Navbar />
        <div className="flex flex-1 w-full max-w-[1920px] mx-auto">
          <Sidebar />
          <main className="flex-1 min-w-0">{children}</main>
          <FloatingMiniPlayer />
          <SupportChatbot />
        </div>
        <footer className="border-t border-[#272727] py-8 px-4 text-center text-[#aaa] text-sm mt-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <p className="font-semibold text-zinc-300">{APP_NAME}</p>
          <p className="mt-1">{APP_TAGLINE}</p>
          <p className="mt-2 text-xs">OpusFilm</p>
        </footer>
                </>
      </body>
    </html>
  );
}
