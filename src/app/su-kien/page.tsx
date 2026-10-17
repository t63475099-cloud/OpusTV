"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { openComingSoon } from "@/components/ComingSoonModal";
import { Clock } from "lucide-react";

export default function LockedFeaturePage() {
  const router = useRouter();

  useEffect(() => {
    openComingSoon(
      "Sắp ra mắt",
      "Opus Event đang được hoàn thiện. Toàn bộ tính năng liên quan tạm khóa."
    );
  }, []);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Clock className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h1 className="text-xl font-semibold text-foreground">Sắp ra mắt</h1>
      <p className="max-w-md text-sm text-foreground-muted">
        Opus Event và các tính năng liên quan đang khóa. Vui lòng quay lại sau.
      </p>
      <button
        type="button"
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        onClick={() => router.push("/home")}
      >
        Về trang chủ
      </button>
    </div>
  );
}
