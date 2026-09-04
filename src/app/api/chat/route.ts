import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const SYSTEM = `Bạn là trợ lý hỗ trợ của OpusFilm — trang xem phim và nghe nhạc online bằng tiếng Việt.
Trả lời ngắn gọn, rõ ràng, thân thiện, không dùng giọng quảng cáo AI sáo rỗng.
Chỉ hỗ trợ về: tài khoản, đăng nhập/đăng ký, PIN, xem phim, player, đồng bộ, hòm thư, tích xanh, cài đặt, lỗi thường gặp.
Nếu câu hỏi ngoài phạm vi, nói lịch sự và gợi ý xem /ho-tro hoặc /dieu-khoan.
Không bịa tính năng không có. Không yêu cầu người dùng gửi mật khẩu.
Thông tin cố định:
- Đăng ký/đăng nhập: /tai-khoan
- FAQ: /ho-tro
- Điều khoản & bảo mật: /dieu-khoan
- Hòm thư: /hop-thu
- Nguồn phim từ API bên thứ ba, không lưu video trên server OpusFilm.
- Quên mật khẩu cần PIN khôi phục 4–8 số.`;

type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

function getConfig() {
  const key =
    process.env.CHAT_API_KEY ||
    process.env.XAI_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.GROK_API_KEY ||
    "";
  const base = (
    process.env.CHAT_API_BASE ||
    (process.env.XAI_API_KEY || process.env.GROK_API_KEY
      ? "https://api.x.ai/v1"
      : "https://api.openai.com/v1")
  ).replace(/\/$/, "");
  const model =
    process.env.CHAT_MODEL ||
    (base.includes("x.ai") ? "grok-2-latest" : "gpt-4o-mini");
  return { key, base, model };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const cleaned: ChatMsg[] = messages
      .filter(
        (m: unknown) =>
          m &&
          typeof m === "object" &&
          ("role" in m) &&
          ("content" in m) &&
          ["user", "assistant"].includes(String((m as ChatMsg).role)) &&
          typeof (m as ChatMsg).content === "string"
      )
      .map((m: ChatMsg) => ({
        role: m.role,
        content: String(m.content).slice(0, 2000),
      }))
      .slice(-12);

    if (!cleaned.length) {
      return NextResponse.json({ ok: false, error: "Thiếu tin nhắn" }, { status: 400 });
    }

    const last = cleaned[cleaned.length - 1];
    if (last.role !== "user" || !last.content.trim()) {
      return NextResponse.json({ ok: false, error: "Tin nhắn không hợp lệ" }, { status: 400 });
    }

    const { key, base, model } = getConfig();
    if (!key) {
      return NextResponse.json({
        ok: false,
        error: "no_api_key",
        message:
          "Chưa cấu hình CHAT_API_KEY / XAI_API_KEY / OPENAI_API_KEY trên Vercel. Dùng chế độ FAQ tạm thời.",
      }, { status: 503 });
    }

    const payload = {
      model,
      temperature: 0.5,
      max_tokens: 600,
      messages: [{ role: "system", content: SYSTEM }, ...cleaned],
    };

    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        data?.error?.message ||
        data?.error ||
        `API lỗi ${res.status}`;
      console.error("chat api", res.status, errMsg);
      return NextResponse.json(
        { ok: false, error: String(errMsg).slice(0, 200) },
        { status: 502 }
      );
    }

    const text =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Xin lỗi, mình chưa trả lời được. Thử hỏi cách khác hoặc xem /ho-tro.";

    return NextResponse.json({ ok: true, reply: text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi chat";
    console.error("chat", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
