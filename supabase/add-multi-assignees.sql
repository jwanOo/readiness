-- ═══════════════════════════════════════════════════════════════
-- ADD MULTI-ASSIGNEE SUPPORT
-- Run this SQL in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Create a junction table for multiple assignees per section
CREATE TABLE IF NOT EXISTS section_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES section_assignments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

-- Enable RLS
ALTER TABLE section_assignees ENABLE ROW LEVEL SECURITY;

-- Policies for section_assignees
CREATE POLICY "Users can view all section assignees" ON section_assignees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage section assignees" ON section_assignees
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_section_assignees_assignment ON section_assignees(assignment_id);
CREATE INDEX IF NOT EXISTS idx_section_assignees_user ON section_assignees(user_id);

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE section_assignees;