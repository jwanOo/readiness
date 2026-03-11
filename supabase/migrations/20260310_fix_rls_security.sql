-- ============================================
-- SECURITY FIX: Row-Level Security (RLS) Policies
-- Date: 2026-03-10
-- Issue: F2 - Supabase RLS Fully Bypassed
-- OWASP: A01:2021 (Broken Access Control)
-- ============================================
-- 
-- This migration fixes the critical security vulnerability where
-- RLS policies with USING (true) / WITH CHECK (true) allowed
-- any authenticated user to read, modify, or delete ANY user's data.
--
-- IMPORTANT: Run this migration in your Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. DROP ALL EXISTING POLICIES
-- ============================================

-- Assessments table policies
DROP POLICY IF EXISTS "allow_all" ON assessments;
DROP POLICY IF EXISTS "allow_all_select" ON assessments;
DROP POLICY IF EXISTS "allow_all_insert" ON assessments;
DROP POLICY IF EXISTS "allow_all_update" ON assessments;
DROP POLICY IF EXISTS "allow_all_delete" ON assessments;
DROP POLICY IF EXISTS "Users can view all assessments" ON assessments;
DROP POLICY IF EXISTS "Users can insert assessments" ON assessments;
DROP POLICY IF EXISTS "Users can update assessments" ON assessments;
DROP POLICY IF EXISTS "Users can delete assessments" ON assessments;
DROP POLICY IF EXISTS "Enable read access for all users" ON assessments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON assessments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON assessments;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON assessments;
DROP POLICY IF EXISTS "assessments_select_own" ON assessments;
DROP POLICY IF EXISTS "assessments_insert_own" ON assessments;
DROP POLICY IF EXISTS "assessments_update_own" ON assessments;
DROP POLICY IF EXISTS "assessments_delete_own" ON assessments;

-- Answers table policies
DROP POLICY IF EXISTS "allow_all" ON answers;
DROP POLICY IF EXISTS "allow_all_select" ON answers;
DROP POLICY IF EXISTS "allow_all_insert" ON answers;
DROP POLICY IF EXISTS "allow_all_update" ON answers;
DROP POLICY IF EXISTS "allow_all_delete" ON answers;
DROP POLICY IF EXISTS "Users can view all answers" ON answers;
DROP POLICY IF EXISTS "Users can insert answers" ON answers;
DROP POLICY IF EXISTS "Users can update answers" ON answers;
DROP POLICY IF EXISTS "Users can delete answers" ON answers;
DROP POLICY IF EXISTS "Enable read access for all users" ON answers;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON answers;
DROP POLICY IF EXISTS "Enable update for users based on email" ON answers;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON answers;
DROP POLICY IF EXISTS "answers_select_own" ON answers;
DROP POLICY IF EXISTS "answers_insert_own" ON answers;
DROP POLICY IF EXISTS "answers_update_own" ON answers;
DROP POLICY IF EXISTS "answers_delete_own" ON answers;

-- Section assignments table policies
DROP POLICY IF EXISTS "allow_all" ON section_assignments;
DROP POLICY IF EXISTS "allow_all_select" ON section_assignments;
DROP POLICY IF EXISTS "allow_all_insert" ON section_assignments;
DROP POLICY IF EXISTS "allow_all_update" ON section_assignments;
DROP POLICY IF EXISTS "allow_all_delete" ON section_assignments;
DROP POLICY IF EXISTS "Users can view all section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "Users can insert section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "Users can update section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "Users can delete section_assignments" ON section_assignments;
DROP POLICY IF EXISTS "Enable read access for all users" ON section_assignments;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON section_assignments;
DROP POLICY IF EXISTS "Enable update for users based on email" ON section_assignments;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON section_assignments;
DROP POLICY IF EXISTS "section_assignments_select" ON section_assignments;
DROP POLICY IF EXISTS "section_assignments_insert" ON section_assignments;
DROP POLICY IF EXISTS "section_assignments_update" ON section_assignments;
DROP POLICY IF EXISTS "section_assignments_delete" ON section_assignments;

-- ============================================
-- 2. ENSURE RLS IS ENABLED
-- ============================================

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_assignments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. CREATE HELPER FUNCTION TO AVOID RECURSION
-- ============================================
-- This function checks if a user has access to an assessment
-- without causing infinite recursion in RLS policies

CREATE OR REPLACE FUNCTION public.user_has_assessment_access(assessment_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM assessments 
    WHERE id = assessment_uuid 
    AND created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM section_assignments 
    WHERE assessment_id = assessment_uuid 
    AND assigned_to = auth.uid()
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.user_has_assessment_access(UUID) TO authenticated;

-- ============================================
-- 4. SECURE POLICIES FOR ASSESSMENTS TABLE
-- ============================================
-- Simple owner-based access - no cross-table references to avoid recursion

-- SELECT: Users can view their own assessments
CREATE POLICY "assessments_select_own"
ON assessments FOR SELECT
USING (created_by = auth.uid());

-- INSERT: Users can only create assessments they own
CREATE POLICY "assessments_insert_own"
ON assessments FOR INSERT
WITH CHECK (created_by = auth.uid());

-- UPDATE: Users can only update their own assessments
CREATE POLICY "assessments_update_own"
ON assessments FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- DELETE: Users can only delete their own assessments
CREATE POLICY "assessments_delete_own"
ON assessments FOR DELETE
USING (created_by = auth.uid());

-- ============================================
-- 5. SECURE POLICIES FOR SECTION_ASSIGNMENTS TABLE
-- ============================================
-- Must be created BEFORE answers policies since answers references this

-- SELECT: Assigned user OR assessment creator can view
CREATE POLICY "section_assignments_select"
ON section_assignments FOR SELECT
USING (
  assigned_to = auth.uid()
  OR EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = section_assignments.assessment_id
    AND assessments.created_by = auth.uid()
  )
);

-- INSERT: Only assessment creator can create assignments
CREATE POLICY "section_assignments_insert"
ON section_assignments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = section_assignments.assessment_id
    AND assessments.created_by = auth.uid()
  )
);

-- UPDATE: Only assessment creator can update assignments
CREATE POLICY "section_assignments_update"
ON section_assignments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = section_assignments.assessment_id
    AND assessments.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = section_assignments.assessment_id
    AND assessments.created_by = auth.uid()
  )
);

-- DELETE: Only assessment creator can delete assignments
CREATE POLICY "section_assignments_delete"
ON section_assignments FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = section_assignments.assessment_id
    AND assessments.created_by = auth.uid()
  )
);

-- ============================================
-- 6. SECURE POLICIES FOR ANSWERS TABLE
-- ============================================
-- Use the helper function to check access

-- SELECT: Users can view answers for assessments they have access to
CREATE POLICY "answers_select_own"
ON answers FOR SELECT
USING (public.user_has_assessment_access(assessment_id));

-- INSERT: Users can insert answers for assessments they have access to
CREATE POLICY "answers_insert_own"
ON answers FOR INSERT
WITH CHECK (public.user_has_assessment_access(assessment_id));

-- UPDATE: Users can update answers for assessments they have access to
CREATE POLICY "answers_update_own"
ON answers FOR UPDATE
USING (public.user_has_assessment_access(assessment_id))
WITH CHECK (public.user_has_assessment_access(assessment_id));

-- DELETE: Only assessment creator can delete answers
CREATE POLICY "answers_delete_own"
ON answers FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM assessments
    WHERE assessments.id = answers.assessment_id
    AND assessments.created_by = auth.uid()
  )
);

-- ============================================
-- 7. FIX COLLABORATION TABLES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view all company profiles" ON company_profiles;
DROP POLICY IF EXISTS "Users can view presence for assessments they can access" ON assessment_presence;
DROP POLICY IF EXISTS "Users can view all locks" ON answer_locks;
DROP POLICY IF EXISTS "Users can view collaboration events" ON collaboration_events;
DROP POLICY IF EXISTS "Anyone can read cache" ON autofill_cache;
DROP POLICY IF EXISTS "Authenticated users can manage cache" ON autofill_cache;
DROP POLICY IF EXISTS "company_profiles_select_all" ON company_profiles;
DROP POLICY IF EXISTS "company_profiles_insert_own" ON company_profiles;
DROP POLICY IF EXISTS "company_profiles_update_own" ON company_profiles;
DROP POLICY IF EXISTS "company_profiles_delete_own" ON company_profiles;
DROP POLICY IF EXISTS "assessment_presence_select_all" ON assessment_presence;
DROP POLICY IF EXISTS "assessment_presence_insert_own" ON assessment_presence;
DROP POLICY IF EXISTS "assessment_presence_update_own" ON assessment_presence;
DROP POLICY IF EXISTS "assessment_presence_delete_own" ON assessment_presence;
DROP POLICY IF EXISTS "answer_locks_select_all" ON answer_locks;
DROP POLICY IF EXISTS "answer_locks_insert_own" ON answer_locks;
DROP POLICY IF EXISTS "answer_locks_update_own" ON answer_locks;
DROP POLICY IF EXISTS "answer_locks_delete_own" ON answer_locks;
DROP POLICY IF EXISTS "collaboration_events_select" ON collaboration_events;
DROP POLICY IF EXISTS "collaboration_events_insert_own" ON collaboration_events;
DROP POLICY IF EXISTS "autofill_cache_select_all" ON autofill_cache;
DROP POLICY IF EXISTS "autofill_cache_insert_authenticated" ON autofill_cache;
DROP POLICY IF EXISTS "autofill_cache_update_authenticated" ON autofill_cache;
DROP POLICY IF EXISTS "autofill_cache_delete_authenticated" ON autofill_cache;

-- Company Profiles: Users can view all (for auto-fill), but only manage their own
CREATE POLICY "company_profiles_select_all"
ON company_profiles FOR SELECT
USING (true);

CREATE POLICY "company_profiles_insert_own"
ON company_profiles FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "company_profiles_update_own"
ON company_profiles FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "company_profiles_delete_own"
ON company_profiles FOR DELETE
USING (created_by = auth.uid());

-- Assessment Presence: Users can view all, manage their own
CREATE POLICY "assessment_presence_select_all"
ON assessment_presence FOR SELECT
USING (true);

CREATE POLICY "assessment_presence_insert_own"
ON assessment_presence FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assessment_presence_update_own"
ON assessment_presence FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "assessment_presence_delete_own"
ON assessment_presence FOR DELETE
USING (user_id = auth.uid());

-- Answer Locks: Users can view all, manage their own
CREATE POLICY "answer_locks_select_all"
ON answer_locks FOR SELECT
USING (true);

CREATE POLICY "answer_locks_insert_own"
ON answer_locks FOR INSERT
WITH CHECK (locked_by = auth.uid());

CREATE POLICY "answer_locks_update_own"
ON answer_locks FOR UPDATE
USING (locked_by = auth.uid())
WITH CHECK (locked_by = auth.uid());

CREATE POLICY "answer_locks_delete_own"
ON answer_locks FOR DELETE
USING (locked_by = auth.uid());

-- Collaboration Events: Users can view their own events, insert their own
CREATE POLICY "collaboration_events_select"
ON collaboration_events FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "collaboration_events_insert_own"
ON collaboration_events FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Autofill Cache: Public read, authenticated write
CREATE POLICY "autofill_cache_select_all"
ON autofill_cache FOR SELECT
USING (true);

CREATE POLICY "autofill_cache_insert_authenticated"
ON autofill_cache FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "autofill_cache_update_authenticated"
ON autofill_cache FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "autofill_cache_delete_authenticated"
ON autofill_cache FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- 8. VERIFICATION
-- ============================================
-- Run these queries to verify:
-- SELECT * FROM pg_policies WHERE tablename = 'assessments';
-- SELECT * FROM pg_policies WHERE tablename = 'answers';
-- SELECT * FROM pg_policies WHERE tablename = 'section_assignments';