-- ============================================================================
-- REICREW AI — CLEAN SLATE DATABASE SCHEMA v6 (Optimized Auditable Architecture)
-- Run this ONCE in a new Supabase project's SQL Editor
-- WARNING: This will DROP ALL EXISTING TABLES and wipe your database!
-- ============================================================================

-- 1. Wipe everything clean and start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: candidates
-- ============================================================================
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  applied_role TEXT NOT NULL DEFAULT 'CSE',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 2: job_posts (Role template definitions)
-- ============================================================================
CREATE TABLE job_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('AI', 'Custom')) DEFAULT 'AI' NOT NULL,
  status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE' NOT NULL,
  difficulty TEXT DEFAULT 'Medium' NOT NULL,
  question_count INTEGER DEFAULT 5 NOT NULL,
  technical_weight NUMERIC(5,2) DEFAULT 40.00 NOT NULL,
  communication_weight NUMERIC(5,2) DEFAULT 20.00 NOT NULL,
  confidence_weight NUMERIC(5,2) DEFAULT 20.00 NOT NULL,
  proctoring_weight NUMERIC(5,2) DEFAULT 20.00 NOT NULL,
  questions JSONB DEFAULT '[]'::jsonb NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb NOT NULL,
  company TEXT DEFAULT 'General' NOT NULL,
  access_key TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 3: interview_sessions (Active candidate sessions)
-- ============================================================================
CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE NOT NULL,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('CREATED','IN_PROGRESS','COMPLETED','TERMINATED','PAUSED')) DEFAULT 'CREATED' NOT NULL,
  termination_reason TEXT,
  overall_score NUMERIC(5,2),
  total_questions INTEGER DEFAULT 5 NOT NULL,
  duration_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  interview_metadata JSONB DEFAULT '{}'::jsonb NOT NULL,
  candidate_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 4: session_responses (Transcripts & Detailed AI Evaluations)
-- ============================================================================
CREATE TABLE session_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  candidate_answer TEXT,
  ideal_answer TEXT,
  
  -- Immutable Audit Fields
  question_snapshot TEXT,
  ideal_answer_snapshot TEXT,
  expected_key_points TEXT[],
  detected_key_points TEXT[],
  missing_key_points TEXT[],
  deduction_reason TEXT,
  bonus_reason TEXT,
  response_duration_seconds INTEGER,

  -- Detailed AI Evaluation Scores (Optional: only populated when evaluated)
  content_score NUMERIC(4,2),
  grammar_score NUMERIC(4,2),
  fluency_score NUMERIC(4,2),
  coverage NUMERIC(4,2),
  understanding NUMERIC(4,2),
  reasoning NUMERIC(4,2),
  depth NUMERIC(4,2),
  clarity NUMERIC(4,2),
  structure NUMERIC(4,2),
  confidence NUMERIC(4,2),
  consistency NUMERIC(4,2),
  answer_directness_score NUMERIC(4,2),
  tradeoff_reasoning_score NUMERIC(4,2),
  curiosity NUMERIC(4,2),
  self_correction NUMERIC(4,2),
  learning_potential NUMERIC(4,2),
  technical_errors JSONB,
  positive_evidence JSONB,

  verdict TEXT CHECK (verdict IN ('Pass', 'Borderline', 'Fail')),
  feedback TEXT,
  candidate_name TEXT NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 5: evaluation_reports (Final Aggregate AI Reports)
-- ============================================================================
CREATE TABLE evaluation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Core Evaluation (Optional until generated)
  total_score INTEGER,
  technical_score NUMERIC(5,2),
  communication_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  proctoring_score NUMERIC(5,2),
  hiring_recommendation TEXT CHECK (hiring_recommendation IN ('Strong Hire', 'Hire', 'Consider', 'Reject')),
  strengths TEXT[],
  failures TEXT[],
  final_verdict TEXT,
  verdict_justification TEXT,
  evaluation_logic JSONB,
  
  -- Auditable Risk & Proctoring Snapshots
  risk_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  risk_reason TEXT[],
  proctoring_summary JSONB,
  
  -- Evaluation Metadata Snapshots
  evaluation_weights_snapshot JSONB,
  evaluation_version TEXT,
  evaluation_model TEXT,
  evaluation_prompt_version TEXT,
  evaluated_at TIMESTAMPTZ,
  
  -- Recruiter Decision & Extended Metrics (add_report_tables)
  trust_score NUMERIC(5,2),
  topic_coverage NUMERIC(5,2),
  knowledge_stability NUMERIC(5,2),
  reasoning_score NUMERIC(5,2),
  consistency_score NUMERIC(5,2),
  difficulty_weighted_performance NUMERIC(5,2),
  report_confidence TEXT,
  recommendation_status TEXT,
  score_calculation_version TEXT,
  candidate_name TEXT NOT NULL,
  
  -- Human/Final Outcome
  candidate_outcome TEXT CHECK (candidate_outcome IN ('SHORTLIST', 'REJECT', 'REVIEW', 'PENDING')) DEFAULT 'PENDING' NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 6: proctoring_events (Cheating & Warning Log)
-- ============================================================================
CREATE TABLE proctoring_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')) DEFAULT 'Medium' NOT NULL,
  risk_points INTEGER DEFAULT 0 NOT NULL,
  message TEXT,
  snapshot_url TEXT,
  clip_url TEXT,
  candidate_name TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- TABLE 7: contradictions (AI Detection of Answer Contradictions)
-- ============================================================================
CREATE TABLE contradictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_name TEXT NOT NULL,
  q_index1 INTEGER NOT NULL,
  q_index2 INTEGER NOT NULL,
  explanation TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'medium' NOT NULL,
  status TEXT CHECK (status IN ('confirmed', 'possible', 'insufficient_evidence')) DEFAULT 'possible' NOT NULL,
  confidence NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- TABLE 8: validation_results (AI verification of follow-up reliability)
-- ============================================================================
CREATE TABLE validation_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  candidate_name TEXT NOT NULL,
  parent_question TEXT NOT NULL,
  parent_score NUMERIC(5,2) NOT NULL,
  followup_question TEXT NOT NULL,
  followup_score NUMERIC(5,2) NOT NULL,
  reliability NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================================
-- DATABASE PERFORMANCE INDEXES (Optimized for Peak Capacity)
-- ============================================================================
-- Single-Column Foreign Key Indexes
CREATE INDEX IF NOT EXISTS idx_interview_sessions_candidate_id ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_job_post_id ON interview_sessions(job_post_id);
CREATE INDEX IF NOT EXISTS idx_session_responses_session_id ON session_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_events_session_id ON proctoring_events(session_id);
CREATE INDEX IF NOT EXISTS idx_contradictions_session_id ON contradictions(session_id);
CREATE INDEX IF NOT EXISTS idx_validation_results_session_id ON validation_results(session_id);

-- Hot-Path Q&A Composite Index (Optimizes filter + order operations)
CREATE INDEX IF NOT EXISTS idx_session_responses_session_question ON session_responses(session_id, question_index);

-- ============================================================================
-- DATABASE TRIGGERS (Automated Sync to Guarantee candidate_name is NOT NULL)
-- ============================================================================

-- Trigger 1: Sync candidate_name on interview_sessions from candidates table
CREATE OR REPLACE FUNCTION sync_session_candidate_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.candidate_name IS NULL OR NEW.candidate_name = '' THEN
    SELECT name INTO NEW.candidate_name
    FROM candidates
    WHERE id = NEW.candidate_id;
  END IF;
  
  IF NEW.candidate_name IS NULL THEN
    NEW.candidate_name := 'Candidate';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_session_candidate_name
BEFORE INSERT OR UPDATE ON interview_sessions
FOR EACH ROW
EXECUTE FUNCTION sync_session_candidate_name();

-- Trigger 2: Sync candidate_name on all child tables from interview_sessions
CREATE OR REPLACE FUNCTION sync_child_candidate_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.candidate_name IS NULL OR NEW.candidate_name = '' THEN
    SELECT candidate_name INTO NEW.candidate_name
    FROM interview_sessions
    WHERE id = NEW.session_id;
  END IF;
  
  IF NEW.candidate_name IS NULL THEN
    NEW.candidate_name := 'Candidate';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_responses_candidate_name
BEFORE INSERT OR UPDATE ON session_responses
FOR EACH ROW
EXECUTE FUNCTION sync_child_candidate_name();

CREATE TRIGGER trigger_sync_reports_candidate_name
BEFORE INSERT OR UPDATE ON evaluation_reports
FOR EACH ROW
EXECUTE FUNCTION sync_child_candidate_name();

CREATE TRIGGER trigger_sync_proctoring_candidate_name
BEFORE INSERT OR UPDATE ON proctoring_events
FOR EACH ROW
EXECUTE FUNCTION sync_child_candidate_name();

CREATE TRIGGER trigger_sync_contradictions_candidate_name
BEFORE INSERT OR UPDATE ON contradictions
FOR EACH ROW
EXECUTE FUNCTION sync_child_candidate_name();

CREATE TRIGGER trigger_sync_validation_candidate_name
BEFORE INSERT OR UPDATE ON validation_results
FOR EACH ROW
EXECUTE FUNCTION sync_child_candidate_name();

-- ============================================================================
-- THE REPORTING LAYER (PRESENTATION VIEWS)
-- ============================================================================

-- View 1: vw_candidate_master (Main Dashboard)
CREATE OR REPLACE VIEW vw_candidate_master WITH (security_invoker = on) AS
SELECT 
  c.id AS candidate_id,
  s.id AS session_id,
  c.name AS candidate_name,
  c.email AS candidate_email,
  j.title AS role,
  s.started_at AS interview_date,
  s.duration_seconds / 60 AS duration_minutes,
  s.total_questions AS questions_asked,
  (SELECT COUNT(*) FROM session_responses WHERE session_id = s.id) AS questions_answered,
  s.overall_score,
  e.risk_score,
  e.risk_level,
  e.hiring_recommendation AS recommendation,
  e.candidate_outcome,
  s.status AS session_status,
  e.strengths,
  e.failures AS weaknesses
FROM candidates c
JOIN interview_sessions s ON c.id = s.candidate_id
LEFT JOIN job_posts j ON s.job_post_id = j.id
LEFT JOIN evaluation_reports e ON s.id = e.session_id;

-- View 2: vw_candidate_qa_details (Q&A Breakdown)
CREATE OR REPLACE VIEW vw_candidate_qa_details WITH (security_invoker = on) AS
SELECT 
  c.name AS candidate_name,
  j.title AS role,
  r.question_index AS question_number,
  r.question_snapshot AS question_asked,
  r.candidate_answer,
  r.ideal_answer_snapshot AS ideal_answer,
  r.expected_key_points,
  r.detected_key_points,
  r.missing_key_points,
  r.response_duration_seconds,
  r.content_score AS technical_score,
  r.grammar_score,
  r.fluency_score AS communication_score,
  r.deduction_reason,
  r.bonus_reason,
  r.verdict AS question_verdict,
  r.feedback AS ai_justification
FROM session_responses r
JOIN interview_sessions s ON r.session_id = s.id
JOIN candidates c ON s.candidate_id = c.id
LEFT JOIN job_posts j ON s.job_post_id = j.id;

-- View 3: vw_candidate_proctoring (Integrity Log)
CREATE OR REPLACE VIEW vw_candidate_proctoring WITH (security_invoker = on) AS
SELECT 
  c.name AS candidate_name,
  j.title AS role,
  p.occurred_at AS event_time,
  p.event_type,
  p.severity,
  p.risk_points,
  p.message AS ai_interpretation,
  p.snapshot_url AS evidence_image,
  p.clip_url AS evidence_video
FROM proctoring_events p
JOIN interview_sessions s ON p.session_id = s.id
JOIN candidates c ON s.candidate_id = c.id
LEFT JOIN job_posts j ON s.job_post_id = j.id;

-- View 4: vw_candidate_evaluation (Final Report)
CREATE OR REPLACE VIEW vw_candidate_evaluation WITH (security_invoker = on) AS
SELECT 
  c.name AS candidate_name,
  j.title AS role,
  e.evaluation_version,
  e.evaluation_model,
  e.evaluation_prompt_version,
  e.evaluated_at,
  e.total_score AS overall_score,
  e.technical_score,
  e.communication_score,
  e.confidence_score,
  e.proctoring_score,
  e.risk_score,
  e.risk_level,
  e.risk_reason,
  e.proctoring_summary,
  e.hiring_recommendation AS recommendation,
  e.candidate_outcome,
  e.strengths,
  e.failures AS weaknesses,
  e.verdict_justification
FROM evaluation_reports e
JOIN interview_sessions s ON e.session_id = s.id
JOIN candidates c ON s.candidate_id = c.id
LEFT JOIN job_posts j ON s.job_post_id = j.id;

-- View 5: vw_candidate_scoring_breakdown (Audit Trail)
CREATE OR REPLACE VIEW vw_candidate_scoring_breakdown WITH (security_invoker = on) AS
SELECT 
  c.name AS candidate_name,
  j.title AS role,
  kv.key AS scoring_category,
  kv.value AS weight_percentage
FROM evaluation_reports e
JOIN interview_sessions s ON e.session_id = s.id
JOIN candidates c ON s.candidate_id = c.id
LEFT JOIN job_posts j ON s.job_post_id = j.id,
jsonb_each_text(e.evaluation_weights_snapshot) kv;

-- View 6: vw_interview_timeline (Chronological History)
CREATE OR REPLACE VIEW vw_interview_timeline WITH (security_invoker = on) AS
SELECT candidate_name, timestamp, event_category, description FROM (
  -- Session Started
  SELECT c.name AS candidate_name, s.started_at AS timestamp, 'Session Status' AS event_category, 'Interview Started' AS description, s.id as session_id
  FROM interview_sessions s JOIN candidates c ON s.candidate_id = c.id
  UNION ALL
  -- Session Completed
  SELECT c.name, s.completed_at, 'Session Status', 'Interview Completed', s.id
  FROM interview_sessions s JOIN candidates c ON s.candidate_id = c.id WHERE s.completed_at IS NOT NULL
  UNION ALL
  -- Questions Answered
  SELECT c.name, r.answered_at, 'Q&A', 'Answer submitted for Question ' || r.question_index, r.session_id
  FROM session_responses r JOIN interview_sessions s ON r.session_id = s.id JOIN candidates c ON s.candidate_id = c.id
  UNION ALL
  -- Proctoring Events
  SELECT c.name, p.occurred_at, 'Proctoring Violation', p.event_type || ' (' || p.severity || ')', p.session_id
  FROM proctoring_events p JOIN interview_sessions s ON p.session_id = s.id JOIN candidates c ON s.candidate_id = c.id
  UNION ALL
  -- Evaluation Generated
  SELECT c.name, e.evaluated_at, 'Evaluation', 'Final Report Generated (Score: ' || e.total_score || ')', e.session_id
  FROM evaluation_reports e JOIN interview_sessions s ON e.session_id = s.id JOIN candidates c ON s.candidate_id = c.id WHERE e.evaluated_at IS NOT NULL
) timeline
ORDER BY session_id, timestamp ASC;

-- View 7: vw_candidate_report_export (Data Export)
CREATE OR REPLACE VIEW vw_candidate_report_export WITH (security_invoker = on) AS
SELECT 
  c.name AS candidate_name,
  c.email,
  j.title AS role,
  s.started_at AS interview_date,
  s.duration_seconds / 60 AS duration_minutes,
  s.overall_score,
  e.risk_score,
  e.risk_level,
  e.hiring_recommendation AS recommendation,
  e.candidate_outcome,
  array_to_string(e.strengths, ', ') AS strengths,
  array_to_string(e.failures, ', ') AS weaknesses,
  s.total_questions AS questions_asked,
  COALESCE(e.proctoring_summary->>'tab_switches', '0') AS tab_switch_count,
  COALESCE(e.proctoring_summary->>'face_missing', '0') AS face_missing_count,
  COALESCE(e.proctoring_summary->>'gaze_away', '0') AS gaze_away_count
FROM candidates c
JOIN interview_sessions s ON c.id = s.candidate_id
LEFT JOIN job_posts j ON s.job_post_id = j.id
LEFT JOIN evaluation_reports e ON s.id = e.session_id;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE contradictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE validation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON job_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON interview_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON session_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON evaluation_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON proctoring_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON contradictions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON validation_results FOR ALL USING (true) WITH CHECK (true);

-- Grant standard usage permissions for Supabase roles to all created tables
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- ============================================================================
-- STORAGE BUCKETS (Consolidated from create_buckets.sql)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('identity-documents', 'identity-documents', true),
  ('proctoring-snapshots', 'proctoring-snapshots', true),
  ('proctoring-clips', 'proctoring-clips', true)
ON CONFLICT (id) DO NOTHING;

-- Storage permissive policies for development (Allows upload/read/delete)
DROP POLICY IF EXISTS "Allow all operations for anon and authenticated" ON storage.objects;
CREATE POLICY "Allow all operations for anon and authenticated" 
ON storage.objects FOR ALL 
USING (bucket_id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips')) 
WITH CHECK (bucket_id IN ('identity-documents', 'proctoring-snapshots', 'proctoring-clips'));
