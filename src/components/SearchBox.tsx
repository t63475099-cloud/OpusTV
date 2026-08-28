"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, X, Mic, MicOff, Clock, Trash2 } from "lucide-react";
import {
  getFilmSearchHistory,
  pushFilmSearchHistory,
  removeFilmSearchHistory,
  clearFilmSearchHistory,
} from "@/lib/searchHistory";

interface SuggestItem {
  slug: string;
  name: string;
  origin_name?: string;
  year?: number;
  quality?: string;
  poster: string;
  episode_current?: string;
}

interface SearchBoxProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}

export default function SearchBox({ variant = "desktop", onNavigate }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      typeof window !== "undefined"
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;
    setVoiceSupported(!!SR);
    setHistory(getFilmSearchHistory());
  }, []);

  const fetchSuggest = useCallback(async (q: string) => {
    abortRef.current?.abort();
    if (q.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`, {
        signal: ac.signal,
      });
      const data = await res.json();
      if (!ac.signal.aborted) {
        setItems(data.items || []);
        setOpen(true);
        setActiveIdx(-1);
      }
    } catch {
      if (!ac.signal.aborted) setItems([]);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(() => fetchSuggest(query), 280);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, fetchSuggest]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const stopVoice = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  };

  const startVoice = () => {
    setVoiceError("");
    const SR =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setVoiceError("Trình duyệt không hỗ trợ tìm bằng giọng nói");
      return;
    }
    if (listening) {
      stopVoice();
      return;
    }
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = "vi-VN";
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onstart = () => setListening(true);
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setVoiceError("Cần cho phép micro trong trình duyệt");
      } else if (e.error !== "aborted") {
        setVoiceError("Không nhận được giọng nói, thử lại");
      }
    };
    rec.onend = () => setListening(false);
    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcript = transcript.trim();
      if (transcript) {
        setQuery(transcript);
        setOpen(true);
        if (event.results[event.results.length - 1].isFinal) {
          // auto search after final result
          setTimeout(() => {
            router.push(`/tim-kiem?q=${encodeURIComponent(transcript)}`);
            onNavigate?.();
            setOpen(false);
          }, 400);
        }
      }
    };
    try {
      rec.start();
    } catch {
      setVoiceError("Không thể bật micro");
      setListening(false);
    }
  };

  const goSearch = (q?: string) => {
    const keyword = (q ?? query).trim();
    if (!keyword) return;
    stopVoice();
    pushFilmSearchHistory(keyword);
    setHistory(getFilmSearchHistory());
    setOpen(false);
    onNavigate?.();
    router.push(`/tim-kiem?q=${encodeURIComponent(keyword)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIdx >= 0 && items[activeIdx]) {
      setOpen(false);
      onNavigate?.();
      router.push(`/phim/${items[activeIdx].slug}`);
      return;
    }
    goSearch();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
      stopVoice();
    }
  };

  const isMobile = variant === "mobile";

  return (
    <div ref={wrapRef} className={`relative ${isMobile ? "w-full" : "flex-1 max-w-xl"}`}>
      <form onSubmit={onSubmit} className="flex w-full">
        <div
          className={`flex w-full items-center overflow-hidden border transition-all duration-300 ${
            listening
              ? "border-red-500 shadow-[0_0_0_3px_rgba(229,9,20,0.25)]"
              : "border-[#303030] focus-within:border-[#3ea6ff]"
          } bg-[#121212] ${isMobile ? "rounded-2xl" : "rounded-full"}`}
        >
          <span className="pl-3.5 text-zinc-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setHistory(getFilmSearchHistory());
              setOpen(true);
            }}
            onKeyDown={onKeyDown}
            placeholder={listening ? "Đang nghe..." : "Tìm phim, diễn viên..."}
            maxLength={120}
            autoComplete="off"
            className="flex-1 bg-transparent text-white text-sm px-2.5 py-2.5 outline-none placeholder:text-zinc-500 min-w-0"
            aria-autocomplete="list"
            aria-expanded={open}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setItems([]);
                setOpen(false);
              }}
              className="p-2 text-zinc-500 hover:text-white transition"
              aria-label="Xóa"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {voiceSupported && (
            <button
              type="button"
              onClick={startVoice}
              className={`p-2 mr-0.5 rounded-full transition ${
                listening
                  ? "text-red-500 bg-red-500/15 animate-pulse"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title={listening ? "Dừng" : "Tìm bằng giọng nói"}
              aria-label={listening ? "Dừng nghe" : "Tìm bằng giọng nói"}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <button
            type="submit"
            className={`px-3.5 py-2 m-1 rounded-full text-white text-sm font-medium transition btn-press ${
              isMobile ? "bg-red-600 hover:bg-red-500" : "bg-white/10 hover:bg-white/15"
            }`}
            aria-label="Tìm kiếm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {voiceError && (
        <p className="absolute left-0 right-0 mt-1 text-[11px] text-amber-400 px-1">{voiceError}</p>
      )}

      {open && (items.length > 0 || loading || query.trim().length >= 2 || (query.trim().length < 2 && history.length > 0)) && (
        <div
          className={`absolute left-0 right-0 mt-2 z-[60] rounded-2xl border border-white/10 glass-dropdown shadow-2xl shadow-black/50 overflow-hidden animate-scale-in ${
            isMobile ? "max-h-[60vh]" : "max-h-[70vh]"
          }`}
        >
          {query.trim().length < 2 && history.length > 0 && (
            <div className="border-b border-white/5">
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs font-medium text-[#aaa]">Lịch sử tìm kiếm</span>
                <button
                  type="button"
                  className="text-xs text-[#3ea6ff] hover:underline"
                  onClick={() => {
                    clearFilmSearchHistory();
                    setHistory([]);
                  }}
                >
                  Xóa tất cả
                </button>
              </div>
              <ul>
                {history.map((h) => (
                  <li key={h}>
                    <div className="flex items-center gap-1 px-2 hover:bg-white/5">
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-3 px-2 py-2.5 text-left min-w-0"
                        onClick={() => {
                          setQuery(h);
                          pushFilmSearchHistory(h);
                          setHistory(getFilmSearchHistory());
                          goSearch(h);
                        }}
                      >
                        <Clock className="w-4 h-4 text-[#717171] shrink-0" />
                        <span className="text-sm text-white line-clamp-1">{h}</span>
                      </button>
                      <button
                        type="button"
                        className="p-2 text-[#717171] hover:text-white"
                        aria-label="Xóa"
                        onClick={() => {
                          removeFilmSearchHistory(h);
                          setHistory(getFilmSearchHistory());
                        }}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {loading && items.length === 0 && query.trim().length >= 2 && (
            <div className="px-4 py-3 text-sm text-zinc-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tìm...
            </div>
          )}
          {!loading && query.trim().length >= 2 && items.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-500">Không có gợi ý cho “{query.trim()}”</div>
          )}
          <ul role="listbox" className="overflow-y-auto max-h-[50vh] custom-scroll">
            {items.map((item, idx) => (
              <li key={item.slug} role="option" aria-selected={idx === activeIdx}>
                <Link
                  href={`/phim/${item.slug}`}
                  onClick={() => {
                    setOpen(false);
                    onNavigate?.();
                  }}
                  className={`flex gap-3 px-3 py-2.5 transition ${
                    idx === activeIdx ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="relative w-11 h-16 rounded-lg overflow-hidden bg-zinc-800 shrink-0 ring-1 ring-white/5">
                    <Image src={item.poster} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white line-clamp-1">{item.name}</p>
                    <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
                      {item.origin_name}
                      {item.year ? ` · ${item.year}` : ""}
                    </p>
                    <p className="text-[11px] text-zinc-600 mt-0.5">
                      {[item.quality, item.episode_current].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {query.trim().length >= 2 && (
            <button
              type="button"
              onClick={() => goSearch()}
              className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 border-t border-white/5"
            >
              Xem tất cả kết quả cho “{query.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
