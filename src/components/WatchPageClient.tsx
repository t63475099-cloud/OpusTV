"use client";

import AmbientGlow from "@/components/AmbientGlow";
import FloatingReactions from "@/components/FloatingReactions";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Player from "./Player";
import { getImageUrl } from "@/lib/api";
import type { Movie, Server, MovieListItem } from "@/lib/types";
import { sanitizeHtml } from "@/lib/sanitize";
import { useFavoritesStore } from "@/lib/favorites";
import { useHistoryStore } from "@/lib/history";
import VideoSocial from "@/components/VideoSocial";
import RelatedInfinite from "@/components/RelatedInfinite";
import {
  Copy,
  ExternalLink,
  Check,
  Heart,
  Share2,
  Download,
  Clapperboard,
  X,
} from "lucide-react";

interface WatchPageClientProps {
  movie: Movie;
  episodes: Server[];
  related?: MovieListItem[];
  categorySlug?: string;
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

function findEpisodeIndex(server: Server | undefined, epSlug: string | null) {
  if (!server || !epSlug) return 0;
  const i = server.server_data.findIndex(
    (e) => e.slug === epSlug || e.name === epSlug
  );
  return i >= 0 ? i : 0;
}

export default function WatchPageClient({
  movie,
  episodes,
  related = [],
  categorySlug = "phim-moi-cap-nhat",
}: WatchPageClientProps) {
  const historyItem = useHistoryStore((s) => s.getBySlug(movie.slug));

  const defaultServerIdx = useMemo(() => {
    const fromHist =
      historyItem?.server != null
        ? episodes.findIndex((s) => s.server_name === historyItem.server)
        : -1;
    if (fromHist >= 0) return fromHist;
    const dub = episodes.findIndex((s) => isDubServer(s.server_name));
    return dub >= 0 ? dub : 0;
  }, [episodes, historyItem?.server]);

  const [serverIdx, setServerIdx] = useState(defaultServerIdx);
  const [epIdx, setEpIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [theater, setTheater] = useState(false);
  const [resumed, setResumed] = useState(false);

  const toggleFav = useFavoritesStore((s) => s.toggle);
  const isFav = useFavoritesStore((s) => s.isFav(movie.slug));

  // Khôi phục tập/server từ URL ?ep= & ?server= hoặc lịch sử
  useEffect(() => {
    if (typeof window === "undefined" || resumed) return;
    const sp = new URLSearchParams(window.location.search);
    const epQ = sp.get("ep");
    const serverQ = sp.get("server");

    let sIdx = serverIdx;
    if (serverQ) {
      const i = episodes.findIndex((s) => s.server_name === serverQ);
      if (i >= 0) sIdx = i;
    } else if (historyItem?.server) {
      const i = episodes.findIndex((s) => s.server_name === historyItem.server);
      if (i >= 0) sIdx = i;
    }
    setServerIdx(sIdx);

    const server = episodes[sIdx] || episodes[0];
    const epSlug = epQ || historyItem?.episodeSlug || null;
    setEpIdx(findEpisodeIndex(server, epSlug));
    setResumed(true);
  }, [episodes, historyItem, resumed, serverIdx]);

  // Khóa body khi theater
  useEffect(() => {
    if (!theater) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [theater]);

  const currentServer = episodes[serverIdx] || episodes[0];
  const currentEpisodes = currentServer?.server_data || [];
  const currentEpisode = currentEpisodes[epIdx] || currentEpisodes[0];
  const nextEpisode = currentEpisodes[epIdx + 1] || null;
  const rawM3u8 = (currentEpisode?.link_m3u8 || "").trim();
  const rawEmbed = (currentEpisode?.link_embed || "").trim();
  const m3u8 = rawM3u8
    ? rawM3u8.startsWith("http://")
      ? "https://" + rawM3u8.slice(7)
      : rawM3u8
    : "";
  const embedUrl = rawEmbed
    ? rawEmbed.startsWith("http://")
      ? "https://" + rawEmbed.slice(7)
      : rawEmbed
    : "";
  const poster = getImageUrl(movie.poster_url || movie.thumb_url);

  const tryNextServer = () => {
    if (episodes.length <= 1) return;
    const next = (serverIdx + 1) % episodes.length;
    switchServer(next);
  };

  const switchServer = useCallback(
    (idx: number) => {
      const prevName = currentEpisode?.name;
      setServerIdx(idx);
      const next = episodes[idx];
      if (!next) return;
      // Giữ cùng tên tập nếu có
      if (prevName) {
        const match = next.server_data.findIndex(
          (e) => e.name === prevName || e.slug === currentEpisode?.slug
        );
        setEpIdx(match >= 0 ? match : 0);
      } else {
        setEpIdx(0);
      }
    },
    [currentEpisode, episodes]
  );

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
      /* cancelled */
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

  const episodePanel = (
    <div className="space-y-3">
      {episodes.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
            Server / Phiên bản
          </h3>
          <div className="flex flex-wrap gap-2">
            {episodes.map((s, idx) => {
              const isDub = isDubServer(s.server_name);
              const active = idx === serverIdx;
              return (
                <button
                  key={s.server_name + idx}
                  type="button"
                  onClick={() => switchServer(idx)}
                  className={`px-3.5 py-2 rounded-full text-sm font-medium transition border ${
                    active
                      ? isDub
                        ? "bg-amber-400 border-amber-300 text-black"
                        : "bg-red-600 border-red-500 text-white"
                      : isDub
                      ? "bg-amber-400/10 border-amber-400/40 text-amber-300 hover:bg-amber-400/20"
                      : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                  }`}
                >
                  {isDub ? "🔊 " : "Server "}
                  {s.server_name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Tập phim ({currentEpisodes.length})
          </h3>
          {currentEpisode && (
            <span className="text-xs text-zinc-400">
              Đang xem: {currentEpisode.name}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto pr-1 custom-scroll">
          {currentEpisodes.map((ep, idx) => (
            <button
              key={ep.slug + idx}
              type="button"
              onClick={() => setEpIdx(idx)}
              className={`min-w-[48px] px-2.5 py-1.5 rounded-lg text-sm transition ${
                idx === epIdx
                  ? "bg-red-600 text-white font-semibold ring-2 ring-red-400/40"
                  : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              }`}
            >
              {ep.name.replace(/^Tập\s*/i, "")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen pt-14 animate-fade-in ${
        theater ? "bg-black" : ""
      }`}
    >
      {/* Theater overlay dim */}
      {theater && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm"
          aria-label="Thoát chế độ rạp"
          onClick={() => setTheater(false)}
        />
      )}

      <div
        className={`max-w-[1600px] mx-auto px-0 md:px-4 lg:px-6 relative ${
          theater ? "z-40" : ""
        }`}
      >
        <div
          className={`grid grid-cols-1 gap-0 xl:gap-6 ${
            theater ? "" : "xl:grid-cols-[1fr_360px]"
          }`}
        >
          <div>
            <div
              className={`w-full bg-black overflow-hidden shadow-2xl ${
                theater
                  ? "fixed inset-x-0 top-[10%] z-40 max-w-6xl mx-auto rounded-xl"
                  : "xl:rounded-xl"
              }`}
            >
              {m3u8 ? (
                <AmbientGlow src={poster} className={theater ? "scale-[1.02]" : ""}>
                  <Player
                    key={`${serverIdx}-${epIdx}-${m3u8 || embedUrl}`}
                    m3u8={m3u8}
                    embedUrl={embedUrl}
                    movie={movie}
                    currentEpisode={currentEpisode}
                    serverName={currentServer?.server_name || ""}
                    nextEpisode={nextEpisode}
                    onNextEpisode={handleNext}
                    onStreamError={tryNextServer}
                  />
                </AmbientGlow>
              ) : (
                <div className="aspect-video bg-zinc-900 flex flex-col items-center justify-center gap-3 text-zinc-500 px-4 text-center">
                  <p>Không tìm thấy link phát cho tập này.</p>
                  {episodes.length > 1 && (
                    <button
                      type="button"
                      onClick={tryNextServer}
                      className="px-4 py-2 rounded-full bg-red-600 text-white text-sm"
                    >
                      Thử server khác
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Nút rạp + panel tập ngay dưới player */}
            <div
              className={`px-3 md:px-0 py-3 space-y-4 ${
                theater ? "fixed bottom-4 inset-x-0 z-40 max-w-6xl mx-auto px-4" : ""
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTheater((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${
                    theater
                      ? "bg-white text-black border-white"
                      : "bg-zinc-800 text-zinc-200 border-zinc-700 hover:bg-zinc-700"
                  }`}
                >
                  {theater ? <X className="w-4 h-4" /> : <Clapperboard className="w-4 h-4" />}
                  {theater ? "Thoát rạp" : "Chế độ rạp"}
                </button>
                {historyItem && historyItem.currentTime > 10 && (
                  <span className="text-xs text-zinc-400">
                    Đã lưu tiến trình · {currentEpisode?.name || historyItem.episode}
                  </span>
                )}
              </div>

              {!theater && (
                <div className="rounded-2xl border border-zinc-800 bg-[#121212] p-3 sm:p-4">
                  {episodePanel}
                </div>
              )}
            </div>

            {!theater && (
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

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onToggleFav}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border ${
                      isFav
                        ? "bg-red-600/20 border-red-500 text-red-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-300"
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    {isFav ? "Đã thích" : "Yêu thích"}
                  </button>
                  <button
                    type="button"
                    onClick={sharePage}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm bg-zinc-800 border border-zinc-700 text-zinc-300"
                  >
                    <Share2 className="w-4 h-4" />
                    {shared ? "Đã copy" : "Chia sẻ"}
                  </button>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm bg-zinc-800 border border-zinc-700 text-zinc-300"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Đã copy" : "Copy link"}
                  </button>
                  {m3u8 && (
                    <a
                      href={m3u8}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm bg-zinc-800 border border-zinc-700 text-zinc-300"
                    >
                      <ExternalLink className="w-4 h-4" /> Mở nguồn
                    </a>
                  )}
                </div>

                <FloatingReactions />
                <VideoSocial slug={movie.slug} title={movie.name} />

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
            )}
          </div>

          {!theater && (
            <aside className="px-3 md:px-0 pb-8 xl:pt-0 pt-2">
              <h3 className="text-sm font-semibold text-white mb-3 sticky top-14 bg-[#0f0f0f] py-2 z-10">
                Video liên quan
              </h3>
              <RelatedInfinite
                initial={related}
                excludeSlug={movie.slug}
                categorySlug={categorySlug}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
