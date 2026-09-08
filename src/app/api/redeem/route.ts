import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";

/**
 * Ghi nhận yêu cầu đổi xu → tiền mặt.
 * Chuyển khoản thật cần cấu hình doanh nghiệp (MoMo Disburse / ngân hàng) + duyệt.
 * Env:
 *   REDEEM_ADMIN_SECRET — secret admin đánh dấu đã chuyển
 *   REDEEM_WEBHOOK_URL — (tuỳ chọn) webhook nội bộ khi có yêu cầu mới
 */

export const runtime = "nodejs";

type Body = {
  coins?: number;
  method?: string;
  accountName?: string;
  accountInfo?: string;
  vndNet?: number;
  requestId?: string;
};

const mem: {
  id: string;
  username: string;
  coins: number;
  method: string;
  accountName: string;
  accountInfo: string;
  vndNet: number;
  status: string;
  createdAt: number;
}[] = [];

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user?.username) {
      return NextResponse.json({ error: "Cần đăng nhập" }, { status: 401 });
    }
    const body = (await req.json()) as Body;
    const coins = Math.floor(Number(body.coins) || 0);
    if (coins < 100) {
      return NextResponse.json({ error: "Tối thiểu 100 xu" }, { status: 400 });
    }
    const method = String(body.method || "").slice(0, 32);
    const accountName = String(body.accountName || "").trim().slice(0, 120);
    const accountInfo = String(body.accountInfo || "").trim().slice(0, 200);
    if (!method || accountName.length < 2 || accountInfo.length < 4) {
      return NextResponse.json({ error: "Thiếu thông tin nhận tiền" }, { status: 400 });
    }
    const vndNet = Math.max(0, Math.floor(Number(body.vndNet) || coins * 100 * 0.98));
    const id = String(body.requestId || `rd_${Date.now()}`);
    const row = {
      id,
      username: user.username,
      coins,
      method,
      accountName,
      accountInfo,
      vndNet,
      status: "pending",
      createdAt: Date.now(),
    };
    mem.unshift(row);
    if (mem.length > 500) mem.length = 500;

    const hook = process.env.REDEEM_WEBHOOK_URL;
    if (hook) {
      try {
        await fetch(hook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "redeem_request", ...row }),
        });
      } catch {
        /* ignore */
      }
    }

    return NextResponse.json({
      ok: true,
      id,
      message:
        "Đã ghi nhận. Tiền sẽ được chuyển vào tài khoản/ví sau khi xử lý (thường trong 24h).",
      vndNet,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Admin: danh sách / đánh dấu đã chuyển tiền */
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-redeem-admin") || "";
  if (!process.env.REDEEM_ADMIN_SECRET || secret !== process.env.REDEEM_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ items: mem.slice(0, 100) });
}

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-redeem-admin") || "";
  if (!process.env.REDEEM_ADMIN_SECRET || secret !== process.env.REDEEM_ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json()) as { id?: string; status?: string };
  const id = String(body.id || "");
  const status = String(body.status || "done");
  const row = mem.find((x) => x.id === id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  row.status = status;
  return NextResponse.json({ ok: true, item: row });
}
