import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon HTTP one-shot driver — mỗi query = 1 request HTTP, không giữ TCP pool.
 * Chỉ dùng trên server (API routes).
 */
let cached: NeonQueryFunction<false, false> | null = null;

export function getNeonSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL chưa được cấu hình");
  }
  if (!cached) {
    cached = neon(url);
  }
  return cached;
}

/** Chạy raw SQL tagged template */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const client = getNeonSql();
  return (client as Function)(strings, ...values);
}
