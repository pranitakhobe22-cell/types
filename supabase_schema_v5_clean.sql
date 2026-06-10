-- ============================================================================
-- REICREW AI — CLEAN SLATE DATABASE SCHEMA v6 (Auditable Architecture)
-- Run this ONCE in a new Supabase project's SQL Editor
-- WARNING: This will DROP ALL EXISTING TABLES and wipe your database!
-- ============================================================================

-- 1. Wipe everything clean and start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 2: candidates
-- ============================================================================
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  applied_role TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 3: job_posts (Combined with role_settings and access_records info)
-- ============================================================================
CREATE TABLE job_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('AI', 'Custom')) DEFAULT 'AI',
  status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  difficulty TEXT,
  question_count INTEGER DEFAULT 5,
  technical_weight NUMERIC(5,2) DEFAULT 40.00,
  communication_weight NUMERIC(5,2) DEFAULT 20.00,
  confidence_weight NUMERIC(5,2) DEFAULT 20.00,
  proctoring_weight NUMERIC(5,2) DEFAULT 20.00,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 5: interview_sessions
-- ============================================================================
CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('CREATED','IN_PROGRESS','COMPLETED','TERMINATED','PAUSED')) DEFAULT 'CREATED',
  overall_score NUMERIC(5,2) DEFAULT 0,
  total_questions INTEGER DEFAULT 5,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  interview_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 6: session_responses
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

  -- Scores
  content_score NUMERIC(4,2),
  grammar_score NUMERIC(4,2),
  fluency_score NUMERIC(4,2),
  verdict TEXT CHECK (verdict IN ('Pass', 'Borderline', 'Fail')),
  feedback TEXT,
  answered_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 7: evaluation_reports
-- ============================================================================
CREATE TABLE evaluation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Core Evaluation
  total_score INTEGER DEFAULT 0,
  technical_score NUMERIC(5,2),
  communication_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  proctoring_score NUMERIC(5,2),
  hiring_recommendation TEXT CHECK (hiring_recommendation IN ('Strong Hire', 'Hire', 'Consider', 'Reject')),
  strengths TEXT[],
  failures TEXT[],
  final_verdict TEXT,
  verdict_justification TEXT,
  evaluation_logic JSONB DEFAULT '{}'::jsonb,
  
  -- Auditable Risk & Proctoring Snapshots
  risk_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('Low', 'Medium', 'High', 'Critical')),
  risk_reason TEXT[],
  proctoring_summary JSONB DEFAULT '{}'::jsonb,
  
  -- Evaluation Metadata Snapshots
  evaluation_weights_snapshot JSONB DEFAULT '{}'::jsonb,
  evaluation_version TEXT,
  evaluation_model TEXT,
  evaluation_prompt_version TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Human/Final Outcome
  candidate_outcome TEXT CHECK (candidate_outcome IN ('SHORTLIST', 'REJECT', 'REVIEW', 'PENDING')),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 8: proctoring_events
-- ============================================================================
CREATE TABLE proctoring_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')) DEFAULT 'Medium',
  risk_points INTEGER DEFAULT 0,
  message TEXT,
  snapshot_url TEXT,
  clip_url TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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
-- This view unpacks the JSON snapshot. It handles a simple key-value breakdown assuming
-- evaluation_weights_snapshot looks like {"technical": 40, "communication": 20, ...}
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
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON job_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON interview_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON session_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON evaluation_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON proctoring_events FOR ALL USING (true) WITH CHECK (true);

-- Grant standard usage permissions for Supabase roles to all created tables
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- SEED DATA
-- (Add any relevant seed data here if needed in the future)
