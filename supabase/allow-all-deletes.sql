-- ═══════════════════════════════════════════════════════════════
-- ALLOW ALL AUTHENTICATED USERS TO DELETE ASSESSMENTS
-- Run this SQL in your Supabase SQL Editor
-- This allows any authenticated user to delete any assessment
-- ═══════════════════════════════════════════════════════════════

-- Drop all existing delete policies on assessments
DROP POLICY IF EXISTS "Users can delete own assessments" ON assessments;
DROP POLICY IF EXISTS "delete_own_assessments" ON assessments;
DROP POLICY IF EXISTS "Allow delete assessments" ON assessments;

-- Create a permissive delete policy - any authenticated user can delete any assessment
CREATE POLICY "Allow delete assessments"
ON assessments
FOR DELETE
TO authenticated
USING (true);

-- Drop all existing delete policies on answers
DROP POLICY IF EXISTS "Users can delete answers" ON answers;
DROP POLICY IF EXISTS "delete_answers" ON answers;
DROP POLICY IF EXISTS "Allow delete answers" ON answers;

-- Create permissive delete policy for answers
CREATE POLICY "Allow delete answers"
ON answers
FOR DELETE
TO authenticated
USING (true);

-- Drop all existing delete policies on section_assignments
DROP POLICY IF EXISTS "Users can delete section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "delete_section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "Allow delete section_assignments" ON section_assignments;

-- Create permissive delete policy for section_assignments
CREATE POLICY "Allow delete section_assignments"
ON section_assignments
FOR DELETE
TO authenticated
USING (true);

-- Ensure CASCADE delete is set up
ALTER TABLE answers 
DROP CONSTRAINT IF EXISTS answers_assessment_id_fkey;

ALTER TABLE answers
ADD CONSTRAINT answers_assessment_id_fkey 
FOREIGN KEY (assessment_id) 
REFERENCES assessments(id) 
ON DELETE CASCADE;

ALTER TABLE section_assignments 
DROP CONSTRAINT IF EXISTS section_assignments_assessment_id_fkey;

ALTER TABLE section_assignments
ADD CONSTRAINT section_assignments_assessment_id_fkey 
FOREIGN KEY (assessment_id) 
REFERENCES assessments(id) 
ON DELETE CASCADE;

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('assessments', 'answers', 'section_assignments')
  AND cmd = 'DELETE'
ORDER BY tablename;