-- ============================================================================
-- REICREW AI — CLEAN SLATE DATABASE SCHEMA v5
-- Run this ONCE in a new Supabase project's SQL Editor
-- WARNING: This will DROP ALL EXISTING TABLES and wipe your database!
-- ============================================================================

-- 1. Wipe everything clean and start fresh
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;


-- 2. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE 1: companies
-- ============================================================================
CREATE TABLE companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 2: candidates
-- ============================================================================
CREATE TABLE candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  id_number TEXT,
  profile_photo_url TEXT,
  id_card_image_url TEXT,
  resume_url TEXT,
  candidate_consent BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMPTZ,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 3: job_posts (Combined with role_settings and access_records info)
-- ============================================================================
CREATE TABLE job_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('AI', 'Custom')) DEFAULT 'AI',
  status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  access_key TEXT NOT NULL,
  settings JSONB DEFAULT '{}'::jsonb, -- Stores difficulty, weights, proctoring settings
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 4: questions
-- ============================================================================
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  ideal_answer TEXT,
  topic TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')) DEFAULT 'Medium',
  key_points TEXT[],
  max_score INTEGER DEFAULT 10,
  sort_order INTEGER DEFAULT 0,
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
  total_score INTEGER DEFAULT 0,
  category TEXT CHECK (category IN ('Excellent', 'Good', 'Average', 'Poor')),
  hiring_recommendation TEXT CHECK (hiring_recommendation IN ('Strong Hire', 'Hire', 'Consider', 'Reject')),
  strengths TEXT[],
  failures TEXT[],
  final_verdict TEXT,
  verdict_justification TEXT,
  scoring_basis TEXT,
  evaluation_logic JSONB DEFAULT '{}'::jsonb,
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
  message TEXT,
  snapshot_url TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- THE MASTER VIEW (ONE ROW PER CANDIDATE)
-- ============================================================================
CREATE OR REPLACE VIEW view_master_session_record AS
SELECT 
  s.id AS session_id,
  c.name AS candidate_name,
  c.email AS candidate_email,
  j.title AS job_title,
  s.status AS session_status,
  s.overall_score,
  e.category AS evaluation_category,
  e.hiring_recommendation,
  e.scoring_basis,
  s.started_at,
  
  -- ROLL UP ALL QUESTIONS INTO A SINGLE JSON ARRAY
  (
    SELECT json_agg(
      json_build_object(
        'question_text', r.question_text,
        'candidate_answer', r.candidate_answer,
        'ideal_answer', r.ideal_answer,
        'scores', json_build_object(
           'content', r.content_score,
           'grammar', r.grammar_score,
           'fluency', r.fluency_score
        ),
        'verdict', r.verdict,
        'feedback', r.feedback
      )
    )
    FROM session_responses r
    WHERE r.session_id = s.id
  ) AS all_questions_and_answers,

  -- ROLL UP ALL PROCTORING EVENTS INTO A SINGLE JSON ARRAY
  (
    SELECT json_agg(
      json_build_object(
        'type', pe.event_type,
        'severity', pe.severity,
        'time', pe.occurred_at,
        'message', pe.message,
        'snapshot_url', pe.snapshot_url
      )
    )
    FROM proctoring_events pe
    WHERE pe.session_id = s.id
  ) AS all_proctoring_events,

  -- CALCULATE TOTAL HIGH SEVERITY VIOLATIONS
  (
    SELECT COUNT(*) 
    FROM proctoring_events pe 
    WHERE pe.session_id = s.id AND pe.severity = 'High'
  ) AS high_severity_violations

FROM interview_sessions s
JOIN candidates c ON s.candidate_id = c.id
LEFT JOIN job_posts j ON s.job_post_id = j.id
LEFT JOIN evaluation_reports e ON s.id = e.session_id;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON job_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON questions FOR ALL USING (true) WITH CHECK (true);
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
INSERT INTO companies (name, domain) VALUES ('REICREW AI', 'reicrew.ai');
