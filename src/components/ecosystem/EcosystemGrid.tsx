"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import {
  Film,
  MessageSquare,
  Code2,
  Music2,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { markEnterSection, type OpusSection } from "@/lib/routeManager";

type CardDef = {
  section: Exclude<OpusSection, "portal">;
  href: string;
  title: string;
  tag: string;
  desc: string;
  icon: typeof Film;
  accent: string;
  rim: string;
};

const CARDS: CardDef[] = [
  {
    section: "film",
    href: "/home",
    title: "Opus Film",
    tag: "Cinema",
    desc: "Phim bộ, phim lẻ, nhiều thể loại. Xem tiếp đúng tập đang dở.",
    icon: Film,
    accent: "from-rose-600/25 via-transparent to-amber-500/10",
    rim: "hover:shadow-[0_0_40px_rgba(244,63,94,0.25)]",
  },
  {
    section: "chat",
    href: "/tin-nhan",
    title: "Opus Chat",
    tag: "Social",
    desc: "Tin nhắn, nhóm và gọi — cùng tài khoản với phần còn lại.",
    icon: MessageSquare,
    accent: "from-indigo-600/25 via-transparent to-violet-500/10",
    rim: "hover:shadow-[0_0_40px_rgba(99,102,241,0.25)]",
  },
  {
    section: "code",
    href: "/code",
    title: "Opus Code",
    tag: "Dev",
    desc: "Soạn thảo, chạy thử và kho snippet ngay trên trình duyệt.",
    icon: Code2,
    accent: "from-cyan-600/25 via-transparent to-emerald-500/10",
    rim: "hover:shadow-[0_0_40px_rgba(6,182,212,0.25)]",
  },
  {
    section: "music",
    href: "/nhac",
    title: "Opus Music",
    tag: "Audio",
    desc: "Nhạc nền và playlist, tiếp tục từ mốc đã nghe.",
    icon: Music2,
    accent: "from-pink-600/25 via-transparent to-blue-500/10",
    rim: "hover:shadow-[0_0_40px_rgba(236,72,153,0.25)]",
  },
];

function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  const loop = () => {
    const el = ref.current;
    if (!el) return;
    rot.current.x += (target.current.x - rot.current.x) * 0.12;
    rot.current.y += (target.current.y - rot.current.y) * 0.12;
    el.style.transform = `perspective(900px) rotateX(${rot.current.x}deg) rotateY(${rot.current.y}deg) translateZ(0)`;
    raf.current = requestAnimationFrame(loop);
  };

  return (
    <div
      ref={ref}
      className={cn("will-change-transform h-full", className)}
      onMouseEnter={() => {
        cancelAnimationFrame(raf.current);
        raf.current = requestAnimationFrame(loop);
      }}
      onMouseLeave={() => {
        target.current = { x: 0, y: 0 };
      }}
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        target.current.y = px * 10;
        target.current.x = -py * 8;
      }}
    >
      {children}
    </div>
  );
}

export default function EcosystemGrid() {
  return (
    <div className="w-full max-w-6xl mx-auto px-[clamp(1rem,3vw,1.5rem)]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[clamp(0.75rem,2vw,1.25rem)]">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <TiltCard key={c.section}>
              <Link
                href={c.href}
                onClick={() => markEnterSection(c.section)}
                className={cn(
                  "group relative flex flex-col h-full min-h-[200px] sm:min-h-[220px] overflow-hidden rounded-2xl sm:rounded-3xl",
                  "border border-white/[0.1] bg-white/[0.04] backdrop-blur-2xl",
                  "shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]",
                  "transition-shadow duration-500",
                  c.rim
                )}
              >
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-90 pointer-events-none",
                    c.accent
                  )}
                />
                {/* rim light */}
                <div className="pointer-events-none absolute inset-px rounded-2xl sm:rounded-3xl border border-white/[0.06] group-hover:border-white/15 transition-colors duration-500" />

                <div className="relative z-10 flex flex-col flex-1 p-[clamp(1.1rem,3vw,1.5rem)]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium px-2 py-0.5 rounded-full border border-white/10 bg-black/20">
                        {c.tag}
                      </span>
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white tracking-tight">
                    {c.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-400 leading-relaxed flex-1">
                    {c.desc}
                  </p>
                  <span className="mt-4 inline-flex text-xs font-medium text-zinc-300 group-hover:text-white transition-colors duration-500">
                    Vào {c.title} →
                  </span>
                </div>
              </Link>
            </TiltCard>
          );
        })}
      </div>

      {/* Pass strip */}
      <TiltCard className="mt-[clamp(0.75rem,2vw,1.25rem)]">
        <Link
          href="/su-kien"
          onClick={() => markEnterSection("pass")}
          className={cn(
            "group relative flex flex-col sm:flex-row sm:items-center gap-4 overflow-hidden rounded-2xl sm:rounded-3xl",
            "border border-amber-400/15 bg-white/[0.04] backdrop-blur-2xl",
            "p-[clamp(1.1rem,3vw,1.5rem)]",
            "hover:shadow-[0_0_40px_rgba(245,158,11,0.2)] transition-shadow duration-500"
          )}
        >
          <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white">Opus Pass</h3>
            <p className="text-sm text-zinc-400 mt-0.5">
              Sự kiện, chuỗi điểm danh và phần thưởng theo mùa.
            </p>
          </div>
          <span className="text-sm text-amber-200/90 group-hover:text-amber-100 shrink-0">
            Mở Pass →
          </span>
        </Link>
      </TiltCard>
    </div>
  );
}
