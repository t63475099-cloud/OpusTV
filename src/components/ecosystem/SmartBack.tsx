"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
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
  const [mounted, setMounted] = useState(false);
  const onWatch = path.startsWith("/phim/");

  useEffect(() => setMounted(true), []);

  // Ẩn trên portal / admin / root mảng — vẫn hiện khi xem phim
  const hide =
    path === "/" ||
    path.startsWith("/admin") ||
    path.startsWith("/bao-tri") ||
    path.startsWith("/get-key") ||
    (!onWatch && isSectionRoot(path));

  const onBack = useCallback(() => {
    if (onWatch) {
      if (typeof window !== "undefined" && window.history.length > 1) {
        router.back();
        return;
      }
      router.push("/home");
      return;
    }
    const dest = resolveSmartBack(path);
    if (dest) {
      router.push(dest);
      return;
    }
    const section = getActiveSection();
    if (section !== "portal" && section in SECTION_HOME) {
      router.push(SECTION_HOME[section as keyof typeof SECTION_HOME]);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    }
  }, [path, router, onWatch]);

  if (!mounted || hide) return null;

  const btn = (
    <button
      type="button"
      onClick={onBack}
      aria-label="Quay lại"
      className={cn(
        "opus-smart-back fixed z-[70] left-[max(0.75rem,env(safe-area-inset-left))]",
        onWatch
          ? "top-[max(0.65rem,calc(env(safe-area-inset-top,0px)+0.5rem))]"
          : "top-[max(3.75rem,calc(env(safe-area-inset-top,0px)+2.85rem))]",
        "flex h-10 w-10 items-center justify-center rounded-full",
        "border border-white/20 bg-black/55 backdrop-blur-xl text-white shadow-lg",
        "hover:bg-white/15 active:scale-95 transition-colors duration-300",
        className
      )}
      style={{
        // Ép fixed theo viewport — không bị transform của parent kéo theo
        position: "fixed",
        transform: "none",
      }}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );

  // Portal ra body để tránh transform/filter của GsapScrollProvider làm hỏng fixed
  return createPortal(btn, document.body);
}
