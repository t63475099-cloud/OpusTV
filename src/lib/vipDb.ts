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
    CREATE TABLE IF NOT EXISTS system_giftcodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(64) UNIQUE NOT NULL,
      type VARCHAR(32) NOT NULL DEFAULT 'GLOBAL_SHARED',
      rewards JSONB NOT NULL DEFAULT '[]'::jsonb,
      coins_reward INT NOT NULL DEFAULT 0,
      vip_hours INT NOT NULL DEFAULT 0,
      vip_tier_key VARCHAR(32),
      max_claims INT NOT NULL DEFAULT 1,
      current_claims INT NOT NULL DEFAULT 0,
      per_user_limit INT NOT NULL DEFAULT 1,
      starts_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(64) NOT NULL DEFAULT 'admin',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS type VARCHAR(32)`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS rewards JSONB`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS coins_reward INT`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS vip_hours INT`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS vip_tier_key VARCHAR(32)`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS max_claims INT`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS current_claims INT`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS per_user_limit INT`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS is_active BOOLEAN`;
  await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS created_by VARCHAR(64)`;

  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN type SET DEFAULT 'GLOBAL_SHARED'`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN rewards SET DEFAULT '[]'::jsonb`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN created_by SET DEFAULT 'admin'`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN coins_reward SET DEFAULT 0`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN vip_hours SET DEFAULT 0`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN max_claims SET DEFAULT 1`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN current_claims SET DEFAULT 0`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN is_active SET DEFAULT TRUE`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN starts_at DROP NOT NULL`;
  } catch {
    /* */
  }
  try {
    await sql`ALTER TABLE system_giftcodes ALTER COLUMN expires_at DROP NOT NULL`;
  } catch {
    /* */
  }
  // Backfill nulls that would break NOT NULL constraints on insert paths
  try {
    await sql`UPDATE system_giftcodes SET type = 'GLOBAL_SHARED' WHERE type IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET rewards = '[]'::jsonb WHERE rewards IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET created_by = 'admin' WHERE created_by IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET coins_reward = 0 WHERE coins_reward IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET vip_hours = 0 WHERE vip_hours IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET max_claims = 1 WHERE max_claims IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET current_claims = 0 WHERE current_claims IS NULL`;
  } catch {
    /* */
  }
  try {
    await sql`UPDATE system_giftcodes SET is_active = TRUE WHERE is_active IS NULL`;
  } catch {
    /* */
  }

  await sql`
    CREATE TABLE IF NOT EXISTS giftcode_redemptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      giftcode_id UUID,
      code VARCHAR(64) NOT NULL DEFAULT '',
      user_id VARCHAR(64) NOT NULL,
      redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE giftcode_redemptions ADD COLUMN IF NOT EXISTS code VARCHAR(64)`;
  await sql`ALTER TABLE giftcode_redemptions ADD COLUMN IF NOT EXISTS giftcode_id UUID`;
  await sql`ALTER TABLE giftcode_redemptions ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ`;
  try {
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS giftcode_redemptions_code_user_uidx ON giftcode_redemptions (code, user_id)`;
  } catch {
    /* */
  }

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
    CREATE TABLE IF NOT EXISTS user_quest_claims (
      user_id VARCHAR(64) NOT NULL,
      quest_id VARCHAR(64) NOT NULL,
      claim_count INT NOT NULL DEFAULT 0,
      last_claimed_date VARCHAR(16),
      last_cycle_key VARCHAR(32),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, quest_id)
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
