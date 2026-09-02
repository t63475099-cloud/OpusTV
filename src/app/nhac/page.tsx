"use client";

import { useSearchParams } from "next/navigation";

import { useCallback, useEffect, useMemo, useRef, useState , Suspense} from "react";
import {
  MUSIC_TRACKS,
  MUSIC_CATEGORIES,
  TREND_QUERIES,
  pickRandomQueries,
  shuffleTracks,
} from "@/lib/music";
import {
  getMusicSearchHistory,
  pushMusicSearchHistory,
  removeMusicSearchHistory,
  clearMusicSearchHistory,
} from "@/lib/searchHistory";
import { useMusicHistoryStore } from "@/lib/musicHistory";
import { Music2, Play, Search, Flame, Library, Loader2, X, History } from "lucide-react";
import VideoSocial from "@/components/VideoSocial";
import AmbientGlow from "@/components/AmbientGlow";
import FloatingReactions from "@/components/FloatingReactions";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import { useXpStore } from "@/lib/xpStore";

type Tab = "home" | "library" | "trending";

type Track = {
  id: string;
  title: string;
  artist: string;
  category?: string;
  thumb?: string;
};

function thumbUrl(id: string, custom?: string) {
  if (custom) return custom;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

const HOME_QUERY = "top music hits 2024 2025";

function NhacInner() {
  const [tab, setTab] = useState<Tab>("home");
  const [cat, setCat] = useState("Tất cả");
  const [searchInput, setSearchInput] = useState("");
  const [playing, setPlaying] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [feed, setFeed] = useState<Track[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [feedQuery, setFeedQuery] = useState(HOME_QUERY);
  const [searchMode, setSearchMode] = useState(false);
  const [suggests, setSuggests] = useState<Track[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [tabSwitching, setTabSwitching] = useState(false);
  const [msg, setMsg] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [trendQ, setTrendQ] = useState(TREND_QUERIES[0] || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);

  const watchedList = useMusicHistoryStore((s) => s.watched);
  const addWatched = useMusicHistoryStore((s) => s.add);
  const setMiniTrack = useMusicPlayerStore((s) => s.setTrack);

  const searchParams = useSearchParams();
  useEffect(() => {
    const v = searchParams?.get("v");
    if (!v || typeof v !== "string") return;
    const thumb = `https://i.ytimg.com/vi/${v}/hqdefault.jpg`;
    setCurrentId(v);
    setCurrentTrack({ id: v, title: "Đang phát", artist: "", thumb });
    setPlaying(true);
    setMiniTrack({ id: v, title: "Đang phát", artist: "", thumb });
  }, [searchParams, setMiniTrack]);
  const addXp = useXpStore((s) => s.add);
  const watchedIds = useMusicHistoryStore((s) => s.ids);

  const library = useMemo(() => {
    let rows = [...MUSIC_TRACKS];
    if (cat !== "Tất cả") rows = rows.filter((t) => t.category === cat);
    return rows;
  }, [cat]);

  const watchedSet = useMemo(() => watchedIds(), [watchedList, watchedIds]);

  const gridItems: Track[] =
    tab === "library" && !searchMode
      ? library.map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          category: t.category,
          thumb: t.thumb || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
        }))
      : feed;

  const current =
    (currentTrack && currentId && currentTrack.id === currentId && currentTrack) ||
    (currentId
      ? (
          [...MUSIC_TRACKS, ...feed, ...suggests]
            .concat(
              watchedList.map((w) => ({
                id: w.id,
                title: w.title,
                artist: w.artist,
                thumb: w.thumb,
                category: w.category,
              }))
            )
            .find((x) => x.id === currentId) || null
        )
      : null);

  const fetchPage = useCallback(
    async (
      query: string,
      token: string | null,
      append: boolean,
      opts?: { hideWatched?: boolean }
    ) => {
      if (busy.current) return;
      busy.current = true;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setMsg("");
      const hideWatched = !!opts?.hideWatched;
      const withThumb = (it: Track): Track => ({
        ...it,
        thumb:
          (it as Track & { thumb?: string }).thumb ||
          `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`,
      });
      try {
        const qs = new URLSearchParams({ q: query, max: "24" });
        if (token) qs.set("pageToken", token);
        const res = await fetch(`/api/youtube-music?${qs}`);
        const data = await res.json();
        if (data.error === "no_api_key" || data.error === "quota_exceeded") {
          setMsg(
            data.message ||
              (data.error === "quota_exceeded"
                ? "Hết hạn mức YouTube trong ngày — đang dùng thư viện offline."
                : "Chưa cấu hình API key — dùng thư viện offline.")
          );
          if (!append) {
            let local = (data.items?.length ? data.items : MUSIC_TRACKS.slice(0, 24)).map(
              (it: Track) => withThumb(it)
            );
            if (hideWatched) {
              const filtered = local.filter((it: Track) => it.id && !watchedSet.has(it.id));
              if (filtered.length) local = filtered;
            }
            setFeed(local);
          }
          setNextToken(null);
        } else if (data.items?.length) {
          const items: Track[] = (data.items as Track[])
            .filter((it) => !!it?.id)
            .map(withThumb);
          setFeed((prev) => {
            if (!append) {
              if (hideWatched) {
                const fresh = items.filter((it) => !watchedSet.has(it.id));
                return shuffleTracks(fresh.length ? fresh : items);
              }
              // Tìm kiếm: giữ nguyên mọi kết quả (kể cả đã xem)
              return items;
            }
            const seen = new Set(prev.map((x) => x.id));
            const merged = [...prev];
            items.forEach((it) => {
              if (!it.id || seen.has(it.id)) return;
              if (hideWatched && watchedSet.has(it.id)) return;
              seen.add(it.id);
              merged.push(it);
            });
            return merged;
          });
          setNextToken(data.nextPageToken || null);
          if (data.source === "local" && data.message) setMsg(data.message);
          else setMsg("");
        } else {
          if (!append) {
            const q = query.toLowerCase();
            let local = MUSIC_TRACKS.filter(
              (it) =>
                it.title.toLowerCase().includes(q) ||
                it.artist.toLowerCase().includes(q) ||
                (it.category || "").toLowerCase().includes(q)
            );
            if (!local.length) local = MUSIC_TRACKS.slice(0, 24);
            setFeed(local.map(withThumb));
            setMsg(data.detail || data.message || "Không có kết quả YouTube — dùng offline.");
          }
          setNextToken(null);
        }
      } catch {
        setMsg("Lỗi mạng — đang dùng thư viện offline.");
        if (!append) {
          const q = query.toLowerCase();
          let local = MUSIC_TRACKS.filter(
            (it) =>
              it.title.toLowerCase().includes(q) ||
              it.artist.toLowerCase().includes(q)
          );
          if (!local.length) local = MUSIC_TRACKS.slice(0, 24);
          setFeed(local.map(withThumb));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        busy.current = false;
      }
    },
    [watchedSet]
  );

  useEffect(() => {
    setHistory(getMusicSearchHistory());
  }, []);

  // Seed offline ngay + fetch đề xuất (không để trang trắng nếu API lỗi)
  useEffect(() => {
    setFeed(
      MUSIC_TRACKS.slice(0, 24).map((it) => ({
        ...it,
        thumb: `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`,
      }))
    );
    const q =
      (typeof pickRandomQueries === "function" ? pickRandomQueries(1)[0] : null) ||
      TREND_QUERIES[0] ||
      "nhạc việt nam";
    setFeedQuery(q);
    void fetchPage(q, null, false, { hideWatched: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (tab === "library" && !searchMode) return;
        if (!nextToken || loading || loadingMore) return;
        fetchPage(feedQuery, nextToken, true, {
          hideWatched: !searchMode && (tab === "home" || tab === "trending"),
        });
      },
      { rootMargin: "500px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [nextToken, loading, loadingMore, feedQuery, tab, searchMode, fetchPage]);

  const switchTab = (next: Tab) => {
    if (next === tab && !searchMode) return;
    setSearchMode(false);
    setPlaying(false);
    setCurrentId(null);
    setCurrentTrack(null);
    setTabSwitching(true);
    setOpenSuggest(false);
    if (switchTimer.current) clearTimeout(switchTimer.current);
    switchTimer.current = setTimeout(() => {
      setTab(next);
      if (next === "home") {
        const q = (typeof pickRandomQueries === "function" ? pickRandomQueries(1)[0] : null) || TREND_QUERIES[0] || "nhạc việt nam";
        setFeedQuery(q);
        fetchPage(q, null, false, { hideWatched: true });
      } else if (next === "trending") {
        const q = pickRandomQueries(1)[0] || TREND_QUERIES[0] || "nhạc việt";
        setTrendQ(q);
        setFeedQuery(q);
        fetchPage(q, null, false, { hideWatched: true });
      }
      setTimeout(() => setTabSwitching(false), 150);
    }, 180);
  };

  const playTrack = (t: Track) => {
    if (!t?.id) return;
    const track: Track = {
      id: t.id,
      title: t.title || "Video",
      artist: t.artist || "",
      thumb: t.thumb || `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
      category: t.category,
    };
    setCurrentTrack(track);
    setCurrentId(track.id);
    setPlaying(true);
    setMiniTrack({
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumb: track.thumb,
    });
    addXp({ type: "music_play" });
    addWatched({
      id: track.id,
      title: track.title,
      artist: track.artist,
      thumb: track.thumb,
      category: track.category,
    });
  };

  const fetchSuggest = useCallback(async (keyword: string) => {
    const s = keyword.trim();
    if (s.length < 2) {
      setSuggests([]);
      return;
    }
    const local = MUSIC_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(s.toLowerCase()) ||
        t.artist.toLowerCase().includes(s.toLowerCase())
    ).slice(0, 6);
    try {
      const res = await fetch(
        `/api/youtube-music?q=${encodeURIComponent(s)}&max=12&suggest=1`
      );
      const data = await res.json();
      const yt: Track[] = data.items || [];
      const map = new Map<string, Track>();
      [...local, ...yt].forEach((t) => {
        if (t.id && !map.has(t.id)) map.set(t.id, t);
      });
      setSuggests(Array.from(map.values()).slice(0, 12));
      setOpenSuggest(true);
    } catch {
      setSuggests(local);
      setOpenSuggest(local.length > 0);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (searchInput.trim().length < 2) {
      setSuggests([]);
      return;
    }
    timerRef.current = setTimeout(() => fetchSuggest(searchInput), 280);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [searchInput, fetchSuggest]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpenSuggest(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const runSearch = async (keyword: string) => {
    const s = keyword.trim();
    if (!s) return;
    pushMusicSearchHistory(s);
    setHistory(getMusicSearchHistory());
    setOpenSuggest(false);
    setSearchMode(true);
    setPlaying(false);
    setCurrentId(null);
    setCurrentTrack(null);
    setFeedQuery(s);
    await fetchPage(s, null, false, { hideWatched: false });
  };

  return (
    <div className="min-h-screen pt-[6.75rem] lg:pt-16 pb-24 px-3 sm:px-4 md:px-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-full bg-[#ff0000] flex items-center justify-center shrink-0">
          <Music2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Opus Music</h1>
          <p className="text-[11px] text-[#aaa]">Đề xuất YouTube · Cuộn tải thêm</p>
        </div>
      </div>

      <div ref={wrapRef} className="relative mb-4 max-w-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(searchInput);
          }}
          className="flex"
        >
          <div className="relative flex-1 flex items-center bg-[#121212] border border-[#303030] rounded-l-full overflow-hidden focus-within:border-[#3ea6ff]">
            <Search className="w-4 h-4 ml-4 text-[#717171] shrink-0" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setOpenSuggest(true);
              }}
              onFocus={() => { setHistory(getMusicSearchHistory()); setOpenSuggest(true); }}
              placeholder="Tìm kiếm"
              className="flex-1 bg-transparent text-white text-sm px-3 py-2.5 outline-none min-w-0"
              autoComplete="off"
            />
            {searchInput && (
              <button
                type="button"
                className="p-2 text-[#717171] hover:text-white"
                onClick={() => {
                  setSearchInput("");
                  setSuggests([]);
                  setSearchMode(false);
                  switchTab("home");
                }}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-5 bg-[#222] border border-l-0 border-[#303030] rounded-r-full text-white hover:bg-[#303030]"
            aria-label="Tìm"
          >
            {loading && !loadingMore ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </button>
        </form>

        {openSuggest && (suggests.length > 0 || (searchInput.trim().length < 2 && history.length > 0)) && (
          <div className="absolute left-0 right-0 mt-1 z-50 rounded-xl border border-[#303030] glass-dropdown shadow-2xl overflow-hidden">
            {searchInput.trim().length < 2 && history.length > 0 && (
              <div className="border-b border-[#303030]">
                <div className="flex justify-between px-4 py-2">
                  <span className="text-xs text-[#aaa]">Lịch sử tìm kiếm</span>
                  <button type="button" className="text-xs text-[#3ea6ff]" onClick={() => { clearMusicSearchHistory(); setHistory([]); }}>
                    Xóa tất cả
                  </button>
                </div>
                <ul>
                  {history.map((h) => (
                    <li key={h} className="flex items-center hover:bg-white/5">
                      <button type="button" className="flex-1 text-left px-4 py-2.5 text-sm text-white" onClick={() => { setSearchInput(h); runSearch(h); }}>
                        {h}
                      </button>
                      <button type="button" className="px-3 text-[#717171]" onClick={() => { removeMusicSearchHistory(h); setHistory(getMusicSearchHistory()); }}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <ul className="max-h-[50vh] overflow-y-auto">
              {suggests.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/10"
                    onClick={() => {
                      setSearchInput(item.title);
                      setOpenSuggest(false);
                      runSearch(item.title);
                    }}
                  >
                    <Search className="w-4 h-4 text-[#aaa] shrink-0" />
                    <span className="text-sm text-white line-clamp-1">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {!searchMode && (
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {(
            [
              { id: "home" as const, label: "Đề xuất", icon: Flame },
              { id: "library" as const, label: "Thư viện", icon: Library },
              { id: "trending" as const, label: "Thịnh hành", icon: Flame },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${
                tab === t.id ? "bg-white text-black font-medium" : "bg-[#272727] text-white"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {searchMode && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-[#aaa]">
            Kết quả cho <span className="text-white font-medium">&quot;{searchInput}&quot;</span>
          </p>
          <button type="button" className="text-sm text-red-400" onClick={() => switchTab("home")}>
            Về đề xuất
          </button>
        </div>
      )}

      {tab === "trending" && !searchMode && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-1">
          {TREND_QUERIES.map((tq) => (
            <button
              key={tq}
              type="button"
              onClick={() => {
                setTrendQ(tq);
                setFeedQuery(tq);
                fetchPage(tq, null, false, { hideWatched: true });
              }}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs transition ${
                trendQ === tq ? "bg-white text-black" : "bg-[#272727] text-white"
              }`}
            >
              {tq}
            </button>
          ))}
        </div>
      )}

      {tab === "library" && !searchMode && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-1">
          {MUSIC_CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-sm transition ${
                cat === c ? "bg-white text-black font-medium" : "bg-[#272727] text-white"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {msg && (
        <p className="text-xs text-amber-400/90 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
          {msg}
        </p>
      )}

      {playing && currentId && (
        <AmbientGlow
          src={
            (current && "thumb" in current && current.thumb) ||
            `https://i.ytimg.com/vi/${currentId}/hqdefault.jpg`
          }
          className="mb-5"
        >
        <div className="rounded-2xl overflow-hidden bg-black border border-[#272727]">
          <div className="relative w-full aspect-video">
            <iframe
              key={currentId}
              title={current?.title || "Opus Music"}
              src={`https://www.youtube.com/embed/${currentId}?autoplay=1&rel=0`}
              className="absolute inset-0 w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
          <div className="px-3 py-2.5">
            <h2 className="text-base font-semibold text-white line-clamp-2">
              {current?.title || "Đang phát"}
            </h2>
            <p className="text-sm text-[#aaa]">{current?.artist || ""}</p>
            <div className="mt-2">
              <FloatingReactions onReact={() => addXp({ type: "like" })} />
            </div>
          </div>
        </div>
        </AmbientGlow>
      )}

      {currentId && (
        <div className="mb-6">
          <VideoSocial slug={`music-${currentId}`} title={current?.title} />
        </div>
      )}

      <div className="relative min-h-[200px]">
        {(tabSwitching || (loading && !loadingMore)) && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 glass-overlay rounded-xl min-h-[180px]">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-red-500 animate-spin" />
            <p className="text-sm text-zinc-300">Đang tải...</p>
          </div>
        )}

        
          {watchedList.length > 0 && tab === "home" && !searchMode && (
            <section className="mb-6">
              <h2 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
                <History className="w-4 h-4" /> Đã xem
              </h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
                {watchedList.slice(0, 24).map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() =>
                      playTrack({
                        id: w.id,
                        title: w.title,
                        artist: w.artist,
                        thumb: w.thumb,
                        category: w.category,
                      })
                    }
                    className="flex-shrink-0 w-28 text-left group"
                  >
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-zinc-800 mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={w.thumb || `https://i.ytimg.com/vi/${w.id}/hqdefault.jpg`}
                        alt=""
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100"
                      />
                    </div>
                    <p className="text-[11px] text-white line-clamp-2 leading-snug">{w.title}</p>
                  </button>
                ))}
              </div>
            </section>
          )}

          {tab === "home" && !searchMode && (
            <h2 className="text-sm font-semibold text-zinc-300 mb-2 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" /> Đề xuất mới cho bạn
            </h2>
          )}

        {!loading && !tabSwitching && searchMode && gridItems.length === 0 && (
          <p className="text-sm text-zinc-400 py-8 text-center">Không tìm thấy video. Thử từ khóa khác.</p>
        )}

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-3 gap-y-6">
          {(tab === "home" && !searchMode ? feed.filter((x) => !watchedSet.has(x.id)) : gridItems).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => playTrack(t)}
              className="group text-left flex flex-col w-full"
            >
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-[#272727]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbUrl(t.id, t.thumb)}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = "0.3";
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/35 transition">
                  <div className="w-11 h-11 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex gap-2.5 px-0.5">
                <div className="w-9 h-9 rounded-full bg-[#272727] shrink-0 flex items-center justify-center">
                  <Music2 className="w-4 h-4 text-[#aaa]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                    {t.title}
                  </p>
                  <p className="text-xs text-[#aaa] mt-0.5 line-clamp-1">{t.artist}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div ref={sentinel} className="h-14 flex items-center justify-center mt-6">
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-[#aaa]">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải thêm...
            </div>
          )}
          {!loadingMore && !nextToken && feed.length > 0 && tab !== "library" && (
            <p className="text-xs text-[#717171]">Kéo để xem thêm khi còn kết quả từ YouTube</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NhacPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] pt-20 text-center text-zinc-500 text-sm">Đang tải nhạc…</div>}>
      <NhacInner />
    </Suspense>
  );
}
