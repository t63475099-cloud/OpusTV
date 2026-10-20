import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import {
  ensureLeaderboardTables,
  fetchLeaderboard,
  getFriendStatus,
} from "@/lib/leaderboardDb";
import { getSessionUser } from "@/lib/session";
import { ensurePaymentTables } from "@/lib/paymentDb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensurePaymentTables();
    await ensureLeaderboardTables();
    const username = String(req.nextUrl.searchParams.get("username") || "")
      .trim()
      .toLowerCase();
    if (!username) {
      return NextResponse.json({ ok: false, error: "Thiếu username" }, { status: 400 });
    }

    const me = await getSessionUser();
    const meName = (me?.username || "").toLowerCase();

    const users = (await sql`
      SELECT username, uid, created_at::text,
             is_lifetime_vip, vip_expires_at::text
      FROM users WHERE lower(username) = ${username} LIMIT 1
    `) as Array<Record<string, unknown>>;

    if (!users[0]) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }

    const stats = (await sql`
      SELECT COUNT(*)::int AS keys_bought,
             COALESCE(SUM(amount_vnd), 0)::bigint AS amount_spent
      FROM key_purchase_orders
      WHERE status = 'APPROVED' AND lower(username) = ${username}
    `) as Array<Record<string, unknown>>;

    const board = await fetchLeaderboard(100);
    const rankEntry = board.find((e) => e.username === username);
    const rank = rankEntry?.rank ?? null;

    const vipExp = users[0].vip_expires_at
      ? Date.parse(String(users[0].vip_expires_at))
      : NaN;
    const isVip =
      !!users[0].is_lifetime_vip ||
      (Number.isFinite(vipExp) && vipExp > Date.now());

    const friendStatus = meName
      ? await getFriendStatus(meName, username)
      : "none";

    return NextResponse.json({
      ok: true,
      profile: {
        username: String(users[0].username),
        uid: users[0].uid ? String(users[0].uid) : "—",
        displayName: String(users[0].username),
        avatarUrl: null as string | null,
        rank,
        totalKeysBought: Number(stats[0]?.keys_bought) || 0,
        totalAmountSpent: Number(stats[0]?.amount_spent) || 0,
        isVip,
        createdAt: users[0].created_at ? String(users[0].created_at) : null,
        friendStatus,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
