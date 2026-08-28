import { NextRequest, NextResponse } from "next/server";
import { MUSIC_TRACKS, LIVE_RADIOS } from "@/lib/music";

export const dynamic = "force-dynamic";

function clean(s: string, max = 100) {
  return s.replace(/[<>]/g, "").trim().slice(0, max);
}

function isQuotaError(msg: string) {
  const m = (msg || "").toLowerCase();
  return m.includes("quota") || m.includes("exceeded") || m.includes("daily limit");
}

/** Fallback offline — không tốn quota YouTube */
function localFallback(q: string, max: number) {
  const key = q.toLowerCase();
  const pool = [
    ...MUSIC_TRACKS.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      thumb: `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
      category: t.category || "Local",
    })),
    ...LIVE_RADIOS.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      thumb: `https://i.ytimg.com/vi/${t.id}/hqdefault.jpg`,
      category: t.category || "Lofi",
    })),
  ];
  const filtered = key
    ? pool.filter(
        (t) =>
          t.title.toLowerCase().includes(key) ||
          t.artist.toLowerCase().includes(key) ||
          (t.category || "").toLowerCase().includes(key)
      )
    : pool;
  const items = (filtered.length ? filtered : pool).slice(0, max);
  return items;
}

export async function GET(req: NextRequest) {
  const key = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const q = clean(req.nextUrl.searchParams.get("q") || "");
  const max = Math.min(50, Math.max(5, Number(req.nextUrl.searchParams.get("max")) || 24));
  const suggest = req.nextUrl.searchParams.get("suggest") === "1";
  const pageToken = clean(req.nextUrl.searchParams.get("pageToken") || "", 200);

  if (!q) {
    return NextResponse.json({
      items: localFallback("", max),
      nextPageToken: null,
      source: "local",
    });
  }

  if (!key) {
    return NextResponse.json({
      items: localFallback(q, max),
      nextPageToken: null,
      source: "local",
      error: "no_api_key",
      message: "Chưa cấu hình YOUTUBE_API_KEY — đang dùng thư viện offline.",
    });
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", String(suggest ? Math.min(12, max) : max));
  url.searchParams.set("q", q);
  url.searchParams.set("key", key);
  if (pageToken) url.searchParams.set("pageToken", pageToken);

  try {
    // Cache 1h to reduce quota burn
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    const data = await res.json();

    if (!res.ok) {
      const detail = (data?.error?.message as string) || "YouTube API error";
      const quota = isQuotaError(detail);
      return NextResponse.json({
        items: localFallback(q, max),
        nextPageToken: null,
        source: "local",
        error: quota ? "quota_exceeded" : "youtube_api",
        message: quota
          ? "Hết hạn mức YouTube API trong ngày. Đang phát thư viện offline — thử lại sau 24h hoặc tạo API key mới."
          : detail,
        detail,
      });
    }

    const items = (data.items || [])
      .map((it: {
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { medium?: { url?: string }; high?: { url?: string }; default?: { url?: string } };
        };
      }) => ({
        id: it.id?.videoId as string,
        title: (it.snippet?.title || "") as string,
        artist: (it.snippet?.channelTitle || "") as string,
        thumb: (it.snippet?.thumbnails?.medium?.url ||
          it.snippet?.thumbnails?.high?.url ||
          it.snippet?.thumbnails?.default?.url ||
          "") as string,
        category: "YouTube",
      }))
      .filter((x: { id?: string }) => !!x.id);

    if (!items.length) {
      return NextResponse.json({
        items: localFallback(q, max),
        nextPageToken: null,
        source: "local",
      });
    }

    return NextResponse.json({
      items,
      nextPageToken: data.nextPageToken || null,
      source: "youtube",
    });
  } catch {
    return NextResponse.json({
      items: localFallback(q, max),
      nextPageToken: null,
      source: "local",
      error: "fetch_failed",
      message: "Không kết nối được YouTube — dùng thư viện offline.",
    });
  }
}
