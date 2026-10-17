"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift } from "lucide-react";
import { useAccountStore } from "@/lib/account";

const TITLES = [
  "Món quà tri ân từ OpusFilm",
  "Phần thưởng sự kiện đặc biệt",
  "Ưu đãi toàn server dành cho bạn",
  "Quà bất ngờ vừa được mở khóa",
  "Đặc quyền thành viên hôm nay",
];

const BODIES = [
  "Cảm ơn bạn đã đồng hành cùng OpusFilm. Nhận ngay phần thưởng toàn server để tiếp tục trải nghiệm phim mượt hơn.",
  "Đợt phát thưởng dành cho mọi tài khoản đang hoạt động. Bấm nhận để cộng thẳng vào hồ sơ của bạn.",
  "Sự kiện tri ân cộng đồng: phần quà được kích hoạt đồng loạt. Mỗi tài khoản chỉ nhận một lần cho đợt này.",
  "Hệ thống vừa phát hành phần thưởng toàn cục. Nhận ngay để không bỏ lỡ quyền lợi đang chờ.",
];

type Pending = {
  id: number;
  reward_type: string;
  reward_value: string;
  message_template?: string;
};

export function GlobalRewardModal() {
  const username = useAccountStore((s) => s.username);
  const [reward, setReward] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const title = useMemo(
    () => TITLES[Math.floor(Math.random() * TITLES.length)],
    [reward?.id]
  );
  const body = useMemo(() => {
    if (reward?.message_template) return reward.message_template;
    return BODIES[Math.floor(Math.random() * BODIES.length)];
  }, [reward?.id, reward?.message_template]);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/rewards/pending?username=${encodeURIComponent(username)}`
        );
        const data = await res.json();
        if (!cancelled && data?.ok && data.reward) setReward(data.reward as Pending);
      } catch {
        /* */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (!username || !reward || done) return null;

  const claim = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/rewards/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, rewardId: reward.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(true);
        window.dispatchEvent(new Event("vip-status-updated"));
      }
    } catch {
      /* */
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl ui-border-contrast">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <Gift className="h-6 w-6" strokeWidth={1.75} />
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <p className="text-sm leading-relaxed text-foreground-muted">{body}</p>
        <p className="mt-3 text-xs text-foreground-subtle">
          Loại: {reward.reward_type} · Giá trị: {reward.reward_value}
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => void claim()}
          className="mt-5 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "Đang nhận…" : "Nhận ngay"}
        </button>
      </div>
    </div>
  );
}
