"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccountStore } from "@/lib/account";

/**
 * Bắt buộc đăng nhập trước khi xem nội dung (phim / trang chủ xem).
 * Redirect tới /tai-khoan?next=...
 */
export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const username = useAccountStore((s) => s.username);
  const pathname = usePathname() || "/";
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (username) return;
    const next = encodeURIComponent(pathname + (typeof window !== "undefined" ? window.location.search : ""));
    router.replace(`/tai-khoan?next=${next}`);
  }, [ready, username, pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-zinc-500 text-sm">
        Đang tải…
      </div>
    );
  }

  if (!username) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-zinc-400 text-sm px-4 text-center">
        Cần đăng nhập để tiếp tục…
      </div>
    );
  }

  return <>{children}</>;
}
