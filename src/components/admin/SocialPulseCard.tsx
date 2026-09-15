"use client";

import Link from "next/link";
import { Bell, FileText, AlertTriangle, Activity } from "lucide-react";
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
  user: Activity,
};

const tone = {
  alert: "text-amber-300 bg-amber-500/15 border-amber-500/25",
  appeal: "text-sky-300 bg-sky-500/15 border-sky-500/25",
  report: "text-rose-300 bg-rose-500/15 border-rose-500/25",
  user: "text-violet-300 bg-violet-500/15 border-violet-500/25",
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
    <GlassCard className="p-5 h-full flex flex-col" accent="violet" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-400/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-violet-300" />
          </span>
          <h3 className="text-sm font-semibold text-white">Nhịp vận hành</h3>
        </div>
        <Link
          href="/admin/verify"
          className="text-[11px] font-medium text-rose-300 hover:text-rose-200 transition duration-500"
        >
          Chi tiết →
        </Link>
      </div>
      <ul className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] scrollbar-hide">
        {list.slice(0, 6).map((it) => {
          const Icon = iconMap[it.kind] || Bell;
          return (
            <li
              key={it.id}
              className="flex gap-3 items-start rounded-xl bg-black/30 border border-white/[0.05] px-3 py-2.5 transition-all duration-500 hover:bg-white/[0.04] hover:border-white/10"
            >
              <span
                className={`relative mt-0.5 w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tone[it.kind]}`}
              >
                <Icon className="w-4 h-4" />
                {it.unread ? (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-[#121216] animate-pulse" />
                ) : null}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate">
                  {it.title}
                </p>
                <p className="text-[11px] text-zinc-500 line-clamp-2 mt-0.5 leading-relaxed">
                  {it.detail}
                </p>
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
