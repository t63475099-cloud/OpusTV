"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAccountStore } from "@/lib/account";

const PUBLIC = [
  "/tai-khoan",
  "/get-key",
  "/bao-tri",
  "/dieu-khoan",
  "/chinh-sach",
  "/admin",
];

function isPublic(path: string) {
  if (path === "/") return true;
  return PUBLIC.some((p) => path === p || path.startsWith(p + "/"));
}

/** Đợi Zustand persist + cookie session trước khi ép đăng nhập. */
function waitAccountHydrated(): Promise<void> {
  const api = useAccountStore.persist;
  if (api?.hasHydrated?.()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = api?.onFinishHydration?.(() => {
      unsub?.();
      resolve();
    });
    // Fallback nếu API không có / hydrate chậm
    window.setTimeout(() => resolve(), 400);
  });
}

/**
 * Bắt buộc đăng nhập mới xem nội dung.
 * Không redirect khi đã có session local (reload) hoặc cookie server còn hạn.
 */
export default function AuthRedirector() {
  const username = useAccountStore((s) => s.username);
  const path = usePathname() || "/";
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await waitAccountHydrated();
      } catch {
        /* ignore */
      }

      // Nếu local đã có username sau hydrate → xong
      if (useAccountStore.getState().username) {
        if (!cancelled) setReady(true);
        return;
      }

      // Thử khôi phục session cookie server (đăng nhập trước đó, reload)
      try {
        await useAccountStore.getState().syncNow();
      } catch {
        /* ignore */
      }

      if (!cancelled) setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (username) return;
    if (isPublic(path)) return;
    const next = encodeURIComponent(path);
    router.replace(`/tai-khoan?next=${next}`);
  }, [ready, username, path, router]);

  return null;
}
