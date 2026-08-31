import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { listFavorites } from "@/lib/db/favorites";
import { getSettings } from "@/lib/db/settings";
import { rankFromLevel, levelFromExp, BADGES } from "@/lib/gamification";

export async function GET(req: NextRequest) {
  try {
    const username = String(req.nextUrl.searchParams.get("username") || "")
      .trim()
      .toLowerCase()
      .slice(0, 40);
    if (!username) {
      return NextResponse.json({ ok: false, error: "Thiếu username" }, { status: 400 });
    }
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        ok: true,
        profile: {
          username,
          name: username,
          level: 1,
          rankLabel: "Tân thủ",
          rankColor: "#a1a1aa",
          badges: [],
          favorites: [],
        },
      });
    }
    const db = neon(process.env.DATABASE_URL);
    const rows = await db`
      SELECT id, username, COALESCE(verified, 0) AS verified
      FROM users WHERE username = ${username} LIMIT 1
    `;
    if (!rows.length) {
      return NextResponse.json({ ok: false, error: "Không tìm thấy người dùng" }, { status: 404 });
    }
    const user = rows[0] as { id: number; username: string; verified: number };
    const settings = await getSettings(user.id);
    const payload = (settings?.payload || {}) as Record<string, unknown>;
    const profileObj =
      payload.profile && typeof payload.profile === "object"
        ? (payload.profile as Record<string, unknown>)
        : {};
    const xpObj =
      payload.xp && typeof payload.xp === "object"
        ? (payload.xp as Record<string, number>)
        : { exp: 0, watchMinutes: 0, comments: 0, musicPlays: 0 };

    const exp = Number(xpObj.exp || 0);
    const level = levelFromExp(exp);
    const rank = rankFromLevel(level);
    const hours = Number(xpObj.watchMinutes || 0) / 60;
    const badges = BADGES.filter((b) => {
      const n = b.need as Record<string, number>;
      if (n.level && level < n.level) return false;
      if (n.watchHours && hours < n.watchHours) return false;
      if (n.comments && Number(xpObj.comments || 0) < n.comments) return false;
      if (n.musicPlays && Number(xpObj.musicPlays || 0) < n.musicPlays) return false;
      return true;
    }).map((b) => ({ id: b.id, label: b.label, icon: b.icon }));

    let favorites: { slug: string; name: string; poster?: string }[] = [];
    try {
      const favs = await listFavorites(user.id, 12);
      favorites = favs.map((f) => ({
        slug: f.videoId,
        name: f.title,
        poster: f.thumbnail || undefined,
      }));
    } catch {
      /* */
    }

    return NextResponse.json({
      ok: true,
      profile: {
        username: user.username,
        name: (profileObj.name as string) || user.username,
        avatar: (profileObj.avatar as string) || undefined,
        avatarFrame: (profileObj.avatarFrame as string) || undefined,
        verified: !!user.verified,
        level,
        rankLabel: rank.label,
        rankColor: rank.color,
        badges,
        favorites,
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
