"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Ẩn Navbar + Sidebar trên landing, cài đặt, tài khoản, admin, khóa… */
const HIDE_PREFIXES = [
  "/cai-dat",
  "/tai-khoan",
  "/admin",
  "/bi-khoa",
  "/hop-thu",
  "/dieu-khoan",
  "/chinh-sach",
  "/faq",
  "/bao-tri",
];

export default function ChromeGuard() {
  const path = usePathname() || "";

  useEffect(() => {
    const hide =
      path === "/" ||
      HIDE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
    const root = document.documentElement;
    if (hide) {
      root.classList.add("opus-chrome-hide");
      document.body.classList.add("opus-chrome-hide-body");
    } else {
      root.classList.remove("opus-chrome-hide");
      document.body.classList.remove("opus-chrome-hide-body");
    }
    return () => {
      root.classList.remove("opus-chrome-hide");
      document.body.classList.remove("opus-chrome-hide-body");
    };
  }, [path]);

  return null;
}
