"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  Play,
  MessageSquare,
  Code2,
  Music2,
  ArrowRight,
  Compass,
  Users,
  Terminal,
  Clapperboard,
  ShieldCheck,
  Headphones,
  Crown,
  Film,
  Tv,
  Flame,
  GitFork,
  ChevronRight,
} from "lucide-react";
import dynamic from "next/dynamic";
import KineticHeadline from "@/components/landing/KineticHeadline";
import ParallaxBanner from "@/components/landing/ParallaxBanner";
import type { OpusCategory } from "@/components/landing/opus3d/types";
import { cn } from "@/lib/utils";

const OpusHeroScene = dynamic(
  () => import("@/components/landing/opus3d/OpusHeroScene"),
  { ssr: false }
);

const ease = "duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";

function Glass({
  children,
  className,
  hover = true,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-2xl",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)] shadow-2xl shadow-black/60",
        `transition-all ${ease}`,
        hover && "hover:-translate-y-1 hover:scale-[1.01] hover:border-white/[0.14] hover:bg-white/[0.05]",
        className
      )}
    >
      {children}
    </div>
  );
}

function Metric({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let frame = 0;
    const steps = 40;
    const id = setInterval(() => {
      frame += 1;
      setN(Math.round((value * frame) / steps));
      if (frame >= steps) clearInterval(id);
    }, 28);
    return () => clearInterval(id);
  }, [value]);
  return (
    <div className="text-center px-2">
      <p className="text-2xl sm:text-3xl font-bold text-white tabular-nums">
        {n.toLocaleString("vi-VN")}
        {suffix || ""}
      </p>
      <p className="text-[11px] sm:text-xs text-zinc-500 mt-1">{label}</p>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [category, setCategory] = useState<OpusCategory>("idle");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#070709] text-zinc-100 relative overflow-x-hidden">
      <OpusHeroScene category={category} className="fixed inset-0 -z-10 opacity-90" />
      {/* Soft blur overlay so text stays readable */}
      <div className="pointer-events-none fixed inset-0 -z-[9] bg-[#070709]/45 backdrop-blur-[2px]" />

      {/* ===== NAV ===== */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-[60] transition-all",
          ease,
          scrolled
            ? "bg-[#070709]/75 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/40"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4 overflow-visible">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 via-fuchsia-500 to-violet-600 flex items-center justify-center shadow-lg shadow-rose-900/40">
              <Tv className="w-4.5 h-4.5 text-white" />
            </span>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-rose-100 to-violet-200 bg-clip-text text-transparent">
              Opus
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-sm text-zinc-400">
            {[
              { href: "#film", label: "Film" },
              { href: "#chat", label: "Chat" },
              { href: "#code", label: "Code" },
              { href: "#music", label: "Music" },
              { href: "#pass", label: "Pass" },
            ].map((i) => (
              <a
                key={i.href}
                href={i.href}
                className={cn(
                  "px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 transition-all",
                  ease
                )}
              >
                {i.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/tai-khoan?next=/home"
              className={cn(
                "hidden sm:inline-flex px-3.5 py-2 rounded-full text-sm border border-white/10 bg-white/[0.04] backdrop-blur hover:bg-white/10 transition-all shrink-0",
                ease
              )}
            >
              Đăng nhập
            </Link>
            <Link
              href="/tai-khoan?next=/home"
              className={cn(
                "inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-sm font-semibold text-white shrink-0",
                "bg-gradient-to-r from-rose-600 to-fuchsia-600 hover:from-rose-500 hover:to-fuchsia-500",
                "shadow-lg shadow-rose-900/30 border border-white/10 transition-all",
                ease
              )}
            >
              Trải nghiệm ngay
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto">
              <div
                className={cn(
                  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] sm:text-xs font-medium",
                  "border border-white/12 bg-white/[0.04] text-zinc-300 mb-6"
                )}
              >
                Xem phim · Chat · Code · Nhạc · Pass
              </div>

              <KineticHeadline line1="Một nền tảng." line2="Năm vũ trụ trải nghiệm." />

              <p className="mt-5 sm:mt-6 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xl mx-auto">
                Opus kết nối xem phim, trò chuyện, lập trình và âm nhạc trong cùng
                một không gian kính lỏng — mượt trên điện thoại lẫn máy tính.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/tai-khoan?next=/home"
                  className={cn(
                    "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-white",
                    "bg-gradient-to-r from-rose-600 via-fuchsia-600 to-violet-600",
                    "hover:brightness-110 shadow-xl shadow-rose-900/40 transition-all",
                    ease
                  )}
                >
                  <Compass className="w-4 h-4" />
                  Khám phá Vũ trụ Opus
                </Link>
                <Link
                  href="/home"
                  className={cn(
                    "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-medium",
                    "border border-white/12 bg-white/[0.04] backdrop-blur hover:bg-white/[0.08] transition-all",
                    ease
                  )}
                >
                  <Play className="w-4 h-4 text-rose-300" />
                  Xem demo trực tiếp
                </Link>
              </div>
            </div>

            {/* Mock dashboard — parallax */}
            <ParallaxBanner className="mt-12 sm:mt-16 mx-auto max-w-4xl" strength={28}>
            <Glass
              className="p-3 sm:p-5"
              hover={false}
            >
              <div className="rounded-2xl border border-white/8 bg-[#0d0e12]/90 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 bg-white/[0.02]">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
                  <span className="ml-2 text-[10px] text-zinc-500 font-mono">
                    opus://dashboard
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4">
                  {[
                    { icon: Film, label: "Film", color: "from-rose-600/40 to-amber-600/20", t: "text-rose-300" },
                    { icon: MessageSquare, label: "Chat", color: "from-indigo-600/40 to-violet-600/20", t: "text-indigo-300" },
                    { icon: Code2, label: "Code", color: "from-cyan-600/40 to-emerald-600/20", t: "text-cyan-300" },
                    { icon: Music2, label: "Music", color: "from-pink-600/40 to-blue-600/20", t: "text-pink-300" },
                  ].map((c) => (
                    <div
                      key={c.label}
                      className={cn(
                        "rounded-xl border border-white/8 p-3 sm:p-4 bg-gradient-to-br",
                        c.color
                      )}
                    >
                      <c.icon className={cn("w-5 h-5 mb-2", c.t)} />
                      <p className="text-xs font-semibold text-white">{c.label}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">Đang hoạt động</p>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>
            </ParallaxBanner>
          </div>
        </section>

        {/* ===== BENTO ===== */}
        <section className="px-4 sm:px-6 pb-20" id="ecosystem">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Năm trụ cột. Một hệ sinh thái.
              </h2>
              <p className="text-sm text-zinc-500 mt-2 max-w-lg">
                Xem phim, nhắn tin, viết code, nghe nhạc và sự kiện trong cùng một tài khoản.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 auto-rows-fr">
              {/* Film - large */}
              <Glass className="md:col-span-2 lg:col-span-4 p-5 sm:p-6">
                <div id="film" onMouseEnter={() => setCategory("film")} onFocus={() => setCategory("film")} className="scroll-mt-24">
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center shrink-0">
                      <Film className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Opus Film</h3>
                      <p className="text-xs text-rose-300/90 mt-0.5">Xem phim online</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
                    Phim bộ, phim lẻ, nhiều thể loại. Có phụ đề, chọn tập và server khi nguồn lỗi.
                  </p>
                  <div className="mt-5 rounded-2xl border border-white/8 bg-black/40 aspect-[16/8] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-tr from-rose-900/40 via-transparent to-amber-900/20" />
                    <Play className="relative w-12 h-12 text-white/80" />
                    <div className="absolute bottom-3 left-3 right-3 flex gap-2 overflow-hidden">
                      {["Hay quá 🔥", "Tập này đỉnh", "Xem chung nhé"].map((d) => (
                        <span
                          key={d}
                          className="shrink-0 text-[10px] px-2 py-1 rounded-full bg-black/50 border border-white/10 text-zinc-200"
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Glass>

              {/* Chat */}
              <Glass className="md:col-span-1 lg:col-span-2 p-5 sm:p-6">
                <div id="chat" onMouseEnter={() => setCategory("chat")} onFocus={() => setCategory("chat")} className="scroll-mt-24">
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">Opus Chat</h3>
                  <p className="text-xs text-indigo-300 mt-0.5">Nhắn tin & gọi</p>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    Nhắn tin 1-1 và nhóm, gọi thoại, gửi ảnh/file. Rich Presence biết bạn bè đang xem phim hay nghe nhạc — kèm nút tham gia.
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600/40 border border-indigo-400/20 px-3 py-2 text-xs text-zinc-100">
                      Vào Watch Party tập 8 không?
                    </div>
                    <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/5 border border-white/10 px-3 py-2 text-xs text-zinc-300">
                      Ok, mình join ngay 🎬
                    </div>
                    <div className="flex -space-x-2 pt-1">
                      {["#f43f5e", "#6366f1", "#10b981"].map((c) => (
                        <span
                          key={c}
                          className="w-7 h-7 rounded-full border-2 border-[#0d0e12]"
                          style={{ background: c }}
                        />
                      ))}
                      <span className="text-[10px] text-zinc-500 self-center ml-2">3 online</span>
                    </div>
                  </div>
                </div>
              </Glass>

              {/* Code */}
              <Glass className="md:col-span-2 lg:col-span-3 p-5 sm:p-6">
                <div id="code" onMouseEnter={() => setCategory("code")} onFocus={() => setCategory("code")} className="scroll-mt-24">
                  <div className="flex items-center gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-600 flex items-center justify-center">
                      <Terminal className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Opus Code</h3>
                      <p className="text-xs text-cyan-300">Sân chơi lập trình tương tác</p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    Chạy Python, JS/Canvas, C# ngay trên trình duyệt. Pair Programming P2P thấy con trỏ và code cùng lúc;
                    Snippet Hub fork hiệu ứng 3D/CSS một chạm.
                  </p>
                  <div className="mt-4 rounded-xl bg-[#0a0c10] border border-white/8 p-3 font-mono text-[11px] text-emerald-300/90 leading-relaxed overflow-hidden">
                    <p className="text-zinc-500">// pair room · 2 cursors</p>
                    <p>
                      <span className="text-fuchsia-400">function</span>{" "}
                      <span className="text-amber-300">render</span>() {"{"}
                    </p>
                    <p className="pl-4 text-cyan-300">requestAnimationFrame(render);</p>
                    <p>{"}"}</p>
                    <div className="flex gap-3 mt-2 text-[10px]">
                      <span className="text-rose-400">▌ Bạn</span>
                      <span className="text-sky-400">▌ Peer</span>
                      <span className="text-zinc-600 flex items-center gap-1 ml-auto">
                        <GitFork className="w-3 h-3" /> Fork snippet
                      </span>
                    </div>
                  </div>
                </div>
              </Glass>

              {/* Music */}
              <Glass className="md:col-span-1 lg:col-span-2 p-5 sm:p-6">
                <div id="music" onMouseEnter={() => setCategory("music")} onFocus={() => setCategory("music")} className="scroll-mt-24">
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-blue-600 flex items-center justify-center">
                    <Headphones className="w-5 h-5 text-white" />
                  </span>
                  <h3 className="mt-4 text-lg font-semibold text-white">Opus Music</h3>
                  <p className="text-xs text-pink-300 mt-0.5">Âm thanh & Lofi 24/7</p>
                  <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                    Radio Lofi, equalizer, Karaoke LRC bắt nhịp. OST Bridge — nghe nhạc rồi nhảy thẳng tới tập phim có đoạn đó.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full border border-pink-400/30 bg-gradient-to-br from-pink-600/40 to-blue-700/30 animate-[spin_8s_linear_infinite] flex items-center justify-center">
                      <div className="w-4 h-4 rounded-full bg-[#070709]" />
                    </div>
                    <div className="flex-1 flex items-end gap-0.5 h-8">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <span
                          key={i}
                          className="flex-1 rounded-sm bg-gradient-to-t from-pink-600 to-blue-400 opacity-80"
                          style={{
                            height: `${30 + ((i * 17) % 70)}%`,
                            animation: `pulse ${0.8 + (i % 5) * 0.15}s ease-in-out infinite alternate`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </Glass>

              {/* Pass */}
              <Glass className="md:col-span-1 lg:col-span-1 p-5 sm:p-6 bg-gradient-to-b from-amber-500/10 to-transparent">
                <div id="pass" onMouseEnter={() => setCategory("idle")} onFocus={() => setCategory("idle")} className="scroll-mt-24">
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                    <Crown className="w-5 h-5 text-white" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-white">Opus Pass</h3>
                  <p className="text-[11px] text-amber-300 mt-0.5">VIP & Arena</p>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    XP, xu sự kiện, streak, Gacha khung viền kính và huy hiệu VIP cá nhân hóa.
                  </p>
                  <div className="mt-3 flex items-center gap-1.5 text-amber-300">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs font-semibold">Season Pass</span>
                  </div>
                </div>
              </Glass>
            </div>
          </div>
        </section>

        {/* ===== SYNERGY ===== */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <Glass className="p-6 sm:p-10" hover={false}>
              <div className="flex items-center gap-2 text-violet-300 text-xs font-medium mb-3">
                <Users className="w-4 h-4" />
                The Synergy Loop
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white max-w-2xl">
                Xem phim thấy OST hay → lưu Opus Music → mở Code làm minigame → rủ bạn trên Chat
              </h2>
              <p className="mt-3 text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Không còn nhảy app liên tục. Mọi thứ nằm trong một vòng trải nghiệm liền mạch:
                giải trí nuôi cảm hứng, code nuôi sản phẩm, chat nuôi cộng đồng, Pass nuôi động lực quay lại mỗi ngày.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Film → Music", "Music → Code", "Code → Chat", "Chat → Watch Party", "Mọi hoạt động → Pass XP"].map(
                  (s) => (
                    <span
                      key={s}
                      className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-zinc-300"
                    >
                      <ChevronRight className="w-3 h-3 text-rose-400" />
                      {s}
                    </span>
                  )
                )}
              </div>
            </Glass>
          </div>
        </section>

        {/* ===== METRICS ===== */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <Glass className="p-6 sm:p-8" hover={false}>
              <h2 className="text-center text-sm font-medium text-zinc-400 mb-8">
                Nhịp đập cộng đồng (minh họa)
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4">
                <Metric label="Giờ phim trực tuyến" value={12840} suffix="+" />
                <Metric label="Tin nhắn tức thì" value={95600} suffix="+" />
                <Metric label="Dòng mã đã chạy" value={40200} suffix="+" />
                <Metric label="XP cộng đồng đã trao" value={218000} suffix="+" />
              </div>
            </Glass>
          </div>
        </section>

        {/* ===== CTA ===== */}
        <section className="px-4 sm:px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <div
              className={cn(
                "relative overflow-hidden rounded-[2rem] border border-white/10 p-8 sm:p-14 text-center",
                "bg-gradient-to-br from-rose-600/20 via-[#0d0e12]/90 to-violet-700/25",
                "backdrop-blur-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] shadow-2xl shadow-black/50"
              )}
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(244,63,94,0.2),transparent_55%)]" />
              <div className="relative">
                <ShieldCheck className="w-10 h-10 text-rose-300 mx-auto mb-4" />
                <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
                  Sẵn sàng bước vào Opus?
                </h2>
                <p className="mt-3 text-sm text-zinc-400 max-w-md mx-auto">
                  Đăng nhập một lần, dùng chung trên điện thoại và máy tính.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/tai-khoan?next=/home"
                    className={cn(
                      "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white",
                      "bg-white text-zinc-900 hover:bg-zinc-100 transition-all shadow-xl",
                      ease
                    )}
                  >
                    Bắt đầu ngay
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/home"
                    className={cn(
                      "w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-medium border border-white/15 bg-black/30 hover:bg-white/5 transition-all",
                      ease
                    )}
                  >
                    Vào trang xem phim
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-white/8 px-4 sm:px-6 py-10">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row gap-8 sm:gap-6 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white">Opus Platform</span>
            </div>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              Giải trí · Kết nối · Sáng tạo. Xây dựng cho người dùng Việt Nam, tối ưu mọi thiết bị.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-zinc-500">
            <div className="space-y-2">
              <p className="text-zinc-300 font-medium">Sản phẩm</p>
              <Link href="/home" className="block hover:text-white transition-colors">Opus Film</Link>
              <Link href="/tin-nhan" className="block hover:text-white transition-colors">Opus Chat</Link>
              <Link href="/code" className="block hover:text-white transition-colors">Opus Code</Link>
              <Link href="/nhac" className="block hover:text-white transition-colors">Opus Music</Link>
            </div>
            <div className="space-y-2">
              <p className="text-zinc-300 font-medium">Tài khoản</p>
              <Link href="/tai-khoan?next=/home" className="block hover:text-white transition-colors">Đăng nhập</Link>
              <Link href="/su-kien" className="block hover:text-white transition-colors">Sự kiện</Link>
              <Link href="/dieu-khoan" className="block hover:text-white transition-colors">Điều khoản</Link>
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <p className="text-zinc-300 font-medium">Hệ thống</p>
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
        <p className="mx-auto max-w-6xl mt-8 text-[11px] text-zinc-600">
          © {new Date().getFullYear()} OpusFilm · Không phải sản phẩm của AI marketing — xây từ trải nghiệm người dùng thật.
        </p>
      </footer>
    </div>
  );
}
