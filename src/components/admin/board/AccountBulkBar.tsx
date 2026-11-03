"use client";

import { Coins, Crown, BadgeCheck, Lock, Trash2, X } from "lucide-react";

type Props = {
  count: number;
  onClear: () => void;
  onBulkCoins: () => void;
  onBulkVip: () => void;
  onBulkVerify: () => void;
  onBulkLock: () => void;
  onBulkDelete: () => void;
};

export function AccountBulkBar({
  count,
  onClear,
  onBulkCoins,
  onBulkVip,
  onBulkVerify,
  onBulkLock,
  onBulkDelete,
}: Props) {
  if (count <= 0) return null;
  return (
    <div className="sticky top-0 z-30 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-violet-500/30 bg-[#161822]/95 px-3 py-2.5 shadow-xl backdrop-blur-md">
      <span className="text-sm font-medium text-violet-200">
        Đã chọn <strong className="text-white">{count}</strong> tài khoản
      </span>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-white/5 hover:text-white"
      >
        <X className="h-3.5 w-3.5" />
        Bỏ chọn tất cả
      </button>
      <div className="ml-auto flex flex-wrap gap-1.5">
        <BulkBtn onClick={onBulkCoins} icon={<Coins className="h-3.5 w-3.5" />} label="Cấp / Trừ Xu" tone="amber" />
        <BulkBtn onClick={onBulkVip} icon={<Crown className="h-3.5 w-3.5" />} label="Cộng ngày VIP" tone="violet" />
        <BulkBtn onClick={onBulkVerify} icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Tick xanh" tone="sky" />
        <BulkBtn onClick={onBulkLock} icon={<Lock className="h-3.5 w-3.5" />} label="Khóa / Mở" tone="slate" />
        <BulkBtn onClick={onBulkDelete} icon={<Trash2 className="h-3.5 w-3.5" />} label={`Xóa (${count})`} tone="red" />
      </div>
    </div>
  );
}

function BulkBtn({
  onClick,
  icon,
  label,
  tone,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  tone: "amber" | "violet" | "sky" | "slate" | "red";
}) {
  const map = {
    amber: "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20",
    violet: "border-violet-500/30 bg-violet-500/10 text-violet-200 hover:bg-violet-500/20",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-200 hover:bg-sky-500/20",
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-200 hover:bg-slate-500/20",
    red: "border-red-500/40 bg-red-500/15 text-red-200 hover:bg-red-500/25",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${map[tone]}`}
    >
      {icon}
      {label}
    </button>
  );
}
