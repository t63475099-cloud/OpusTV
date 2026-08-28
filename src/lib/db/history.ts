import { eq, desc, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { watchHistory } from "@/db/schema";

export async function listHistory(userId: number, limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(watchHistory)
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.updatedAt))
    .limit(Math.min(80, Math.max(1, limit)));
}

export async function upsertHistory(
  userId: number,
  item: {
    videoId: string;
    title?: string;
    thumbnail?: string;
    episode?: string;
    episodeSlug?: string;
    server?: string;
    progress?: number;
    duration?: number;
  }
) {
  const db = getDb();
  const now = new Date();
  await db
    .insert(watchHistory)
    .values({
      userId,
      videoId: item.videoId,
      title: item.title || "",
      thumbnail: item.thumbnail || "",
      episode: item.episode || "",
      episodeSlug: item.episodeSlug || "",
      server: item.server || "",
      progress: item.progress || 0,
      duration: item.duration || 0,
      watchedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [watchHistory.userId, watchHistory.videoId],
      set: {
        title: item.title || "",
        thumbnail: item.thumbnail || "",
        episode: item.episode || "",
        episodeSlug: item.episodeSlug || "",
        server: item.server || "",
        progress: item.progress || 0,
        duration: item.duration || 0,
        updatedAt: now,
        watchedAt: now,
      },
    });
}

export async function removeHistory(userId: number, videoId: string) {
  const db = getDb();
  await db
    .delete(watchHistory)
    .where(and(eq(watchHistory.userId, userId), eq(watchHistory.videoId, videoId)));
}
