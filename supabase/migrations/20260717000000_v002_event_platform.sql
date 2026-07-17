-- ============================================
-- Neosoul Tournament v0.0.2 Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Event Categories
CREATE TABLE IF NOT EXISTS event_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT 'Tag',
  color TEXT DEFAULT '#FF7A00',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO event_categories (name, slug, icon, color, sort_order) VALUES
  ('Tournament', 'tournament', 'Swords', '#FF7A00', 1),
  ('Giveaway', 'giveaway', 'Gift', '#EAB308', 2),
  ('Community Night', 'community-night', 'Users', '#3B82F6', 3),
  ('Poker', 'poker', 'Spade', '#8B5CF6', 4),
  ('Quiz', 'quiz', 'HelpCircle', '#10B981', 5),
  ('Watch Party', 'watch-party', 'Tv', '#EC4899', 6),
  ('Workshop', 'workshop', 'Wrench', '#F97316', 7),
  ('Custom Event', 'custom', 'Calendar', '#6B7280', 8)
ON CONFLICT (slug) DO NOTHING;

-- 2. Events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  banner TEXT,
  thumbnail TEXT,
  description TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'tournament',
  status TEXT NOT NULL DEFAULT 'draft',
  registration_status TEXT NOT NULL DEFAULT 'closed',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  location TEXT DEFAULT '',
  max_participants INTEGER DEFAULT 0,
  current_participants INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Registration Forms
CREATE TABLE IF NOT EXISTS registration_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Registration Form',
  description TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Registration Fields
CREATE TABLE IF NOT EXISTS registration_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL,
  label TEXT NOT NULL,
  placeholder TEXT DEFAULT '',
  required BOOLEAN DEFAULT false,
  options JSONB DEFAULT '[]',
  validation JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Registration Responses
CREATE TABLE IF NOT EXISTS registration_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES registration_forms(id) ON DELETE CASCADE,
  respondent_name TEXT DEFAULT '',
  respondent_email TEXT DEFAULT '',
  data JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'info',
  pinned BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Extend Settings (additive only, no breaks)
ALTER TABLE settings ADD COLUMN IF NOT EXISTS community_name TEXT DEFAULT 'Neosoul Indonesia';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#FF7A00';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#FFA726';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS hero_banner TEXT;
ALTER TABLE settings ADD COLUMN IF NOT EXISTS discord_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS kick_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS instagram_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS website_url TEXT DEFAULT '';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'v0.0.2';

-- 8. RLS: disabled (admin auth handled at app level, public read filtered in code)
ALTER TABLE event_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_fields DISABLE ROW LEVEL SECURITY;
ALTER TABLE registration_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE announcements DISABLE ROW LEVEL SECURITY;

-- 9. Enable Realtime (safe to run multiple times)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE events;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE registration_responses;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 10. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_slug ON events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_events_published ON events(published) WHERE published = true;
CREATE INDEX IF NOT EXISTS idx_registration_forms_event ON registration_forms(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_fields_form ON registration_fields(form_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_registration_responses_event ON registration_responses(event_id);
CREATE INDEX IF NOT EXISTS idx_registration_responses_status ON registration_responses(status);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(published) WHERE published = true;
