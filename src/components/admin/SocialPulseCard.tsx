"use client";

import Link from "next/link";
import { Bell, FileText, AlertTriangle } from "lucide-react";
import GlassCard from "./GlassCard";

export type PulseItem = {
  id: string;
  title: string;
  detail: string;
  time?: string;
  kind: "alert" | "appeal" | "report" | "user";
  unread?: boolean;
};

const iconMap = {
  alert: AlertTriangle,
  appeal: FileText,
  report: Bell,
  user: Bell,
};

export default function SocialPulseCard({ items }: { items: PulseItem[] }) {
  const list =
    items.length > 0
      ? items
      : ([
          {
            id: "m1",
            title: "Chưa có sự kiện mới",
            detail: "Cảnh báo, khiếu nại và báo lỗi sẽ hiện tại đây.",
            kind: "alert" as const,
          },
        ] satisfies PulseItem[]);

  return (
    <GlassCard className="p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Nhịp vận hành</h3>
        <Link
          href="/admin/verify"
          className="text-[11px] text-sky-400 hover:underline transition duration-500"
        >
          Chi tiết
        </Link>
      </div>
      <ul className="space-y-3">
        {list.slice(0, 5).map((it) => {
          const Icon = iconMap[it.kind] || Bell;
          return (
            <li
              key={it.id}
              className="flex gap-3 items-start rounded-2xl bg-black/25 border border-white/5 px-3 py-2.5 transition-all duration-500 hover:bg-white/[0.05]"
            >
              <span className="relative mt-0.5 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-3.5 h-3.5 text-zinc-300" />
                {it.unread ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#0a0a0c]" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-zinc-100 truncate">{it.title}</p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5">{it.detail}</p>
                {it.time ? (
                  <p className="text-[10px] text-zinc-600 mt-1">{it.time}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </GlassCard>
  );
}
