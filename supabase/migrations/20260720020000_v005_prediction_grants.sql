-- ============================================
-- Neosoul Tournament v0.0.5 Migration
-- Fix: Add GRANT permissions for prediction tables
-- SAFE: Additive only. No existing data modified.
-- ============================================

-- prediction_settings
DO $$ BEGIN
  GRANT SELECT ON prediction_settings TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT ALL ON prediction_settings TO authenticated;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;

-- prediction_users
DO $$ BEGIN
  GRANT SELECT ON prediction_users TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT ALL ON prediction_users TO authenticated;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT INSERT, UPDATE ON prediction_users TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;

-- prediction_entries
DO $$ BEGIN
  GRANT SELECT ON prediction_entries TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT INSERT, UPDATE, DELETE ON prediction_entries TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT ALL ON prediction_entries TO authenticated;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;

-- prediction_event_matches
DO $$ BEGIN
  GRANT SELECT ON prediction_event_matches TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT INSERT, UPDATE, DELETE ON prediction_event_matches TO anon;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;
DO $$ BEGIN
  GRANT ALL ON prediction_event_matches TO authenticated;
EXCEPTION WHEN undefined_table OR insufficient_privilege THEN NULL;
END $$;

-- Enable Realtime for prediction tables (safe if already added)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prediction_settings;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE prediction_event_matches;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
