-- ============================================================
-- RHW Research DB — Azure Postgres schema
-- Run once against the target database to initialize tables.
--
-- Prerequisites (IT):
--   1. Azure Database for PostgreSQL Flexible Server provisioned
--   2. Database created (e.g. "rhw_research")
--   3. App user created with SELECT, INSERT, UPDATE privileges
--      on the two tables below
--
-- Run with psql:
--   psql "host=<server>.postgres.database.azure.com dbname=rhw_research \
--         user=<admin> password=<pw> sslmode=require" \
--        -f setup-db.sql
-- ============================================================

-- ── Rate limits ──────────────────────────────────────────────
-- One row per (user_id, date). count is incremented atomically
-- via INSERT ... ON CONFLICT DO UPDATE so concurrent requests
-- never double-count.

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id  TEXT    NOT NULL,
  date     TEXT    NOT NULL,   -- YYYY-MM-DD in UTC
  count    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);

-- ── AI Research audit log ────────────────────────────────────
-- Append-only. One row per query that was actually sent to Claude.
-- Rows are deleted only if the Claude API call fails (rollback).

CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL       PRIMARY KEY,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  user_id      TEXT         NOT NULL,
  email        TEXT         NOT NULL,
  question     TEXT         NOT NULL,
  model        TEXT         NOT NULL,
  query_number INTEGER      NOT NULL
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx   ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at DESC);

-- ── Verify ───────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('rate_limits', 'audit_log')
ORDER BY table_name;
