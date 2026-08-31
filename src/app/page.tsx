"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  TrendingUp,
  Compass,
  Film,
  Tv,
  Sparkles,
  Bookmark,
  Star,
  Loader2,
  Swords,
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

interface HeroSlideMovie {
  id: string;
  name: string;
  originName: string;
  slug: string;
  tag: string;
  year: number;
  quality: string;
  rating: number;
  description: string;
  imageUrl: string;
}

// Tuyển tập siêu phẩm Tiên Hiệp đặc sắc nhất hiển thị luân phiên tự động
const TIEN_HIEP_HERO_LIST: HeroSlideMovie[] = [
  {
    id: "hero-1",
    name: "Trường Nguyệt Tẫn Minh",
    originName: "Till The End Of The Moon",
    slug: "truong-nguyet-tan-minh",
    tag: "Tiên Hiệp Thượng Thừa",
    year: 2026,
    quality: "4K Ultra HD",
    rating: 9.9,
    description:
      "Vì cứu vãn tam giới khỏi sự thống trị của Ma Thần Đạm Đài Tẫn, Lê Tô Tô quay về 500 năm trước hoá thân thành Diệp Tịch Vụ, tạo nên thiên tình sử bi tráng chấn động cửu giới.",
    imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: "hero-2",
    name: "Phàm Nhân Tu Tiên",
    originName: "A Record of a Mortal's Journey",
    slug: "pham-nhan-tu-tien",
    tag: "Tu Chân Huyền Huyễn",
    year: 2026,
    quality: "60 FPS 4K",
    rating: 9.8,
    description:
      "Thiếu niên bình phàm Hàn Lập bằng sự cẩn trọng và ý chí kiên định từng bước vượt qua muôn ngàn hiểm cảnh trong giới tu chân, nghịch thiên cải mệnh đắc đạo phi thăng.",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: "hero-3",
    name: "Thương Lan Quyết",
    originName: "Love Between Fairy and Devil",
    slug: "thuong-lan-quyet",
    tag: "Cổ Trang Tiên Giới",
    year: 2026,
    quality: "Dolby Vision",
    rating: 9.7,
    description:
      "Nguyệt Tôn ma giới Đông Phương Thanh Thương vô tình bị trói buộc đồng cảm linh hồn với tiểu tiên nữ Hoa Lan Nhỏ, mở ra cuộc chiến rung chuyển thiên địa.",
    imageUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920&auto=format&fit=crop",
  },
  {
    id: "hero-4",
    name: "Đấu Phá Thương Khung: Niên Phiên",
    originName: "Battle Through the Heavens",
    slug: "dau-pha-thuong-khung",
    tag: "Huyền Huyễn Võ Đạo",
    year: 2026,
    quality: "4K HDR",
    rating: 9.8,
    description:
      "Tam Thập Niên Hà Đông, Tam Thập Niên Hà Tây, Mạc Khi Thiếu Niên Cùng! Tiêu Viêm nắm giữ Dị Hỏa, luyện dược đỉnh cao, chinh phạt Đấu Khí Đại Lục.",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop",
  },
];

const CATEGORIES = [
  { id: "moi-cap-nhat", label: "Phim Mới Nhất", icon: Compass, endpoint: "https://phimapi.com/danh-sach/phim-moi-cap-nhat" },
  { id: "phim-bo", label: "Phim Bộ", icon: Tv, endpoint: "https://phimapi.com/v1/api/danh-sach/phim-bo" },
  { id: "phim-le", label: "Phim Lẻ Chiếu Rạp", icon: Film, endpoint: "https://phimapi.com/v1/api/danh-sach/phim-le" },
  { id: "hoat-hinh", label: "Hoạt Hình Anime", icon: Sparkles, endpoint: "https://phimapi.com/v1/api/danh-sach/hoat-hinh" },
  { id: "tv-shows", label: "TV Shows", icon: TrendingUp, endpoint: "https://phimapi.com/v1/api/danh-sach/tv-shows" },
];

export default function LiquidGlassHomePage() {
  const [activeCategory, setActiveCategory] = useState<string>("moi-cap-nhat");
  const [movies, setMovies] = useState<RealMovie[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  
  // Quản lý chuyển slide hình ảnh Tiên Hiệp tự động
  const [heroIndex, setHeroIndex] = useState<number>(0);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const observerTarget = useRef<HTMLDivElement | null>(null);
  const currentHero = TIEN_HIEP_HERO_LIST[heroIndex];

  // Tự động chuyển đổi hình ảnh Tiên Hiệp sau mỗi 6 giây
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % TIEN_HIEP_HERO_LIST.length);
    }, 6000);

    return () => clearInterval(slideTimer);
  }, []);

  // Tương tác ánh sáng theo chuyển động chuột trên Desktop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePos({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Tải danh sách phim từ API
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

  // Infinite Scroll tải thêm khi cuộn xuống cuối trang
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
      
      {/* 1. NỀN KÍNH LỎNG & ÁNH SÁNG ĐỘNG */}
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

        {/* 2. THANH DANH MỤC KÍNH NỔI */}
        <section className="pt-2 sm:pt-4">
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
              Đã nạp: <strong className="text-white">{movies.length}</strong> phim
            </div>
          </div>
        </section>

        {/* 3. HERO SLIDESHOW HÌNH ẢNH TIÊN HIỆP (TỰ ĐỘNG CHUYỂN ĐỔI) */}
        <section className="relative">
          <div className="liquid-spotlight-card relative rounded-2xl sm:rounded-[2.5rem] overflow-hidden p-5 sm:p-8 lg:p-12 min-h-[360px] sm:min-h-[460px] lg:min-h-[500px] flex flex-col justify-end">
            
            {/* HÌNH ẢNH TIÊN HIỆP TỰ ĐỘNG CHUYỂN ĐỔI VỚI HIỆU ỨNG CROSSFADE */}
            {TIEN_HIEP_HERO_LIST.map((item, idx) => (
              <div
                key={item.id}
                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
                  idx === heroIndex ? "opacity-100 scale-100" : "opacity-0 scale-105 pointer-events-none"
                }`}
                style={{
                  backgroundImage: `url(${item.imageUrl})`,
                  transition: "opacity 1s ease-in-out, transform 8s ease-out",
                }}
              />
            ))}

            {/* LỚP GRADIENT MỜ PHỦ KÍNH LỎNG */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/70 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050508] via-[#050508]/60 to-transparent pointer-events-none" />
            <div className="absolute top-1/4 left-6 sm:left-12 w-64 sm:w-96 h-64 sm:h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* THÔNG TIN CHI TIẾT CỦA PHIM ĐANG HIỂN THỊ */}
            <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md flex items-center gap-1">
                  <Swords className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> {currentHero.tag}
                </span>
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-white/10 border border-white/15 text-zinc-200 backdrop-blur-md">
                  {currentHero.quality}
                </span>
                <span className="px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 backdrop-blur-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {currentHero.rating}
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-2xl">
                  {currentHero.name}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-mono tracking-wide">{currentHero.originName}</p>
              </div>

              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-xl text-shadow-sm">
                {currentHero.description}
              </p>

              {/* BỘ NÚT HÀNH ĐỘNG */}
              <div className="flex items-center gap-3 pt-2">
                <Link
                  href={`/phim/${currentHero.slug}`}
                  className="liquid-btn-primary flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-sm shadow-[0_0_30px_rgba(244,63,94,0.45)] transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" /> Xem Phim Ngay
                </Link>

                <button
                  type="button"
                  onClick={() => toggleBookmark(currentHero.id)}
                  className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all duration-300 backdrop-blur-md ${
                    savedIds[currentHero.id]
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                  }`}
                  title="Lưu vào danh sách xem"
                >
                  <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${savedIds[currentHero.id] ? "fill-current" : ""}`} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 4. LƯỚI POSTER NẰM NGANG 16:9 (DANH SÁCH PHIM TỰ ĐỘNG TẢI VÔ TẬN) */}
        <section className="space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" /> Danh Sách Phim Mới Cập Nhật
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

          {/* 5. VÙNG THEO DÕI CUỘN VÔ TẬN */}
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
          border: 1px solid rgba(255, 255, 255, 0.1);
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
