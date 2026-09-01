"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import UserAvatar from "@/components/UserAvatar";
import { ArrowLeft } from "lucide-react";
import { RANKS } from "@/lib/gamification";

interface PublicProfile {
  username: string;
  name?: string;
  avatar?: string;
  avatarFrame?: string;
  verified?: boolean;
  level?: number;
  rankLabel?: string;
  rankColor?: string;
  badges?: { id: string; label: string; icon: string }[];
  favorites?: { slug: string; name: string; poster?: string }[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params?.username || "").toLowerCase();
  const [data, setData] = useState<PublicProfile | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!username) return;
    let c = false;
    (async () => {
      try {
        const res = await fetch(`/api/user/profile?username=${encodeURIComponent(username)}`);
        const j = await res.json();
        if (c) return;
        if (!j.ok) {
          setErr(j.error || "Không tìm thấy");
          // fallback local-looking profile
          setData({
            username,
            name: username,
            level: 1,
            rankLabel: RANKS[0].label,
            rankColor: RANKS[0].color,
            badges: [],
            favorites: [],
          });
          return;
        }
        setData(j.profile);
      } catch {
        if (!c) {
          setErr("Lỗi mạng");
          setData({
            username,
            name: username,
            level: 1,
            rankLabel: RANKS[0].label,
            rankColor: RANKS[0].color,
            badges: [],
            favorites: [],
          });
        }
      }
    })();
    return () => {
      c = true;
    };
  }, [username]);

  if (!username) {
    return <p className="p-8 text-center text-zinc-400">Thiếu username</p>;
  }

  const profile = data;

  return (
    <div className="lg-page min-h-[100dvh] pb-24 pt-16">
      <div className="lg-orbs" aria-hidden>
        <span />
        <span />
        <span />
      </div>
      <div className="relative z-10 mx-auto max-w-lg px-4 pt-4">
        <Link href="/" className="lg-btn text-xs mb-4 inline-flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Về trang chủ
        </Link>

        <div className="lg-card lg-border-spin rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-4">
            <UserAvatar
              profile={{
                name: profile?.name || username,
                avatar: profile?.avatar,
                avatarFrame: profile?.avatarFrame,
                verified: profile?.verified,
                avatarPosition: "50% 50%",
              }}
              size={88}
              showBadge={!!profile?.verified}
            />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate">
                {profile?.name || username}
              </h1>
              <p className="text-sm text-zinc-400">@{username}</p>
              {profile?.rankLabel && (
                <span
                  className="inline-flex mt-2 text-xs font-semibold px-2.5 py-1 rounded-full border border-white/10"
                  style={{ color: profile.rankColor || "#a1a1aa" }}
                >
                  Lv.{profile.level || 1} · {profile.rankLabel}
                </span>
              )}
            </div>
          </div>

          {err && <p className="text-xs text-amber-400/80">{err}</p>}

          {!!profile?.badges?.length && (
            <div>
              <p className="text-xs text-zinc-500 mb-2">Huy hiệu</p>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map((b) => (
                  <span
                    key={b.id}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-zinc-200"
                  >
                    <span>{b.icon}</span> {b.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs text-zinc-500 mb-2">Yêu thích công khai</p>
            {profile?.favorites && profile.favorites.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {profile.favorites.slice(0, 9).map((f) => (
                  <Link
                    key={f.slug}
                    href={`/phim/${f.slug}`}
                    className="rounded-xl overflow-hidden bg-zinc-800 aspect-[2/3] block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={f.poster || "/placeholder.svg"}
                      alt={f.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Chưa có danh sách công khai</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
