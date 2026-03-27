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

-- ── File server document index ───────────────────────────────
-- Populated by the rhw-knowledge-search crawler (runs on the Azure VM).
-- Both apps share this database so search results are always in sync.
-- Run: npm run crawl:full   in the rhw-knowledge-search project to index P:\Data.
--
-- IT note: pgvector must be enabled on the Azure Postgres instance.
-- Azure Database for PostgreSQL Flexible Server includes it by default.

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS files (
  id            SERIAL PRIMARY KEY,
  file_path     TEXT        UNIQUE NOT NULL,
  file_name     TEXT        NOT NULL,
  file_type     TEXT        NOT NULL,
  file_size     BIGINT,
  modified_at   TIMESTAMPTZ,
  indexed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash  TEXT,
  text_preview  TEXT,                       -- First ~500 chars of extracted text
  folder_path   TEXT        NOT NULL,
  embedding     vector(1536)                -- OpenAI text-embedding-3-small
);

-- ivfflat index for fast approximate cosine search.
-- Note: ivfflat needs at least ~1000 rows to be useful.
-- For < 1000 rows an exact scan is used automatically.
CREATE INDEX IF NOT EXISTS files_embedding_idx
  ON files USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS files_modified_at_idx ON files (modified_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS files_file_type_idx   ON files (file_type);
CREATE INDEX IF NOT EXISTS files_folder_path_idx ON files (folder_path text_pattern_ops);

-- ── Verify ───────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('rate_limits', 'audit_log', 'files')
ORDER BY table_name;
