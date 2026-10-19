import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensurePaymentTables } from "@/lib/paymentDb";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await ensurePaymentTables();
    const orderId = req.nextUrl.searchParams.get("id") || "";
    const user = await getSessionUser();
    const username = user?.username?.toLowerCase() || "";

    if (orderId) {
      const rows = (await sql`
        SELECT id::text, username, tier_code, product_label, amount_vnd, bank_name, bank_account,
               buyer_name, buyer_phone, transfer_content, status, key_code, duration_label, key_expires_at::text,
               created_at::text, approved_at::text
        FROM key_purchase_orders
        WHERE id = ${orderId}::uuid
        LIMIT 1
      `) as Array<Record<string, unknown>>;
      const o = rows[0];
      if (!o) return NextResponse.json({ ok: false, error: "Không tìm thấy đơn" }, { status: 404 });
      // Chỉ chủ đơn (hoặc chưa login nhưng khớp username trống) xem được key
      if (username && String(o.username || "").toLowerCase() !== username) {
        return NextResponse.json({ ok: false, error: "Không có quyền xem đơn này" }, { status: 403 });
      }
      return NextResponse.json({ ok: true, order: mapOrder(o) });
    }

    if (!username) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }
    const list = (await sql`
      SELECT id::text, username, tier_code, product_label, amount_vnd, bank_name, status,
             key_code, duration_label, key_expires_at::text, created_at::text, approved_at::text
      FROM key_purchase_orders
      WHERE lower(username) = ${username}
      ORDER BY created_at DESC
      LIMIT 20
    `) as Array<Record<string, unknown>>;
    return NextResponse.json({ ok: true, orders: list.map(mapOrder) });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensurePaymentTables();
    const user = await getSessionUser();
    const body = await req.json().catch(() => ({}));
    const tierCode = String(body.tierCode || "").trim().toUpperCase();
    const bankId = String(body.bankId || "").trim();
    const buyerName = String(body.buyerName || "").trim().slice(0, 80);
    const buyerPhone = String(body.buyerPhone || "").trim().slice(0, 20);
    const note = String(body.note || "").trim().slice(0, 200);
    const username =
      (user?.username || String(body.username || "")).trim().toLowerCase();

    if (!tierCode || !bankId || !buyerName || !buyerPhone) {
      return NextResponse.json(
        { ok: false, error: "Điền đủ gói, ngân hàng, họ tên và số điện thoại" },
        { status: 400 }
      );
    }
    if (!username) {
      return NextResponse.json(
        { ok: false, error: "Cần đăng nhập hoặc nhập tên tài khoản" },
        { status: 400 }
      );
    }

    const products = (await sql`
      SELECT tier_code, label, amount_vnd, duration_label
      FROM key_products
      WHERE tier_code = ${tierCode} AND is_active = TRUE AND amount_vnd > 0
      LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!products[0]) {
      return NextResponse.json(
        { ok: false, error: "Gói này chưa mở bán hoặc chưa có giá" },
        { status: 400 }
      );
    }

    const banks = (await sql`
      SELECT id::text, name, account_number, account_holder
      FROM payment_banks
      WHERE id = ${bankId}::uuid AND is_active = TRUE
      LIMIT 1
    `) as Array<Record<string, unknown>>;
    if (!banks[0]) {
      return NextResponse.json({ ok: false, error: "Ngân hàng không hợp lệ" }, { status: 400 });
    }

    const amount = Number(products[0].amount_vnd);
    const transferContent = `OPUS ${username} ${tierCode}`.toUpperCase();

    const inserted = (await sql`
      INSERT INTO key_purchase_orders (
        username, user_id, tier_code, product_label, amount_vnd,
        bank_id, bank_name, bank_account,
        buyer_name, buyer_phone, transfer_content, note, status, duration_label
      ) VALUES (
        ${username},
        ${user?.userId != null ? String(user.userId) : null},
        ${tierCode},
        ${String(products[0].label || tierCode)},
        ${amount},
        ${bankId}::uuid,
        ${String(banks[0].name || "")},
        ${String(banks[0].account_number || "")},
        ${buyerName},
        ${buyerPhone},
        ${transferContent},
        ${note},
        'PENDING',
        ${String(products[0].duration_label || "")}
      )
      RETURNING id::text, created_at::text, transfer_content, amount_vnd, product_label, duration_label, status
    `) as Array<Record<string, unknown>>;

    const row = inserted[0];
    return NextResponse.json({
      ok: true,
      order: mapOrder({
        ...row,
        username,
        tier_code: tierCode,
        bank_name: banks[0].name,
        bank_account: banks[0].account_number,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        key_code: null,
        approved_at: null,
      }),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

function mapOrder(o: Record<string, unknown>) {
  return {
    id: String(o.id || ""),
    username: String(o.username || ""),
    tierCode: String(o.tier_code || ""),
    productLabel: String(o.product_label || ""),
    amountVnd: Number(o.amount_vnd || 0),
    bankName: String(o.bank_name || ""),
    bankAccount: String(o.bank_account || ""),
    buyerName: String(o.buyer_name || ""),
    buyerPhone: String(o.buyer_phone || ""),
    transferContent: String(o.transfer_content || ""),
    status: String(o.status || "PENDING"),
    keyCode: o.key_code ? String(o.key_code) : null,
    durationLabel: String(o.duration_label || ""),
    keyExpiresAt: o.key_expires_at ? String(o.key_expires_at) : null,
    isLifetime: !o.key_expires_at && !!o.key_code,
    createdAt: o.created_at ? String(o.created_at) : null,
    approvedAt: o.approved_at ? String(o.approved_at) : null,
  };
}
