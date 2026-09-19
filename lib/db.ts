import { neon } from "@neondatabase/serverless";

// DATABASE_URL is provided automatically when you attach a Neon/Postgres
// database to this project on Vercel (Storage tab -> Create Database).
export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Attach a Postgres/Neon database to this Vercel project."
    );
  }
  return neon(url);
}

export async function ensureSchema() {
  const db = sql();
  await db`
    CREATE TABLE IF NOT EXISTS license_keys (
      id BIGSERIAL PRIMARY KEY,
      key_id BIGINT UNIQUE NOT NULL,
      key_string TEXT UNIQUE NOT NULL,
      label TEXT,
      expiry_epoch_seconds BIGINT NOT NULL, -- -1 = permanent
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      revoked BOOLEAN NOT NULL DEFAULT false,
      revoked_at TIMESTAMPTZ
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS installations (
      id BIGSERIAL PRIMARY KEY,
      key_id BIGINT NOT NULL REFERENCES license_keys(key_id) ON DELETE CASCADE,
      server_ip TEXT,
      server_name TEXT,
      plugin_version TEXT,
      first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
      last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
      player_count INT,
      UNIQUE(key_id, server_ip)
    )
  `;
  await db`
    CREATE TABLE IF NOT EXISTS plugin_versions (
      id BIGSERIAL PRIMARY KEY,
      version_label TEXT NOT NULL,
      mc_version TEXT NOT NULL DEFAULT '1.21.1-1.21.11',
      filename TEXT NOT NULL,
      file_bytes TEXT NOT NULL, -- base64-encoded jar contents
      file_size_bytes BIGINT NOT NULL,
      sha256 TEXT, -- hex digest of the raw jar bytes, computed server-side on upload
      notes TEXT,
      is_latest BOOLEAN NOT NULL DEFAULT false,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      download_count INT NOT NULL DEFAULT 0
    )
  `;
  // Migration: sha256 was added after plugin_versions already existed on
  // some deployments - CREATE TABLE IF NOT EXISTS above won't add it to a
  // table that's already there, so patch it in explicitly. The auto-update
  // feature (see /api/heartbeat) refuses to hand out a version with no
  // checksum, so this must succeed before that feature works on an
  // existing database.
  await db`ALTER TABLE plugin_versions ADD COLUMN IF NOT EXISTS sha256 TEXT`;
  await db`
    CREATE TABLE IF NOT EXISTS download_pins (
      id BIGSERIAL PRIMARY KEY,
      pin TEXT NOT NULL, -- 6-digit numeric string, zero-padded
      label TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      used_version_id BIGINT REFERENCES plugin_versions(id) ON DELETE SET NULL,
      revoked BOOLEAN NOT NULL DEFAULT false
    )
  `;
  await db`
    CREATE INDEX IF NOT EXISTS idx_download_pins_pin_active
    ON download_pins (pin)
    WHERE used_at IS NULL AND revoked = false
  `;

  // Migration: download_pins.used_version_id was originally created with
  // no ON DELETE clause (defaults to NO ACTION in Postgres), which made
  // deleting a plugin_versions row fail with a foreign key violation the
  // instant any PIN had ever been redeemed against it. CREATE TABLE IF
  // NOT EXISTS above doesn't retroactively fix that on a database that
  // already has the table, so patch it here on every call - cheap no-op
  // once the constraint is already correct.
  await db`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'download_pins_used_version_id_fkey'
          AND confdeltype != 'n' -- 'n' = SET NULL; anything else needs fixing
      ) THEN
        ALTER TABLE download_pins DROP CONSTRAINT download_pins_used_version_id_fkey;
        ALTER TABLE download_pins
          ADD CONSTRAINT download_pins_used_version_id_fkey
          FOREIGN KEY (used_version_id) REFERENCES plugin_versions(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `;
}
