"use client";

import { useEffect } from "react";
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

/** Bắt buộc đăng nhập mới xem được nội dung (trừ trang public). */
export default function AuthRedirector() {
  const username = useAccountStore((s) => s.username);
  const path = usePathname() || "/";
  const router = useRouter();

  useEffect(() => {
    if (username) return;
    if (isPublic(path)) return;
    const next = encodeURIComponent(path);
    router.replace(`/tai-khoan?next=${next}`);
  }, [username, path, router]);

  return null;
}
