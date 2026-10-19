import { NextResponse } from "next/server";
import { sql } from "@/lib/neonSql";
import { ensurePaymentTables } from "@/lib/paymentDb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensurePaymentTables();
    const banks = (await sql`
      SELECT id::text, name, account_number, account_holder, branch, transfer_hint
      FROM payment_banks
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, name ASC
    `) as Array<Record<string, unknown>>;

    const products = (await sql`
      SELECT tier_code, label, amount_vnd, duration_label
      FROM key_products
      WHERE is_active = TRUE AND amount_vnd > 0
      ORDER BY amount_vnd ASC
    `) as Array<Record<string, unknown>>;

    return NextResponse.json({
      ok: true,
      banks: banks.map((b) => ({
        id: String(b.id),
        name: String(b.name || ""),
        accountNumber: String(b.account_number || ""),
        accountHolder: String(b.account_holder || ""),
        branch: String(b.branch || ""),
        transferHint: String(b.transfer_hint || ""),
      })),
      products: products.map((p) => ({
        tierCode: String(p.tier_code),
        label: String(p.label || ""),
        amountVnd: Number(p.amount_vnd || 0),
        durationLabel: String(p.duration_label || ""),
      })),
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Lỗi";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
