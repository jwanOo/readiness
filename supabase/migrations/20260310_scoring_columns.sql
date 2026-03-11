-- ============================================
-- SECURITY FIX: Server-Side Scoring
-- Date: 2026-03-10
-- Issue: F6 - Business Logic (Scoring) Entirely Client-Side
-- ============================================
-- 
-- This migration adds columns to store server-computed scores
-- to ensure score integrity and prevent client-side manipulation.
--
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. ADD SCORE COLUMNS TO ASSESSMENTS TABLE
-- ============================================

-- Add computed score column (overall score 0-100)
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS computed_score INTEGER DEFAULT NULL;

-- Add section scores as JSONB (stores sap, btp, data scores)
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS section_scores JSONB DEFAULT NULL;

-- Add timestamp for when score was computed
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS score_computed_at TIMESTAMPTZ DEFAULT NULL;

-- Add score algorithm version for future migrations
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS score_version TEXT DEFAULT 'v1';

-- ============================================
-- 2. ADD INDEXES FOR PERFORMANCE
-- ============================================

-- Index on computed_score for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_assessments_computed_score 
ON assessments(computed_score);

-- Index on score_computed_at for finding stale scores
CREATE INDEX IF NOT EXISTS idx_assessments_score_computed_at 
ON assessments(score_computed_at);

-- ============================================
-- 3. ADD COMMENTS
-- ============================================

COMMENT ON COLUMN assessments.computed_score IS 'Server-computed overall AI readiness score (0-100). This is the authoritative score.';
COMMENT ON COLUMN assessments.section_scores IS 'Server-computed section scores as JSON: {sap: number, btp: number, data: number}';
COMMENT ON COLUMN assessments.score_computed_at IS 'Timestamp when the score was last computed by the server';
COMMENT ON COLUMN assessments.score_version IS 'Version of the scoring algorithm used (for migration purposes)';

-- ============================================
-- 4. VERIFICATION
-- ============================================
-- Run this query to verify columns were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'assessments' 
-- AND column_name IN ('computed_score', 'section_scores', 'score_computed_at', 'score_version');