-- Enhanced squad messages with avatar, reply, and seen tracking
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS reply_to_id TEXT;
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS reply_to_text TEXT;
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS reply_to_username TEXT;
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS msg_type TEXT DEFAULT 'text';
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS sticker_id TEXT;
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE squad_messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Seen receipts
CREATE TABLE IF NOT EXISTS message_seen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id TEXT NOT NULL,
  squad_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  seen_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_seen_msg ON message_seen(message_id);

-- Cosmetics system
CREATE TABLE IF NOT EXISTS cosmetics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('avatar_decoration','profile_effect','avatar_gif_unlock','sticker_pack')) NOT NULL,
  description TEXT,
  preview_url TEXT,
  xp_cost INTEGER NOT NULL DEFAULT 0,
  tier TEXT CHECK (tier IN ('common','rare','epic','legendary')) DEFAULT 'common'
);

CREATE TABLE IF NOT EXISTS user_cosmetics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  cosmetic_id TEXT REFERENCES cosmetics(id) ON DELETE CASCADE,
  equipped BOOLEAN DEFAULT FALSE,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, cosmetic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_cosmetics_user ON user_cosmetics(user_id);

-- Seed cosmetics
INSERT INTO cosmetics (id, name, type, description, xp_cost, tier) VALUES
  ('gif_unlock', 'Animated Avatar', 'avatar_gif_unlock', 'Upload GIF avatars', 5000, 'epic'),
  ('deco_fire', 'Fire Ring', 'avatar_decoration', 'Blazing ring around your avatar', 3000, 'rare'),
  ('deco_lightning', 'Lightning Bolt', 'avatar_decoration', 'Electric sparks around your avatar', 3000, 'rare'),
  ('deco_crown', 'Golden Crown', 'avatar_decoration', 'A royal crown above your avatar', 5000, 'epic'),
  ('deco_stars', 'Starfield', 'avatar_decoration', 'Twinkling stars around your avatar', 2000, 'common'),
  ('deco_neon', 'Neon Glow', 'avatar_decoration', 'Pulsing neon outline', 4000, 'rare'),
  ('effect_confetti', 'Confetti Burst', 'profile_effect', 'Confetti rains on your profile', 4000, 'rare'),
  ('effect_sparkle', 'Sparkle Trail', 'profile_effect', 'Sparkles follow interactions', 3000, 'rare'),
  ('effect_flames', 'Flame Aura', 'profile_effect', 'Flames rise from the bottom of your profile', 6000, 'epic'),
  ('sticker_bundesliga', 'Bundesliga Pack', 'sticker_pack', '12 Bundesliga-themed stickers', 2000, 'common'),
  ('sticker_reactions', 'Reactions Pack', 'sticker_pack', '10 animated reaction stickers', 1500, 'common')
ON CONFLICT (id) DO NOTHING;
