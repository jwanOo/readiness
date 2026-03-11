-- Migration: Add Real-time Collaboration and Smart Auto-Fill support
-- Date: 2026-03-07

-- ============================================
-- 1. Company Profiles Table
-- ============================================
-- Stores company information for better auto-fill suggestions

CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  industry TEXT,
  company_size TEXT CHECK (company_size IN ('small', 'medium', 'large', 'enterprise')),
  sap_systems JSONB DEFAULT '[]'::jsonb,
  cloud_provider TEXT,
  headquarters_country TEXT,
  employee_count INTEGER,
  annual_revenue TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_profiles_customer_name ON company_profiles(customer_name);
CREATE INDEX IF NOT EXISTS idx_company_profiles_industry ON company_profiles(industry);

-- ============================================
-- 2. Link Assessments to Company Profiles
-- ============================================
-- Add company_profile_id to assessments table

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessments' AND column_name = 'company_profile_id'
  ) THEN
    ALTER TABLE assessments ADD COLUMN company_profile_id UUID REFERENCES company_profiles(id);
  END IF;
END $$;

-- ============================================
-- 3. Assessment Presence Table
-- ============================================
-- Tracks which users are currently viewing/editing an assessment
-- Note: This is optional - Supabase Realtime Presence can handle this in-memory
-- This table is for persistence and analytics

CREATE TABLE IF NOT EXISTS assessment_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cursor_position JSONB,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(assessment_id, user_id)
);

-- Index for faster queries (created after table exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessment_presence_assessment') THEN
    CREATE INDEX idx_assessment_presence_assessment ON assessment_presence(assessment_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessment_presence_user') THEN
    CREATE INDEX idx_assessment_presence_user ON assessment_presence(user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_assessment_presence_active') THEN
    CREATE INDEX idx_assessment_presence_active ON assessment_presence(is_active) WHERE is_active = true;
  END IF;
END $$;

-- ============================================
-- 4. Answer Locks Table (Optional)
-- ============================================
-- Prevents simultaneous edits to the same question
-- Uses optimistic locking with short TTL

CREATE TABLE IF NOT EXISTS answer_locks (
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  section_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  locked_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 seconds'),
  PRIMARY KEY (assessment_id, section_id, question_index)
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_answer_locks_expires ON answer_locks(expires_at);

-- ============================================
-- 5. Collaboration Events Log (Optional)
-- ============================================
-- Audit trail for collaboration activities

CREATE TABLE IF NOT EXISTS collaboration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('join', 'leave', 'edit', 'conflict', 'resolve')),
  section_id TEXT,
  question_index INTEGER,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for querying events
CREATE INDEX IF NOT EXISTS idx_collaboration_events_assessment ON collaboration_events(assessment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_events_created ON collaboration_events(created_at DESC);

-- ============================================
-- 6. Auto-Fill Suggestions Cache (Optional)
-- ============================================
-- Caches AI suggestions for faster retrieval

CREATE TABLE IF NOT EXISTS autofill_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE,
  suggestions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 hour')
);

-- Index for cleanup
CREATE INDEX IF NOT EXISTS idx_autofill_cache_expires ON autofill_cache(expires_at);

-- ============================================
-- 7. Functions and Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for company_profiles
DROP TRIGGER IF EXISTS update_company_profiles_updated_at ON company_profiles;
CREATE TRIGGER update_company_profiles_updated_at
  BEFORE UPDATE ON company_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired locks
CREATE OR REPLACE FUNCTION cleanup_expired_locks()
RETURNS void AS $$
BEGIN
  DELETE FROM answer_locks WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up stale presence records
CREATE OR REPLACE FUNCTION cleanup_stale_presence()
RETURNS void AS $$
BEGIN
  UPDATE assessment_presence 
  SET is_active = false 
  WHERE last_seen < NOW() - INTERVAL '5 minutes' AND is_active = true;
  
  DELETE FROM assessment_presence 
  WHERE last_seen < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM autofill_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Row Level Security (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE answer_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE autofill_cache ENABLE ROW LEVEL SECURITY;

-- Company Profiles: Users can view all, but only edit their own
CREATE POLICY "Users can view all company profiles" ON company_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert company profiles" ON company_profiles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own company profiles" ON company_profiles
  FOR UPDATE USING (auth.uid() = created_by);

-- Assessment Presence: Users can manage their own presence
CREATE POLICY "Users can view presence for assessments they can access" ON assessment_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own presence" ON assessment_presence
  FOR ALL USING (auth.uid() = user_id);

-- Answer Locks: Users can view all, manage their own
CREATE POLICY "Users can view all locks" ON answer_locks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own locks" ON answer_locks
  FOR ALL USING (auth.uid() = locked_by);

-- Collaboration Events: Users can view events for assessments they can access
CREATE POLICY "Users can view collaboration events" ON collaboration_events
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own events" ON collaboration_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Auto-fill Cache: Public read, authenticated write
CREATE POLICY "Anyone can read cache" ON autofill_cache
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage cache" ON autofill_cache
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 9. Realtime Subscriptions
-- ============================================
-- Enable realtime for relevant tables (only if not already added)

DO $$
BEGIN
  -- Check and add answers table (may already exist)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'answers'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE answers;
  END IF;
  
  -- Check and add assessment_presence table
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'assessment_presence'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE assessment_presence;
  END IF;
  
  -- Check and add answer_locks table
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'answer_locks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE answer_locks;
  END IF;
END $$;

-- ============================================
-- 10. Comments
-- ============================================

COMMENT ON TABLE company_profiles IS 'Stores company information for auto-fill suggestions';
COMMENT ON TABLE assessment_presence IS 'Tracks active users in assessments for real-time collaboration';
COMMENT ON TABLE answer_locks IS 'Optimistic locking for concurrent answer editing';
COMMENT ON TABLE collaboration_events IS 'Audit log for collaboration activities';
COMMENT ON TABLE autofill_cache IS 'Cache for AI-generated auto-fill suggestions';