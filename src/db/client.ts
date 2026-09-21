import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { resolveDatabaseUrl } from "@/lib/neonSql";

/**
 * Neon HTTP + Drizzle — phù hợp Vercel Serverless (không giữ pool lớn).
 * Chỉ dùng phía server (API routes / Server Components).
 */
export function getDb() {
  const url = resolveDatabaseUrl();
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof getDb>;
