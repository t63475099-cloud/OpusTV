import { eq, desc } from "drizzle-orm";
import { getDb } from "@/db/client";
import { musicHistory } from "@/db/schema";

export async function listMusicHistory(userId: number, limit = 40) {
  const db = getDb();
  return db
    .select()
    .from(musicHistory)
    .where(eq(musicHistory.userId, userId))
    .orderBy(desc(musicHistory.playedAt))
    .limit(Math.min(120, Math.max(1, limit)));
}

export async function upsertMusicPlay(
  userId: number,
  item: { videoId: string; title?: string; thumbnail?: string; artist?: string; category?: string }
) {
  const db = getDb();
  const now = new Date();
  await db
    .insert(musicHistory)
    .values({
      userId,
      videoId: item.videoId,
      title: item.title || "",
      thumbnail: item.thumbnail || "",
      artist: item.artist || "",
      category: item.category || "",
      playedAt: now,
    })
    .onConflictDoUpdate({
      target: [musicHistory.userId, musicHistory.videoId],
      set: {
        title: item.title || "",
        thumbnail: item.thumbnail || "",
        artist: item.artist || "",
        category: item.category || "",
        playedAt: now,
      },
    });
}
