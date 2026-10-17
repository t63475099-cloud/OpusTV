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
- Chỉ hỗ trợ admin đã xác thực. Trả lời tiếng Việt, ngắn gọn, chính xác.
- Khi admin yêu cầu tạo tài khoản hàng loạt, phát thưởng toàn server, hoặc xem thống kê — HÃY gọi tool tương ứng, không bịa số liệu.
- Không tiết lộ ADMIN_SECRET, DATABASE_URL, GEMINI_API_KEY hay dữ liệu nhạy cảm.
- Không xóa toàn bộ user trừ khi admin yêu cầu rõ và bạn từ chối (tool delete không có).
- Sau khi tool chạy, tóm tắt kết quả rõ ràng cho admin.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: "bulk_create_accounts",
        description:
          "Tạo N tài khoản hàng loạt với prefix, mật khẩu chung. Chống trùng username.",
        parameters: {
          type: "object",
          properties: {
            count: {
              type: "integer",
              description: "Số tài khoản (1–100)",
            },
            prefix: {
              type: "string",
              description: "Tiền tố username, ví dụ user_ hoặc test_",
            },
            password: {
              type: "string",
              description: "Mật khẩu chung (tuỳ chọn)",
            },
          },
          required: ["count"],
        },
      },
      {
        name: "create_broadcast_reward",
        description:
          "Phát thưởng toàn server (coins / VIP giờ / VIP vĩnh viễn) kèm thông điệp popup.",
        parameters: {
          type: "object",
          properties: {
            reward_type: {
              type: "string",
              description: "coins | vip_hours | vip_lifetime",
            },
            reward_value: {
              type: "integer",
              description: "Số xu hoặc số giờ VIP (lifetime dùng 1)",
            },
            message: {
              type: "string",
              description: "Thông điệp hiển thị cho user",
            },
          },
          required: ["reward_type", "reward_value", "message"],
        },
      },
      {
        name: "get_system_stats",
        description: "Lấy thống kê số user, key, v.v. trên hệ thống.",
        parameters: {
          type: "object",
          properties: {},
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
      const username = `${prefix}${seq}${Math.floor(Math.random() * 90 + 10)}`.slice(
        0,
        32
      );
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
        ${created.length},
        ${count},
        ${prefix},
        ${"ai-copilot"},
        ${JSON.stringify(created.map((c) => c.username))}::jsonb,
        ${JSON.stringify(created)}::jsonb
      )
    `;
  } catch {
    /* */
  }
  return {
    ok: true,
    created: created.length,
    requested: count,
    prefix,
    defaultPassword: defaultPass,
    accounts: created.slice(0, 30),
    note:
      created.length > 30
        ? `Chỉ liệt kê 30/${created.length} tài khoản đầu`
        : undefined,
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
    return { ok: false, error: "reward_type phải là coins | vip_hours | vip_lifetime" };
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
    RETURNING id, reward_type, reward_value, message_template, is_active, created_at
  `;
  return { ok: true, reward: rows[0] };
}

async function toolStats() {
  const sql = db();
  let users = 0;
  let keys = 0;
  let activeBroadcast = 0;
  try {
    const u = await sql`SELECT COUNT(*)::int AS c FROM users`;
    users = Number((u[0] as { c: number })?.c || 0);
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
  return { ok: true, users, keys, activeBroadcast };
}

async function runTool(
  name: string,
  args: Record<string, unknown>
): Promise<unknown> {
  if (name === "bulk_create_accounts") {
    return toolBulkCreate(args as { count?: number; prefix?: string; password?: string });
  }
  if (name === "create_broadcast_reward") {
    return toolBroadcast(
      args as {
        reward_type?: string;
        reward_value?: number;
        message?: string;
      }
    );
  }
  if (name === "get_system_stats") {
    return toolStats();
  }
  return { ok: false, error: `Tool không hỗ trợ: ${name}` };
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
    generationConfig: { temperature: 0.35, maxOutputTokens: 2048 },
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

export async function POST(req: NextRequest) {
  try {
    const secret = adminSecretFromRequest(req.headers, req.nextUrl.searchParams);
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
      const role = h.role === "assistant" || h.role === "model" ? "model" : "user";
      const text = String(h.content || "").slice(0, 2000);
      if (!text) continue;
      contents.push({ role, parts: [{ text }] });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    // Ưu tiên gemini-3.8-flash (model mới); fallback 2.5 / 2.0 — bỏ 1.5
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
      // Thử model tiếp theo khi model không tồn tại / không hỗ trợ
      if (/no longer available|not found|not supported|deprecated/i.test(lastErr)) {
        continue;
      }
      // Lỗi khác (quota, key…) — dừng
      break;
    }

    if (data?.error?.message && !data.candidates?.length) {
      return NextResponse.json(
        {
          ok: false,
          error: `${data.error.message} (đã thử: ${models.join(", ")})`,
        },
        { status: 502 }
      );
    }
    if (!data.candidates?.length && lastErr) {
      return NextResponse.json(
        {
          ok: false,
          error: `${lastErr} (đã thử: ${models.join(", ")})`,
        },
        { status: 502 }
      );
    }

    const parts = data.candidates?.[0]?.content?.parts || [];
    const functionCalls = parts.filter((p) => p.functionCall?.name);
    const toolResults: Array<{ name: string; result: unknown }> = [];

    if (functionCalls.length) {
      // Execute tools then second turn
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

      if (!finalText) {
        finalText = toolResults
          .map(
            (t) =>
              `[${t.name}] ${typeof t.result === "string" ? t.result : JSON.stringify(t.result, null, 2)}`
          )
          .join("\n\n");
      }

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
