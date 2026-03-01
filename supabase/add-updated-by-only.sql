-- ═══════════════════════════════════════════════════════════════
-- ADD UPDATED_BY COLUMN ONLY
-- Run this SQL in your Supabase SQL Editor
-- The updated_at column already exists
-- ═══════════════════════════════════════════════════════════════

-- Add updated_by column if it doesn't exist
ALTER TABLE assessments 
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'assessments' 
AND column_name IN ('updated_at', 'updated_by');

-- Show sample data
SELECT id, customer_name, updated_at, updated_by 
FROM assessments 
LIMIT 5;