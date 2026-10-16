"use client";

import { Coins, KeyRound, ListChecks, LockKeyhole, X } from "lucide-react";

export type VipGateAction = "shop" | "redeem" | "quests" | "close";

export function UnactivatedAccessModal({
  open,
  onAction,
}: {
  open: boolean;
  onAction: (a: VipGateAction) => void;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal
      onClick={() => onAction("close")}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl ui-border-contrast"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <LockKeyhole className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-foreground">
              Tính năng yêu cầu kích hoạt gói VIP
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground-muted">
              Tài khoản của bạn hiện chưa kích hoạt gói VIP hoặc thời hạn sử dụng đã hết. Vui lòng
              kích hoạt gói VIP bằng Xu, nhập License Key hoặc Giftcode để mở khóa toàn bộ OpusFilm,
              OpusMusic và OpusChat.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng"
            className="text-foreground-muted hover:text-foreground"
            onClick={() => onAction("close")}
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => onAction("shop")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground"
          >
            <Coins className="h-4 w-4" strokeWidth={1.75} />
            Mua gói VIP bằng Xu
          </button>
          <button
            type="button"
            onClick={() => onAction("redeem")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface-elevated px-3 py-2.5 text-sm font-medium text-foreground ui-border-contrast"
          >
            <KeyRound className="h-4 w-4" strokeWidth={1.75} />
            Nhập Key / Giftcode
          </button>
          <button
            type="button"
            onClick={() => onAction("quests")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground ui-border-contrast"
          >
            <ListChecks className="h-4 w-4" strokeWidth={1.75} />
            Làm nhiệm vụ kiếm Xu
          </button>
        </div>
      </div>
    </div>
  );
}
