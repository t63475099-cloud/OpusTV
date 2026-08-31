"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Play,
  Flame,
  TrendingUp,
  Compass,
  Heart,
  Search,
  Volume2,
  VolumeX,
  Clock,
  Star,
  Film,
  Music,
  Eye,
  MessageSquare,
  Bookmark,
  Radio,
  ShieldCheck,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface RealMovie {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  year: number;
  quality?: string;
  episode_current?: string;
  time?: string;
  category?: { name: string }[];
}

export default function LiquidGlassHomePage() {
  const [movies, setMovies] = useState<RealMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("tat-ca");
  const [activeMovieIndex, setActiveMovieIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Tải danh sách phim thật từ API
  useEffect(() => {
    async function fetchRealMovies() {
      setLoading(true);
      try {
        const res = await fetch("https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=1");
        const data = await res.json();
        if (data?.items && data.items.length > 0) {
          setMovies(data.items);
        }
      } catch (err) {
        console.error("Lỗi tải phim:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRealMovies();
  }, []);

  // Theo dõi vị trí chuột cho hiệu ứng Orbs phản chiếu ánh sáng kính
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const toggleBookmark = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleLike = (id: string) => {
    setLikedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const featuredMovie = movies[activeMovieIndex] || movies[0];

  const getPoster = (url?: string) => {
    if (!url) return "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800";
    return url.startsWith("http") ? url : `https://phimimg.com/${url}`;
  };

  return (
    <div className="relative min-h-screen text-zinc-100 overflow-hidden pb-20 selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* 1. LỚP NỀN KÍNH LỎNG & ÁNH SÁNG ĐỘNG (LIQUID ORBS REFRACTION) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="liquid-orb orb-primary"
          style={{ transform: `translate3d(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px, 0)` }}
        />
        <div
          className="liquid-orb orb-secondary"
          style={{ transform: `translate3d(${-mousePos.x * 2}px, ${-mousePos.y * 2}px, 0)` }}
        />
        <div
          className="liquid-orb orb-tertiary"
          style={{ transform: `translate3d(${mousePos.x * 0.8}px, ${-mousePos.y * 1.2}px, 0)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* 2. THANH DANH MỤC KÍNH NỔI */}
        <section className="pt-4">
          <div className="liquid-glass-panel p-3 sm:p-4 rounded-3xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5 overflow-x-auto">
              {[
                { id: "tat-ca", label: "Kho Phim Mới", icon: Compass },
                { id: "phim-bo", label: "Phim Bộ", icon: Film },
                { id: "phim-le", label: "Phim Lẻ Chiếu Rạp", icon: Film },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-rose-600/90 to-purple-600/90 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-white/20 scale-[1.02]"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-zinc-400 font-mono hidden sm:block">
              Tổng số tác phẩm: <strong className="text-rose-400">{movies.length}</strong>
            </div>
          </div>
        </section>

        {/* 3. HERO SPOTLIGHT — PHIM NỔI BẬT */}
        {featuredMovie && (
          <section className="relative">
            <div className="liquid-spotlight-card relative rounded-[2rem] overflow-hidden p-6 sm:p-10 lg:p-12 min-h-[480px] flex flex-col justify-end">
              
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
                style={{ backgroundImage: `url(${getPoster(featuredMovie.poster_url || featuredMovie.thumb_url)})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/75 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/60 to-transparent" />

              <div className="absolute top-1/4 left-10 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Tiêu Điểm Mới Nhất
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-zinc-200 backdrop-blur-md">
                    {featuredMovie.episode_current || "Full HD"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 backdrop-blur-md flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {featuredMovie.year || 2026}
                  </span>
                </div>

                <div className="space-y-1">
                  <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                    {featuredMovie.name}
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 font-mono tracking-wide">{featuredMovie.origin_name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3.5 pt-4">
                  <Link
                    href={`/phim/${featuredMovie.slug}`}
                    className="liquid-btn-primary flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all hover:scale-105 active:scale-95"
                  >
                    <Play className="w-5 h-5 fill-white" /> Xem Phim Ngay
                  </Link>

                  <button
                    type="button"
                    onClick={() => toggleBookmark(featuredMovie._id)}
                    className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                      savedIds[featuredMovie._id]
                        ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                        : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                    }`}
                  >
                    <Bookmark className={`w-5 h-5 ${savedIds[featuredMovie._id] ? "fill-current" : ""}`} />
                  </button>
                </div>
              </div>

              {/* Bộ chọn danh sách phim nhanh */}
              <div className="absolute bottom-6 right-6 z-20 hidden lg:flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
                {movies.slice(0, 4).map((item, idx) => (
                  <button
                    key={item._id}
                    onClick={() => setActiveMovieIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeMovieIndex === idx
                        ? "bg-white/20 text-white border border-white/30"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* 4. LƯỚI DANH SÁCH PHIM THẬT TỪ HỆ THỐNG */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-500" /> Phim Mới Cập Nhật Hôm Nay
              </h2>
              <p className="text-xs text-zinc-400">Danh sách phim chuẩn HD được cập nhật tự động liên tục</p>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
              <p className="text-xs text-zinc-500">Đang đồng bộ kho phim trực tuyến...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
              {movies.map((item) => (
                <Link
                  key={item._id}
                  href={`/phim/${item.slug}`}
                  className="liquid-media-card group relative rounded-3xl overflow-hidden p-2.5 sm:p-3 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                >
                  <div className="relative aspect-[2/3] rounded-2xl overflow-hidden mb-2.5 bg-zinc-900">
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${getPoster(item.thumb_url || item.poster_url)})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                      <div className="w-11 h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.6)] backdrop-blur-md">
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </div>
                    </div>

                    <div className="absolute top-2 left-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-white backdrop-blur-md">
                        {item.episode_current || "HD"}
                      </span>
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 text-[10px] text-zinc-300">
                      <span className="bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-md">
                        {item.year || 2026}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 px-1">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-zinc-500 truncate">{item.origin_name}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>

      <style jsx global>{`
        .liquid-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .orb-primary {
          width: 550px;
          height: 550px;
          top: -10%;
          left: -10%;
          background: radial-gradient(circle, rgba(244, 63, 94, 0.18) 0%, transparent 70%);
        }
        .orb-secondary {
          width: 500px;
          height: 500px;
          top: 30%;
          right: -10%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
        }
        .orb-tertiary {
          width: 450px;
          height: 450px;
          bottom: 10%;
          left: 25%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
        }
        .liquid-glass-panel {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(24px) saturate(1.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
        }
        .liquid-spotlight-card {
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(28px) saturate(1.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .liquid-media-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .liquid-media-card:hover {
          background: rgba(20, 30, 55, 0.55);
          border-color: rgba(244, 63, 94, 0.4);
        }
        .liquid-btn-primary {
          background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%);
        }
      `}</style>
    </div>
  );
}
