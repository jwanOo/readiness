-- ═══════════════════════════════════════════════════════════════
-- FIX DELETE PERMISSIONS FOR ASSESSMENTS
-- Run this SQL in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- First, let's check existing policies
-- SELECT * FROM pg_policies WHERE tablename = 'assessments';

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete own assessments" ON assessments;
DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;

-- Create a new delete policy that allows users to delete their own assessments
CREATE POLICY "Users can delete own assessments"
ON assessments
FOR DELETE
USING (auth.uid() = created_by);

-- Also need to handle cascading deletes for related tables
-- First, let's make sure answers can be deleted when assessment is deleted

-- Drop existing delete policy for answers
DROP POLICY IF EXISTS "Users can delete answers" ON answers;
DROP POLICY IF EXISTS "delete_answers" ON answers;

-- Create delete policy for answers (allow if user owns the assessment)
CREATE POLICY "Users can delete answers"
ON answers
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM assessments 
    WHERE assessments.id = answers.assessment_id 
    AND assessments.created_by = auth.uid()
  )
);

-- Drop existing delete policy for section_assignments
DROP POLICY IF EXISTS "Users can delete section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "delete_section_assignments" ON section_assignments;

-- Create delete policy for section_assignments
CREATE POLICY "Users can delete section_assignments"
ON section_assignments
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM assessments 
    WHERE assessments.id = section_assignments.assessment_id 
    AND assessments.created_by = auth.uid()
  )
);

-- Add ON DELETE CASCADE to foreign keys if not already set
-- This ensures related records are automatically deleted

-- For answers table
ALTER TABLE answers 
DROP CONSTRAINT IF EXISTS answers_assessment_id_fkey;

ALTER TABLE answers
ADD CONSTRAINT answers_assessment_id_fkey 
FOREIGN KEY (assessment_id) 
REFERENCES assessments(id) 
ON DELETE CASCADE;

-- For section_assignments table
ALTER TABLE section_assignments 
DROP CONSTRAINT IF EXISTS section_assignments_assessment_id_fkey;

ALTER TABLE section_assignments
ADD CONSTRAINT section_assignments_assessment_id_fkey 
FOREIGN KEY (assessment_id) 
REFERENCES assessments(id) 
ON DELETE CASCADE;

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('assessments', 'answers', 'section_assignments')
ORDER BY tablename, policyname;