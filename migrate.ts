/**
 * Migration: creates all FinTrack tables.
 * Run with:  npm run db:migrate
 */
import pool from "./db";

const SQL = /* sql */ `
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email            TEXT        NOT NULL UNIQUE,
  name             TEXT        NOT NULL,
  password_hash    TEXT        NOT NULL,
  monthly_salary   NUMERIC(12,2) NOT NULL DEFAULT 0,
  avatar_initials  TEXT        NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ─── Transactions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT        NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category    TEXT        NOT NULL DEFAULT 'Other',
  date        DATE        NOT NULL DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id  ON transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions (category);

-- Compound index for the most common query: user's transactions by date
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date DESC);

-- ─── Refresh Tokens ───────────────────────────────────────────────────────────
-- Stored so we can revoke individual sessions without touching the JWT secret.
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens (user_id);

-- ─── Updated-at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at        ON users;
DROP TRIGGER IF EXISTS transactions_updated_at ON transactions;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
`;

async function migrate() {
  console.log("▶ Running migrations…");
  const client = await pool.connect();
  try {
    await client.query(SQL);
    console.log("✓ Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
