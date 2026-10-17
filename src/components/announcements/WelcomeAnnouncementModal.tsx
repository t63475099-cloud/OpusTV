"use client";

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { usePathname } from "next/navigation";

type Announcement = {
  id: number;
  title: string;
  content: string;
  image_url: string;
  link_action: string;
};

const DISMISS_KEY = "opus_announcement_dismissed_id";

function readDismissedId(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(DISMISS_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function writeDismissedId(id: number) {
  try {
    localStorage.setItem(DISMISS_KEY, String(id));
  } catch {
    /* */
  }
}

function AnnouncementImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return (
      <p className="mt-4 text-center text-xs text-foreground-subtle">
        Không tải được ảnh QR. Admin hãy đăng lại thông báo và chọn ảnh trên máy.
      </p>
    );
  }
  return (
    <div className="mx-auto mt-5 max-w-[280px] overflow-hidden rounded-xl border border-border bg-white p-3 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="mx-auto h-auto w-full object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function WelcomeAnnouncementModal() {
  const username = useAccountStore((s) => s.username);
  const pathname = usePathname();
  const [item, setItem] = useState<Announcement | null>(null);
  const [open, setOpen] = useState(false);

  const dismiss = useCallback(() => {
    if (item?.id) writeDismissedId(item.id);
    setOpen(false);
  }, [item?.id]);

  useEffect(() => {
    // Không hiện trên admin / auth nặng
    if (pathname?.startsWith("/admin")) return;

    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/announcements/active", { cache: "no-store" });
        const data = await res.json();
        if (cancelled || !data?.ok || !data.announcement) return;
        const a = data.announcement as Announcement;
        if (!a.id) return;
        if (readDismissedId() === a.id) return;
        setItem(a);
        setOpen(true);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, username]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, dismiss]);

  if (!open || !item) return null;

  const hasImage = Boolean(item.image_url?.trim());
  const hasLink = Boolean(item.link_action?.trim());

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opus-announcement-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl ui-border-contrast">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-full border border-border bg-surface-elevated p-1.5 text-foreground-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        <div className="px-6 pb-6 pt-8 text-center">
          <h2
            id="opus-announcement-title"
            className="text-lg font-semibold tracking-tight text-foreground"
          >
            {item.title || "Thông báo"}
          </h2>
          {item.content ? (
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">{item.content}</p>
          ) : null}

          {hasImage ? (
            <AnnouncementImage src={item.image_url} alt={item.title || "Thông báo"} />
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            {hasLink ? (
              <a
                href={item.link_action}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
                onClick={() => writeDismissedId(item.id)}
              >
                Mở liên kết
              </a>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-medium text-foreground"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
