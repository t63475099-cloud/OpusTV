"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import {
  resolveSmartBack,
  isSectionRoot,
  getActiveSection,
  SECTION_HOME,
} from "@/lib/routeManager";
import { cn } from "@/lib/utils";

export default function SmartBack({ className }: { className?: string }) {
  const path = usePathname() || "/";
  const router = useRouter();

  // Ẩn trên: portal, admin, trang chủ mảng, trang xem phim
  const hide =
    path === "/" ||
    path.startsWith("/admin") ||
    path.startsWith("/bao-tri") ||
    path.startsWith("/get-key") ||
    path.startsWith("/phim/") ||
    isSectionRoot(path);

  const onBack = useCallback(() => {
    const dest = resolveSmartBack(path);
    if (dest) {
      router.push(dest);
      return;
    }
    // Không bao giờ về "/" — về trang chủ mảng
    const section = getActiveSection();
    if (section !== "portal" && section in SECTION_HOME) {
      router.push(SECTION_HOME[section as keyof typeof SECTION_HOME]);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    }
  }, [path, router]);

  if (hide) return null;

  return (
    <button
      type="button"
      onClick={onBack}
      aria-label="Quay lại"
      className={cn(
        "fixed z-[55] left-[max(0.75rem,env(safe-area-inset-left))] sm:left-4",
        "top-[max(3.75rem,calc(env(safe-area-inset-top)+2.85rem))]",
        "flex h-9 w-9 items-center justify-center rounded-full",
        "border border-white/12 bg-black/50 backdrop-blur-xl text-white",
        "hover:bg-white/10 transition-colors duration-300",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
