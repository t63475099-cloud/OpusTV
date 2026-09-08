"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Film,
  Tv,
  Flame,
  Music,
  Code,
  MessageSquare,
  Gift,
  Settings,
  X,
  Clock,
  Heart,
  Sparkles,
} from "lucide-react";

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  expandable?: boolean;
  className?: string;
  [key: string]: any;
}

const navItems = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/moi-cap-nhat", label: "Mới cập nhật", icon: Sparkles },
  { href: "/phim-bo", label: "Phim bộ", icon: Tv },
  { href: "/phim-le", label: "Phim lẻ", icon: Film },
  { href: "/da-xem", label: "Đã xem", icon: Clock },
  { href: "/yeu-thich", label: "Yêu thích", icon: Heart },
  { href: "/music", label: "Opus Music", icon: Music },
  { href: "/code", label: "Opus Code", icon: Code },
  { href: "/tin-nhan", label: "Opus Chat", icon: MessageSquare },
  { href: "/su-kien", label: "Sự kiện", icon: Gift },
  { href: "/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function Sidebar({
  isOpen = false,
  onClose = () => {},
  expandable = false,
  className = "",
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop overlay trên mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Container Sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-neutral-950 border-r border-neutral-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${className}`}
      >
        {/* Header Sidebar */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-neutral-800">
          <Link href="/" className="flex items-center gap-2" onClick={onClose}>
            <span className="text-xl font-black bg-gradient-to-r from-red-500 to-rose-500 bg-clip-text text-transparent">
              OpusTV
            </span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 lg:hidden transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Menu danh sách điều hướng */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-red-600/10 text-red-500 border border-red-500/20"
                    : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-red-500" : "text-neutral-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}

export { Sidebar };
