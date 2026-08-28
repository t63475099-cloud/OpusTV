import { eq, desc, and } from "drizzle-orm";
import { getDb } from "@/db/client";
import { favorites } from "@/db/schema";

export async function listFavorites(userId: number, limit = 50) {
  const db = getDb();
  return db
    .select()
    .from(favorites)
    .where(eq(favorites.userId, userId))
    .orderBy(desc(favorites.createdAt))
    .limit(Math.min(100, Math.max(1, limit)));
}

export async function toggleFavorite(
  userId: number,
  item: { videoId: string; title?: string; thumbnail?: string; type?: string; year?: number }
) {
  const db = getDb();
  const existing = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.videoId, item.videoId)))
    .limit(1);
  if (existing[0]) {
    await db
      .delete(favorites)
      .where(and(eq(favorites.userId, userId), eq(favorites.videoId, item.videoId)));
    return { favorited: false };
  }
  await db.insert(favorites).values({
    userId,
    videoId: item.videoId,
    title: item.title || "",
    thumbnail: item.thumbnail || "",
    type: item.type || "movie",
    year: item.year ?? null,
  });
  return { favorited: true };
}
