-- Run this script in your Supabase SQL Editor to support detailed recruiter decision fields,
-- candidate name tracking across all tables, and new contradiction/validation tables.

-- 1. Add candidate_name tracking column to existing tables for easy verification
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS candidate_name TEXT;
ALTER TABLE session_responses ADD COLUMN IF NOT EXISTS candidate_name TEXT;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS candidate_name TEXT;
ALTER TABLE proctoring_events ADD COLUMN IF NOT EXISTS candidate_name TEXT;

-- 2. Add structured metrics/scores columns to evaluation_reports
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS trust_score NUMERIC(5,2);
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS topic_coverage NUMERIC(5,2);
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS knowledge_stability NUMERIC(5,2);
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS reasoning_score NUMERIC(5,2);
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS consistency_score NUMERIC(5,2);
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS difficulty_weighted_performance NUMERIC(5,2);
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS report_confidence TEXT;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS recommendation_status TEXT;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS score_calculation_version TEXT;

-- 3. Create contradictions table
CREATE TABLE IF NOT EXISTS contradictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_name TEXT,
  q_index1 INTEGER NOT NULL,
  q_index2 INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('confirmed', 'possible', 'insufficient_evidence')) DEFAULT 'possible',
  confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and permissions on contradictions
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON contradictions;
CREATE POLICY "allow_all" ON contradictions FOR ALL USING (true) WITH CHECK (true);
GRANT ALL PRIVILEGES ON contradictions TO postgres, anon, authenticated, service_role;

-- 4. Create validation_results table
CREATE TABLE IF NOT EXISTS validation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_name TEXT,
  parent_question TEXT NOT NULL,
  parent_score NUMERIC(5,2) NOT NULL,
  followup_question TEXT NOT NULL,
  followup_score NUMERIC(5,2) NOT NULL,
  reliability NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS and permissions on validation_results
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all" ON validation_results;
CREATE POLICY "allow_all" ON validation_results FOR ALL USING (true) WITH CHECK (true);
GRANT ALL PRIVILEGES ON validation_results TO postgres, anon, authenticated, service_role;
