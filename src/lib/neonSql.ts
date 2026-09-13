import { neon, neonConfig, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon HTTP — tối ưu Render (Node long-running + cold start).
 * "fetch failed" thường do: Neon sleep, URL thiếu sslmode, hoặc race cold start.
 */

try {
  neonConfig.fetchConnectionCache = true;
} catch {
  /* */
}

function normalizeUrl(raw: string): string {
  let u = raw.trim();
  // Đôi khi copy nhầm dấu ngoặc / khoảng trắng
  u = u.replace(/^["']|["']$/g, "");
  if (!u.includes("sslmode=")) {
    u += (u.includes("?") ? "&" : "?") + "sslmode=require";
  }
  return u;
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
    const raw = String(c || "").trim();
    if (raw.startsWith("postgres://") || raw.startsWith("postgresql://")) {
      return normalizeUrl(raw);
    }
  }
  return null;
}

/** Mọi URL hợp lệ (pooled + unpooled) để fallback khi fetch failed */
function allDatabaseUrls(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const key of [
    "DATABASE_URL",
    "DATABASE_URL_UNPOOLED",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "NEON_DATABASE_URL",
  ]) {
    const raw = String(process.env[key] || "").trim();
    if (!(raw.startsWith("postgres://") || raw.startsWith("postgresql://"))) continue;
    const n = normalizeUrl(raw);
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

let cachedSql: NeonQueryFunction<false, false> | null = null;
let cachedUrl: string | null = null;

export function getNeonSql(urlOverride?: string): NeonQueryFunction<false, false> {
  const url = urlOverride || resolveDatabaseUrl();
  if (!url) {
    throw new Error(
      "DATABASE_URL chưa cấu hình trên Render. Environment → thêm chuỗi Neon (postgresql://...?sslmode=require)."
    );
  }
  if (cachedSql && cachedUrl === url && !urlOverride) return cachedSql;
  const sql = neon(url);
  if (!urlOverride) {
    cachedSql = sql;
    cachedUrl = url;
  }
  return sql;
}

function isTransientDbError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e || "")).toLowerCase();
  return (
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("timeout") ||
    msg.includes("socket") ||
    msg.includes("503") ||
    msg.includes("502") ||
    msg.includes("und_err") ||
    msg.includes("connection")
  );
}

/** Thử lại + fallback URL unpooled khi fetch failed */
export async function withNeonRetry<T>(fn: (sql: NeonQueryFunction<false, false>) => Promise<T>, retries = 3): Promise<T> {
  const urls = allDatabaseUrls();
  if (!urls.length) {
    throw new Error(
      "DATABASE_URL chưa cấu hình trên Render. Environment → thêm chuỗi Neon (postgresql://...?sslmode=require)."
    );
  }

  let last: unknown;
  for (let u = 0; u < urls.length; u++) {
    const sql = getNeonSql(urls[u]);
    for (let i = 0; i <= retries; i++) {
      try {
        return await fn(sql);
      } catch (e) {
        last = e;
        if (!isTransientDbError(e)) throw e;
        // đợi Neon/Render cold wake
        await new Promise((r) => setTimeout(r, 300 + i * 500 + u * 200));
      }
    }
    // thử URL kế (unpooled)
    cachedSql = null;
    cachedUrl = null;
  }
  throw last;
}

/** Ping DB — đánh thức Neon free tier */
export async function wakeNeon(): Promise<{ ok: boolean; error?: string }> {
  try {
    await withNeonRetry(async (sql) => {
      await sql`SELECT 1 AS ok`;
    }, 4);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: formatDbError(e) };
  }
}

export function formatDbError(e: unknown): string {
  const raw = e instanceof Error ? e.message : String(e || "Lỗi DB");
  const lower = raw.toLowerCase();
  if (isTransientDbError(e)) {
    return (
      "Neon tạm không phản hồi (fetch failed). Đợi 5–10 giây rồi F5. " +
      "Nếu kéo dài: mở console.neon.tech đánh thức project, kiểm tra DATABASE_URL trên Render."
    );
  }
  if (lower.includes("password") || lower.includes("authentication")) {
    return "Sai mật khẩu DATABASE_URL — copy lại connection string từ Neon Console.";
  }
  if (lower.includes("database_url") || lower.includes("chưa cấu hình")) {
    return raw;
  }
  return raw;
}
