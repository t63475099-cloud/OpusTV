import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "@/lib/neonSql";

/**
 * Neon HTTP driver — Render / Netlify / Vercel.
 */
export function getDb() {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL chưa được cấu hình. Thêm DATABASE_URL (Neon) vào Environment Variables trên Render."
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof getDb>;
