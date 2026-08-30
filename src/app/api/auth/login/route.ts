import { NextRequest, NextResponse } from "next/server";
import { checkPassword, touchLastLogin } from "@/lib/db/users";
import { createSession, cookieOptions, SESSION_COOKIE } from "@/lib/session";
import { listHistory } from "@/lib/db/history";
import { listFavorites } from "@/lib/db/favorites";
import { listMusicHistory } from "@/lib/db/music";
import { getSettings } from "@/lib/db/settings";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL chưa cấu hình (Neon PostgreSQL)." },
        { status: 503 }
      );
    }
    const body = await req.json();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const user = await checkPassword(username, password);
    if (!user) {
      return NextResponse.json({ ok: false, error: "Sai tài khoản hoặc mật khẩu" }, { status: 401 });
    }
    await touchLastLogin(user.id);
    const token = await createSession(user.id);

    const [history, favorites, music, settingsRow] = await Promise.all([
      listHistory(user.id, 80),
      listFavorites(user.id, 100),
      listMusicHistory(user.id, 120),
      getSettings(user.id),
    ]);

    const data = {
      history: history.map((h) => ({
        slug: h.videoId,
        name: h.title,
        poster: h.thumbnail,
        episode: h.episode,
        episodeSlug: h.episodeSlug,
        server: h.server,
        currentTime: h.progress,
        duration: h.duration,
        updatedAt: h.updatedAt?.getTime?.() || Date.now(),
      })),
      favorites: favorites.map((f) => ({
        slug: f.videoId,
        name: f.title,
        poster: f.thumbnail,
        year: f.year ?? undefined,
        addedAt: f.createdAt?.getTime?.() || Date.now(),
      })),
      musicWatched: music.map((m) => ({
        id: m.videoId,
        title: m.title,
        artist: m.artist,
        thumb: m.thumbnail,
        category: m.category,
        watchedAt: m.playedAt?.getTime?.() || Date.now(),
      })),
      settings: settingsRow?.payload || {},
      profile: { name: user.username, loggedIn: true, verified: !!(user as { verified?: number }).verified },
      updatedAt: Date.now(),
    };

    const res = NextResponse.json({
      ok: true,
      username: user.username,
      storage: "neon",
      data,
    });
    res.cookies.set(SESSION_COOKIE, token, cookieOptions(30 * 24 * 60 * 60));
    return res;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi đăng nhập";
    console.error("login", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
