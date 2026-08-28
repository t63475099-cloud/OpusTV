import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { listHistory, upsertHistory } from "@/lib/db/history";
import { listFavorites, toggleFavorite } from "@/lib/db/favorites";
import { listMusicHistory, upsertMusicPlay } from "@/lib/db/music";
import { getSettings, upsertSettings } from "@/lib/db/settings";
import { getDb } from "@/db/client";
import { favorites } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const [history, favs, music, settingsRow] = await Promise.all([
      listHistory(session.userId, 80),
      listFavorites(session.userId, 100),
      listMusicHistory(session.userId, 120),
      getSettings(session.userId),
    ]);
    return NextResponse.json({
      ok: true,
      username: session.username,
      data: {
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
        favorites: favs.map((f) => ({
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
        profile: { name: session.username, loggedIn: true },
        updatedAt: Date.now(),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const body = await req.json();
    const data = body.data || {};
    const uid = session.userId;

    // Merge watch history từ client lên DB (không xóa bản ghi server)
    if (Array.isArray(data.history)) {
      for (const h of data.history.slice(0, 80)) {
        if (!h?.slug) continue;
        await upsertHistory(uid, {
          videoId: String(h.slug),
          title: String(h.name || ""),
          thumbnail: String(h.poster || ""),
          episode: String(h.episode || ""),
          episodeSlug: String(h.episodeSlug || ""),
          server: String(h.server || ""),
          progress: Number(h.currentTime || 0),
          duration: Number(h.duration || 0),
        });
      }
    }

    if (Array.isArray(data.favorites)) {
      const db = getDb();
      for (const f of data.favorites.slice(0, 100)) {
        if (!f?.slug) continue;
        const existing = await db
          .select()
          .from(favorites)
          .where(and(eq(favorites.userId, uid), eq(favorites.videoId, String(f.slug))))
          .limit(1);
        if (!existing[0]) {
          await db.insert(favorites).values({
            userId: uid,
            videoId: String(f.slug),
            title: String(f.name || ""),
            thumbnail: String(f.poster || ""),
            type: "movie",
            year: f.year ? Number(f.year) : null,
          });
        }
      }
    }

    if (Array.isArray(data.musicWatched)) {
      for (const m of data.musicWatched.slice(0, 120)) {
        if (!m?.id) continue;
        await upsertMusicPlay(uid, {
          videoId: String(m.id),
          title: String(m.title || ""),
          thumbnail: String(m.thumb || ""),
          artist: String(m.artist || ""),
          category: String(m.category || ""),
        });
      }
    }

    if (data.settings && typeof data.settings === "object") {
      await upsertSettings(uid, {
        payload: data.settings as Record<string, unknown>,
      });
    }

    // Trả về snapshot đã merge từ DB
    const [history, favs, music, settingsRow] = await Promise.all([
      listHistory(uid, 80),
      listFavorites(uid, 100),
      listMusicHistory(uid, 120),
      getSettings(uid),
    ]);

    return NextResponse.json({
      ok: true,
      data: {
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
        favorites: favs.map((f) => ({
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
        profile: { name: session.username, loggedIn: true },
        updatedAt: Date.now(),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi đồng bộ";
    console.error("sync", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
