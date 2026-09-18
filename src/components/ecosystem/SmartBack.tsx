"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { resolveSmartBack, isSectionRoot, getActiveSection } from "@/lib/routeManager";
import { cn } from "@/lib/utils";

/**
 * Nút Back thông minh + đồng bộ khi user bấm back trình duyệt từ deep link
 * (không ép popstate — chỉ gợi ý UI; deep routes dùng nút này hoặc link section home).
 */
export default function SmartBack({ className }: { className?: string }) {
  const path = usePathname() || "/";
  const router = useRouter();

  const section = typeof window !== "undefined" ? getActiveSection() : "portal";
  const hide =
    path === "/" ||
    path.startsWith("/tai-khoan") ||
    path.startsWith("/admin") ||
    path.startsWith("/bao-tri") ||
    path.startsWith("/get-key");

  const onBack = useCallback(() => {
    const dest = resolveSmartBack(path);
    router.push(dest);
  }, [path, router]);

  useEffect(() => {
    // Ghi section theo path khi user vào sâu trong app (không qua portal)
    try {
      if (path.startsWith("/tin-nhan")) sessionStorage.setItem("opus-nav-section", "chat");
      else if (path.startsWith("/code")) sessionStorage.setItem("opus-nav-section", "code");
      else if (path.startsWith("/nhac")) sessionStorage.setItem("opus-nav-section", "music");
      else if (path.startsWith("/su-kien")) sessionStorage.setItem("opus-nav-section", "pass");
      else if (
        path.startsWith("/home") ||
        path.startsWith("/phim") ||
        path.startsWith("/the-loai") ||
        path.startsWith("/danh-sach")
      ) {
        sessionStorage.setItem("opus-nav-section", "film");
      }
    } catch {
      /* */
    }
  }, [path]);

  if (hide) return null;

  const label =
    !isSectionRoot(path) && section !== "portal"
      ? "Về trang chính mục"
      : "Về cổng Opus";

  return (
    <button
      type="button"
      onClick={onBack}
      className={cn(
        "fixed z-[55] left-3 sm:left-4 bottom-[max(1rem,env(safe-area-inset-bottom))]",
        "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium",
        "border border-white/12 bg-black/50 backdrop-blur-xl text-zinc-200",
        "hover:bg-black/70 hover:text-white shadow-lg shadow-black/40 transition-colors",
        "lg:left-auto lg:right-4",
        className
      )}
      aria-label={label}
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
