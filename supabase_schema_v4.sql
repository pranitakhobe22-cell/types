-- ============================================================================
-- REICREW AI — COMPLETE DATABASE SCHEMA v4
-- Run this ONCE in a new Supabase project's SQL Editor
-- ============================================================================

-- 0. Extensions
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_candidates_email ON candidates(email);

-- ============================================================================
-- TABLE 3: job_posts
-- ============================================================================
CREATE TABLE job_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  mode TEXT CHECK (mode IN ('AI', 'Custom')) DEFAULT 'AI',
  status TEXT CHECK (status IN ('ACTIVE', 'INACTIVE')) DEFAULT 'ACTIVE',
  access_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
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
  created_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_questions_job ON questions(job_post_id);

-- ============================================================================
-- TABLE 5: role_settings
-- ============================================================================
CREATE TABLE role_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE UNIQUE NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('Very Easy','Easy','Medium','Hard','Very Hard')) DEFAULT 'Medium',
  preset TEXT CHECK (preset IN ('Relaxed','Normal','Strict','Custom')) DEFAULT 'Normal',
  weight_concept INTEGER DEFAULT 50,
  weight_grammar INTEGER DEFAULT 20,
  weight_fluency INTEGER DEFAULT 20,
  weight_camera INTEGER DEFAULT 10,
  proctoring_max_warnings INTEGER DEFAULT 3,
  proctoring_sensitivity TEXT CHECK (proctoring_sensitivity IN ('Low','Medium','High')) DEFAULT 'Medium',
  proctoring_include_in_score BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 6: access_records
-- ============================================================================
CREATE TABLE access_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE CASCADE NOT NULL,
  access_key_hash TEXT NOT NULL,
  status TEXT CHECK (status IN ('INACTIVE','ACTIVE','LOCKED','EXPIRED','CONSUMED')) DEFAULT 'INACTIVE',
  max_attempts INTEGER DEFAULT 5,
  attempts_used INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  used_by_candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_access_records_job ON access_records(job_post_id);
CREATE INDEX idx_access_records_key_hash ON access_records(access_key_hash);

-- ============================================================================
-- TABLE 7: interview_sessions
-- ============================================================================
CREATE TABLE interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  job_post_id UUID REFERENCES job_posts(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('CREATED','IN_PROGRESS','COMPLETED','TERMINATED','PAUSED')) DEFAULT 'CREATED',
  termination_reason TEXT,
  overall_score NUMERIC(5,2) DEFAULT 0,
  total_questions INTEGER DEFAULT 5,
  questions_attempted INTEGER DEFAULT 0,
  questions_skipped INTEGER DEFAULT 0,
  duration_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,

  -- AI Interview Metadata
  interview_metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX idx_sessions_job ON interview_sessions(job_post_id);
CREATE INDEX idx_sessions_status ON interview_sessions(status);

-- ============================================================================
-- TABLE 8: session_responses
-- ============================================================================
CREATE TABLE session_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_index INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  candidate_answer TEXT,
  ideal_answer TEXT,
  was_skipped BOOLEAN DEFAULT false,

  -- AI evaluation scores
  content_score NUMERIC(4,2),
  grammar_score NUMERIC(4,2),
  fluency_score NUMERIC(4,2),
  communication_score NUMERIC(4,2),
  confidence_score NUMERIC(5,2),

  -- Qualitative
  verdict TEXT CHECK (verdict IN ('Pass', 'Borderline', 'Fail')),
  feedback TEXT,
  expression_analysis TEXT,
  matched_key_points TEXT[],
  missing_key_points TEXT[],

  -- Deep analysis
  analysis_technical_accuracy NUMERIC(4,2),
  analysis_problem_solving NUMERIC(4,2),
  analysis_practical_execution NUMERIC(4,2),
  analysis_communication NUMERIC(4,2),
  red_flags TEXT[],

  -- Speech analysis metrics
  speech_rate_wpm INTEGER,
  filler_word_count INTEGER,
  pause_count INTEGER,
  avg_pause_duration_ms INTEGER,
  total_speech_duration_ms INTEGER,
  silence_percentage NUMERIC(5,2),

  answered_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_responses_session ON session_responses(session_id);

-- ============================================================================
-- TABLE 9: interview_status_history
-- ============================================================================
CREATE TABLE interview_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT DEFAULT 'system',
  reason TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_status_history_session ON interview_status_history(session_id, changed_at);

-- ============================================================================
-- TABLE 10: proctoring_reports
-- ============================================================================
CREATE TABLE proctoring_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,
  proctoring_session_id TEXT,

  current_risk_score INTEGER DEFAULT 0,
  overall_risk_score INTEGER DEFAULT 0,

  no_face_events INTEGER DEFAULT 0,
  gaze_away_events INTEGER DEFAULT 0,
  multiple_face_events INTEGER DEFAULT 0,
  tab_switch_events INTEGER DEFAULT 0,
  microphone_lost_events INTEGER DEFAULT 0,

  session_duration_ms BIGINT DEFAULT 0,
  monitoring_duration_ms BIGINT DEFAULT 0,
  heartbeat_count INTEGER DEFAULT 0,
  camera_reconnect_count INTEGER DEFAULT 0,
  max_concurrent_faces INTEGER DEFAULT 1,

  browser_name TEXT,
  browser_version TEXT,
  os_name TEXT,
  device_type TEXT,
  ip_hash TEXT,
  network_type TEXT,
  viewport_width INTEGER,
  viewport_height INTEGER,

  monitoring_coverage_percent NUMERIC(5,1) DEFAULT 100,
  avg_tracking_confidence NUMERIC(5,1) DEFAULT 100,
  total_detection_frames INTEGER DEFAULT 0,
  stalled_periods INTEGER DEFAULT 0,
  longest_no_face_duration_ms BIGINT DEFAULT 0,
  longest_gaze_away_duration_ms BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 11: proctoring_violations
-- ============================================================================
CREATE TABLE proctoring_violations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES proctoring_reports(id) ON DELETE CASCADE NOT NULL,
  violation_type TEXT CHECK (violation_type IN (
    'TAB_HIDDEN', 'NO_FACE', 'GAZE_AWAY', 'MULTIPLE_FACES',
    'CAMERA_LOST', 'MICROPHONE_LOST', 'REFRESH_ATTEMPT'
  )) NOT NULL,
  severity INTEGER NOT NULL,
  message TEXT,
  snapshot_url TEXT,
  clip_url TEXT,
  capture_timestamp_ms BIGINT,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_violations_report ON proctoring_violations(report_id);
CREATE INDEX idx_violations_type ON proctoring_violations(violation_type);

-- ============================================================================
-- TABLE 12: proctoring_timeline (ALL events — no filtering)
-- ============================================================================
CREATE TABLE proctoring_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID REFERENCES proctoring_reports(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  severity INTEGER DEFAULT 0,
  detail TEXT,
  event_data JSONB,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_timeline_report ON proctoring_timeline(report_id, occurred_at);
CREATE INDEX idx_timeline_type ON proctoring_timeline(event_type);

-- ============================================================================
-- TABLE 13: evaluation_reports
-- ============================================================================
CREATE TABLE evaluation_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE UNIQUE NOT NULL,

  total_score INTEGER DEFAULT 0,
  category TEXT CHECK (category IN ('Excellent', 'Good', 'Average', 'Poor')),
  hiring_recommendation TEXT CHECK (hiring_recommendation IN ('Strong Hire', 'Hire', 'Consider', 'Reject')),

  metric_relevance NUMERIC(4,2),
  metric_accuracy NUMERIC(4,2),
  metric_clarity NUMERIC(4,2),
  metric_depth NUMERIC(4,2),
  metric_vocabulary NUMERIC(4,2),

  strengths TEXT[],
  failures TEXT[],

  final_verdict TEXT,
  verdict_justification TEXT,

  question_breakdown JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- TABLE 14: recruiter_notes
-- ============================================================================
CREATE TABLE recruiter_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id) ON DELETE CASCADE NOT NULL,
  note TEXT NOT NULL,
  note_type TEXT CHECK (note_type IN ('general', 'positive', 'concern', 'follow_up')) DEFAULT 'general',
  created_by TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notes_session ON recruiter_notes(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY — Phase 1 (Open for development)
-- ============================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE proctoring_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE recruiter_notes ENABLE ROW LEVEL SECURITY;

-- Open policies for development (tighten for production)
CREATE POLICY "allow_all" ON companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON candidates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON job_posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON role_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON access_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON interview_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON session_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON interview_status_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON proctoring_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON proctoring_violations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON proctoring_timeline FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON evaluation_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON recruiter_notes FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED DATA — Default company
-- ============================================================================
INSERT INTO companies (name, domain) VALUES ('REICREW AI', 'reicrew.ai');

-- ============================================================================
-- DONE. All 14 tables created with indexes and RLS.
-- ============================================================================
