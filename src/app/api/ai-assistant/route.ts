import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `Bạn là trợ lý CSKH kiêm hỗ trợ hệ thống của OpusFilm (OpusTV) — nền tảng xem phim online tiếng Việt.

Vai trò:
- Hướng dẫn xem phim, tìm kiếm, tài khoản, gói VIP, giao diện sáng/tối.
- Trả lời ngắn gọn, lịch sự, rõ ràng bằng tiếng Việt.
- Không tiết lộ: mã admin, secret, connection string DB, API key, cấu trúc server nội bộ, dữ liệu người dùng khác.

Ngữ cảnh sản phẩm (cập nhật):
- Xem phim: trang chủ /home, tìm kiếm, thể loại, trang /phim/[slug].
- VIP: một số nội dung/tính năng yêu cầu gói VIP; kích hoạt bằng key hoặc giftcode trong Cài đặt / tài khoản.
- Chuỗi (streak): tự điểm danh khi xem phim đủ thời gian trong ngày.
- Opus Event (/su-kien) và Opus Code (/code): đang "Sắp ra mắt", tạm khóa.
- Chat / tin nhắn, nhạc: có trong hệ sinh thái; dock điều hướng phía dưới.
- Admin board chỉ dành cho quản trị viên — không hướng dẫn bypass.

Nếu không chắc, nói trung thực và gợi ý liên hệ hỗ trợ / nhóm Zalo (nếu user đã thấy thông báo QR).
Không bịa tính năng không tồn tại.`;

type ChatMsg = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  try {
    const key =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";
    if (!key) {
      return NextResponse.json(
        {
          ok: false,
          error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ",
        },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || body.text || "").trim().slice(0, 2000);
    if (!message) {
      return NextResponse.json({ ok: false, error: "Thiếu nội dung tin nhắn" }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? (body.history as ChatMsg[]) : [];
    const path = String(body.path || "").slice(0, 200);

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const h of history.slice(-12)) {
      const role = h.role === "assistant" ? "model" : "user";
      const text = String(h.content || "").slice(0, 1500);
      if (!text) continue;
      contents.push({ role, parts: [{ text }] });
    }
    contents.push({
      role: "user",
      parts: [
        {
          text: path
            ? `[Trang hiện tại: ${path}]\n${message}`
            : message,
        },
      ],
    });

    const model =
      process.env.GEMINI_MODEL ||
      "gemini-3.8-flash";

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(key)}`;

    const payload = {
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents,
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
      ],
    };

    const candidates = Array.from(
      new Set(
        [
          model,
          "gemini-3.8-flash",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
        ].filter(Boolean)
      )
    );

    let res: Response | null = null;
    let data: {
      error?: { message?: string };
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    } = {};

    for (const m of candidates) {
      const tryUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
        m
      )}:generateContent?key=${encodeURIComponent(key)}`;
      res = await fetch(tryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      data = (await res.json().catch(() => ({}))) as typeof data;
      if (res.ok) break;
      const msg = String(data?.error?.message || "");
      if (!/no longer available|not found|not supported/i.test(msg)) break;
    }

    if (!res || !res.ok) {
      const errMsg = data?.error?.message || `Gemini lỗi (${res?.status || 0})`;
      return NextResponse.json({ ok: false, error: errMsg }, { status: 502 });
    }

    const text =
      data.candidates?.[0]?.content?.parts
        ?.map((p) => p.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "AI không trả lời được. Thử lại sau." },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, reply: text });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
