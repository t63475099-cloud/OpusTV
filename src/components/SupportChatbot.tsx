"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, HelpCircle } from "lucide-react";

type Msg = { id: string; role: "bot" | "user"; text: string };

const FAQ: { keys: string[]; answer: string }[] = [
  {
    keys: ["đăng ký", "tao tai khoan", "tạo tài khoản", "register", "sign up"],
    answer:
      "Vào Cài đặt → Tài khoản (hoặc /tai-khoan), chọn Đăng ký. Điền tên đăng nhập, mật khẩu, PIN khôi phục và mã kích hoạt nếu trang yêu cầu.",
  },
  {
    keys: ["đăng nhập", "login", "dang nhap"],
    answer:
      "Mở /tai-khoan, chọn Đăng nhập, nhập tên tài khoản và mật khẩu. Có thể bật hiện mật khẩu để kiểm tra khi gõ.",
  },
  {
    keys: ["quên mật khẩu", "quen mat khau", "khôi phục", "khoi phuc", "pin", "quên mk"],
    answer:
      "Ở màn đăng nhập chọn Quên MK. Cần đúng tên tài khoản và mã PIN khôi phục (4–8 số). Nếu quên cả PIN, liên hệ quản trị để xác minh chủ tài khoản.",
  },
  {
    keys: ["uid"],
    answer:
      "UID là dãy 10 số gắn với tài khoản, xem trong trang Tài khoản. Có thể bấm để sao chép. Đổi tên hiển thị không đổi UID.",
  },
  {
    keys: ["tích xanh", "xác minh", "xac minh", "tick", "verified"],
    answer:
      "Trong Tài khoản bấm Xác minh, điền form và gửi. Quản trị duyệt thủ công; được duyệt thì huy hiệu hiện trên avatar.",
  },
  {
    keys: ["không xem được", "ko xem", "lỗi phim", "không phát", "loi phim", "404 phim"],
    answer:
      "Nguồn phim từ API bên thứ ba — link có thể lỗi hoặc bị chặn mạng. Thử đổi server trong player (nếu có), tải lại trang, hoặc chọn tựa khác.",
  },
  {
    keys: ["toàn màn hình", "fullscreen", "full man hinh", "iphone"],
    answer:
      "Dùng nút toàn màn hình trong player. Trên điện thoại, xoay ngang và ẩn thanh địa chỉ trình duyệt thường giúp khung phát rộng hơn.",
  },
  {
    keys: ["đồng bộ", "dong bo", "thiết bị khác", "may khac"],
    answer:
      "Đăng nhập cùng tài khoản trên máy khác rồi bấm Đồng bộ trong Tài khoản. Dữ liệu chỉ trên máy (chưa đăng nhập) sẽ không tự lên cloud.",
  },
  {
    keys: ["hòm thư", "hom thu", "thông báo", "thong bao", "chuông"],
    answer:
      "Hòm thư tại /hop-thu hoặc biểu tượng chuông trên thanh trên. Có thông báo tương tác, xác minh và hệ thống (tùy tính năng đang bật).",
  },
  {
    keys: ["nhạc", "music", "opus music"],
    answer:
      "Vào mục Opus Music trên menu. Cần cấu hình API nhạc trên server nếu danh sách trống. Lịch sử nghe tách với lịch sử phim.",
  },
  {
    keys: ["điều khoản", "chính sách", "bao mat", "bảo mật", "policy"],
    answer:
      "Chính sách & Điều khoản gộp tại /dieu-khoan. Trong Cài đặt cũng có mục tương ứng.",
  },
  {
    keys: ["faq", "hỗ trợ", "ho tro", "trợ giúp", "help"],
    answer:
      "Trang FAQ đầy đủ tại /ho-tro. Bạn cũng có thể hỏi tôi các từ khóa: đăng ký, quên mật khẩu, tích xanh, lỗi phim, đồng bộ…",
  },
];

const QUICK = [
  "Đăng ký thế nào?",
  "Quên mật khẩu",
  "Không xem được phim",
  "Tích xanh",
  "Đồng bộ thiết bị",
];

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
  if (!n) {
    return "Bạn hỏi gì về OpusFilm? Ví dụ: đăng ký, quên mật khẩu, lỗi xem phim…";
  }
  let best: { score: number; answer: string } | null = null;
  for (const item of FAQ) {
    let score = 0;
    for (const k of item.keys) {
      const nk = normalize(k);
      if (n.includes(nk) || nk.includes(n)) score += nk.length;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: item.answer };
    }
  }
  if (best) return best.answer;
  return "Mình chưa khớp đúng câu này. Thử từ khóa: đăng ký, đăng nhập, PIN, tích xanh, lỗi phim, đồng bộ, hòm thư — hoặc xem FAQ tại /ho-tro.";
}

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: "0",
      role: "bot",
      text: "Xin chào, mình là trợ lý OpusFilm. Hỏi về tài khoản, xem phim, đồng bộ hoặc mở FAQ nếu cần.",
    },
  ]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, msgs]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    const userMsg: Msg = { id: String(Date.now()), role: "user", text: t };
    const botMsg: Msg = {
      id: String(Date.now() + 1),
      role: "bot",
      text: replyFor(t),
    };
    setMsgs((m) => [...m, userMsg, botMsg]);
    setInput("");
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed z-[80] bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 sm:right-6 flex items-center gap-2 rounded-full bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/40 px-4 py-3 text-sm font-medium transition active:scale-95"
          aria-label="Mở chat hỗ trợ"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="hidden sm:inline">Hỗ trợ</span>
        </button>
      )}

      {open && (
        <div
          className="fixed z-[80] bottom-[max(1rem,env(safe-area-inset-bottom))] right-3 sm:right-6 w-[min(100vw-1.5rem,380px)] h-[min(70vh,520px)] flex flex-col rounded-2xl border border-white/15 bg-[#12121a]/95 backdrop-blur-xl shadow-2xl overflow-hidden"
          role="dialog"
          aria-label="Chat hỗ trợ"
        >
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10 bg-white/5">
            <div className="w-8 h-8 rounded-full bg-sky-600/30 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Trợ lý OpusFilm</p>
              <p className="text-[10px] text-zinc-500">Hỗ trợ nhanh · FAQ</p>
            </div>
            <Link
              href="/ho-tro"
              className="text-[11px] text-sky-400 hover:underline px-1"
              onClick={() => setOpen(false)}
            >
              FAQ
            </Link>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400"
              aria-label="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-sky-600 text-white rounded-br-md"
                      : "bg-white/8 text-zinc-200 border border-white/10 rounded-bl-md"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="px-2 pb-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
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
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 300))}
              placeholder="Nhập câu hỏi..."
              className="flex-1 min-w-0 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-sky-500/50"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white shrink-0"
              aria-label="Gửi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
