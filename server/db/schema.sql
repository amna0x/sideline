-- Sideline · RDS PostgreSQL schema
-- Run this against your AWS RDS instance to set up all tables.
-- No Supabase-specific features (no RLS, no auth.users, no storage).
-- User IDs are text (Cognito sub UUIDs stored as strings).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE,
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  prediction_title TEXT DEFAULT 'Rookie',
  tier TEXT DEFAULT 'fan',
  points_total INTEGER DEFAULT 0,
  predictions_made INTEGER DEFAULT 0,
  predictions_correct INTEGER DEFAULT 0,
  matches_watched INTEGER DEFAULT 0,
  notifications_enabled BOOLEAN DEFAULT FALSE,
  strava_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  minute INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('upcoming','live','finished')) DEFAULT 'upcoming',
  stadium TEXT,
  matchday INTEGER,
  started_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  type TEXT,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT,
  opens_at TIMESTAMPTZ DEFAULT NOW(),
  closes_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS user_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  prediction_id TEXT REFERENCES predictions(id) ON DELETE CASCADE,
  selected_option TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER,
  speed_ms INTEGER,
  speed_bonus NUMERIC DEFAULT 1,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, prediction_id)
);

CREATE TABLE IF NOT EXISTS vault_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('profile_frame','badge','adidas_card','collectible')),
  tier TEXT CHECK (tier IN ('common','rare','epic','legendary','mythic')),
  total_supply INTEGER DEFAULT 0,
  remaining_supply INTEGER DEFAULT 0,
  image_url TEXT,
  points_cost INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  vault_item_id TEXT REFERENCES vault_items(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed BOOLEAN DEFAULT FALSE,
  code TEXT
);

CREATE TABLE IF NOT EXISTS match_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  type TEXT,
  player_name TEXT,
  minute INTEGER,
  team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  match_id TEXT REFERENCES matches(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT,
  fun_fact TEXT,
  difficulty TEXT
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
  answer TEXT,
  correct BOOLEAN,
  points_earned INTEGER,
  elapsed_seconds NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_predictions_user ON user_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_prediction ON user_predictions(prediction_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points_total DESC);
CREATE INDEX IF NOT EXISTS idx_user_vault_user ON user_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_match_events_match ON match_events(match_id);
