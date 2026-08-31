"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Flame,
  TrendingUp,
  Compass,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  Star,
  Loader2,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

// Danh sách phim Tiên Hiệp đỉnh cao mặc định xuất hiện trên Hero Banner
interface HeroFeaturedMovie {
  id: string;
  name: string;
  origin_name: string;
  slug: string;
  youtube_trailer_id: string;
  backdrop_url: string;
  episode_current: string;
  year: number;
  rating: number;
  category: string;
  description: string;
}

const TIEN_HIEP_HERO_LIST: HeroFeaturedMovie[] = [
  {
    id: "th-1",
    name: "Trường Nguyệt Tẫn Minh",
    origin_name: "Till The End Of The Moon",
    slug: "truong-nguyet-tan-minh",
    youtube_trailer_id: "XpWz8gR9yU4",
    backdrop_url: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop",
    episode_current: "Thuyết Minh Full 40/40",
    year: 2026,
    rating: 9.9,
    category: "Tiên Hiệp / Huyền Huyễn",
    description: "Đại kiếp tam giới diệt vong, thần nữ phụng mệnh quay về 500 năm trước để ngăn chặn ma thần thức tỉnh.",
  },
  {
    id: "th-2",
    name: "Phàm Nhân Tu Tiên: Phong Khởi Lạc Vân",
    origin_name: "A Mortal's Journey to Immortality",
    slug: "pham-nhan-tu-tien",
    youtube_trailer_id: "aX6DkM0w_wM",
    backdrop_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop",
    episode_current: "4K 60FPS",
    year: 2026,
    rating: 9.8,
    category: "Tu Chân / 3D Đỉnh Cao",
    description: "Hành trình thiếu niên bình phàm bước vào con đường tu đạo đầy hiểm hóc, từng bước nghịch thiên cải mệnh.",
  },
  {
    id: "th-3",
    name: "Thế Giới Hoàn Mỹ: Thạch Hạo Tái Xuất",
    origin_name: "Perfect World: Reborn",
    slug: "the-gioi-hoan-my",
    youtube_trailer_id: "dJvY7q5K0e8",
    backdrop_url: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920&auto=format&fit=crop",
    episode_current: "Tập Mới Nhất",
    year: 2026,
    rating: 9.7,
    category: "Hồng Hoang / Thượng Cổ",
    description: "Nhất thảo trảm tận nhật nguyệt tinh thần. Hoang Thiên Đế độc đoán vạn cổ, bảo vệ nhân tộc giữa loạn thế.",
  },
  {
    id: "th-4",
    name: "Muôn Dặm Giang Sơn Chờ Ta Khai Phá",
    origin_name: "Braving The Famine With My Wife",
    slug: "muon-dam-giang-son-cho-ta-khai-pha",
    youtube_trailer_id: "m8e3gN3Qp1s",
    backdrop_url: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920&auto=format&fit=crop",
    episode_current: "Full HD",
    year: 2026,
    rating: 9.6,
    category: "Xuyên Không / Cổ Trang",
    description: "Trùng sinh khai hoang xây dựng thế lực, kiến tạo sơn hà tráng lệ và bình định thiên hạ.",
  },
];

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
}

const CATEGORIES = [
  { id: "moi-cap-nhat", label: "Phim Mới Nhất", icon: Compass, endpoint: "https://phimapi.com/danh-sach/phim-moi-cap-nhat" },
  { id: "phim-bo", label: "Phim Bộ", icon: Tv, endpoint: "https://phimapi.com/v1/api/danh-sach/phim-bo" },
  { id: "phim-le", label: "Phim Lẻ Chiếu Rạp", icon: Film, endpoint: "https://phimapi.com/v1/api/danh-sach/phim-le" },
  { id: "hoat-hinh", label: "Hoạt Hình Anime", icon: Sparkles, endpoint: "https://phimapi.com/v1/api/danh-sach/hoat-hinh" },
  { id: "tv-shows", label: "TV Shows", icon: TrendingUp, endpoint: "https://phimapi.com/v1/api/danh-sach/tv-shows" },
];

const AUTO_SLIDE_INTERVAL = 14000; // 14 giây tự động đổi sang trailer khác

export default function LiquidGlassHomePage() {
  const [activeCategory, setActiveCategory] = useState<string>("moi-cap-nhat");
  const [movies, setMovies] = useState<RealMovie[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  
  // Trạng thái Hero Banner Trailer
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [isTrailerMuted, setIsTrailerMuted] = useState<boolean>(true);
  const [isHoveringHero, setIsHoveringHero] = useState<boolean>(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const currentHero = TIEN_HIEP_HERO_LIST[heroIndex];

  // Tự động chuyển đổi Trailer định kỳ (chỉ chạy khi không rê chuột vào banner)
  useEffect(() => {
    if (isHoveringHero) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % TIEN_HIEP_HERO_LIST.length);
    }, AUTO_SLIDE_INTERVAL);
    return () => clearInterval(timer);
  }, [isHoveringHero]);

  // Hiệu ứng tương tác vị trí chuột theo thời gian thực
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Tải danh sách phim thật từ API
  const fetchMoviesByPage = useCallback(
    async (pageNum: number, catId: string, isReset: boolean = false) => {
      if (loading && !isReset) return;
      setLoading(true);

      const currentCategoryObj = CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
      const isCustomList = currentCategoryObj.id !== "moi-cap-nhat";
      const apiUrl = isCustomList
        ? `${currentCategoryObj.endpoint}?page=${pageNum}&limit=24`
        : `${currentCategoryObj.endpoint}?page=${pageNum}`;

      try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        let incomingItems: RealMovie[] = [];
        if (isCustomList && data?.data?.items) {
          incomingItems = data.data.items;
        } else if (data?.items) {
          incomingItems = data.items;
        }

        if (incomingItems.length === 0) {
          setHasMore(false);
        } else {
          setMovies((prev) => (isReset ? incomingItems : [...prev, ...incomingItems]));
          setHasMore(true);
        }
      } catch (err) {
        console.error("Lỗi kết nối nguồn phim:", err);
      } finally {
        setLoading(false);
        setInitialLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchMoviesByPage(1, activeCategory, true);
  }, [activeCategory, fetchMoviesByPage]);

  // Infinite Scroll bắt điểm chạm đáy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !initialLoading) {
          setPage((prevPage) => {
            const nextPage = prevPage + 1;
            fetchMoviesByPage(nextPage, activeCategory, false);
            return nextPage;
          });
        }
      },
      { threshold: 0.2, rootMargin: "250px" }
    );

    const currentElem = observerTarget.current;
    if (currentElem) observer.observe(currentElem);
    return () => {
      if (currentElem) observer.unobserve(currentElem);
    };
  }, [hasMore, loading, initialLoading, activeCategory, fetchMoviesByPage]);

  const toggleBookmark = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const getPoster = (thumbUrl?: string, posterUrl?: string) => {
    const target = thumbUrl || posterUrl;
    if (!target) return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1200";
    return target.startsWith("http") ? target : `https://phimimg.com/${target}`;
  };

  return (
    <div className="relative min-h-screen text-zinc-100 overflow-hidden pb-20 selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* 1. LỚP NỀN KÍNH LỎNG & QUẢ CẦU PHÁT QUANG */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="liquid-orb orb-primary"
          style={{ transform: `translate3d(${mousePos.x * 1.2}px, ${mousePos.y * 1.2}px, 0)` }}
        />
        <div
          className="liquid-orb orb-secondary"
          style={{ transform: `translate3d(${-mousePos.x * 1.6}px, ${-mousePos.y * 1.6}px, 0)` }}
        />
        <div
          className="liquid-orb orb-tertiary"
          style={{ transform: `translate3d(${mousePos.x * 0.8}px, ${-mousePos.y * 0.8}px, 0)` }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">

        {/* 2. KHUNG HERO BANNER TRAILER TIÊN HIỆP TỰ ĐỘNG PHÁT & CHUYỂN ĐỔI */}
        <section
          className="pt-2 sm:pt-4"
          onMouseEnter={() => setIsHoveringHero(true)}
          onMouseLeave={() => setIsHoveringHero(false)}
        >
          <div className="liquid-spotlight-card relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden min-h-[400px] sm:min-h-[500px] lg:min-h-[540px] flex flex-col justify-end p-5 sm:p-8 lg:p-12 border border-white/15 shadow-2xl">
            
            {/* LỚP VIDEO TRAILER CHUYỂN ĐỘNG NỀN (AUTOPLAY YOUTUBE STREAM) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
              <iframe
                key={currentHero.youtube_trailer_id + (isTrailerMuted ? "-muted" : "-unmuted")}
                src={`https://www.youtube-nocookie.com/embed/${currentHero.youtube_trailer_id}?autoplay=1&mute=${isTrailerMuted ? 1 : 0}&controls=0&loop=1&playlist=${currentHero.youtube_trailer_id}&showinfo=0&rel=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
                title={currentHero.name}
                className="absolute top-1/2 left-1/2 w-[160%] h-[160%] -translate-x-1/2 -translate-y-1/2 object-cover opacity-75 sm:opacity-85 scale-105 transition-opacity duration-1000"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
              
              {/* Lớp phủ Gradient Kính tối ưu đọc chữ */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/70 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/95 via-[#050508]/60 to-transparent hidden sm:block" />
            </div>

            {/* Quầng sáng Neon Ambient */}
            <div className="absolute top-1/3 left-6 sm:left-12 w-64 sm:w-96 h-64 sm:h-96 bg-rose-500/25 rounded-full blur-3xl pointer-events-none" />

            {/* THÔNG TIN CHI TIẾT PHIM TIÊN HIỆP ĐANG PHÁT */}
            <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
              
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400 animate-pulse" /> Tiêu Điểm Tiên Hiệp
                </span>
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-white/10 border border-white/15 text-zinc-200 backdrop-blur-md">
                  {currentHero.episode_current}
                </span>
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 backdrop-blur-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {currentHero.rating}
                </span>
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-purple-500/10 border border-purple-500/20 text-purple-300 backdrop-blur-md">
                  {currentHero.category}
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                  {currentHero.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-mono line-clamp-1">{currentHero.origin_name}</p>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2 max-w-xl text-shadow">
                {currentHero.description}
              </p>

              {/* NÚT THAO TÁC & ĐIỀU KHIỂN ÂM THANH */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/phim/${currentHero.slug}`}
                  className="liquid-btn-primary flex items-center gap-2 px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-sm shadow-[0_0_25px_rgba(244,63,94,0.45)] transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> Xem Phim Ngay
                </Link>

                <button
                  type="button"
                  onClick={() => toggleBookmark(currentHero.id)}
                  className={`p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                    savedIds[currentHero.id]
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                  }`}
                  title="Lưu phim vào danh sách"
                >
                  <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${savedIds[currentHero.id] ? "fill-current" : ""}`} />
                </button>

                {/* Bật / Tắt âm thanh Trailer */}
                <button
                  type="button"
                  onClick={() => setIsTrailerMuted(!isTrailerMuted)}
                  className="p-3 rounded-xl sm:rounded-2xl bg-black/40 hover:bg-black/60 border border-white/15 text-zinc-200 hover:text-white transition-all backdrop-blur-md flex items-center gap-2 text-xs font-semibold"
                  title={isTrailerMuted ? "Bật âm thanh trailer" : "Tắt âm thanh"}
                >
                  {isTrailerMuted ? (
                    <>
                      <VolumeX className="w-4 h-4 text-zinc-400" />
                      <span className="hidden sm:inline">Bật Tiếng</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-rose-400 animate-pulse" />
                      <span className="hidden sm:inline text-rose-300">Đang Phát Tiếng</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* THANH ĐIỀU HƯỚNG SỐ THỨ TỰ & TIẾN TRÌNH TỰ ĐỔI TRAILER */}
            <div className="absolute bottom-5 right-5 sm:bottom-8 sm:right-8 z-20 flex items-center gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/15 backdrop-blur-2xl">
              <button
                type="button"
                onClick={() => setHeroIndex((prev) => (prev - 1 + TIEN_HIEP_HERO_LIST.length) % TIEN_HIEP_HERO_LIST.length)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Trailer trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {TIEN_HIEP_HERO_LIST.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setHeroIndex(idx)}
                  className={`relative px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all overflow-hidden ${
                    heroIndex === idx
                      ? "bg-white/20 text-white border border-white/30 shadow-inner"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  0{idx + 1}
                  {heroIndex === idx && !isHoveringHero && (
                    <span
                      className="absolute bottom-0 left-0 h-[2px] bg-rose-500 animate-trailer-progress"
                      style={{ animationDuration: `${AUTO_SLIDE_INTERVAL}ms` }}
                    />
                  )}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setHeroIndex((prev) => (prev + 1) % TIEN_HIEP_HERO_LIST.length)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                title="Trailer kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </section>

        {/* 3. THANH DANH MỤC KÍNH NỔI */}
        <section>
          <div className="liquid-glass-panel p-2 sm:p-3.5 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-3 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 px-0.5 w-full">
              {CATEGORIES.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCategory(tab.id)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-300 shrink-0 ${
                      isActive
                        ? "bg-gradient-to-r from-rose-600 to-purple-600 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-white/20 scale-[1.02]"
                        : "text-zinc-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/5"
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="text-[11px] text-zinc-400 font-mono hidden lg:flex items-center gap-1.5 shrink-0 pr-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tổng: <strong className="text-white">{movies.length}</strong> phim
            </div>
          </div>
        </section>

        {/* 4. LƯỚI POSTER NẰM NGANG 16:9 (RESPONSIVE CHUẨN MỌI THIẾT BỊ) */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /> Danh Sách Phim Trực Tuyến
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">Cuộn xuống để tải thêm hàng ngàn tác phẩm tự động</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {movies.map((item, index) => (
              <Link
                key={`${item._id}-${index}`}
                href={`/phim/${item.slug}`}
                className="liquid-media-card group relative rounded-2xl sm:rounded-3xl overflow-hidden p-2 sm:p-2.5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 cursor-pointer"
              >
                <div className="relative aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden mb-2.5 bg-zinc-950">
                  <img
                    src={getPoster(item.thumb_url, item.poster_url)}
                    alt={item.name}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-60 group-hover:opacity-30 transition-opacity" />

                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.6)] backdrop-blur-md">
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  <div className="absolute top-1.5 left-1.5">
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-md bg-black/70 border border-white/10 text-white backdrop-blur-md">
                      {item.episode_current || "HD"}
                    </span>
                  </div>

                  <div className="absolute bottom-1.5 right-1.5">
                    <span className="text-[9px] sm:text-[10px] font-medium bg-black/70 px-1.5 sm:px-2 py-0.5 rounded-md backdrop-blur-md text-zinc-300">
                      {item.year || 2026}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5 px-0.5">
                  <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                    {item.name}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">{item.origin_name}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* VÙNG OBSERVER CUỘN VÔ TẬN */}
          <div ref={observerTarget} className="py-10 flex flex-col items-center justify-center">
            {loading && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 backdrop-blur-xl">
                <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
                <span className="text-xs text-zinc-300 font-medium">Đang tải thêm phim...</span>
              </div>
            )}
            {!hasMore && movies.length > 0 && (
              <p className="text-xs text-zinc-600 font-mono">Đã tải hết toàn bộ danh sách tác phẩm.</p>
            )}
          </div>
        </section>

      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes trailer-progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-trailer-progress {
          animation: trailer-progress linear forwards;
        }

        .liquid-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .orb-primary {
          width: 480px;
          height: 480px;
          top: -8%;
          left: -8%;
          background: radial-gradient(circle, rgba(244, 63, 94, 0.16) 0%, transparent 70%);
        }
        .orb-secondary {
          width: 420px;
          height: 420px;
          top: 35%;
          right: -10%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.14) 0%, transparent 70%);
        }
        .orb-tertiary {
          width: 380px;
          height: 380px;
          bottom: 10%;
          left: 20%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
        }
        .liquid-glass-panel {
          background: rgba(15, 23, 42, 0.5);
          backdrop-filter: blur(20px) saturate(1.5);
          -webkit-backdrop-filter: blur(20px) saturate(1.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
        }
        .liquid-spotlight-card {
          background: rgba(10, 15, 30, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .liquid-media-card {
          background: rgba(15, 23, 42, 0.38);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
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
