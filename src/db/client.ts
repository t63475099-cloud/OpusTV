import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Neon HTTP driver — phù hợp Vercel Serverless (không giữ pool lớn).
 * Chỉ dùng phía server (API routes / Server Components).
 */
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL chưa được cấu hình. Kết nối Neon trên Vercel (Storage → Neon) hoặc thêm DATABASE_URL vào Environment Variables."
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export type Db = ReturnType<typeof getDb>;
