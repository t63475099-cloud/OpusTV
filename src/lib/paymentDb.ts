import { sql } from "@/lib/neonSql";

let ensured = false;

export async function ensurePaymentTables() {
  if (ensured) return;
  await sql`
    CREATE TABLE IF NOT EXISTS payment_banks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      account_holder TEXT NOT NULL DEFAULT '',
      branch TEXT NOT NULL DEFAULT '',
      transfer_hint TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS key_products (
      tier_code VARCHAR(16) PRIMARY KEY,
      label TEXT NOT NULL,
      amount_vnd INT NOT NULL,
      duration_label TEXT NOT NULL DEFAULT '',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS key_purchase_orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username TEXT NOT NULL DEFAULT '',
      user_id TEXT,
      tier_code VARCHAR(16) NOT NULL,
      product_label TEXT NOT NULL DEFAULT '',
      amount_vnd INT NOT NULL,
      bank_id UUID,
      bank_name TEXT NOT NULL DEFAULT '',
      bank_account TEXT NOT NULL DEFAULT '',
      buyer_name TEXT NOT NULL DEFAULT '',
      buyer_phone TEXT NOT NULL DEFAULT '',
      transfer_content TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      status VARCHAR(24) NOT NULL DEFAULT 'PENDING',
      key_code TEXT,
      duration_label TEXT NOT NULL DEFAULT '',
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      approved_at TIMESTAMPTZ,
      approved_by TEXT,
      key_expires_at TIMESTAMPTZ
    )
  `;
  await sql`ALTER TABLE key_purchase_orders ADD COLUMN IF NOT EXISTS key_expires_at TIMESTAMPTZ`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kpo_status ON key_purchase_orders (status, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_kpo_user ON key_purchase_orders (username, created_at DESC)`;
  ensured = true;
}
