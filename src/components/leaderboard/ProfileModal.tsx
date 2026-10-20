"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, UserPlus, UserCheck, X, Users } from "lucide-react";
import { useAccountStore } from "@/lib/account";

export type ProfileData = {
  username: string;
  uid: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number | null;
  totalKeysBought: number;
  totalAmountSpent: number;
  isVip: boolean;
  createdAt: string | null;
  friendStatus: string;
};

function formatVnd(n: number) {
  if (!n) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return "—";
  }
}

function Avatar({ name, url, size = 72 }: { name: string; url: string | null; size?: number }) {
  const letter = (name || "?").charAt(0).toUpperCase();
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="rounded-full object-cover border border-border"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center rounded-full bg-surface-elevated border border-border text-foreground font-bold"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {letter}
    </div>
  );
}

export function ProfileModal({
  username,
  onClose,
}: {
  username: string;
  onClose: () => void;
}) {
  const me = useAccountStore((s) => s.username);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leaderboard/profile?username=${encodeURIComponent(username)}`,
        { cache: "no-store" }
      );
      const data = await res.json();
      if (data.ok && data.profile) setProfile(data.profile);
      else setMsg(data.error || "Không tải được hồ sơ");
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const friendAction = async (action: string) => {
    if (!me) {
      setMsg("Đăng nhập để kết bạn");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/leaderboard/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, username }),
      });
      const data = await res.json();
      if (data.ok) {
        setProfile((p) =>
          p ? { ...p, friendStatus: data.friendStatus || p.friendStatus } : p
        );
        if (data.message) setMsg(data.message);
      } else {
        setMsg(data.error || "Thất bại");
      }
    } catch {
      setMsg("Lỗi mạng");
    } finally {
      setBusy(false);
    }
  };

  const copyUid = async () => {
    if (!profile?.uid || profile.uid === "—") return;
    try {
      await navigator.clipboard.writeText(profile.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* */
    }
  };

  const st = profile?.friendStatus || "none";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-md border-0 cursor-pointer"
        aria-label="Đóng"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface text-foreground shadow-2xl overflow-hidden"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-surface-elevated text-foreground-muted hover:text-foreground"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>

        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-foreground-muted">
            Đang tải…
          </div>
        ) : !profile ? (
          <div className="px-6 py-16 text-center text-sm text-foreground-muted">
            {msg || "Không có dữ liệu"}
          </div>
        ) : (
          <div className="p-6 pt-8">
            <div className="flex flex-col items-center text-center">
              <Avatar name={profile.displayName} url={profile.avatarUrl} size={80} />
              <h2 className="mt-3 text-lg font-semibold tracking-tight">
                {profile.displayName}
              </h2>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-foreground-muted">
                <span className="font-mono">UID: {profile.uid}</span>
                <button
                  type="button"
                  onClick={() => void copyUid()}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-md hover:bg-surface-elevated"
                  aria-label="Chép UID"
                >
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
                </button>
                {copied ? <span className="text-emerald-500">Đã chép</span> : null}
              </div>
              {profile.rank != null ? (
                <span className="mt-2 inline-flex items-center rounded-full border border-border bg-surface-elevated px-2.5 py-0.5 text-xs font-semibold">
                  Hạng #{profile.rank}
                </span>
              ) : (
                <span className="mt-2 text-xs text-foreground-muted">
                  Chưa có trên bảng xếp hạng
                </span>
              )}
              {profile.isVip ? (
                <span className="mt-1.5 text-[11px] font-medium text-violet-400">VIP</span>
              ) : null}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-surface-elevated/50 px-3 py-2.5">
                <p className="text-[11px] text-foreground-muted">Hạng chi tiêu</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {profile.rank != null ? `#${profile.rank}` : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-elevated/50 px-3 py-2.5">
                <p className="text-[11px] text-foreground-muted">Tổng đã mua</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {formatVnd(profile.totalAmountSpent)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-elevated/50 px-3 py-2.5">
                <p className="text-[11px] text-foreground-muted">Số Key đã mua</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  {profile.totalKeysBought} Key
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-elevated/50 px-3 py-2.5">
                <p className="text-[11px] text-foreground-muted">Ngày tham gia</p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              {st === "self" ? (
                <p className="rounded-xl border border-border bg-surface-elevated py-2.5 text-center text-sm font-medium text-foreground-muted">
                  Hồ sơ của bạn
                </p>
              ) : st === "friends" ? (
                <div className="flex gap-2">
                  <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 py-2.5 text-sm font-semibold text-emerald-400">
                    <UserCheck className="h-4 w-4" strokeWidth={1.75} />
                    Bạn bè
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void friendAction("unfriend")}
                    className="rounded-xl border border-border px-3 py-2.5 text-xs font-medium text-foreground-muted hover:text-foreground"
                  >
                    Hủy
                  </button>
                </div>
              ) : st === "pending_sent" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void friendAction("cancel")}
                  className="w-full rounded-xl border border-border bg-surface-elevated py-2.5 text-sm font-semibold text-foreground-muted"
                >
                  Đã gửi lời mời
                </button>
              ) : st === "pending_received" ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void friendAction("accept")}
                    className="flex-1 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
                  >
                    Chấp nhận kết bạn
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void friendAction("reject")}
                    className="rounded-xl border border-border px-3 py-2.5 text-sm font-medium"
                  >
                    Từ chối
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busy || !me}
                  onClick={() => void friendAction("request")}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  <UserPlus className="h-4 w-4" strokeWidth={1.75} />
                  Kết bạn
                </button>
              )}
              {msg ? (
                <p className="text-center text-xs text-foreground-muted">{msg}</p>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function FriendsPanel() {
  const me = useAccountStore((s) => s.username);
  const [pending, setPending] = useState<Array<{ id: string; username: string }>>([]);
  const [friends, setFriends] = useState<Array<{ id: string; username: string }>>([]);
  const [open, setOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!me) return;
    try {
      const res = await fetch("/api/leaderboard/friends", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setPending(data.pending || []);
        setFriends(data.friends || []);
      }
    } catch {
      /* */
    }
  }, [me]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const act = async (action: string, username: string) => {
    await fetch("/api/leaderboard/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, username }),
    });
    void load();
  };

  if (!me) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-surface-elevated"
      >
        <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
        Bạn bè
        {pending.length > 0 ? (
          <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] text-white">
            {pending.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90] flex items-start justify-center pt-20 px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 border-0"
            onClick={() => setOpen(false)}
            aria-label="Đóng"
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-surface p-4 shadow-xl">
            <h3 className="text-sm font-semibold">Lời mời & Bạn bè</h3>
            {pending.length > 0 ? (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
                  Lời mời ({pending.length})
                </p>
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border px-3 py-2"
                  >
                    <button
                      type="button"
                      className="text-sm font-medium hover:underline"
                      onClick={() => setProfileUser(p.username)}
                    >
                      {p.username}
                    </button>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white"
                        onClick={() => void act("accept", p.username)}
                      >
                        Chấp nhận
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-border px-2 py-1 text-[11px]"
                        onClick={() => void act("reject", p.username)}
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-3 space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-foreground-muted">
                Bạn bè ({friends.length})
              </p>
              {friends.length === 0 ? (
                <p className="py-4 text-center text-xs text-foreground-muted">
                  Chưa có bạn bè
                </p>
              ) : (
                friends.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-elevated"
                    onClick={() => setProfileUser(f.username)}
                  >
                    <Avatar name={f.username} url={null} size={28} />
                    {f.username}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {profileUser ? (
        <ProfileModal username={profileUser} onClose={() => setProfileUser(null)} />
      ) : null}
    </>
  );
}
