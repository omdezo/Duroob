-- 001_initial_schema.sql
-- Source of truth for the live Duroob database schema. Applied to Neon.
-- This file documents the existing schema as of 2026-05-01.
--
-- All future schema changes must be added as new numbered files
-- (e.g. 002_*.sql) and applied in order.

-- ─── USERS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT NOT NULL UNIQUE,
  name            TEXT,
  password        TEXT NOT NULL,
  role            TEXT DEFAULT 'user',
  locale_pref     TEXT DEFAULT 'en',
  email_verified  BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── DESTINATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS destinations (
  id                  TEXT PRIMARY KEY,
  name_en             TEXT NOT NULL,
  name_ar             TEXT NOT NULL,
  lat                 DOUBLE PRECISION,
  lng                 DOUBLE PRECISION,
  region_en           TEXT,
  region_ar           TEXT,
  categories          TEXT[],
  company_en          TEXT,
  company_ar          TEXT,
  avg_visit_min       INTEGER DEFAULT 60,
  ticket_cost         NUMERIC DEFAULT 0,
  crowd_level         INTEGER DEFAULT 3,
  recommended_months  INTEGER[],
  is_active           BOOLEAN DEFAULT TRUE,
  image_url           TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS destinations_region_active_idx
  ON destinations(region_en) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS destinations_categories_gin_idx
  ON destinations USING GIN(categories);

-- ─── SAVED TRIPS ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_trips (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  title        TEXT,
  inputs_json  JSONB NOT NULL DEFAULT '{}',
  plan_json    JSONB NOT NULL DEFAULT '{}',
  scores_json  JSONB DEFAULT '{}',
  is_public    BOOLEAN DEFAULT FALSE,
  share_count  INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS saved_trips_user_created_idx
  ON saved_trips(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS saved_trips_is_public_idx
  ON saved_trips(is_public) WHERE is_public = TRUE;

-- ─── SAVED INTERESTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_interests (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  destination_id  TEXT REFERENCES destinations(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, destination_id)
);

CREATE INDEX IF NOT EXISTS saved_interests_user_idx
  ON saved_interests(user_id);

-- ─── CHAT SESSIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id             TEXT PRIMARY KEY,
  user_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email     TEXT,
  user_name      TEXT,
  message_count  INTEGER DEFAULT 0,
  has_plan       BOOLEAN DEFAULT FALSE,
  last_message   TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_sessions_user_idx
  ON chat_sessions(user_id, updated_at DESC);

-- ─── CHAT MESSAGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id          SERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  plan_json   JSONB,
  tool_calls  JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_created_idx
  ON chat_messages(session_id, created_at);

-- ─── TRIP ANALYTICS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trip_analytics (
  id                SERIAL PRIMARY KEY,
  duration          INTEGER,
  tier              TEXT,
  regions           TEXT[],
  total_cost        NUMERIC,
  safety_score      NUMERIC,
  enjoyment_score   NUMERIC,
  overall           TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_analytics_created_idx
  ON trip_analytics(created_at DESC);

-- ─── AUDIT LOG ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id           SERIAL PRIMARY KEY,
  admin_email  TEXT,
  action       TEXT NOT NULL,
  target_type  TEXT,
  target_id    TEXT,
  details      TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_log_created_idx
  ON audit_log(created_at DESC);
