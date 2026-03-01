-- ═══════════════════════════════════════════════════════════════
-- ADD UPDATED_BY COLUMN TO ASSESSMENTS
-- Run this SQL in your Supabase SQL Editor to track who last updated an assessment
-- ═══════════════════════════════════════════════════════════════

-- Add updated_by column to track who last modified the assessment
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Add updated_at column if it doesn't exist (should already exist)
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;

CREATE TRIGGER update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON COLUMN assessments.updated_by IS 'User ID of the person who last updated this assessment';