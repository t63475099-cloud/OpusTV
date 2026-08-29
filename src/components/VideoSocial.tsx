"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle, Reply, Send, Loader2, BadgeCheck } from "lucide-react";
import { useAccountStore } from "@/lib/account";
import { useSettingsStore } from "@/lib/settings";
import { CommentAvatar } from "@/components/UserAvatar";

interface CommentItem {
  id: string;
  username: string;
  text: string;
  parentId: string | null;
  likes: number;
  createdAt: number;
  avatar?: string | null;
  verified?: boolean;
}

interface VideoSocialProps {
  slug: string;
  title?: string;
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "vừa xong";
  if (s < 3600) return `${Math.floor(s / 60)} phút`;
  if (s < 86400) return `${Math.floor(s / 3600)} giờ`;
  return `${Math.floor(s / 86400)} ngày`;
}

export default function VideoSocial({ slug, title }: VideoSocialProps) {
  const accountName = useAccountStore((s) => s.username);
  const profile = useSettingsStore((s) => s.profile);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [text, setText] = useState("");
  const [guestName, setGuestName] = useState("");
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [err, setErr] = useState("");

  const displayName = accountName || guestName.trim().toLowerCase();

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`/api/social?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      setLikes(data.likes || 0);
      setComments(data.comments || []);
    } catch {
      setErr("Không tải được bình luận");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const roots = useMemo(() => comments.filter((c) => !c.parentId), [comments]);
  const repliesOf = (id: string) => comments.filter((c) => c.parentId === id);

  const post = async (action: string, extra: Record<string, unknown> = {}) => {
    setPosting(true);
    setErr("");
    try {
      const res = await fetch("/api/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          slug,
          username: displayName || undefined,
          avatar: accountName ? profile.avatar || null : null,
          verified: Boolean(accountName),
          ...extra,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Thất bại");
        return null;
      }
      return data;
    } catch {
      setErr("Lỗi mạng");
      return null;
    } finally {
      setPosting(false);
    }
  };

  const onLike = async () => {
    if (!displayName) {
      setErr("Đăng nhập để thích");
      return;
    }
    const data = await post("like");
    if (data) {
      setLikes(data.likes);
      setLiked(!!data.liked);
    }
  };

  const onComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName) {
      setErr("Đăng nhập hoặc nhập tên để bình luận");
      return;
    }
    if (!text.trim()) return;
    const data = await post("comment", {
      text: text.trim(),
      parentId: replyTo?.id || null,
      avatar: accountName ? profile.avatar || null : null,
      verified: Boolean(accountName),
    });
    if (data?.comment) {
      setComments((prev) => [...prev, data.comment]);
      setText("");
      setReplyTo(null);
    }
  };

  const onLikeComment = async (id: string) => {
    if (!displayName) {
      setErr("Đăng nhập để thích bình luận");
      return;
    }
    const data = await post("like_comment", { commentId: id });
    if (data) {
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, likes: data.likes } : c))
      );
    }
  };

  const renderComment = (c: CommentItem, nested = false) => (
    <div key={c.id} className={nested ? "mt-3 ml-2 pl-3 border-l border-white/10" : "flex gap-2.5"}>
      {!nested && (
        <CommentAvatar
          username={c.username}
          avatar={c.avatar}
          size={36}
          verified={c.verified}
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-zinc-300 flex items-center gap-1 flex-wrap">
          {nested && (
            <span className="mr-1.5 inline-block align-middle">
              <CommentAvatar username={c.username} avatar={c.avatar} size={24} verified={c.verified} />
            </span>
          )}
          <span className="font-semibold text-white">{c.username}</span>
          {c.verified && (
            <BadgeCheck className="w-3.5 h-3.5 text-[#1d9bf0] fill-[#1d9bf0]" aria-label="Đã xác thực" />
          )}
          <span className="text-zinc-600 text-xs ml-1">{timeAgo(c.createdAt)}</span>
        </p>
        <p className="text-zinc-200 mt-0.5 whitespace-pre-wrap break-words">{c.text}</p>
        <div className="flex gap-3 mt-1.5 text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => onLikeComment(c.id)}
            className="hover:text-red-400 inline-flex items-center gap-1"
          >
            <Heart className="w-3 h-3" /> {c.likes || ""}
          </button>
          {!nested && (
            <button
              type="button"
              onClick={() => setReplyTo(c)}
              className="hover:text-white inline-flex items-center gap-1"
            >
              <Reply className="w-3 h-3" /> Trả lời
            </button>
          )}
        </div>
        {!nested && repliesOf(c.id).map((r) => renderComment(r, true))}
      </div>
    </div>
  );

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <button
          type="button"
          onClick={onLike}
          disabled={posting}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
            liked ? "bg-red-600 text-white" : "bg-white/10 text-zinc-200 hover:bg-white/15"
          }`}
        >
          <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
          {likes} thích
        </button>
        <span className="inline-flex items-center gap-1.5 text-sm text-zinc-400">
          <MessageCircle className="w-4 h-4" />
          {comments.length} bình luận
        </span>
        {title && <span className="text-xs text-zinc-600 truncate max-w-[200px]">{title}</span>}
      </div>

      {!accountName && (
        <input
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="Tên hiển thị"
          className="w-full mb-3 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-red-500"
          maxLength={32}
        />
      )}

      <form onSubmit={onComment} className="flex gap-2 mb-4 items-end">
        <div className="shrink-0 pb-0.5">
          <CommentAvatar
            username={displayName || "?"}
            avatar={accountName ? profile.avatar : null}
            size={36}
            verified={Boolean(accountName)}
          />
        </div>
        <div className="flex-1">
          {replyTo && (
            <div className="text-xs text-zinc-500 mb-1 flex items-center gap-2">
              Đang trả lời <strong className="text-zinc-300">@{replyTo.username}</strong>
              <button type="button" className="text-red-400" onClick={() => setReplyTo(null)}>
                Hủy
              </button>
            </div>
          )}
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Viết bình luận…"
            maxLength={500}
            className="w-full px-3 py-2.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white outline-none focus:border-red-500"
          />
        </div>
        <button
          type="submit"
          disabled={posting || !text.trim()}
          className="px-3 rounded-xl bg-red-600 text-white disabled:opacity-50 h-[42px]"
          aria-label="Gửi"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      {err && <p className="text-xs text-amber-400 mb-3">{err}</p>}

      {loading ? (
        <p className="text-sm text-zinc-500 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải…
        </p>
      ) : roots.length === 0 ? (
        <p className="text-sm text-zinc-500">Chưa có bình luận.</p>
      ) : (
        <ul className="space-y-4 max-h-[480px] overflow-y-auto custom-scroll pr-1">
          {roots.map((c) => (
            <li key={c.id} className="text-sm">
              {renderComment(c)}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
