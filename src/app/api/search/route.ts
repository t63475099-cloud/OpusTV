import { NextRequest, NextResponse } from "next/server";
import { searchMovies, getImageUrl } from "@/lib/api";

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Điểm khớp: exact > startsWith > includes từng token */
function scoreMatch(q: string, name: string, origin?: string): number {
  const nq = norm(q);
  const nn = norm(name || "");
  const no = norm(origin || "");
  if (!nq) return 0;
  if (nn === nq || no === nq) return 1000;
  if (nn.startsWith(nq) || no.startsWith(nq)) return 800;
  if (nn.includes(nq) || no.includes(nq)) return 600;
  const tokens = nq.split(" ").filter((t) => t.length >= 2);
  if (!tokens.length) return 0;
  let hit = 0;
  for (const t of tokens) {
    if (nn.includes(t) || no.includes(t)) hit += 1;
  }
  if (hit === tokens.length) return 400 + hit * 10;
  if (hit > 0) return 100 + hit * 20;
  return 0;
}

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
    const raw = data?.data?.items || [];
    const ranked = [...raw]
      .map((m) => ({
        m,
        score: scoreMatch(q, m.name || "", m.origin_name),
      }))
      .sort((a, b) => b.score - a.score || (b.m.year || 0) - (a.m.year || 0));

    const items = ranked.slice(0, 12).map(({ m }) => ({
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
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch {
    return NextResponse.json({ items: [] });
  }
}
