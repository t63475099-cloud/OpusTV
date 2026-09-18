"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * Chỉ hiện trên trang xem phim — cố định góc trên trái khung player (dưới header),
 * không trôi theo scroll.
 */
export default function SmartBack() {
  const path = usePathname() || "/";
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const onWatch = path.startsWith("/phim/");

  useEffect(() => setMounted(true), []);

  const onBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/home");
  }, [router]);

  if (!mounted || !onWatch) return null;

  return createPortal(
    <button
      type="button"
      onClick={onBack}
      aria-label="Quay lại"
      data-smart-back="1"
      className="opus-smart-back opus-smart-back--watch"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>,
    document.body
  );
}
