import { NextRequest, NextResponse } from "next/server";

/**
 * Trả soft-Vietsub JSON nếu client gửi content; hoặc placeholder.
 * GET ?slug=&ep= — không có file ngoài thì 204.
 */
export async function GET() {
  return NextResponse.json({ cues: [], source: "none" });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = String(body?.content || "");
    const title = String(body?.title || "");
    const duration = Number(body?.duration) || 0;
    if (!content && !title) {
      return NextResponse.json({ cues: [], source: "empty" });
    }
    // Client tự soft-gen; server chỉ echo để đồng bộ nếu cần
    return NextResponse.json({
      ok: true,
      source: "soft",
      title,
      contentLength: content.length,
      duration,
    });
  } catch {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
}
