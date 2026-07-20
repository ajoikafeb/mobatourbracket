-- ============================================
-- Neosoul Tournament v0.0.4 Migration
-- Feature: Prediction Events (standalone event type)
-- SAFE: Additive only. No existing data modified.
-- ============================================

-- 1. Junction table: which matches belong to a prediction event
CREATE TABLE IF NOT EXISTS prediction_event_matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prediction_event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(prediction_event_id, match_id)
);

-- 2. RLS disabled (same pattern as v0.0.2 / v0.0.3)
ALTER TABLE prediction_event_matches DISABLE ROW LEVEL SECURITY;

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_pem_event ON prediction_event_matches(prediction_event_id);
CREATE INDEX IF NOT EXISTS idx_pem_match ON prediction_event_matches(match_id);
