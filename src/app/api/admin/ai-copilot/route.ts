import { NextRequest, NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { hashPassword } from "@/lib/password";
import {
  adminSecretFromRequest,
  isAdminSecretValid,
  randomAdminPin,
} from "@/lib/adminEngine";
import { generateUid } from "@/lib/db/users";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM = `Bạn là Admin AI Copilot của OpusFilm (OpusTV) — trợ lý quản trị nội bộ.
- Chỉ hỗ trợ admin đã xác thực. Trả lời tiếng Việt.
- Khi admin yêu cầu thao tác dữ liệu (tạo/xóa acc, phát thưởng, thống kê, tìm user, ban…) — HÃY gọi tool, không bịa số liệu.
- Không tiết lộ ADMIN_SECRET, DATABASE_URL, API key.
- SAU KHI TOOL CHẠY: trình bày kết quả dạng bảng text rõ ràng (cột căn bằng dấu | hoặc dòng có nhãn), KHÔNG dump JSON thô.
  Ví dụ bảng:
  Username          | Password     | UID
  test_123          | Opus@abc     | 1391491623
- Tóm tắt ngắn: số lượng thành công / lỗi, mật khẩu chung nếu có.
- Xóa theo prefix: chỉ xóa user có username BẮT ĐẦU bằng prefix; không xóa role admin; limit tối đa 100/lần.
- Không xóa toàn bộ database.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "bulk_create_accounts",
        description: "Tạo N tài khoản hàng loạt với prefix + mật khẩu chung.",
        parameters: {
          type: "object",
          properties: {
            count: { type: "integer", description: "1–100" },
            prefix: { type: "string", description: "Tiền tố username" },
            password: { type: "string", description: "Mật khẩu chung (tuỳ chọn)" },
          },
          required: ["count"],
        },
      },
      {
        name: "delete_accounts_by_prefix",
        description:
          "Xóa tối đa N tài khoản có username bắt đầu bằng prefix (không xóa admin).",
        parameters: {
          type: "object",
          properties: {
            prefix: { type: "string", description: "Tiền tố, ví dụ test_" },
            limit: { type: "integer", description: "Tối đa 100, mặc định 10" },
            confirm: {
              type: "boolean",
              description: "Phải true để thực thi xóa",
            },
          },
          required: ["prefix", "confirm"],
        },
      },
      {
        name: "delete_account_by_username",
        description: "Xóa đúng 1 tài khoản theo username (không xóa admin).",
        parameters: {
          type: "object",
          properties: {
            username: { type: "string" },
            confirm: { type: "boolean" },
          },
          required: ["username", "confirm"],
        },
      },
      {
        name: "list_accounts",
        description: "Liệt kê tài khoản gần đây hoặc theo prefix.",
        parameters: {
          type: "object",
          properties: {
            prefix: { type: "string", description: "Lọc prefix (tuỳ chọn)" },
            limit: { type: "integer", description: "Mặc định 20, tối đa 50" },
          },
        },
      },
      {
        name: "search_account",
        description: "Tìm 1 tài khoản theo username chính xác hoặc gần đúng.",
        parameters: {
          type: "object",
          properties: {
            username: { type: "string" },
          },
          required: ["username"],
        },
      },
      {
        name: "set_user_role",
        description: "Đổi role user: User | Moderator | Admin (cẩn thận).",
        parameters: {
          type: "object",
          properties: {
            username: { type: "string" },
            role: { type: "string", description: "User | Moderator | Admin" },
          },
          required: ["username", "role"],
        },
      },
      {
        name: "create_broadcast_reward",
        description: "Phát thưởng toàn server: coins | vip_hours | vip_lifetime.",
        parameters: {
          type: "object",
          properties: {
            reward_type: { type: "string" },
            reward_value: { type: "integer" },
            message: { type: "string" },
          },
          required: ["reward_type", "reward_value", "message"],
        },
      },
      {
        name: "get_system_stats",
        description: "Thống kê user, key, broadcast đang active.",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "list_bulk_logs",
        description: "Lịch sử tạo tài khoản hàng loạt gần đây.",
        parameters: {
          type: "object",
          properties: {
            limit: { type: "integer", description: "Mặc định 10" },
          },
        },
      },
    ],
  },
];

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL chưa cấu hình");
  return neon(url);
}

function unauthorized() {
  return NextResponse.json(
    { ok: false, error: "Unauthorized — cần x-admin-secret hợp lệ" },
    { status: 401 }
  );
}

function pad(s: string, n: number) {
  const t = String(s ?? "");
  return t.length >= n ? t.slice(0, n) : t + " ".repeat(n - t.length);
}

function tableAccounts(
  rows: Array<{ username?: string; password?: string; uid?: string; role?: string }>
) {
  if (!rows.length) return "(trống)";
  const hasPw = rows.some((r) => r.password);
  const hasRole = rows.some((r) => r.role);
  const lines = [
    hasPw
      ? `${pad("Username", 22)} | ${pad("Password", 14)} | ${pad("UID", 12)}${hasRole ? " | Role" : ""}`
      : `${pad("Username", 22)} | ${pad("UID", 12)}${hasRole ? " | Role" : ""}`,
    hasPw
      ? `${"-".repeat(22)}-+-${"-".repeat(14)}-+-${"-".repeat(12)}${hasRole ? "-+------" : ""}`
      : `${"-".repeat(22)}-+-${"-".repeat(12)}${hasRole ? "-+------" : ""}`,
  ];
  for (const r of rows) {
    if (hasPw) {
      lines.push(
        `${pad(r.username || "", 22)} | ${pad(r.password || "", 14)} | ${pad(String(r.uid || ""), 12)}${hasRole ? ` | ${r.role || ""}` : ""}`
      );
    } else {
      lines.push(
        `${pad(r.username || "", 22)} | ${pad(String(r.uid || ""), 12)}${hasRole ? ` | ${r.role || ""}` : ""}`
      );
    }
  }
  return lines.join("\n");
}

async function toolBulkCreate(args: {
  count?: number;
  prefix?: string;
  password?: string;
}) {
  const sql = db();
  await sql`
    CREATE TABLE IF NOT EXISTS bulk_creation_logs (
      id SERIAL PRIMARY KEY,
      created_count INT NOT NULL DEFAULT 0,
      requested_count INT NOT NULL DEFAULT 0,
      prefix TEXT DEFAULT 'user_',
      created_by TEXT DEFAULT 'admin',
      usernames JSONB DEFAULT '[]'::jsonb,
      accounts JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  const count = Math.min(100, Math.max(1, Number(args.count) || 1));
  const prefix =
    String(args.prefix || "user_")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 24) || "user_";
  const defaultPass =
    String(args.password || "").trim() ||
    "Opus@" + Math.random().toString(36).slice(2, 8);
  const passwordHash = await hashPassword(defaultPass);
  const pinHash = await hashPassword(randomAdminPin(6));
  const created: Array<{ username: string; password: string; uid: string }> =
    [];
  let seq = Date.now() % 1000000;
  for (let i = 0; i < count; i++) {
    for (let attempt = 0; attempt < 20; attempt++) {
      seq += 1;
      const username =
        `${prefix}${seq}${Math.floor(Math.random() * 90 + 10)}`.slice(0, 32);
      try {
        const uid = generateUid();
        await sql`
          INSERT INTO users (username, password_hash, recovery_pin_hash, uid, role, verified, updated_at)
          VALUES (${username}, ${passwordHash}, ${pinHash}, ${uid}, 'User', 0, NOW())
        `;
        created.push({ username, password: defaultPass, uid });
        break;
      } catch {
        /* retry */
      }
    }
  }
  try {
    await sql`ALTER TABLE bulk_creation_logs ADD COLUMN IF NOT EXISTS accounts JSONB DEFAULT '[]'::jsonb`;
  } catch {
    /* */
  }
  try {
    await sql`
      INSERT INTO bulk_creation_logs (created_count, requested_count, prefix, created_by, usernames, accounts)
      VALUES (
        ${created.length}, ${count}, ${prefix}, ${"ai-copilot"},
        ${JSON.stringify(created.map((c) => c.username))}::jsonb,
        ${JSON.stringify(created)}::jsonb
      )
    `;
  } catch {
    /* */
  }
  return {
    ok: true,
    summary: `Đã tạo ${created.length}/${count} · prefix ${prefix} · pass ${defaultPass}`,
    table: tableAccounts(created),
    created: created.length,
    defaultPassword: defaultPass,
  };
}

async function toolDeleteByPrefix(args: {
  prefix?: string;
  limit?: number;
  confirm?: boolean;
}) {
  if (!args.confirm) {
    return { ok: false, error: "Cần confirm=true để xóa" };
  }
  const prefix = String(args.prefix || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
  if (prefix.length < 2) {
    return { ok: false, error: "Prefix tối thiểu 2 ký tự an toàn" };
  }
  const limit = Math.min(100, Math.max(1, Number(args.limit) || 10));
  const sql = db();
  const rows = await sql`
    SELECT id, username, uid, COALESCE(role, 'User') AS role
    FROM users
    WHERE lower(username) LIKE ${prefix + "%"}
      AND lower(COALESCE(role, 'User')) NOT IN ('admin')
    ORDER BY id DESC
    LIMIT ${limit}
  `;
  if (!rows.length) {
    return { ok: true, deleted: 0, summary: `Không có user nào prefix "${prefix}"` };
  }
  const ids = rows.map((r) => Number((r as { id: number }).id));
  const usernames = rows.map((r) => String((r as { username: string }).username));
  for (const id of ids) {
    try {
      await sql`DELETE FROM sessions WHERE user_id = ${id}`;
    } catch {
      /* */
    }
    try {
      await sql`DELETE FROM users WHERE id = ${id}`;
    } catch {
      /* */
    }
  }
  return {
    ok: true,
    deleted: usernames.length,
    summary: `Đã xóa ${usernames.length} acc prefix "${prefix}"`,
    table: tableAccounts(
      rows.map((r) => ({
        username: String((r as { username: string }).username),
        uid: String((r as { uid?: string }).uid || ""),
        role: String((r as { role?: string }).role || ""),
      }))
    ),
    usernames,
  };
}

async function toolDeleteOne(args: { username?: string; confirm?: boolean }) {
  if (!args.confirm) return { ok: false, error: "Cần confirm=true" };
  const username = String(args.username || "")
    .trim()
    .toLowerCase();
  if (!username) return { ok: false, error: "Thiếu username" };
  const sql = db();
  const rows = await sql`
    SELECT id, username, uid, COALESCE(role, 'User') AS role
    FROM users WHERE lower(username) = ${username} LIMIT 1
  `;
  if (!rows.length) return { ok: false, error: "Không tìm thấy user" };
  const u = rows[0] as { id: number; username: string; uid?: string; role: string };
  if (String(u.role).toLowerCase() === "admin") {
    return { ok: false, error: "Không xóa tài khoản role Admin" };
  }
  try {
    await sql`DELETE FROM sessions WHERE user_id = ${u.id}`;
  } catch {
    /* */
  }
  await sql`DELETE FROM users WHERE id = ${u.id}`;
  return {
    ok: true,
    summary: `Đã xóa ${u.username}`,
    table: tableAccounts([{ username: u.username, uid: u.uid || "", role: u.role }]),
  };
}

async function toolListAccounts(args: { prefix?: string; limit?: number }) {
  const limit = Math.min(50, Math.max(1, Number(args.limit) || 20));
  const prefix = String(args.prefix || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "");
  const sql = db();
  const rows = prefix
    ? await sql`
        SELECT username, uid, COALESCE(role, 'User') AS role
        FROM users WHERE lower(username) LIKE ${prefix + "%"}
        ORDER BY id DESC LIMIT ${limit}
      `
    : await sql`
        SELECT username, uid, COALESCE(role, 'User') AS role
        FROM users ORDER BY id DESC LIMIT ${limit}
      `;
  const list = rows.map((r) => ({
    username: String((r as { username: string }).username),
    uid: String((r as { uid?: string }).uid || ""),
    role: String((r as { role?: string }).role || "User"),
  }));
  return {
    ok: true,
    count: list.length,
    summary: prefix
      ? `${list.length} user prefix "${prefix}"`
      : `${list.length} user gần nhất`,
    table: tableAccounts(list),
  };
}

async function toolSearch(args: { username?: string }) {
  const q = String(args.username || "")
    .trim()
    .toLowerCase();
  if (!q) return { ok: false, error: "Thiếu username" };
  const sql = db();
  const rows = await sql`
    SELECT username, uid, COALESCE(role, 'User') AS role, email, bio
    FROM users
    WHERE lower(username) = ${q} OR lower(username) LIKE ${"%" + q + "%"}
    ORDER BY CASE WHEN lower(username) = ${q} THEN 0 ELSE 1 END
    LIMIT 15
  `;
  const list = rows.map((r) => ({
    username: String((r as { username: string }).username),
    uid: String((r as { uid?: string }).uid || ""),
    role: String((r as { role?: string }).role || "User"),
  }));
  return {
    ok: true,
    count: list.length,
    summary: list.length ? `Tìm thấy ${list.length}` : "Không thấy",
    table: tableAccounts(list),
  };
}

async function toolSetRole(args: { username?: string; role?: string }) {
  const username = String(args.username || "")
    .trim()
    .toLowerCase();
  const roleRaw = String(args.role || "User").trim();
  const role =
    /admin/i.test(roleRaw)
      ? "Admin"
      : /mod/i.test(roleRaw)
        ? "Moderator"
        : "User";
  if (!username) return { ok: false, error: "Thiếu username" };
  const sql = db();
  const r = await sql`
    UPDATE users SET role = ${role}, updated_at = NOW()
    WHERE lower(username) = ${username}
    RETURNING username, uid, role
  `;
  if (!r.length) return { ok: false, error: "Không tìm thấy user" };
  const u = r[0] as { username: string; uid?: string; role: string };
  return {
    ok: true,
    summary: `${u.username} → role ${u.role}`,
    table: tableAccounts([
      { username: u.username, uid: u.uid || "", role: u.role },
    ]),
  };
}

async function toolBroadcast(args: {
  reward_type?: string;
  reward_value?: number;
  message?: string;
}) {
  const sql = db();
  const rewardType = String(args.reward_type || "coins").toLowerCase();
  if (!["coins", "vip_hours", "vip_lifetime"].includes(rewardType)) {
    return {
      ok: false,
      error: "reward_type: coins | vip_hours | vip_lifetime",
    };
  }
  const rewardValue = Math.max(0, Number(args.reward_value) || 0);
  const message = String(args.message || "Phần thưởng từ Admin").slice(0, 500);
  await sql`
    CREATE TABLE IF NOT EXISTS global_broadcast_rewards (
      id SERIAL PRIMARY KEY,
      reward_type TEXT NOT NULL,
      reward_value INT NOT NULL DEFAULT 0,
      message_template TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      is_active BOOLEAN DEFAULT TRUE
    )
  `;
  await sql`UPDATE global_broadcast_rewards SET is_active = FALSE WHERE is_active = TRUE`;
  const rows = await sql`
    INSERT INTO global_broadcast_rewards (reward_type, reward_value, message_template, is_active)
    VALUES (${rewardType}, ${rewardValue}, ${message}, TRUE)
    RETURNING id, reward_type, reward_value, message_template
  `;
  const row = rows[0] as {
    id: number;
    reward_type: string;
    reward_value: number;
    message_template: string;
  };
  return {
    ok: true,
    summary: `Broadcast #${row.id}: ${row.reward_type}=${row.reward_value}`,
    table: `ID | Type         | Value | Message\n---+--------------+-------+--------\n${pad(String(row.id), 2)} | ${pad(row.reward_type, 12)} | ${pad(String(row.reward_value), 5)} | ${row.message_template}`,
  };
}

async function toolStats() {
  const sql = db();
  let users = 0;
  let keys = 0;
  let activeBroadcast = 0;
  let admins = 0;
  try {
    const u = await sql`SELECT COUNT(*)::int AS c FROM users`;
    users = Number((u[0] as { c: number })?.c || 0);
  } catch {
    /* */
  }
  try {
    const a =
      await sql`SELECT COUNT(*)::int AS c FROM users WHERE lower(COALESCE(role,'user')) = 'admin'`;
    admins = Number((a[0] as { c: number })?.c || 0);
  } catch {
    /* */
  }
  try {
    const k = await sql`SELECT COUNT(*)::int AS c FROM activation_keys`;
    keys = Number((k[0] as { c: number })?.c || 0);
  } catch {
    try {
      const k2 = await sql`SELECT COUNT(*)::int AS c FROM license_keys_v2`;
      keys = Number((k2[0] as { c: number })?.c || 0);
    } catch {
      /* */
    }
  }
  try {
    const b =
      await sql`SELECT COUNT(*)::int AS c FROM global_broadcast_rewards WHERE is_active = TRUE`;
    activeBroadcast = Number((b[0] as { c: number })?.c || 0);
  } catch {
    /* */
  }
  return {
    ok: true,
    summary: `${users} users · ${admins} admin · ${keys} keys · ${activeBroadcast} broadcast`,
    table: `Chỉ số              | Giá trị\n---------------------+--------\nTài khoản           | ${users}\nAdmin               | ${admins}\nKey kích hoạt       | ${keys}\nBroadcast đang bật  | ${activeBroadcast}`,
  };
}

async function toolBulkLogs(args: { limit?: number }) {
  const limit = Math.min(20, Math.max(1, Number(args.limit) || 10));
  const sql = db();
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS bulk_creation_logs (
        id SERIAL PRIMARY KEY,
        created_count INT NOT NULL DEFAULT 0,
        requested_count INT NOT NULL DEFAULT 0,
        prefix TEXT DEFAULT 'user_',
        created_by TEXT DEFAULT 'admin',
        usernames JSONB DEFAULT '[]'::jsonb,
        accounts JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
  } catch {
    /* */
  }
  const rows = await sql`
    SELECT id, created_count, requested_count, prefix, created_by, created_at
    FROM bulk_creation_logs ORDER BY id DESC LIMIT ${limit}
  `;
  const lines = [
    `${pad("ID", 4)} | ${pad("Prefix", 12)} | ${pad("OK/Req", 8)} | ${pad("By", 12)} | Time`,
    `${"-".repeat(4)}-+-${"-".repeat(12)}-+-${"-".repeat(8)}-+-${"-".repeat(12)}-+------`,
  ];
  for (const r of rows) {
    const row = r as {
      id: number;
      prefix: string;
      created_count: number;
      requested_count: number;
      created_by: string;
      created_at: string;
    };
    lines.push(
      `${pad(String(row.id), 4)} | ${pad(row.prefix || "", 12)} | ${pad(`${row.created_count}/${row.requested_count}`, 8)} | ${pad(row.created_by || "", 12)} | ${String(row.created_at || "").slice(0, 19)}`
    );
  }
  return {
    ok: true,
    count: rows.length,
    summary: `${rows.length} log bulk gần nhất`,
    table: rows.length ? lines.join("\n") : "(chưa có log)",
  };
}

async function runTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  switch (name) {
    case "bulk_create_accounts":
      return toolBulkCreate(
        args as { count?: number; prefix?: string; password?: string }
      );
    case "delete_accounts_by_prefix":
      return toolDeleteByPrefix(
        args as { prefix?: string; limit?: number; confirm?: boolean }
      );
    case "delete_account_by_username":
      return toolDeleteOne(args as { username?: string; confirm?: boolean });
    case "list_accounts":
      return toolListAccounts(args as { prefix?: string; limit?: number });
    case "search_account":
      return toolSearch(args as { username?: string });
    case "set_user_role":
      return toolSetRole(args as { username?: string; role?: string });
    case "create_broadcast_reward":
      return toolBroadcast(
        args as {
          reward_type?: string;
          reward_value?: number;
          message?: string;
        }
      );
    case "get_system_stats":
      return toolStats();
    case "list_bulk_logs":
      return toolBulkLogs(args as { limit?: number });
    default:
      return { ok: false, error: `Tool không hỗ trợ: ${name}` };
  }
}

type GeminiPart = {
  text?: string;
  functionCall?: { name?: string; args?: Record<string, unknown> };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
};

async function callGemini(
  key: string,
  model: string,
  contents: Array<{ role: string; parts: GeminiPart[] }>,
  withTools: boolean
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(key)}`;
  const payload: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: SYSTEM }] },
    contents,
    generationConfig: { temperature: 0.25, maxOutputTokens: 4096 },
  };
  if (withTools) payload.tools = TOOLS;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: { message?: string };
    candidates?: Array<{
      content?: { parts?: GeminiPart[]; role?: string };
    }>;
  };
  return { res, data };
}

function fallbackReplyFromTools(
  toolResults: Array<{ name: string; result: unknown }>
) {
  return toolResults
    .map((t) => {
      const r = t.result as {
        summary?: string;
        table?: string;
        error?: string;
        ok?: boolean;
      };
      if (r?.error) return `❌ ${t.name}: ${r.error}`;
      const head = r?.summary || t.name;
      const table = r?.table ? `\n\`\`\`\n${r.table}\n\`\`\`` : "";
      return `✅ ${head}${table}`;
    })
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const secret = adminSecretFromRequest(
      req.headers,
      req.nextUrl.searchParams
    );
    if (!isAdminSecretValid(secret)) return unauthorized();

    const geminiKey =
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      "";
    if (!geminiKey) {
      return NextResponse.json(
        { ok: false, error: "Chưa cấu hình GEMINI_API_KEY" },
        { status: 503 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || body.text || "")
      .trim()
      .slice(0, 4000);
    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Thiếu nội dung lệnh" },
        { status: 400 }
      );
    }

    const history = Array.isArray(body.history)
      ? (body.history as Array<{ role: string; content: string }>)
      : [];

    const contents: Array<{ role: string; parts: GeminiPart[] }> = [];
    for (const h of history.slice(-10)) {
      const role =
        h.role === "assistant" || h.role === "model" ? "model" : "user";
      const text = String(h.content || "").slice(0, 2000);
      if (!text) continue;
      contents.push({ role, parts: [{ text }] });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const models = Array.from(
      new Set(
        [
          process.env.GEMINI_MODEL || "gemini-3.8-flash",
          "gemini-3.8-flash",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-flash-latest",
        ].filter(Boolean)
      )
    );

    let data: Awaited<ReturnType<typeof callGemini>>["data"] = {};
    let modelUsed = models[0] || "gemini-3.8-flash";
    let lastErr = "";
    for (const m of models) {
      const { res, data: d } = await callGemini(geminiKey, m, contents, true);
      data = d;
      modelUsed = m;
      if (res.ok && d.candidates?.length) break;
      lastErr = String(d?.error?.message || `HTTP ${res.status}`);
      if (/no longer available|not found|not supported|deprecated/i.test(lastErr)) {
        continue;
      }
      break;
    }

    if (data?.error?.message && !data.candidates?.length) {
      return NextResponse.json(
        { ok: false, error: data.error.message || lastErr },
        { status: 502 }
      );
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const functionCalls = parts.filter((p) => p.functionCall?.name);
    const toolResults: Array<{ name: string; result: unknown }> = [];

    if (functionCalls.length) {
      const modelContent = {
        role: "model",
        parts: functionCalls.map((p) => ({
          functionCall: {
            name: p.functionCall!.name!,
            args: p.functionCall!.args || {},
          },
        })),
      };
      const responseParts: GeminiPart[] = [];
      for (const fc of functionCalls) {
        const name = fc.functionCall!.name!;
        const args = (fc.functionCall!.args || {}) as Record<string, unknown>;
        let result: unknown;
        try {
          result = await runTool(name, args);
        } catch (e) {
          result = {
            ok: false,
            error: e instanceof Error ? e.message : "Tool error",
          };
        }
        toolResults.push({ name, result });
        responseParts.push({
          functionResponse: {
            name,
            response: { result } as Record<string, unknown>,
          },
        });
      }

      const contents2 = [
        ...contents,
        modelContent,
        { role: "user", parts: responseParts },
      ];

      let finalText = "";
      for (const m of models) {
        const { res, data: d } = await callGemini(
          geminiKey,
          m,
          contents2,
          false
        );
        if (!res.ok) continue;
        finalText =
          d.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("")
            .trim() || "";
        if (finalText) break;
      }

      if (!finalText) finalText = fallbackReplyFromTools(toolResults);

      return NextResponse.json({
        ok: true,
        reply: finalText,
        tools: toolResults,
        model: modelUsed,
      });
    }

    const text =
      parts
        .map((p) => p.text || "")
        .join("")
        .trim() || "Không có phản hồi từ AI.";

    return NextResponse.json({
      ok: true,
      reply: text,
      tools: [],
      model: modelUsed,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi máy chủ";
    console.error("admin ai-copilot", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
