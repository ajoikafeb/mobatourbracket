-- ============================================
-- Neosoul Tournament Tracker — Database Schema
-- ============================================
-- Run this SQL in your Supabase SQL Editor.
-- Safe to run multiple times (idempotent).

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_name TEXT NOT NULL,
  logo TEXT,
  captain TEXT NOT NULL DEFAULT '',
  player_1 TEXT NOT NULL DEFAULT '',
  player_2 TEXT NOT NULL DEFAULT '',
  player_3 TEXT NOT NULL DEFAULT '',
  player_4 TEXT NOT NULL DEFAULT '',
  player_5 TEXT NOT NULL DEFAULT '',
  player_6 TEXT NOT NULL DEFAULT '',
  substitute TEXT,
  seed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_name TEXT NOT NULL DEFAULT 'Neosoul Tournament',
  tournament_subtitle TEXT NOT NULL DEFAULT 'Indonesian Community Tournament',
  tournament_logo TEXT,
  tournament_banner TEXT,
  tournament_status TEXT NOT NULL DEFAULT 'upcoming' CHECK (tournament_status IN ('upcoming', 'ongoing', 'completed')),
  tournament_start_date TIMESTAMPTZ,
  match_duration_minutes INTEGER DEFAULT 45,
  break_duration_minutes INTEGER DEFAULT 15,
  timezone TEXT DEFAULT 'Asia/Jakarta',
  best_of INTEGER DEFAULT 3 CHECK (best_of IN (1, 3, 5)),
  players_per_team INTEGER DEFAULT 5,
  footer_text TEXT DEFAULT 'Built for the community, by the community.',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_a TEXT NOT NULL DEFAULT '',
  team_a_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  team_b TEXT NOT NULL DEFAULT '',
  team_b_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  score_a INTEGER NOT NULL DEFAULT 0,
  score_b INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'live', 'finished')),
  round TEXT NOT NULL DEFAULT 'Quarter Final',
  round_order INTEGER DEFAULT 0,
  match_index INTEGER DEFAULT 0,
  match_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  best_of INTEGER NOT NULL DEFAULT 3 CHECK (best_of IN (1, 3, 5)),
  winner TEXT,
  winner_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  bracket_slot INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brackets table
CREATE TABLE IF NOT EXISTS brackets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  round TEXT NOT NULL,
  round_order INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  team_name TEXT NOT NULL DEFAULT '',
  team_seed INTEGER NOT NULL DEFAULT 0,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  opponent_id UUID,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  is_bye BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round, position)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_round_order ON matches(round_order);
CREATE INDEX IF NOT EXISTS idx_brackets_round ON brackets(round);
CREATE INDEX IF NOT EXISTS idx_brackets_round_order ON brackets(round_order);
CREATE INDEX IF NOT EXISTS idx_brackets_position ON brackets(position);
CREATE INDEX IF NOT EXISTS idx_brackets_team_id ON brackets(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_seed ON teams(seed);

-- RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE brackets ENABLE ROW LEVEL SECURITY;

-- Grants (required for Supabase anon/authenticated roles)
GRANT SELECT ON players TO anon;
GRANT SELECT ON teams TO anon;
GRANT SELECT ON settings TO anon;
GRANT SELECT ON matches TO anon;
GRANT SELECT ON brackets TO anon;

GRANT ALL ON players TO authenticated;
GRANT ALL ON teams TO authenticated;
GRANT ALL ON settings TO authenticated;
GRANT ALL ON matches TO authenticated;
GRANT ALL ON brackets TO authenticated;

-- Public read policies (drop first if they exist)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can read players" ON players;
  DROP POLICY IF EXISTS "Public can read teams" ON teams;
  DROP POLICY IF EXISTS "Public can read settings" ON settings;
  DROP POLICY IF EXISTS "Public can read matches" ON matches;
  DROP POLICY IF EXISTS "Public can read brackets" ON brackets;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Public can read players" ON players FOR SELECT USING (true);
CREATE POLICY "Public can read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public can read settings" ON settings FOR SELECT USING (true);
CREATE POLICY "Public can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public can read brackets" ON brackets FOR SELECT USING (true);

-- Admin full-access policies (drop first if they exist)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admin can manage players" ON players;
  DROP POLICY IF EXISTS "Admin can manage teams" ON teams;
  DROP POLICY IF EXISTS "Admin can manage settings" ON settings;
  DROP POLICY IF EXISTS "Admin can manage matches" ON matches;
  DROP POLICY IF EXISTS "Admin can manage brackets" ON brackets;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Admin can manage players" ON players FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage teams" ON teams FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage settings" ON settings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage matches" ON matches FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Admin can manage brackets" ON brackets FOR ALL USING (auth.role() = 'authenticated');

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
DROP TRIGGER IF EXISTS update_brackets_updated_at ON brackets;

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_brackets_updated_at BEFORE UPDATE ON brackets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Realtime
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE players; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE teams; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE settings; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE matches; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE brackets; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Insert default settings (only if empty)
INSERT INTO settings (tournament_name, tournament_subtitle, tournament_status, footer_text)
SELECT 'Neosoul Tournament', 'Indonesian Community Tournament', 'upcoming', 'Built for the community, by the community.'
WHERE NOT EXISTS (SELECT 1 FROM settings LIMIT 1);
