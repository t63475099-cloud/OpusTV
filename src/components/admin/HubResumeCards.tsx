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
  ChevronRight,
} from "lucide-react";
import GlassCard from "./GlassCard";

type Hub = {
  href: string;
  title: string;
  sub: string;
  icon: typeof Clapperboard;
  accent: "rose" | "violet" | "sky" | "amber" | "emerald";
  cta: string;
};

const HUBS: Hub[] = [
  {
    href: "/admin/verify",
    title: "Kiểm duyệt",
    sub: "Tích xanh · Chuỗi · Xu · Khóa tài khoản",
    icon: ShieldAlert,
    accent: "rose",
    cta: "Mở verify",
  },
  {
    href: "/",
    title: "Opus Film",
    sub: "Trang chủ phim & báo lỗi nguồn phát",
    icon: Clapperboard,
    accent: "rose",
    cta: "Xem web",
  },
  {
    href: "/nhac",
    title: "Opus Music",
    sub: "Nhạc nền / playlist người dùng",
    icon: Music2,
    accent: "violet",
    cta: "Mở nhạc",
  },
  {
    href: "/code",
    title: "Opus Code",
    sub: "Môi trường lập trình trên web",
    icon: Code2,
    accent: "emerald",
    cta: "Mở code",
  },
  {
    href: "/tin-nhan",
    title: "Opus Chat",
    sub: "Tin nhắn, nhóm & cuộc gọi",
    icon: MessageSquare,
    accent: "sky",
    cta: "Mở chat",
  },
  {
    href: "/admin/verify",
    title: "Tài khoản",
    sub: "Danh sách UID cập nhật realtime",
    icon: Users,
    accent: "amber",
    cta: "Danh sách",
  },
];

export default function HubResumeCards() {
  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {HUBS.map((h) => {
        const Icon = h.icon;
        return (
          <GlassCard key={h.title + h.href} className="p-4 group" accent={h.accent}>
            <div className="flex items-start gap-3.5">
              <span className="w-12 h-12 rounded-2xl bg-white/[0.07] border border-white/10 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform duration-500">
                <Icon className="w-5 h-5 text-white" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-white leading-tight">
                  {h.title}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                  {h.sub}
                </p>
                <Link
                  href={h.href}
                  className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-rose-300 group-hover:text-rose-200 transition-colors duration-500"
                >
                  <Play className="w-3 h-3 fill-current" />
                  {h.cta}
                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                </Link>
              </div>
            </div>
          </GlassCard>
        );
      })}
    </div>
  );
}
