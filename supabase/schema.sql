-- ═══════════════════════════════════════════════════════════════
-- AI READINESS CHECK - SUPABASE DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────
-- 1. PROFILES TABLE (extends Supabase Auth users)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'consultant' CHECK (role IN ('admin', 'consultant')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ────────────────────────────────────────────────────────────────
-- 2. ASSESSMENTS TABLE (main questionnaire instances)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed')),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- Policies for assessments
CREATE POLICY "Users can view all assessments" ON assessments
  FOR SELECT USING (true);

CREATE POLICY "Users can create assessments" ON assessments
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own assessments" ON assessments
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own assessments" ON assessments
  FOR DELETE USING (auth.uid() = created_by);

-- ────────────────────────────────────────────────────────────────
-- 3. SECTION_ASSIGNMENTS TABLE (who works on what section)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS section_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL,
  section_title TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, section_id)
);

-- Enable RLS
ALTER TABLE section_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for section_assignments
CREATE POLICY "Users can view all section assignments" ON section_assignments
  FOR SELECT USING (true);

CREATE POLICY "Assessment owners can manage assignments" ON section_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = section_assignments.assessment_id 
      AND assessments.created_by = auth.uid()
    )
  );

CREATE POLICY "Assigned users can update their sections" ON section_assignments
  FOR UPDATE USING (assigned_to = auth.uid());

-- ────────────────────────────────────────────────────────────────
-- 4. ANSWERS TABLE (individual question responses)
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE NOT NULL,
  section_id TEXT NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT,
  answer TEXT,
  answered_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assessment_id, section_id, question_index)
);

-- Enable RLS
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Policies for answers
CREATE POLICY "Users can view all answers" ON answers
  FOR SELECT USING (true);

CREATE POLICY "Users can insert answers for their assessments or assigned sections" ON answers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = answers.assessment_id 
      AND assessments.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM section_assignments 
      WHERE section_assignments.assessment_id = answers.assessment_id 
      AND section_assignments.section_id = answers.section_id
      AND section_assignments.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can update answers for their assessments or assigned sections" ON answers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM assessments 
      WHERE assessments.id = answers.assessment_id 
      AND assessments.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM section_assignments 
      WHERE section_assignments.assessment_id = answers.assessment_id 
      AND section_assignments.section_id = answers.section_id
      AND section_assignments.assigned_to = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 5. INDEXES FOR PERFORMANCE
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_section_assignments_assessment ON section_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_section_assignments_assigned_to ON section_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_answers_assessment ON answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_answers_section ON answers(assessment_id, section_id);

-- ────────────────────────────────────────────────────────────────
-- 6. UPDATED_AT TRIGGER FUNCTION
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_section_assignments_updated_at ON section_assignments;
CREATE TRIGGER update_section_assignments_updated_at
  BEFORE UPDATE ON section_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ────────────────────────────────────────────────────────────────
-- 7. ENABLE REALTIME FOR COLLABORATIVE FEATURES
-- ────────────────────────────────────────────────────────────────
-- Run these in the Supabase Dashboard > Database > Replication
-- Or use the following SQL:

ALTER PUBLICATION supabase_realtime ADD TABLE assessments;
ALTER PUBLICATION supabase_realtime ADD TABLE section_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- ════════════════════════════════════════════════════════════════
-- SETUP COMPLETE!
-- 
-- Next steps:
-- 1. Go to Authentication > Providers and enable Email
-- 2. (Optional) Enable Microsoft OAuth for SSO
-- 3. Copy your API keys to .env file
-- ════════════════════════════════════════════════════════════════