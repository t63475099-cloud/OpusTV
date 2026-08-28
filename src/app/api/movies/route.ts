import { NextRequest, NextResponse } from "next/server";

const API = "https://phimapi.com";

export const dynamic = "force-dynamic";

const FEED_SOURCES = [
  { type: "list", slug: "phim-moi-cap-nhat" },
  { type: "list", slug: "phim-bo" },
  { type: "list", slug: "phim-le" },
  { type: "list", slug: "hoat-hinh" },
  { type: "category", slug: "co-trang" },
  { type: "category", slug: "hanh-dong" },
  { type: "category", slug: "tinh-cam" },
  { type: "category", slug: "kinh-di" },
  { type: "category", slug: "vien-tuong" },
  { type: "country", slug: "han-quoc" },
  { type: "country", slug: "trung-quoc" },
];

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") || "";
  const type = req.nextUrl.searchParams.get("type") || "list";
  const slug = (req.nextUrl.searchParams.get("slug") || "phim-moi-cap-nhat").replace(
    /[^a-z0-9-]/gi,
    ""
  );
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const keyword = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  const cursor = Math.max(0, Number(req.nextUrl.searchParams.get("cursor")) || 0);

  // Infinite random feed: cursor maps to source + page
  if (mode === "feed") {
    const src = FEED_SOURCES[cursor % FEED_SOURCES.length];
    const pageNum = Math.floor(cursor / FEED_SOURCES.length) + 1;
    let url = "";
    if (src.type === "category") {
      url = `${API}/v1/api/the-loai/${src.slug}?page=${pageNum}`;
    } else if (src.type === "country") {
      url = `${API}/v1/api/quoc-gia/${src.slug}?page=${pageNum}`;
    } else {
      url = `${API}/v1/api/danh-sach/${src.slug}?page=${pageNum}`;
    }
    try {
      const res = await fetch(url, { next: { revalidate: 600 } });
      const data = await res.json();
      const items = data?.data?.items || [];
      // shuffle lightly for "ngẫu nhiên"
      for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
      }
      return NextResponse.json({
        items,
        cursor: cursor + 1,
        hasMore: true,
        source: src.slug,
        page: pageNum,
      });
    } catch {
      return NextResponse.json({ items: [], cursor: cursor + 1, hasMore: true }, { status: 502 });
    }
  }

  let url = "";
  if (type === "category") url = `${API}/v1/api/the-loai/${slug}?page=${page}`;
  else if (type === "country") url = `${API}/v1/api/quoc-gia/${slug}?page=${page}`;
  else if (type === "search") {
    if (!keyword) return NextResponse.json({ items: [], totalPages: 0 });
    url = `${API}/v1/api/tim-kiem?keyword=${encodeURIComponent(keyword)}&page=${page}`;
  } else url = `${API}/v1/api/danh-sach/${slug}?page=${page}`;

  try {
    const res = await fetch(url, { next: { revalidate: 900 } });
    const data = await res.json();
    const items = data?.data?.items || [];
    const pagination = data?.data?.params?.pagination;
    return NextResponse.json({
      items,
      page: pagination?.currentPage || page,
      totalPages: pagination?.totalPages || 1,
    });
  } catch {
    return NextResponse.json({ items: [], totalPages: 0 }, { status: 502 });
  }
}
