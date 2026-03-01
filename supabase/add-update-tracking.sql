-- ═══════════════════════════════════════════════════════════════
-- ADD UPDATE TRACKING TO ASSESSMENTS
-- Run this SQL in your Supabase SQL Editor
-- This adds updated_by and updated_at columns to track who changed what
-- ═══════════════════════════════════════════════════════════════

-- 1. Add updated_by column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' AND column_name = 'updated_by'
    ) THEN
        ALTER TABLE assessments ADD COLUMN updated_by UUID REFERENCES auth.users(id);
        RAISE NOTICE 'Added updated_by column';
    ELSE
        RAISE NOTICE 'updated_by column already exists';
    END IF;
END $$;

-- 2. Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'assessments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE assessments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        RAISE NOTICE 'updated_at column already exists';
    END IF;
END $$;

-- 3. Set default value for updated_at to match created_at for existing records
UPDATE assessments 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 4. Create or replace the trigger function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_assessments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Drop and recreate the trigger
DROP TRIGGER IF EXISTS trigger_update_assessments_updated_at ON assessments;

CREATE TRIGGER trigger_update_assessments_updated_at
    BEFORE UPDATE ON assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_assessments_updated_at();

-- 6. Verify the columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'assessments'
AND column_name IN ('updated_at', 'updated_by')
ORDER BY column_name;

-- 7. Show sample data
SELECT id, customer_name, created_at, updated_at, updated_by
FROM assessments
LIMIT 5;