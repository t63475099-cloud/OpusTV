"use client";

import Link from "next/link";
import {
  Clapperboard,
  Music2,
  Code2,
  Play,
  MessageSquare,
  Users,
  ShieldAlert,
} from "lucide-react";
import GlassCard from "./GlassCard";

type Hub = {
  href: string;
  title: string;
  sub: string;
  icon: typeof Clapperboard;
  accent: string;
  cta: string;
};

const HUBS: Hub[] = [
  {
    href: "/admin/verify",
    title: "Kiểm duyệt",
    sub: "Tích xanh · Chuỗi · Xu · Khóa",
    icon: ShieldAlert,
    accent: "from-rose-500/20 to-transparent",
    cta: "Mở verify",
  },
  {
    href: "/",
    title: "Opus Film",
    sub: "Trang chủ phim & báo lỗi nguồn",
    icon: Clapperboard,
    accent: "from-red-500/20 to-transparent",
    cta: "Xem web",
  },
  {
    href: "/nhac",
    title: "Opus Music",
    sub: "Nhạc nền / playlist người dùng",
    icon: Music2,
    accent: "from-violet-500/20 to-transparent",
    cta: "Mở nhạc",
  },
  {
    href: "/code",
    title: "Opus Code",
    sub: "Môi trường code trên web",
    icon: Code2,
    accent: "from-emerald-500/20 to-transparent",
    cta: "Mở code",
  },
  {
    href: "/tin-nhan",
    title: "Opus Chat",
    sub: "Tin nhắn & nhóm",
    icon: MessageSquare,
    accent: "from-sky-500/20 to-transparent",
    cta: "Mở chat",
  },
  {
    href: "/admin/verify",
    title: "Tài khoản",
    sub: "Danh sách UID realtime",
    icon: Users,
    accent: "from-amber-500/20 to-transparent",
    cta: "Danh sách",
  },
];

export default function HubResumeCards() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {HUBS.map((h) => {
        const Icon = h.icon;
        return (
          <GlassCard key={h.title + h.href} className="p-4 relative overflow-hidden">
            <div
              className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${h.accent}`}
            />
            <div className="relative flex items-start gap-3">
              <span className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white/90" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">{h.title}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{h.sub}</p>
                <Link
                  href={h.href}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-sky-300 hover:text-sky-200 transition-all duration-500"
                >
                  <Play className="w-3 h-3" />
                  {h.cta}
                </Link>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
