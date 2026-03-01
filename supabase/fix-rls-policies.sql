-- ═══════════════════════════════════════════════════════════════
-- FIX RLS POLICIES FOR ASSESSMENTS TABLE
-- Run this SQL in your Supabase SQL Editor to fix the 
-- "new row violates row-level security policy" error
-- ═══════════════════════════════════════════════════════════════

-- Drop existing policies for assessments
DROP POLICY IF EXISTS "Users can view all assessments" ON assessments;
DROP POLICY IF EXISTS "Users can create assessments" ON assessments;
DROP POLICY IF EXISTS "Users can update own assessments" ON assessments;
DROP POLICY IF EXISTS "Users can delete own assessments" ON assessments;

-- Create new, more permissive policies

-- 1. SELECT: All authenticated users can view all assessments
CREATE POLICY "Users can view all assessments" ON assessments
  FOR SELECT 
  TO authenticated
  USING (true);

-- 2. INSERT: Any authenticated user can create assessments
-- The created_by will be set by the application
CREATE POLICY "Authenticated users can create assessments" ON assessments
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Allow insert if created_by matches the current user OR is null (will be set by trigger)
    created_by = auth.uid() OR created_by IS NULL
  );

-- 3. UPDATE: Users can update their own assessments
CREATE POLICY "Users can update own assessments" ON assessments
  FOR UPDATE 
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- 4. DELETE: Users can delete their own assessments
CREATE POLICY "Users can delete own assessments" ON assessments
  FOR DELETE 
  TO authenticated
  USING (created_by = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- ALTERNATIVE: More permissive policy (if above doesn't work)
-- Uncomment the following if you want all authenticated users
-- to be able to create/update/delete any assessment
-- ═══════════════════════════════════════════════════════════════

-- DROP POLICY IF EXISTS "Authenticated users can create assessments" ON assessments;
-- DROP POLICY IF EXISTS "Users can update own assessments" ON assessments;
-- DROP POLICY IF EXISTS "Users can delete own assessments" ON assessments;

-- CREATE POLICY "Authenticated users can do anything" ON assessments
--   FOR ALL 
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- FIX RLS POLICIES FOR ANSWERS TABLE
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view all answers" ON answers;
DROP POLICY IF EXISTS "Users can insert answers for their assessments or assigned sections" ON answers;
DROP POLICY IF EXISTS "Users can update answers for their assessments or assigned sections" ON answers;

-- 1. SELECT: All authenticated users can view all answers
CREATE POLICY "Users can view all answers" ON answers
  FOR SELECT 
  TO authenticated
  USING (true);

-- 2. INSERT: Authenticated users can insert answers
CREATE POLICY "Authenticated users can insert answers" ON answers
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- 3. UPDATE: Authenticated users can update answers
CREATE POLICY "Authenticated users can update answers" ON answers
  FOR UPDATE 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- FIX RLS POLICIES FOR SECTION_ASSIGNMENTS TABLE
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can view all section assignments" ON section_assignments;
DROP POLICY IF EXISTS "Assessment owners can manage assignments" ON section_assignments;
DROP POLICY IF EXISTS "Assigned users can update their sections" ON section_assignments;

-- 1. SELECT: All authenticated users can view all assignments
CREATE POLICY "Users can view all section assignments" ON section_assignments
  FOR SELECT 
  TO authenticated
  USING (true);

-- 2. INSERT/UPDATE/DELETE: Authenticated users can manage assignments
CREATE POLICY "Authenticated users can manage assignments" ON section_assignments
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════════
-- VERIFY POLICIES
-- ═══════════════════════════════════════════════════════════════
-- Run this to see all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename IN ('assessments', 'answers', 'section_assignments', 'profiles');