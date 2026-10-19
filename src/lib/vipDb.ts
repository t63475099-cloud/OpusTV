import { sql } from "@/lib/neonSql";

let ready = false;
let inflight: Promise<void> | null = null;

/**
 * Idempotent schema ensure — runs at most once per serverless isolate.
 * Avoids flooding Neon with dozens of ALTER on every admin click.
 */
export async function ensureVipTables() {
  if (ready) return;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
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
          expires_at TIMESTAMPTZ,
          is_lifetime BOOLEAN NOT NULL DEFAULT FALSE,
          note TEXT
        )
      `;
      await sql`ALTER TABLE license_keys_v2 ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;
      await sql`ALTER TABLE license_keys_v2 ADD COLUMN IF NOT EXISTS is_lifetime BOOLEAN NOT NULL DEFAULT FALSE`;

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

      // Single round of safe column adds (legacy tables)
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS coins_reward INT DEFAULT 0`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS vip_hours INT DEFAULT 0`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS vip_tier_key VARCHAR(32)`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS max_claims INT DEFAULT 1`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS current_claims INT DEFAULT 0`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS type VARCHAR(32) DEFAULT 'GLOBAL_SHARED'`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS rewards JSONB DEFAULT '[]'::jsonb`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS created_by VARCHAR(64) DEFAULT 'admin'`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ`;
      await sql`ALTER TABLE system_giftcodes ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`;

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
      await sql`ALTER TABLE giftcode_redemptions ADD COLUMN IF NOT EXISTS code VARCHAR(64) DEFAULT ''`;
      try {
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS giftcode_redemptions_code_user_uidx ON giftcode_redemptions (code, user_id)`;
      } catch {
        /* index may already exist with different def */
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
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
