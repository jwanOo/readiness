-- Create recommendations table for AI-powered recommendations
CREATE TABLE IF NOT EXISTS recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  recommendation_text TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'next_step',
  priority VARCHAR(20) DEFAULT 'medium',
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES profiles(id),
  language VARCHAR(5) DEFAULT 'de',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recommendations_assessment_id ON recommendations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_is_completed ON recommendations(is_completed);

-- Enable Row Level Security
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running the migration)
DROP POLICY IF EXISTS "Users can view recommendations for their assessments" ON recommendations;
DROP POLICY IF EXISTS "Users can insert recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can update recommendations" ON recommendations;
DROP POLICY IF EXISTS "Users can delete recommendations" ON recommendations;

-- Policy: Users can view recommendations for assessments they created or are assigned to
CREATE POLICY "Users can view recommendations for their assessments" ON recommendations
  FOR SELECT
  USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE created_by = auth.uid()
    )
    OR
    assessment_id IN (
      SELECT assessment_id FROM section_assignments WHERE assigned_to = auth.uid()
    )
  );

-- Policy: Users can insert recommendations for assessments they have access to
CREATE POLICY "Users can insert recommendations" ON recommendations
  FOR INSERT
  WITH CHECK (
    assessment_id IN (
      SELECT id FROM assessments WHERE created_by = auth.uid()
    )
    OR
    assessment_id IN (
      SELECT assessment_id FROM section_assignments WHERE assigned_to = auth.uid()
    )
  );

-- Policy: Users can update recommendations for assessments they have access to
CREATE POLICY "Users can update recommendations" ON recommendations
  FOR UPDATE
  USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE created_by = auth.uid()
    )
    OR
    assessment_id IN (
      SELECT assessment_id FROM section_assignments WHERE assigned_to = auth.uid()
    )
  );

-- Policy: Users can delete recommendations for assessments they created
CREATE POLICY "Users can delete recommendations" ON recommendations
  FOR DELETE
  USING (
    assessment_id IN (
      SELECT id FROM assessments WHERE created_by = auth.uid()
    )
  );

-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS trigger_recommendations_updated_at ON recommendations;
DROP FUNCTION IF EXISTS update_recommendations_updated_at();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recommendations_updated_at
  BEFORE UPDATE ON recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_recommendations_updated_at();

-- Comment on table
COMMENT ON TABLE recommendations IS 'AI-powered recommendations for assessments';
COMMENT ON COLUMN recommendations.category IS 'Category: quick_win, strategic, risk, next_step';
COMMENT ON COLUMN recommendations.priority IS 'Priority: high, medium, low';