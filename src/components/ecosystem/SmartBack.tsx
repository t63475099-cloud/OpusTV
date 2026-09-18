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
      data-smart-back="1"
      className={cn(
        "opus-smart-back",
        onWatch ? "opus-smart-back--watch" : "opus-smart-back--page",
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );

  return createPortal(btn, document.body);
}
