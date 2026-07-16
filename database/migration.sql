-- ============================================
-- Migration: Add new columns to existing tables
-- Run this in Supabase SQL Editor
-- ============================================

-- Add players table (new)
CREATE TABLE IF NOT EXISTS players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS seed INTEGER DEFAULT 0;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS player_6 TEXT NOT NULL DEFAULT '';
CREATE INDEX IF NOT EXISTS idx_teams_seed ON teams(seed);

-- Add new columns to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tournament_start_date TIMESTAMPTZ;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS match_duration_minutes INTEGER DEFAULT 45;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER DEFAULT 15;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jakarta';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS best_of INTEGER DEFAULT 3;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS players_per_team INTEGER DEFAULT 5;

-- Add new columns to matches table
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_a_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team_b_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS round_order INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS match_index INTEGER DEFAULT 0;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS bracket_slot INTEGER;
CREATE INDEX IF NOT EXISTS idx_matches_round_order ON matches(round_order);

-- Add new columns to brackets table
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS round_order INTEGER DEFAULT 0;
ALTER TABLE brackets ADD COLUMN IF NOT EXISTS is_bye BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS idx_brackets_round_order ON brackets(round_order);

-- Players table RLS + grants
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Public can read players" ON players;
  DROP POLICY IF EXISTS "Admin can manage players" ON players;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
CREATE POLICY "Public can read players" ON players FOR SELECT USING (true);
CREATE POLICY "Admin can manage players" ON players FOR ALL USING (auth.role() = 'authenticated');
GRANT SELECT ON players TO anon;
GRANT ALL ON players TO authenticated;

-- Players indexes
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);

-- Players trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Enable Realtime for players
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE players; EXCEPTION WHEN OTHERS THEN NULL; END $$;
