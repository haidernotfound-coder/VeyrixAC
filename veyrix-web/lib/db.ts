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
      mc_version TEXT NOT NULL DEFAULT '1.21.11',
      filename TEXT NOT NULL,
      file_bytes TEXT NOT NULL, -- base64-encoded jar contents
      file_size_bytes BIGINT NOT NULL,
      notes TEXT,
      is_latest BOOLEAN NOT NULL DEFAULT false,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      download_count INT NOT NULL DEFAULT 0
    )
  `;
}
