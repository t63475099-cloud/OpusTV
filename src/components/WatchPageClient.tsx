"use client";
import AmbientGlow from "@/components/AmbientGlow";
import FloatingReactions from "@/components/FloatingReactions";
import { useXpStore } from "@/lib/xpStore";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Player from "./Player";
import { getImageUrl } from "@/lib/api";
import type { Movie, Server, MovieListItem } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { useFavoritesStore } from "@/lib/favorites";
import VideoSocial from "@/components/VideoSocial";
import {
  Copy,
  ExternalLink,
  Check,
  Heart,
  Share2,
  Download,
} from "lucide-react";

interface WatchPageClientProps {
  movie: Movie;
  episodes: Server[];
  related?: MovieListItem[];
}

function isDubServer(name: string) {
  const n = name.toLowerCase();
  return (
    n.includes("lồng") ||
    n.includes("long") ||
    n.includes("thuyết") ||
    n.includes("thuyet") ||
    n.includes("tm") ||
    n.includes("lt")
  );
}

export default function WatchPageClient({
  movie,
  episodes,
  related = [],
}: WatchPageClientProps) {
  const defaultServerIdx = Math.max(
    0,
    episodes.findIndex((s) => isDubServer(s.server_name))
  );
  const [serverIdx, setServerIdx] = useState(defaultServerIdx >= 0 ? defaultServerIdx : 0);
  const [epIdx, setEpIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const toggleFav = useFavoritesStore((s) => s.toggle);
  const isFav = useFavoritesStore((s) => s.isFav(movie.slug));

  const currentServer = episodes[serverIdx] || episodes[0];
  const currentEpisodes = currentServer?.server_data || [];
  const currentEpisode = currentEpisodes[epIdx] || currentEpisodes[0];
  const nextEpisode = currentEpisodes[epIdx + 1] || null;
  const m3u8 = currentEpisode?.link_m3u8 || "";
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);

  const handleNext = () => {
    if (epIdx < currentEpisodes.length - 1) setEpIdx(epIdx + 1);
  };

  const copyLink = async () => {
    if (!m3u8) return;
    try {
      await navigator.clipboard.writeText(m3u8);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt("Sao chép link:", m3u8);
    }
  };

  const sharePage = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    try {
      if (navigator.share) {
        await navigator.share({ title: movie.name, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      /* user cancelled */
    }
  };

  const onToggleFav = () => {
    toggleFav({
      slug: movie.slug,
      name: movie.name,
      poster,
      year: movie.year,
      addedAt: Date.now(),
    });
  };

  return (
    <div className="min-h-screen pt-14 animate-fade-in">
      <div className="max-w-[1600px] mx-auto px-0 md:px-4 lg:px-6">
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-0 xl:gap-6">
          {/* Main column */}
          <div>
            <div className="w-full bg-black xl:rounded-xl overflow-hidden shadow-2xl">
              {m3u8 ? (
                <AmbientGlow src={poster}>
                  <Player
                    key={`${serverIdx}-${epIdx}-${m3u8}`}
                    m3u8={m3u8}
                    movie={movie}
                    currentEpisode={currentEpisode}
                    serverName={currentServer?.server_name || ""}
                    nextEpisode={nextEpisode}
                    onNextEpisode={handleNext}
                  />
                </AmbientGlow>
              ) : (
                <div className="aspect-video bg-zinc-900 flex items-center justify-center text-zinc-500">
                  Không tìm thấy link phát
                </div>
              )}
            </div>

            <div className="px-3 md:px-0 py-4 space-y-4">
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-white leading-snug">
                  {movie.name}
                  {currentEpisode ? ` · ${currentEpisode.name}` : ""}
                </h1>
                <p className="text-zinc-400 text-sm mt-1">
                  {movie.origin_name} · {movie.year} · {movie.quality} · {movie.lang}
                </p>
              </div>

              {/* Action bar YouTube-like */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onToggleFav}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition btn-press ${
                    isFav
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFav ? "fill-white" : ""}`} />
                  {isFav ? "Đã thích" : "Yêu thích"}
                </button>
                <button
                  onClick={sharePage}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition btn-press"
                >
                  <Share2 className="w-4 h-4" />
                  {shared ? "Đã copy link" : "Chia sẻ"}
                </button>
                <button
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition btn-press"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" /> Đã copy m3u8
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy link tải
                    </>
                  )}
                </button>
                <a
                  href={m3u8 || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition btn-press"
                >
                  <ExternalLink className="w-4 h-4" /> Mở tab mới
                </a>
                <a
                  href={m3u8 || "#"}
                  download={`${movie.slug}-${currentEpisode?.slug || "ep"}.m3u8`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-red-600 text-white hover:bg-red-500 transition btn-press"
                >
                  <Download className="w-4 h-4" /> Tải m3u8
                </a>
              </div>

              <p className="text-xs text-zinc-500 glass-card rounded-xl p-3 border border-zinc-800">
                💡 <strong className="text-zinc-300">Tải về điện thoại:</strong> Bấm{" "}
                <strong className="text-red-400">Copy link tải</strong> → mở app{" "}
                <strong>VLC</strong> (miễn phí) → biểu tượng mạng → dán link → phát hoặc tải.
                Trình duyệt thường không tải được file video HLS (.m3u8) trực tiếp như YouTube.
              </p>

              {/* Servers */}
              {episodes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Phiên bản / Server
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {episodes.map((s, idx) => {
                      const isDub = isDubServer(s.server_name);
                      const active = idx === serverIdx;
                      return (
                        <button
                          key={s.server_name + idx}
                          onClick={() => {
                            setServerIdx(idx);
                            setEpIdx(0);
                          }}
                          className={`px-3.5 py-2 rounded-full text-sm font-medium transition border btn-press ${
                            active
                              ? isDub
                                ? "bg-amber-400 border-amber-300 text-black"
                                : "bg-red-600 border-red-500 text-white"
                              : isDub
                              ? "bg-amber-400/10 border-amber-400/40 text-amber-300 hover:bg-amber-400/20"
                              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                          }`}
                        >
                          {isDub ? "🔊 " : ""}
                          {s.server_name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Episodes */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Tập phim ({currentEpisodes.length})
                </h3>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-1 custom-scroll">
                  {currentEpisodes.map((ep, idx) => (
                    <button
                      key={ep.slug + idx}
                      onClick={() => setEpIdx(idx)}
                      className={`min-w-[48px] px-2.5 py-1.5 rounded-lg text-sm transition btn-press ${
                        idx === epIdx
                          ? "bg-red-600 text-white font-semibold"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {ep.name.replace(/^Tập\s*/i, "")}
                    </button>
                  ))}
                </div>
              </div>

              {movie.content && (
                <div className="bg-[#212121] rounded-xl p-4 border border-zinc-800">
                  <h3 className="text-sm font-semibold text-white mb-2">Mô tả</h3>
                  <div
                    className="text-zinc-300 text-sm leading-relaxed line-clamp-6"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(movie.content) }}
                  />
                </div>
              )}
            </div>
          </div>

                        <div className="mb-3">
                          <FloatingReactions />
                        </div>
                        <VideoSocial slug={movie.slug} title={movie.name} />

              {/* Related sidebar - YouTube style */}
          <aside className="px-3 md:px-0 pb-8 xl:pt-0 pt-2">
            <h3 className="text-sm font-semibold text-white mb-3 sticky top-14 bg-[#0f0f0f] py-2 z-10">
              Video liên quan
            </h3>
            <div className="space-y-3">
              {related.length === 0 && (
                <p className="text-zinc-500 text-sm">Đang tải gợi ý...</p>
              )}
              {related.map((item) => (
                <Link
                  key={item.slug}
                  href={`/phim/${item.slug}`}
                  className="flex gap-3 group hover:bg-white/5 rounded-lg p-1.5 -mx-1.5 transition"
                >
                  <div className="relative w-40 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                    <Image
                      src={getImageUrl(item.thumb_url || item.poster_url)}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                    {item.episode_current && (
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 rounded">
                        {item.episode_current}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 py-0.5">
                    <h4 className="text-sm font-medium text-zinc-100 line-clamp-2 group-hover:text-red-400 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                      {item.origin_name}
                    </p>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {item.year} · {item.quality}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
