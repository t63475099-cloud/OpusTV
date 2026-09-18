"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  getActiveSection,
  isSectionRoot,
  SECTION_HOME,
  type OpusSection,
} from "@/lib/routeManager";

/**
 * Khi đang trong một mảng (film/chat/code/…), nếu history Back đưa về "/"
 * thì ép quay lại trang chủ mảng — chỉ về Hub khi user bấm logo Cổng / link cố ý.
 */
export default function SectionRouteGuard() {
  const path = usePathname() || "/";
  const router = useRouter();
  const sectionRef = useRef<OpusSection>("portal");

  useEffect(() => {
    const s = getActiveSection();
    if (s !== "portal") sectionRef.current = s;
  }, [path]);

  useEffect(() => {
    const onPopState = () => {
      // Defer until Next has applied the new path
      requestAnimationFrame(() => {
        const now = window.location.pathname || "/";
        if (now !== "/" && now !== "") return;

        const sec = sectionRef.current;
        if (sec === "portal") return;

        const home = SECTION_HOME[sec as keyof typeof SECTION_HOME];
        if (home) {
          router.replace(home);
        }
      });
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [router]);

  // Soft lock: if somehow rendered portal while section mark exists and referrer was in-app
  useEffect(() => {
    if (path !== "/" && path !== "") return;
    try {
      const mark = sessionStorage.getItem("opus-nav-section");
      const lock = sessionStorage.getItem("opus-section-lock");
      if (lock === "1" && mark && mark !== "portal") {
        const home = SECTION_HOME[mark as keyof typeof SECTION_HOME];
        if (home) {
          sessionStorage.removeItem("opus-section-lock");
          router.replace(home);
        }
      }
    } catch {
      /* */
    }
  }, [path, router]);

  return null;
}
