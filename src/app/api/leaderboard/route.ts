import { NextRequest, NextResponse } from "next/server";
import { fetchLeaderboard } from "@/lib/leaderboardDb";
import { ensurePaymentTables } from "@/lib/paymentDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensurePaymentTables();
    const limit = Number(req.nextUrl.searchParams.get("limit") || 50);
    const entries = await fetchLeaderboard(limit);
    return NextResponse.json(
      { ok: true, entries, updatedAt: new Date().toISOString() },
      {
        headers: {
          // Cache ngắn phía CDN/browser — giảm hit Neon
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
