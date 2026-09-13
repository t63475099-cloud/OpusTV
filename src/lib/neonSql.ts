import { neon, neonConfig } from "@neondatabase/serverless";

/**
 * Neon HTTP — dùng trên Render / Netlify / Vercel.
 * "fetch failed" thường do: thiếu DATABASE_URL, URL sai, hoặc Neon tạm ngắt.
 */
try {
  // Cache kết nối HTTP giữa các lần gọi trong cùng instance
  neonConfig.fetchConnectionCache = true;
} catch {
  /* */
}

export function resolveDatabaseUrl(): string | null {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.DATABASE_URL_UNPOOLED,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.NEON_DATABASE_URL,
  ];
  for (const c of candidates) {
    const u = String(c || "").trim();
    if (u.startsWith("postgres://") || u.startsWith("postgresql://")) return u;
  }
  return null;
}

export function getNeonSql() {
  const url = resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL chưa cấu hình trên Render. Vào Dashboard → Environment → thêm DATABASE_URL (chuỗi Neon PostgreSQL)."
    );
  }
  return neon(url);
}

export function formatDbError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e || "Lỗi DB");
  const lower = raw.toLowerCase();
  if (lower.includes("fetch failed") || lower.includes("network") || lower.includes("econnrefused")) {
    return (
      "Không kết nối được Neon DB (fetch failed). Kiểm tra trên Render: " +
      "1) DATABASE_URL đúng từ Neon Console  2) Neon project đang Active  3) Redeploy sau khi thêm env."
    );
  }
  if (lower.includes("password") || lower.includes("authentication")) {
    return "Sai mật khẩu DATABASE_URL — copy lại connection string từ Neon.";
  }
  if (lower.includes("database_url") || lower.includes("missing")) {
    return raw;
  }
  return raw;
}
