-- ═══════════════════════════════════════════════════════════════
-- ADD ASSIGNEES JSON COLUMN TO SECTION_ASSIGNMENTS
-- Run this SQL in your Supabase SQL Editor to persist multiple assignees
-- ═══════════════════════════════════════════════════════════════

-- Add a column to store multiple assignees as JSON array
ALTER TABLE section_assignments 
ADD COLUMN IF NOT EXISTS assignees_json TEXT;

-- Add a comment to explain the column
COMMENT ON COLUMN section_assignments.assignees_json IS 'JSON array of user IDs assigned to this section. Example: ["uuid1", "uuid2"]';