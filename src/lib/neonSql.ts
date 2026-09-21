import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon HTTP one-shot driver — mỗi query = 1 HTTP request, không giữ TCP pool.
 * Chỉ dùng phía server (API routes / Server Components).
 */

export function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    "";
  if (!url) {
    throw new Error(
      "DATABASE_URL chưa được cấu hình. Thêm DATABASE_URL (Neon) vào Environment Variables."
    );
  }
  return url;
}

let cached: NeonQueryFunction<false, false> | null = null;

export function getNeonSql(): NeonQueryFunction<false, false> {
  if (!cached) {
    cached = neon(resolveDatabaseUrl());
  }
  return cached;
}

/** Alias tagged-template SQL */
export function sql(strings: TemplateStringsArray, ...values: unknown[]) {
  const client = getNeonSql();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (client as any)(strings, ...values);
}

/** Chuỗi lỗi thân thiện khi Neon sleep / mạng lỗi */
export function formatDbError(err: unknown): string {
  const msg =
    err instanceof Error
      ? err.message
      : typeof err === "string"
        ? err
        : "Lỗi cơ sở dữ liệu";
  const lower = msg.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("socket")
  ) {
    return "Không kết nối được database (Neon có thể đang sleep). Thử lại sau vài giây.";
  }
  if (lower.includes("password") || lower.includes("authentication")) {
    return "Sai thông tin kết nối database.";
  }
  if (lower.includes("does not exist") && lower.includes("column")) {
    return msg;
  }
  return msg.length > 200 ? msg.slice(0, 200) + "…" : msg;
}

/**
 * Đánh thức Neon (compute sleep) bằng một query nhẹ.
 * Gọi trước các thao tác quan trọng khi DB có thể đang ngủ.
 */
export async function wakeNeon(): Promise<boolean> {
  try {
    const client = getNeonSql();
    await client`SELECT 1 AS ok`;
    return true;
  } catch {
    try {
      // reset cache phòng URL đổi / endpoint lỗi tạm
      cached = null;
      const client = getNeonSql();
      await client`SELECT 1 AS ok`;
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Retry khi gặp lỗi mạng / Neon sleep.
 */
export async function withNeonRetry<T>(
  fn: () => Promise<T>,
  opts?: { retries?: number; delayMs?: number }
): Promise<T> {
  const retries = opts?.retries ?? 3;
  const delayMs = opts?.delayMs ?? 600;
  let last: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      if (i > 0) await wakeNeon();
      return await fn();
    } catch (e) {
      last = e;
      const msg = e instanceof Error ? e.message.toLowerCase() : "";
      const retryable =
        msg.includes("fetch failed") ||
        msg.includes("timeout") ||
        msg.includes("econnreset") ||
        msg.includes("network") ||
        msg.includes("503") ||
        msg.includes("502");
      if (!retryable || i === retries - 1) break;
      await new Promise((r) => setTimeout(r, delayMs * (i + 1)));
    }
  }
  throw last instanceof Error ? last : new Error(formatDbError(last));
}
