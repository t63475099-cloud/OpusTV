"use client";

import { useEventStore } from "@/lib/eventCoins";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, X, Mic, MicOff, Clock } from "lucide-react";
import {
  getFilmSearchHistory,
  pushFilmSearchHistory,
  removeFilmSearchHistory,
  clearFilmSearchHistory,
} from "@/lib/searchHistory";
import { cn } from "@/lib/utils";

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
  /** true khi ô tìm đang mở rộng / focus */
  onExpandChange?: (expanded: boolean) => void;
  /** Bắt buộc thu nhỏ (vd. khi mở menu 3 gạch) */
  forceCollapse?: boolean;
  className?: string;
}

export default function SearchBox({
  variant = "desktop",
  onNavigate,
  onExpandChange,
  forceCollapse = false,
  className,
}: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SuggestItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);

  const expanded =
    !forceCollapse && (focused || hovered || open || query.length > 0 || listening);

  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded, onExpandChange]);

  useEffect(() => {
    if (forceCollapse) {
      setFocused(false);
      setOpen(false);
      inputRef.current?.blur();
    }
  }, [forceCollapse]);

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
        setFocused(false);
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
          setTimeout(() => {
            try {
              useEventStore.getState().addMissionProgress("search");
            } catch {}
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
    try {
      useEventStore.getState().addMissionProgress("search");
    } catch {}
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
      setFocused(false);
      stopVoice();
      inputRef.current?.blur();
    }
  };

  const isMobile = variant === "mobile";

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative isolate z-[90] flex justify-end sm:justify-center",
        isMobile ? "w-full" : "w-full max-w-xl",
        className
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <form
        onSubmit={onSubmit}
        className={cn(
          "opus-search-shell group relative flex h-11 sm:h-11 items-center",
          "overflow-hidden backdrop-blur-2xl",
          "border border-white/15 bg-white/[0.07]",
          "shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)]",
          "transition-[width,max-width,border-radius,box-shadow,background-color] duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
          listening && "border-rose-500/60 shadow-[0_0_0_3px_rgba(244,63,94,0.2)]",
          expanded
            ? "w-full max-w-full rounded-full"
            : "w-11 sm:w-11 max-w-[2.75rem] rounded-full",
          forceCollapse && "w-11 max-w-[2.75rem] opacity-80"
        )}
        style={{
          transition: "width 0.4s ease, max-width 0.4s ease, border-radius 0.4s ease, box-shadow 0.4s ease",
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (!expanded) {
              setFocused(true);
              inputRef.current?.focus();
            }
          }}
          className="shrink-0 flex h-11 w-11 items-center justify-center text-zinc-300 hover:text-white transition-colors duration-300"
          aria-label="Tìm kiếm"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </button>

        <div
          className={cn(
            "flex h-full flex-1 items-center min-w-0 overflow-hidden",
            "transition-[opacity,max-width,padding] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            expanded ? "opacity-100 max-w-[640px] pr-1" : "opacity-0 max-w-0 pr-0 pointer-events-none"
          )}
          style={{
            transition: "opacity 0.5s ease, max-width 0.5s ease, padding 0.5s ease",
            overflow: "hidden",
          }}
        >
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              setFocused(true);
              setHistory(getFilmSearchHistory());
              setOpen(true);
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!wrapRef.current?.contains(document.activeElement)) {
                  setFocused(false);
                }
              }, 150);
            }}
            onKeyDown={onKeyDown}
            placeholder={listening ? "Đang nghe..." : "Tìm phim, diễn viên..."}
            maxLength={120}
            autoComplete="off"
            className="flex-1 min-w-0 h-full bg-transparent text-white text-sm leading-none outline-none placeholder:text-zinc-500 placeholder:leading-none"
            aria-autocomplete="list"
            aria-expanded={open && expanded}
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setItems([]);
                setOpen(false);
                inputRef.current?.focus();
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Xóa"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          {voiceSupported && (
            <button
              type="button"
              onClick={startVoice}
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition",
                listening
                  ? "text-rose-400 bg-rose-500/15 animate-pulse"
                  : "text-zinc-400 hover:text-white hover:bg-white/10"
              )}
              title={listening ? "Dừng" : "Tìm bằng giọng nói"}
              aria-label={listening ? "Dừng nghe" : "Tìm bằng giọng nói"}
            >
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          )}
          <button
            type="submit"
            className="hidden sm:flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition mr-0.5"
            aria-label="Tìm kiếm"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {voiceError && expanded && (
        <p className="absolute left-0 right-0 top-full mt-1 text-[11px] text-amber-400 px-1">
          {voiceError}
        </p>
      )}

      {expanded &&
        open &&
        (items.length > 0 ||
          loading ||
          query.trim().length >= 2 ||
          (query.trim().length < 2 && history.length > 0)) && (
          <div
            className={cn(
              "absolute left-0 right-0 top-full mt-2 z-[100]",
              "rounded-2xl border border-white/12 overflow-hidden overflow-y-auto",
              "bg-neutral-950/90 backdrop-blur-2xl",
              "shadow-[0_16px_48px_rgba(0,0,0,0.55)]",
              "max-h-[min(70vh,420px)] animate-scale-in",
              isMobile && "max-h-[60vh]"
            )}
            style={{ overflow: "hidden" }}
          >
            {query.trim().length < 2 && history.length > 0 && (
              <div className="border-b border-white/5">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs font-medium leading-none text-zinc-400">Lịch sử tìm kiếm</span>
                  <button
                    type="button"
                    className="text-xs text-sky-400 hover:underline"
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
                          <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span className="text-sm text-white line-clamp-1">{h}</span>
                        </button>
                        <button
                          type="button"
                          className="p-2 text-zinc-500 hover:text-white"
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
              <div className="px-4 py-3 text-sm text-zinc-500">
                Không có gợi ý cho “{query.trim()}”
              </div>
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
                    className={cn(
                      "flex gap-3 px-3 py-2.5 transition",
                      idx === activeIdx ? "bg-white/10" : "hover:bg-white/5"
                    )}
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
                className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-white/5 border-t border-white/5"
              >
                Xem tất cả kết quả cho “{query.trim()}”
              </button>
            )}
          </div>
        )}
    </div>
  );
}
