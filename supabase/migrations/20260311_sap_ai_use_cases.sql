/* ═══════════════════════════════════════════════════════════════
   SAP AI USE CASES TABLE
   Stores SAP AI catalog data from Discovery Center
   Synced daily at 15:00 from SAP Discovery Center
   ═══════════════════════════════════════════════════════════════ */

-- Create the main table for SAP AI use cases
CREATE TABLE IF NOT EXISTS sap_ai_use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core fields from SAP Discovery Center
  identifier TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  ai_type TEXT, -- 'AI Feature', 'AI Agent'
  commercial_type TEXT, -- 'Base', 'Premium', ''
  product TEXT,
  description TEXT,
  product_category TEXT,
  package TEXT,
  quick_filters TEXT,
  availability TEXT, -- 'Generally Available', 'Beta', 'Early Adopter Care (EAC)'
  detail_page TEXT,
  
  -- adesso evaluation fields (editable by consultants)
  business_value_adesso INTEGER CHECK (business_value_adesso BETWEEN 1 AND 5),
  restrictions TEXT,
  contact_person TEXT,
  priority INTEGER CHECK (priority BETWEEN 1 AND 5),
  sales_pitch_usability INTEGER CHECK (sales_pitch_usability BETWEEN 1 AND 5),
  tags TEXT,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'UPDATED', 'REVIEWED', 'ARCHIVED')),
  change_history JSONB DEFAULT '[]',
  
  -- Generated content (cached AI outputs)
  cached_pitch_de TEXT,
  cached_pitch_en TEXT,
  cached_email_de TEXT,
  cached_email_en TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced_at TIMESTAMPTZ,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at TIMESTAMPTZ
);

-- Create indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_sap_ai_product_category ON sap_ai_use_cases(product_category);
CREATE INDEX IF NOT EXISTS idx_sap_ai_availability ON sap_ai_use_cases(availability);
CREATE INDEX IF NOT EXISTS idx_sap_ai_ai_type ON sap_ai_use_cases(ai_type);
CREATE INDEX IF NOT EXISTS idx_sap_ai_commercial_type ON sap_ai_use_cases(commercial_type);
CREATE INDEX IF NOT EXISTS idx_sap_ai_status ON sap_ai_use_cases(status);
CREATE INDEX IF NOT EXISTS idx_sap_ai_priority ON sap_ai_use_cases(priority);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_sap_ai_search ON sap_ai_use_cases 
  USING GIN (to_tsvector('german', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(product, '')));

-- Enable Row Level Security
ALTER TABLE sap_ai_use_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read
CREATE POLICY "Allow read for authenticated" ON sap_ai_use_cases 
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to update (for evaluations)
CREATE POLICY "Allow update for authenticated" ON sap_ai_use_cases 
  FOR UPDATE TO authenticated USING (true);

-- Allow service role to insert/delete (for sync function)
CREATE POLICY "Allow insert for service role" ON sap_ai_use_cases 
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow delete for service role" ON sap_ai_use_cases 
  FOR DELETE TO service_role USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_sap_ai_use_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_sap_ai_use_cases_updated_at ON sap_ai_use_cases;
CREATE TRIGGER trigger_update_sap_ai_use_cases_updated_at
  BEFORE UPDATE ON sap_ai_use_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_sap_ai_use_cases_updated_at();

-- Function to track changes in change_history
CREATE OR REPLACE FUNCTION track_sap_ai_use_case_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
BEGIN
  -- Only track changes to evaluation fields
  IF (OLD.business_value_adesso IS DISTINCT FROM NEW.business_value_adesso) OR
     (OLD.restrictions IS DISTINCT FROM NEW.restrictions) OR
     (OLD.contact_person IS DISTINCT FROM NEW.contact_person) OR
     (OLD.priority IS DISTINCT FROM NEW.priority) OR
     (OLD.sales_pitch_usability IS DISTINCT FROM NEW.sales_pitch_usability) OR
     (OLD.tags IS DISTINCT FROM NEW.tags) OR
     (OLD.status IS DISTINCT FROM NEW.status) THEN
    
    changes = jsonb_build_object(
      'timestamp', NOW(),
      'user_id', auth.uid(),
      'changes', jsonb_build_object(
        'business_value_adesso', CASE WHEN OLD.business_value_adesso IS DISTINCT FROM NEW.business_value_adesso 
          THEN jsonb_build_object('old', OLD.business_value_adesso, 'new', NEW.business_value_adesso) END,
        'priority', CASE WHEN OLD.priority IS DISTINCT FROM NEW.priority 
          THEN jsonb_build_object('old', OLD.priority, 'new', NEW.priority) END,
        'status', CASE WHEN OLD.status IS DISTINCT FROM NEW.status 
          THEN jsonb_build_object('old', OLD.status, 'new', NEW.status) END
      )
    );
    
    NEW.change_history = NEW.change_history || changes;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to track changes
DROP TRIGGER IF EXISTS trigger_track_sap_ai_use_case_changes ON sap_ai_use_cases;
CREATE TRIGGER trigger_track_sap_ai_use_case_changes
  BEFORE UPDATE ON sap_ai_use_cases
  FOR EACH ROW
  EXECUTE FUNCTION track_sap_ai_use_case_changes();

-- ═══════════════════════════════════════════════════════════════
-- CUSTOMER-USE CASE MATCHING TABLE
-- Stores AI-generated matches between assessments and use cases
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS assessment_use_case_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  use_case_id UUID NOT NULL REFERENCES sap_ai_use_cases(id) ON DELETE CASCADE,
  
  -- Matching scores
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 100),
  match_reason TEXT,
  
  -- Status
  is_recommended BOOLEAN DEFAULT true,
  is_dismissed BOOLEAN DEFAULT false,
  dismissed_reason TEXT,
  
  -- Generated content
  generated_pitch TEXT,
  generated_email TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  matched_by TEXT DEFAULT 'AI', -- 'AI' or 'MANUAL'
  
  UNIQUE(assessment_id, use_case_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_assessment ON assessment_use_case_matches(assessment_id);
CREATE INDEX IF NOT EXISTS idx_match_use_case ON assessment_use_case_matches(use_case_id);
CREATE INDEX IF NOT EXISTS idx_match_score ON assessment_use_case_matches(relevance_score DESC);

-- RLS
ALTER TABLE assessment_use_case_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON assessment_use_case_matches 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for authenticated" ON assessment_use_case_matches 
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow update for authenticated" ON assessment_use_case_matches 
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow delete for authenticated" ON assessment_use_case_matches 
  FOR DELETE TO authenticated USING (true);

-- ═══════════════════════════════════════════════════════════════
-- SYNC LOG TABLE
-- Tracks sync operations for the SAP AI catalog
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sap_ai_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL')),
  
  -- Statistics
  total_fetched INTEGER DEFAULT 0,
  new_records INTEGER DEFAULT 0,
  updated_records INTEGER DEFAULT 0,
  unchanged_records INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_details JSONB,
  
  -- Metadata
  triggered_by TEXT DEFAULT 'SCHEDULED' -- 'SCHEDULED', 'MANUAL', 'WEBHOOK'
);

-- Index for recent syncs
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON sap_ai_sync_log(sync_started_at DESC);

-- RLS
ALTER TABLE sap_ai_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated" ON sap_ai_sync_log 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow insert for service role" ON sap_ai_sync_log 
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Allow update for service role" ON sap_ai_sync_log 
  FOR UPDATE TO service_role USING (true);

-- ═══════════════════════════════════════════════════════════════
-- VIEWS
-- ═══════════════════════════════════════════════════════════════

-- View for use cases with statistics
CREATE OR REPLACE VIEW sap_ai_use_cases_with_stats AS
SELECT 
  uc.*,
  COUNT(DISTINCT m.assessment_id) as match_count,
  AVG(m.relevance_score) as avg_relevance_score
FROM sap_ai_use_cases uc
LEFT JOIN assessment_use_case_matches m ON uc.id = m.use_case_id AND m.is_recommended = true
GROUP BY uc.id;

-- View for latest sync status
CREATE OR REPLACE VIEW latest_sync_status AS
SELECT * FROM sap_ai_sync_log
ORDER BY sync_started_at DESC
LIMIT 1;

-- ═══════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════

COMMENT ON TABLE sap_ai_use_cases IS 'SAP AI use cases from Discovery Center, synced daily at 15:00';
COMMENT ON COLUMN sap_ai_use_cases.identifier IS 'Unique identifier from SAP (e.g., J172, J826)';
COMMENT ON COLUMN sap_ai_use_cases.ai_type IS 'Type of AI capability: AI Feature or AI Agent';
COMMENT ON COLUMN sap_ai_use_cases.commercial_type IS 'Licensing type: Base (included), Premium (additional cost), or empty';
COMMENT ON COLUMN sap_ai_use_cases.availability IS 'Release status: Generally Available, Beta, Early Adopter Care (EAC)';
COMMENT ON COLUMN sap_ai_use_cases.business_value_adesso IS 'adesso internal rating 1-5 for business value';
COMMENT ON COLUMN sap_ai_use_cases.sales_pitch_usability IS 'adesso internal rating 1-5 for sales pitch potential';