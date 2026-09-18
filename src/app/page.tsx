import { redirect } from "next/navigation";

/** Trang giới thiệu đã gỡ — vào thẳng trang chủ phim */
export default function RootPage() {
  redirect("/home");
}
