-- ============================================
-- Migration: Add Tournament State to Settings
-- ============================================
-- Run this SQL in your Supabase SQL Editor.
-- Adds centralized tournament state management.

-- Add tournament state columns
ALTER TABLE settings ADD COLUMN IF NOT EXISTS tournament_state TEXT DEFAULT 'draft'
  CHECK (tournament_state IN ('draft', 'ready', 'running', 'completed'));

ALTER TABLE settings ADD COLUMN IF NOT EXISTS current_round_order INTEGER DEFAULT 0;

ALTER TABLE settings ADD COLUMN IF NOT EXISTS current_match_id UUID REFERENCES matches(id) ON DELETE SET NULL;

-- Update the default settings row to have 'draft' state
UPDATE settings SET tournament_state = 'draft' WHERE tournament_state IS NULL;

-- Create an index for faster current_match lookups
CREATE INDEX IF NOT EXISTS idx_settings_tournament_state ON settings(tournament_state);
