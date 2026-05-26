-- Persistent squads
CREATE TABLE IF NOT EXISTS squads (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  match_id TEXT NOT NULL,
  invite_code TEXT UNIQUE,
  visibility TEXT CHECK (visibility IN ('public','private')) DEFAULT 'public',
  created_by TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS squad_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id TEXT REFERENCES squads(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin','moderator','member')) DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (squad_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_squads_match ON squads(match_id);
CREATE INDEX IF NOT EXISTS idx_squads_invite ON squads(invite_code);
CREATE INDEX IF NOT EXISTS idx_squad_members_squad ON squad_members(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_members_user ON squad_members(user_id);
