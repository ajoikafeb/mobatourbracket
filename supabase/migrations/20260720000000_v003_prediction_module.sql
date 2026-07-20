-- ============================================
-- Neosoul Tournament v0.0.3 Migration
-- Feature: Prediction Module
-- SAFE: Additive only. No existing data modified.
-- ============================================

-- 1. Add prediction_enabled column to events (default false = feature hidden)
ALTER TABLE events ADD COLUMN IF NOT EXISTS prediction_enabled BOOLEAN DEFAULT false;

-- 2. Prediction Settings (per-event configuration)
CREATE TABLE IF NOT EXISTS prediction_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  lock_minutes_before INTEGER DEFAULT 5,
  leaderboard_enabled BOOLEAN DEFAULT true,
  points_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(event_id)
);

-- 3. Prediction Users (Discord username + stats)
CREATE TABLE IF NOT EXISTS prediction_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  discord_username TEXT NOT NULL UNIQUE,
  total_predictions INTEGER DEFAULT 0,
  correct_predictions INTEGER DEFAULT 0,
  wrong_predictions INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Prediction Entries (one prediction per user per match)
CREATE TABLE IF NOT EXISTS prediction_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  discord_username TEXT NOT NULL REFERENCES prediction_users(discord_username) ON DELETE CASCADE,
  selected_team_id UUID NOT NULL,
  is_correct BOOLEAN,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(match_id, discord_username)
);

-- 5. RLS: disabled (same pattern as v0.0.2 event tables)
ALTER TABLE prediction_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_entries DISABLE ROW LEVEL SECURITY;

-- 6. Enable Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prediction_entries;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prediction_users;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prediction_settings_event ON prediction_settings(event_id);
CREATE INDEX IF NOT EXISTS idx_prediction_entries_match ON prediction_entries(match_id);
CREATE INDEX IF NOT EXISTS idx_prediction_entries_event ON prediction_entries(event_id);
CREATE INDEX IF NOT EXISTS idx_prediction_entries_username ON prediction_entries(discord_username);
CREATE INDEX IF NOT EXISTS idx_prediction_users_username ON prediction_users(discord_username);
CREATE INDEX IF NOT EXISTS idx_prediction_users_points ON prediction_users(points DESC);

-- 8. Function: Recalculate user prediction stats
CREATE OR REPLACE FUNCTION recalculate_user_stats(p_discord_username TEXT)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
  v_wrong INTEGER;
  v_points INTEGER;
  v_accuracy NUMERIC(5,2);
  v_current_streak INTEGER := 0;
  v_best_streak INTEGER := 0;
  v_streak INTEGER := 0;
  rec RECORD;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_correct = true), COUNT(*) FILTER (WHERE is_correct = false)
  INTO v_total, v_correct, v_wrong
  FROM prediction_entries
  WHERE discord_username = p_discord_username;

  v_points := COALESCE(v_correct, 0);
  v_accuracy := CASE WHEN v_total > 0 THEN ROUND((v_correct::NUMERIC / v_total) * 100, 2) ELSE 0 END;

  -- Calculate streaks (ordered by submitted_at)
  v_streak := 0;
  v_best_streak := 0;
  FOR rec IN
    SELECT is_correct FROM prediction_entries
    WHERE discord_username = p_discord_username AND is_correct IS NOT NULL
    ORDER BY submitted_at ASC
  LOOP
    IF rec.is_correct THEN
      v_streak := v_streak + 1;
      IF v_streak > v_best_streak THEN
        v_best_streak := v_streak;
      END IF;
    ELSE
      v_streak := 0;
    END IF;
  END LOOP;
  v_current_streak := v_streak;

  INSERT INTO prediction_users (discord_username, total_predictions, correct_predictions, wrong_predictions, points, accuracy, current_streak, best_streak, updated_at)
  VALUES (p_discord_username, v_total, v_correct, v_wrong, v_points, v_accuracy, v_current_streak, v_best_streak, now())
  ON CONFLICT (discord_username) DO UPDATE SET
    total_predictions = EXCLUDED.total_predictions,
    correct_predictions = EXCLUDED.correct_predictions,
    wrong_predictions = EXCLUDED.wrong_predictions,
    points = EXCLUDED.points,
    accuracy = EXCLUDED.accuracy,
    current_streak = EXCLUDED.current_streak,
    best_streak = EXCLUDED.best_streak,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger: Auto-recalculate stats when is_correct changes
CREATE OR REPLACE FUNCTION trg_recalc_prediction_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_correct IS DISTINCT FROM OLD.is_correct THEN
    PERFORM recalculate_user_stats(NEW.discord_username);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prediction_result_calculated ON prediction_entries;
CREATE TRIGGER prediction_result_calculated
  AFTER UPDATE OF is_correct ON prediction_entries
  FOR EACH ROW
  EXECUTE FUNCTION trg_recalc_prediction_stats();
