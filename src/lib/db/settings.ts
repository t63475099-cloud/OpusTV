import { eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { settings } from "@/db/schema";

export async function getSettings(userId: number) {
  const db = getDb();
  const rows = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  return rows[0] || null;
}

export async function upsertSettings(
  userId: number,
  data: {
    payload?: Record<string, unknown>;
    backgroundPlayback?: boolean;
    theme?: string;
    language?: string;
  }
) {
  const db = getDb();
  const now = new Date();
  await db
    .insert(settings)
    .values({
      userId,
      payload: data.payload || {},
      backgroundPlayback: data.backgroundPlayback ? 1 : 0,
      theme: data.theme || "dark",
      language: data.language || "vi",
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [settings.userId],
      set: {
        payload: data.payload || {},
        backgroundPlayback: data.backgroundPlayback ? 1 : 0,
        theme: data.theme || "dark",
        language: data.language || "vi",
        updatedAt: now,
      },
    });
}
