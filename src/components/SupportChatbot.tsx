"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, HelpCircle } from "lucide-react";
import { useMusicPlayerStore } from "@/lib/musicPlayerStore";
import { usePathname } from "next/navigation";

type Msg = { id: string; role: "bot" | "user"; text: string };

const FAQ: { keys: string[]; answer: string }[] = [
  {
    keys: ["đăng ký", "tao tai khoan", "tạo tài khoản", "register"],
    answer:
      "Vào Cài đặt → Tài khoản (hoặc /tai-khoan), chọn Đăng ký. Cần tên đăng nhập, mật khẩu và PIN khôi phục.",
  },
  {
    keys: ["đăng nhập", "login", "dang nhap"],
    answer: "Mở /tai-khoan → Đăng nhập, nhập tài khoản và mật khẩu.",
  },
  {
    keys: ["quên mật khẩu", "quen mat khau", "khôi phục", "pin", "quên mk"],
    answer:
      "Chọn Quên MK, nhập tài khoản + PIN khôi phục (4–8 số), rồi đặt mật khẩu mới.",
  },
  {
    keys: ["không xem được", "ko xem", "lỗi phim", "không phát"],
    answer:
      "Nguồn phim từ API bên thứ ba. Thử đổi server, tải lại trang, hoặc chọn phim khác.",
  },
  {
    keys: ["đồng bộ", "dong bo", "thiết bị"],
    answer: "Đăng nhập cùng tài khoản rồi bấm Đồng bộ trong trang Tài khoản.",
  },
  {
    keys: ["tích xanh", "xác minh", "tick"],
    answer: "Trong Tài khoản → Xác minh, gửi form. Quản trị duyệt thủ công.",
  },
  {
    keys: ["hòm thư", "thông báo", "hom thu"],
    answer: "Mở /hop-thu hoặc biểu tượng chuông trên thanh trên.",
  },
  {
    keys: ["nhạc", "music", "playbox", "mini"],
    answer:
      "Opus Music ở menu bên trái. Khi nghe nền, bấm nút phóng to trên playbox để quay lại đúng bài đang phát.",
  },
  {
    keys: ["faq", "hỗ trợ", "help"],
    answer: "Xem đầy đủ tại /ho-tro.",
  },
];

const QUICK = ["Đăng ký", "Quên mật khẩu", "Lỗi xem phim", "Đồng bộ", "FAQ"];

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function replyFor(input: string): string {
  const n = normalize(input);
  if (!n) return "Bạn cần hỗ trợ gì? Ví dụ: đăng ký, quên mật khẩu, lỗi phim…";
  let best: { score: number; answer: string } | null = null;
  for (const item of FAQ) {
    let score = 0;
    for (const k of item.keys) {
      const nk = normalize(k);
      if (n.includes(nk) || nk.includes(n)) score += nk.length;
    }
    if (score > 0 && (!best || score > best.score)) best = { score, answer: item.answer };
  }
  return (
    best?.answer ||
    "Chưa khớp câu hỏi. Thử: đăng ký, quên mật khẩu, lỗi phim, đồng bộ — hoặc mở /ho-tro."
  );
}

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "0",
      role: "bot",
      text: "Xin chào. Mình hỗ trợ nhanh về tài khoản, xem phim, nhạc. Gõ câu hỏi hoặc chọn gợi ý.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const path = usePathname();
  const track = useMusicPlayerStore((s) => s.track);
  const miniVisible = !!track && !path?.startsWith("/nhac");

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, msgs]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [
      ...m,
      { id: String(Date.now()), role: "user", text: t },
      { id: String(Date.now() + 1), role: "bot", text: replyFor(t) },
    ]);
    setInput("");
  }

  // Nút hỗ trợ: góc trái dưới; đẩy lên nếu có mini player
  const btnPos = miniVisible
    ? "bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-3 sm:left-4"
    : "bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-3 sm:left-4";

  const panelPos = miniVisible
    ? "bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+4.5rem))] left-3 sm:left-4"
    : "bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 sm:left-4";

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`fixed z-[70] ${btnPos} flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-xl text-white shadow-lg px-3.5 py-2.5 text-sm font-medium transition active:scale-95`}
          aria-label="Hỗ trợ"
        >
          <MessageCircle className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Hỗ trợ</span>
        </button>
      )}

      {open && (
        <div
          className={`fixed z-[70] ${panelPos} w-[min(100vw-1.5rem,360px)] h-[min(62vh,480px)] flex flex-col rounded-2xl border border-white/15 bg-[#12121a]/92 backdrop-blur-xl shadow-2xl overflow-hidden`}
          role="dialog"
          aria-label="Hỗ trợ"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <p className="flex-1 text-sm font-semibold text-white">Hỗ trợ OpusFilm</p>
            <Link href="/ho-tro" className="text-[11px] text-sky-400" onClick={() => setOpen(false)}>
              FAQ
            </Link>
            <button type="button" onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400" aria-label="Đóng">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-sky-600/90 text-white rounded-br-md"
                      : "bg-white/8 text-zinc-200 border border-white/10 rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <div className="px-2 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-white/15 text-zinc-300 hover:bg-white/10"
              >
                {q}
              </button>
            ))}
          </div>
          <form
            className="p-2 border-t border-white/10 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 300))}
              placeholder="Nhập câu hỏi..."
              className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-sky-500/40"
            />
            <button type="submit" className="p-2.5 rounded-xl bg-sky-600 text-white" aria-label="Gửi">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
