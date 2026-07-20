-- ============================================
-- Neosoul Tournament v0.0.6 Migration
-- Feature: Admin close predictions + event media storage
-- SAFE: Additive only. No existing data modified.
-- ============================================

-- 1. Close predictions
ALTER TABLE prediction_settings ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Storage bucket for event media (banner/thumbnail)
INSERT INTO storage.buckets (id, name, public) VALUES ('event_media', 'event_media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read and anon/authenticated upload
DO $$ BEGIN
  CREATE POLICY "Public read event_media" ON storage.objects FOR SELECT USING (bucket_id = 'event_media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anon upload event_media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event_media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Anon delete event_media" ON storage.objects FOR DELETE USING (bucket_id = 'event_media');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

