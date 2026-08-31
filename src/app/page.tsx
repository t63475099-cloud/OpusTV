"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Play,
  Flame,
  Sparkles,
  TrendingUp,
  Compass,
  Heart,
  Share2,
  Search,
  Sliders,
  Volume2,
  VolumeX,
  Maximize2,
  Clock,
  Star,
  Film,
  Music,
  Eye,
  MessageSquare,
  Bookmark,
  Radio,
  Tv,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

// --- Kiểu dữ liệu nội dung giải trí ---
interface MediaItem {
  id: string;
  title: string;
  originalTitle: string;
  category: "phim" | "nhac" | "truyen-hinh" | "chieu-rap";
  rating: number;
  year: number;
  duration: string;
  quality: string;
  episodes?: string;
  tags: string[];
  bannerUrl: string;
  posterUrl: string;
  views: number;
  likes: number;
  description: string;
  isHot?: boolean;
}

interface LiveComment {
  id: string;
  user: string;
  avatarColor: string;
  verified: boolean;
  content: string;
  time: string;
  likes: number;
}

// --- Dữ liệu phim & nội dung phát hành ---
const FEATURED_MEDIA: MediaItem[] = [
  {
    id: "thien-menh-anh-hung",
    title: "Thiên Mệnh Thần Giới",
    originalTitle: "Immortal Realm: Destiny",
    category: "phim",
    rating: 9.8,
    year: 2026,
    duration: "135 phút",
    quality: "4K Ultra HD",
    tags: ["Tiên Hiệp", "Huyền Huyễn", "Kỹ Xảo"],
    bannerUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop",
    posterUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop",
    views: 1284500,
    likes: 94200,
    description:
      "Một kiếm phá vỡ hư không, vạn giới quy phục. Hành trình thức tỉnh thần cốt thượng cổ của kiếm tu phi thăng giữa muôn trùng kiếp nạn luân hồi.",
    isHot: true,
  },
  {
    id: "van-co-chi-ton",
    title: "Vạn Cổ Độc Tôn",
    originalTitle: "Peerless Overlord",
    category: "phim",
    rating: 9.5,
    year: 2026,
    duration: "Tập 48 / 60",
    quality: "1080p FHD",
    tags: ["Cổ Trang", "Võ Thuật", "Hành Động"],
    bannerUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920&auto=format&fit=crop",
    posterUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=800&auto=format&fit=crop",
    views: 890200,
    likes: 67300,
    description: "Trùng sinh sau một vạn năm phong ấn, tái thiết tông môn, chinh phục giang sơn cửu châu với thần công tuyệt thế vô song.",
  },
  {
    id: "thu-kich-hoang-da",
    title: "Thư Kích Thần Vực",
    originalTitle: "Sniper Warzone: Origin",
    category: "phim",
    rating: 9.2,
    year: 2026,
    duration: "118 phút",
    quality: "4K HDR",
    tags: ["Viễn Tưởng", "Sinh Tồn", "Chiến Tranh"],
    bannerUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop",
    posterUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800&auto=format&fit=crop",
    views: 642100,
    likes: 51200,
    description: "Đội đặc nhiệm sinh tồn đối mặt với sinh vật biến dị trong vùng đất cấm không gian kín thời kỳ hậu tận thế.",
  },
  {
    id: "nguyet-hoa-dau-la",
    title: "Nguyệt Hoa Vũ Điệu",
    originalTitle: "Moonlight Serenade OST",
    category: "nhac",
    rating: 9.9,
    year: 2026,
    duration: "04:22",
    quality: "Lossless FLAC",
    tags: ["Nhạc Phim", "Cổ Phong", "Nhạc Cụ Dân Tộc"],
    bannerUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1920&auto=format&fit=crop",
    posterUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=800&auto=format&fit=crop",
    views: 2150000,
    likes: 184000,
    description: "Bản giao hưởng tiên hiệp kết hợp đàn tranh cổ truyền và dàn nhạc giao hưởng điện tử hiện đại đầy mê hoặc.",
  },
];

const LIVE_COMMENTS: LiveComment[] = [
  {
    id: "c1",
    user: "KiemThanh99",
    avatarColor: "from-rose-500 to-orange-500",
    verified: true,
    content: "Kỹ xảo đoạn đấu kiếm ở đỉnh núi Vân Tiêu tập này thực sự vượt trội, xem 4K trên màn kính mờ quá đã!",
    time: "2 phút trước",
    likes: 24,
  },
  {
    id: "c2",
    user: "BichDao_TienTu",
    avatarColor: "from-purple-500 to-indigo-500",
    verified: true,
    content: "Nhạc nền khúc cuối nghe da diết thật sự, hy vọng team cập nhật luôn bản Lossless vào mục Âm Nhạc.",
    time: "7 phút trước",
    likes: 19,
  },
  {
    id: "c3",
    user: "ThienVuong_Cinema",
    avatarColor: "from-cyan-500 to-blue-600",
    verified: false,
    content: "Giao diện mới mượt mà, lướt thẻ phim nhìn các hạt sáng chuyển động rất nịnh mắt.",
    time: "15 phút trước",
    likes: 42,
  },
];

export default function LiquidGlassHomePage() {
  const [activeCategory, setActiveCategory] = useState<string>("tat-ca");
  const [activeMediaIndex, setActiveMediaIndex] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const activeMedia = FEATURED_MEDIA[activeMediaIndex];

  // Theo dõi vị trí chuột để tạo hiệu ứng phản chiếu ánh sáng kính thời gian thực
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

  const filteredMedia = useMemo(() => {
    return FEATURED_MEDIA.filter((item) => {
      const matchCat =
        activeCategory === "tat-ca" ||
        (activeCategory === "phim" && item.category === "phim") ||
        (activeCategory === "nhac" && item.category === "nhac");
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="relative min-h-screen text-zinc-100 overflow-hidden pb-20 selection:bg-rose-500/30 selection:text-rose-200">
      
      {/* 1. LỚP NỀN KÍNH LỎNG & ÁNH SÁNG ĐỘNG (LIQUID ORBS REFRACTION) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className="liquid-orb orb-primary"
          style={{
            transform: `translate3d(${mousePos.x * 1.5}px, ${mousePos.y * 1.5}px, 0)`,
          }}
        />
        <div
          className="liquid-orb orb-secondary"
          style={{
            transform: `translate3d(${-mousePos.x * 2}px, ${-mousePos.y * 2}px, 0)`,
          }}
        />
        <div
          className="liquid-orb orb-tertiary"
          style={{
            transform: `translate3d(${mousePos.x * 0.8}px, ${-mousePos.y * 1.2}px, 0)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

        {/* 2. THANH TÌM KIẾM VÀ DANH MỤC KÍNH NỔI (LIQUID GLASS DOCK) */}
        <section className="pt-6">
          <div className="liquid-glass-panel p-3 sm:p-4 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Bộ lọc danh mục kiểu kính trượt */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-black/30 border border-white/5 w-full md:w-auto overflow-x-auto">
              {[
                { id: "tat-ca", label: "Tất cả", icon: Compass },
                { id: "phim", label: "Phim Chiếu Rạp", icon: Film },
                { id: "nhac", label: "Nhạc & Soundtrack", icon: Music },
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

            {/* Thanh tìm kiếm kính trong suốt */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm tác phẩm, thể loại..."
                className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-black/40 border border-white/10 text-sm text-white placeholder-zinc-500 outline-none focus:border-rose-500/60 focus:bg-black/60 transition-all backdrop-blur-md"
              />
            </div>
          </div>
        </section>

        {/* 3. HERO SPOTLIGHT — KHUNG BANNER KÍNH LỎNG SIÊU THỰC */}
        <section className="relative">
          <div className="liquid-spotlight-card relative rounded-[2rem] overflow-hidden p-6 sm:p-10 lg:p-12 min-h-[500px] flex flex-col justify-end">
            
            {/* Ảnh nền phủ hiệu ứng khúc xạ */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-105"
              style={{ backgroundImage: `url(${activeMedia.bannerUrl})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050508] via-[#050508]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/90 via-[#050508]/40 to-transparent" />

            {/* Quầng sáng Ambient Glow phía sau nội dung */}
            <div className="absolute top-1/4 left-10 w-96 h-96 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Thông tin tác phẩm chính */}
            <div className="relative z-10 max-w-2xl space-y-4">
              
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> Tiêu Điểm Trong Tuần
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-white/10 border border-white/15 text-zinc-200 backdrop-blur-md">
                  {activeMedia.quality}
                </span>
                <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 backdrop-blur-md flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-300 text-amber-300" /> {activeMedia.rating}
                </span>
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg">
                  {activeMedia.title}
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 font-mono tracking-wide">{activeMedia.originalTitle}</p>
              </div>

              <p className="text-sm text-zinc-300 leading-relaxed line-clamp-3 max-w-xl">
                {activeMedia.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {activeMedia.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-zinc-400 backdrop-blur-sm"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Hành động chính */}
              <div className="flex flex-wrap items-center gap-3.5 pt-4">
                <button
                  type="button"
                  className="liquid-btn-primary flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-white font-bold text-sm shadow-[0_0_30px_rgba(244,63,94,0.4)] transition-all hover:scale-105 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white" /> Thưởng Thức Ngay
                </button>

                <button
                  type="button"
                  onClick={() => toggleBookmark(activeMedia.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    savedIds[activeMedia.id]
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                      : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                  }`}
                  title="Lưu vào danh sách"
                >
                  <Bookmark className={`w-5 h-5 ${savedIds[activeMedia.id] ? "fill-current" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => toggleLike(activeMedia.id)}
                  className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                    likedIds[activeMedia.id]
                      ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                      : "bg-white/10 border-white/15 text-white hover:bg-white/20"
                  }`}
                  title="Yêu thích"
                >
                  <Heart className={`w-5 h-5 ${likedIds[activeMedia.id] ? "fill-current" : ""}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3.5 rounded-2xl bg-white/10 border border-white/15 text-white hover:bg-white/20 transition-all"
                  title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-zinc-400" /> : <Volume2 className="w-5 h-5 text-white" />}
                </button>
              </div>
            </div>

            {/* Bộ chọn danh sách chuyển nhanh phim */}
            <div className="absolute bottom-6 right-6 z-20 hidden lg:flex items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              {FEATURED_MEDIA.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => setActiveMediaIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeMediaIndex === idx
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

        {/* 4. LƯỚI KHÁM PHÁ TÁC PHẨM PHONG CÁCH KÍNH LỎNG */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-rose-500" /> Danh Sách Thịnh Hành
              </h2>
              <p className="text-xs text-zinc-400">Những tác phẩm được cộng đồng đón nhận nồng nhiệt nhất</p>
            </div>
            <span className="text-xs text-zinc-500 font-mono">Hiển thị: {filteredMedia.length} mục</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className="liquid-media-card group relative rounded-3xl overflow-hidden p-3.5 flex flex-col justify-between transition-all duration-500 hover:-translate-y-2"
              >
                {/* Ảnh áp phích với khung viền lỏng */}
                <div className="relative aspect-[16/10] sm:aspect-[3/4] rounded-2xl overflow-hidden mb-3 bg-zinc-900">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${item.posterUrl})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                  {/* Nút Play hiển thị khi hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100">
                    <div className="w-12 h-12 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-[0_0_25px_rgba(244,63,94,0.6)] backdrop-blur-md">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </div>

                  {/* Thẻ Chất Lượng & Điểm Số */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 border border-white/10 text-white backdrop-blur-md">
                      {item.quality}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 backdrop-blur-md flex items-center gap-1">
                      <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" /> {item.rating}
                    </span>
                  </div>

                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-[11px] text-zinc-300">
                    <span className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">
                      <Clock className="w-3 h-3 text-zinc-400" /> {item.duration}
                    </span>
                    <span className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md">
                      <Eye className="w-3 h-3 text-zinc-400" /> {item.views.toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>

                {/* Thông tin mô tả tác phẩm */}
                <div className="space-y-1.5 px-1">
                  <h3 className="text-sm font-bold text-white group-hover:text-rose-400 transition-colors truncate">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-zinc-500 truncate">{item.originalTitle}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <div className="flex gap-1">
                      {item.tags.slice(0, 2).map((t) => (
                        <span key={t} className="text-[10px] text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBookmark(item.id);
                      }}
                      className="text-zinc-400 hover:text-rose-400 transition-colors p-1"
                    >
                      <Bookmark className={`w-4 h-4 ${savedIds[item.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 5. CỘNG ĐỒNG & BÌNH LUẬN TRỰC TUYẾN THỜI GIAN THỰC */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Cột 1: Thông số & Tiện ích kính lỏng */}
          <div className="liquid-glass-panel p-6 sm:p-8 rounded-3xl space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white">Âm Thanh Đa Chiều Không Gian</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Thưởng thức trải nghiệm âm thanh phòng thu chất lượng cao với bộ giải mã thích ứng theo thời gian thực trên mọi nền tảng thiết bị.
              </p>
            </div>

            <div className="space-y-2 pt-4 border-t border-white/10">
              <div className="flex justify-between text-xs text-zinc-400">
                <span>Tốc độ truyền phát</span>
                <span className="text-emerald-400 font-mono font-semibold">60 FPS / 4K Lossless</span>
              </div>
              <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                <div className="w-4/5 h-full bg-gradient-to-r from-rose-500 via-purple-500 to-cyan-500 rounded-full" />
              </div>
            </div>
          </div>

          {/* Cột 2 & 3: Bình luận thời gian thực phong cách kính lỏng */}
          <div className="lg:col-span-2 liquid-glass-panel p-6 sm:p-8 rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white">Trao Đổi Cộng Đồng Trực Tiếp</h3>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                Hoạt động trực tuyến
              </span>
            </div>

            <div className="space-y-3">
              {LIVE_COMMENTS.map((cmt) => (
                <div
                  key={cmt.id}
                  className="p-3.5 rounded-2xl bg-black/30 border border-white/5 flex items-start gap-3.5 hover:bg-black/40 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-full bg-gradient-to-br ${cmt.avatarColor} flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md`}
                  >
                    {cmt.user.charAt(0)}
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-zinc-200 truncate">{cmt.user}</span>
                        {cmt.verified && (
                          <span title="Thành viên đã xác thực">
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400 fill-sky-400/20" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500">{cmt.time}</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{cmt.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* 6. TOÀN BỘ CSS KEYFRAMES & HIỆU ỨNG KHÚC XẠ KÍNH LỎNG */}
      <style jsx global>{`
        /* Các khối hạt cầu phát sáng chuyển động đa lớp (Liquid Background Orbs) */
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
          animation: float-orb-1 22s ease-in-out infinite;
        }
        .orb-secondary {
          width: 500px;
          height: 500px;
          top: 30%;
          right: -10%;
          background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%);
          animation: float-orb-2 26s ease-in-out infinite;
        }
        .orb-tertiary {
          width: 450px;
          height: 450px;
          bottom: 10%;
          left: 25%;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%);
          animation: float-orb-3 20s ease-in-out infinite;
        }

        @keyframes float-orb-1 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(60px, 40px, 0) scale(1.08); }
        }
        @keyframes float-orb-2 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(-50px, -60px, 0) scale(0.95); }
        }
        @keyframes float-orb-3 {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(40px, -30px, 0) scale(1.05); }
        }

        /* Khối Kính Lỏng Chuẩn (Liquid Glass Panel) */
        .liquid-glass-panel {
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(24px) saturate(1.6);
          -webkit-backdrop-filter: blur(24px) saturate(1.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4),
                      inset 0 1px 0 rgba(255, 255, 255, 0.08);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .liquid-glass-panel:hover {
          border-color: rgba(255, 255, 255, 0.15);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5),
                      0 0 25px rgba(244, 63, 94, 0.08),
                      inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        /* Khung Tiêu Điểm Kính Lỏng (Spotlight Card) */
        .liquid-spotlight-card {
          background: rgba(10, 15, 30, 0.6);
          backdrop-filter: blur(28px) saturate(1.5);
          -webkit-backdrop-filter: blur(28px) saturate(1.5);
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Thẻ phim kính lỏng tương tác (Interactive Media Card) */
        .liquid-media-card {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.35),
                      inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }
        .liquid-media-card:hover {
          background: rgba(20, 30, 55, 0.55);
          border-color: rgba(244, 63, 94, 0.4);
          box-shadow: 0 20px 45px rgba(0, 0, 0, 0.5),
                      0 0 20px rgba(244, 63, 94, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.15);
        }

        /* Nút Bấm Kính Lỏng Phát Quang */
        .liquid-btn-primary {
          background: linear-gradient(135deg, #e11d48 0%, #f43f5e 50%, #fb7185 100%);
          position: relative;
          overflow: hidden;
        }
        .liquid-btn-primary::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }
        .liquid-btn-primary:hover::after {
          transform: translateX(100%);
        }
      `}</style>
    </div>
  );
}
