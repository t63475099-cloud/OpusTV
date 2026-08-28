import { NextRequest, NextResponse } from "next/server";
import { searchMovies } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }
  if (q.length > 80) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  try {
    const data = await searchMovies(q, 1);
    const items = (data?.data?.items || []).slice(0, 8).map((m) => ({
      slug: m.slug,
      name: m.name,
      origin_name: m.origin_name,
      year: m.year,
      quality: m.quality,
      poster: getImageUrl(m.poster_url || m.thumb_url),
      episode_current: m.episode_current,
    }));
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch {
    return NextResponse.json({ items: [] });
  }
}
