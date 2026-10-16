import { sql } from "@/lib/neonSql";

let ready = false;

export async function ensureVipTables() {
  if (ready) return;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_lifetime_vip BOOLEAN DEFAULT FALSE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0`;

  await sql`
    CREATE TABLE IF NOT EXISTS license_keys_v2 (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key_code TEXT NOT NULL UNIQUE,
      tier_code VARCHAR(16) NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'AVAILABLE',
      claimed_by_user_id VARCHAR(64),
      claimed_username VARCHAR(64),
      claimed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      note TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_license_keys_v2_status ON license_keys_v2 (status)`;

  await sql`
    CREATE TABLE IF NOT EXISTS giftcodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      coins INT NOT NULL DEFAULT 0,
      vip_tier VARCHAR(16),
      max_uses INT,
      used_count INT NOT NULL DEFAULT 0,
      starts_at TIMESTAMPTZ,
      ends_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS giftcode_redemptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      giftcode_id UUID NOT NULL,
      user_id VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (giftcode_id, user_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_quests (
      user_id VARCHAR(64) NOT NULL,
      quest_id VARCHAR(64) NOT NULL,
      progress INT NOT NULL DEFAULT 0,
      claimed BOOLEAN NOT NULL DEFAULT FALSE,
      day_key VARCHAR(16) NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, quest_id, day_key)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS coin_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(64) NOT NULL,
      amount INT NOT NULL,
      reason VARCHAR(64) NOT NULL,
      meta JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  ready = true;
}
