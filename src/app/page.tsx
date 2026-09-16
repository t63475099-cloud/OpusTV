"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  Play,
  MessageSquare,
  Code2,
  Music2,
  ArrowRight,
  Film,
  Crown,
  Users,
  Infinity as InfinityIcon,
} from "lucide-react";
import KineticHeadline from "@/components/landing/KineticHeadline";
import ParallaxBanner from "@/components/landing/ParallaxBanner";
import { cn } from "@/lib/utils";

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
        "relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/[0.1]",
        "bg-white/[0.045] backdrop-blur-2xl",
        "shadow-[inset_0_1px_1px_rgba(255,255,255,0.14)] shadow-2xl shadow-black/50",
        `transition-all ${ease}`,
        hover && "hover:-translate-y-1 hover:border-white/[0.16] hover:bg-white/[0.07]",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Nền gradient violet → azure + light orbs */
function AmbientBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 15% 10%, rgba(91,33,182,0.45), transparent 55%), radial-gradient(ellipse 80% 60% at 85% 20%, rgba(37,99,235,0.35), transparent 50%), radial-gradient(ellipse 70% 50% at 50% 90%, rgba(14,165,233,0.2), transparent 45%), linear-gradient(165deg, #0b0618 0%, #0c1228 42%, #0a1628 100%)",
        }}
      />
      <div className="absolute -top-24 left-1/4 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-[120px] animate-pulse" />
      <div
        className="absolute top-1/3 -right-20 h-[22rem] w-[22rem] rounded-full bg-sky-500/20 blur-[100px]"
        style={{ animation: "pulse 8s ease-in-out infinite" }}
      />
      <div className="absolute bottom-0 left-1/3 h-[18rem] w-[18rem] rounded-full bg-indigo-500/15 blur-[90px]" />
      {/* soft grid */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />
    </div>
  );
}

const SERVICES = [
  {
    id: "film",
    title: "Opus Film",
    line: "Phim truyện, Series & Hơn thế nữa.",
    desc: "Phòng chiếu gọn trên trình duyệt — phim bộ, phim lẻ, nhiều thể loại. Chọn tập, server dự phòng khi nguồn lỗi.",
    href: "/home",
    accent: "from-rose-600/50 via-orange-500/20 to-transparent",
    icon: Film,
    iconBg: "from-rose-500 to-amber-500",
    preview: "film" as const,
  },
  {
    id: "chat",
    title: "Opus Chat",
    line: "Trò chuyện & Gọi video không giới hạn.",
    desc: "Tin nhắn, nhóm, gọi thoại và video trong cùng tài khoản. Avatar và trạng thái online đồng bộ.",
    href: "/tin-nhan",
    accent: "from-indigo-600/50 via-violet-500/20 to-transparent",
    icon: MessageSquare,
    iconBg: "from-indigo-500 to-violet-600",
    preview: "chat" as const,
  },
  {
    id: "code",
    title: "Opus Code",
    line: "Lập trình tương tác & Cộng tác.",
    desc: "Soạn thảo đa ngôn ngữ, chạy thử nhanh, kho snippet và phòng code đôi khi cần làm việc cùng nhau.",
    href: "/code",
    accent: "from-cyan-600/45 via-emerald-500/15 to-transparent",
    icon: Code2,
    iconBg: "from-cyan-500 to-emerald-500",
    preview: "code" as const,
  },
  {
    id: "music",
    title: "Opus Music",
    line: "Âm thanh & Lofi 24/7.",
    desc: "Nghe nhạc nền, playlist và tiếp tục từ mốc đã dừng — gọn trong cùng hệ sinh thái.",
    href: "/nhac",
    accent: "from-pink-600/45 via-blue-500/15 to-transparent",
    icon: Music2,
    iconBg: "from-pink-500 to-blue-500",
    preview: "music" as const,
  },
];

function ServicePreview({ kind }: { kind: "film" | "chat" | "code" | "music" }) {
  if (kind === "film") {
    return (
      <div className="relative h-full min-h-[140px] rounded-xl overflow-hidden bg-black/50 border border-white/10">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-900/50 via-zinc-900 to-amber-900/30" />
        <div className="absolute inset-3 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg bg-white/5 border border-white/10 overflow-hidden"
              style={{ opacity: 1 - i * 0.15 }}
            >
              <div className={cn("h-full w-full bg-gradient-to-b", i === 0 ? "from-rose-500/40 to-transparent" : "from-white/10 to-transparent")} />
            </div>
          ))}
        </div>
        <Play className="absolute bottom-3 right-3 w-8 h-8 text-white/90 drop-shadow-lg" />
      </div>
    );
  }
  if (kind === "chat") {
    return (
      <div className="relative h-full min-h-[140px] rounded-xl bg-black/40 border border-white/10 p-3 flex flex-col justify-end gap-2">
        <div className="flex items-end gap-2">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 shrink-0 border border-white/20" />
          <div className="rounded-2xl rounded-bl-md bg-white/10 border border-white/10 px-3 py-2 text-[11px] text-zinc-200 max-w-[75%]">
            Xem tập mới chưa?
          </div>
        </div>
        <div className="flex items-end gap-2 justify-end">
          <div className="rounded-2xl rounded-br-md bg-indigo-600/50 border border-indigo-400/20 px-3 py-2 text-[11px] text-white max-w-[75%]">
            Đang vào phòng chat
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-emerald-300/90">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Đang gọi…
        </div>
      </div>
    );
  }
  if (kind === "code") {
    return (
      <div className="relative h-full min-h-[140px] rounded-xl bg-[#0d1117] border border-white/10 p-3 font-mono text-[10px] sm:text-[11px] leading-relaxed overflow-hidden">
        <div className="text-zinc-500 mb-1">// pair · cursor B</div>
        <div>
          <span className="text-pink-400">const</span>{" "}
          <span className="text-sky-300">room</span>{" "}
          <span className="text-zinc-400">=</span>{" "}
          <span className="text-amber-300">&quot;opus-42&quot;</span>
        </div>
        <div>
          <span className="text-pink-400">function</span>{" "}
          <span className="text-violet-300">run</span>
          <span className="text-zinc-300">()</span>{" "}
          <span className="text-zinc-400">{"{"}</span>
        </div>
        <div className="pl-3 text-emerald-300/90">return preview(live)</div>
        <div className="text-zinc-400">{"}"}</div>
        <div className="absolute top-2 right-2 w-2 h-4 bg-cyan-400/80 animate-pulse" title="remote cursor" />
      </div>
    );
  }
  // music
  return (
    <div className="relative h-full min-h-[140px] rounded-xl bg-black/45 border border-white/10 flex items-center justify-center gap-6 overflow-hidden">
      <div className="relative w-20 h-20 rounded-full border-4 border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-inner">
        <div className="absolute inset-3 rounded-full border border-pink-500/40 bg-gradient-to-br from-pink-600/30 to-blue-600/20 animate-[spin_12s_linear_infinite]" />
        <div className="absolute inset-[38%] rounded-full bg-zinc-900 border border-white/10" />
      </div>
      <div className="flex items-end gap-0.5 h-12">
        {[4, 9, 6, 12, 7, 11, 5, 10, 8, 13, 6, 9].map((h, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-gradient-to-t from-pink-500 to-sky-400"
            style={{
              height: `${h * 4}px`,
              animation: `pulse ${1.2 + (i % 5) * 0.15}s ease-in-out infinite`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-[100dvh] text-zinc-100 relative overflow-x-hidden">
      <AmbientBackdrop />

      {/* ===== HEADER ===== */}
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-[60] transition-all pt-[env(safe-area-inset-top,0px)]",
          ease,
          scrolled
            ? "bg-[#0b0618]/80 backdrop-blur-2xl border-b border-white/10 shadow-lg shadow-black/30"
            : "bg-transparent"
        )}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 flex items-center justify-center shadow-lg shadow-violet-900/40">
              <InfinityIcon className="w-5 h-5 text-white" strokeWidth={2.25} />
            </span>
            <span className="font-bold text-lg tracking-tight text-white">Opus</span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-sm text-zinc-300">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/8 transition-all"
            >
              Trang chủ
            </Link>
            <Link
              href="/tai-khoan?next=/home"
              className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/8 transition-all"
            >
              Trải nghiệm ngay
            </Link>
            <a
              href="#cong-dong"
              className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/8 transition-all"
            >
              Cộng đồng
            </a>
          </nav>

          <Link
            href="/tai-khoan?next=/home"
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full text-sm font-semibold text-white shrink-0",
              "bg-gradient-to-r from-violet-600 to-sky-500 hover:brightness-110",
              "shadow-lg shadow-violet-900/35 border border-white/10 transition-all",
              ease
            )}
          >
            Bắt đầu
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main>
        {/* ===== HERO ===== */}
        <section
          className={cn(
            "relative px-4 sm:px-6",
            "pt-[calc(5.75rem+env(safe-area-inset-top,0px))] sm:pt-[calc(7rem+env(safe-area-inset-top,0px))]",
            "pb-14 sm:pb-20"
          )}
        >
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-3xl mx-auto">
              <KineticHeadline
                text="Hệ sinh thái duy nhất. Trải nghiệm liền mạch."
                className="!text-[1.65rem] sm:!text-4xl md:!text-5xl lg:!text-6xl !leading-[1.25] !whitespace-normal"
              />
              <p className="mt-5 sm:mt-6 text-sm sm:text-base text-zinc-300/90 leading-relaxed max-w-xl mx-auto">
                Hệ sinh thái 5-trong-1. Thay thế 5 ứng dụng rời rạc.
              </p>

              {/* five panes strip */}
              <ParallaxBanner className="mt-10 sm:mt-12" strength={18}>
                <Glass className="p-3 sm:p-4" hover={false}>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                    {[
                      { icon: Film, label: "Film", c: "from-rose-500/30 to-amber-500/10" },
                      { icon: MessageSquare, label: "Chat", c: "from-indigo-500/30 to-violet-500/10" },
                      { icon: Code2, label: "Code", c: "from-cyan-500/30 to-emerald-500/10" },
                      { icon: Music2, label: "Music", c: "from-pink-500/30 to-blue-500/10" },
                      { icon: Crown, label: "Pass", c: "from-amber-500/30 to-yellow-500/10" },
                    ].map((p) => (
                      <div
                        key={p.label}
                        className={cn(
                          "rounded-xl border border-white/10 bg-gradient-to-b p-3 sm:p-4 min-h-[72px] flex flex-col items-center justify-center gap-1.5",
                          p.c
                        )}
                      >
                        <p.icon className="w-5 h-5 text-white/90" />
                        <span className="text-[11px] font-medium text-zinc-200">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </Glass>
              </ParallaxBanner>

              <div className="mt-8 flex justify-center">
                <Link
                  href="/tai-khoan?next=/home"
                  className={cn(
                    "inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl text-sm font-semibold text-white",
                    "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-sky-500",
                    "hover:brightness-110 shadow-xl shadow-violet-900/40 border border-white/15 transition-all",
                    ease
                  )}
                >
                  Khám phá Vũ trụ
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===== SERVICE BANNERS (F-pattern) ===== */}
        <section className="px-4 sm:px-6 pb-16 sm:pb-24 space-y-5 sm:space-y-6">
          <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <ParallaxBanner key={s.id} strength={14}>
                  <Glass className="p-0" hover>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
                      <div className={cn("relative p-5 sm:p-7 bg-gradient-to-br", s.accent)}>
                        <div className="flex items-center gap-3 mb-3">
                          <span
                            className={cn(
                              "w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg",
                              s.iconBg
                            )}
                          >
                            <Icon className="w-5 h-5 text-white" />
                          </span>
                          <div>
                            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                            <p className="text-sm text-zinc-200/95 mt-0.5">{s.line}</p>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-400 leading-relaxed max-w-md">{s.desc}</p>
                        <Link
                          href={s.href}
                          className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/90 hover:text-white transition-colors"
                        >
                          Mở {s.title}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                      <div className="p-4 sm:p-5 md:border-l border-white/8">
                        <ServicePreview kind={s.preview} />
                      </div>
                    </div>
                  </Glass>
                </ParallaxBanner>
              );
            })}

            {/* Opus Pass — receding */}
            <ParallaxBanner strength={10}>
              <Glass className="p-5 sm:p-7 bg-gradient-to-r from-amber-500/10 via-transparent to-violet-500/10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0">
                      <Crown className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Opus Pass</h2>
                      <p className="text-sm text-amber-100/90 mt-0.5">Mùa hiện tại · theo dõi XP & phần thưởng</p>
                      <p className="mt-2 text-sm text-zinc-400 max-w-lg leading-relaxed">
                        Tiến trình sự kiện, chuỗi điểm danh và quà trong mùa — gắn với tài khoản của bạn trên mọi thiết bị.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <div className="rounded-2xl border border-amber-400/20 bg-black/30 px-4 py-3 text-center min-w-[88px]">
                      <p className="text-lg font-bold text-amber-200 tabular-nums">S2</p>
                      <p className="text-[10px] text-zinc-500">Mùa</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center min-w-[88px]">
                      <p className="text-lg font-bold text-white tabular-nums">XP</p>
                      <p className="text-[10px] text-zinc-500">Tiến trình</p>
                    </div>
                    <Link
                      href="/su-kien"
                      className="self-center inline-flex items-center gap-1 text-sm font-medium text-amber-200 hover:text-white"
                    >
                      Xem Pass
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </Glass>
            </ParallaxBanner>
          </div>
        </section>

        {/* Cộng đồng */}
        <section id="cong-dong" className="px-4 sm:px-6 pb-20 scroll-mt-24">
          <div className="mx-auto max-w-6xl">
            <Glass className="p-6 sm:p-8 text-center" hover={false}>
              <Users className="w-8 h-8 text-sky-300 mx-auto mb-3" />
              <h2 className="text-xl font-semibold text-white">Cộng đồng Opus</h2>
              <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Một tài khoản cho phim, chat, code và nhạc. Đăng nhập để đồng bộ dữ liệu giữa các thiết bị.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/tai-khoan?next=/home"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-semibold text-white bg-white/10 border border-white/15 hover:bg-white/15 transition-all"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/home"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium text-zinc-200 border border-white/10 hover:bg-white/5 transition-all"
                >
                  Vào xem phim
                </Link>
              </div>
            </Glass>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-zinc-500">
        <p className="font-medium text-zinc-400">Opus</p>
        <p className="mt-1">Film · Chat · Code · Music · Pass</p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-zinc-500">
          <Link href="/home" className="hover:text-zinc-300">
            Film
          </Link>
          <Link href="/tin-nhan" className="hover:text-zinc-300">
            Chat
          </Link>
          <Link href="/code" className="hover:text-zinc-300">
            Code
          </Link>
          <Link href="/nhac" className="hover:text-zinc-300">
            Music
          </Link>
          <Link href="/su-kien" className="hover:text-zinc-300">
            Pass
          </Link>
          <Link href="/dieu-khoan" className="hover:text-zinc-300">
            Điều khoản
          </Link>
        </div>
      </footer>
    </div>
  );
}
