# Reincrew AI Database Schema & Query Performance Audit Report
This report contains a detailed audit of the database tables, existing indexes, foreign keys, table sizes, pg_stat_statements profile, and execution plan benchmarks for critical interview queries.
## 1. Public Schema Tables
| Table Name |
|---|
| candidates |
| contradictions |
| evaluation_reports |
| interview_sessions |
| job_posts |
| proctoring_events |
| session_responses |
| validation_results |

## 2. Table Sizes & Live Row Counts
| Table Name | Estimated Live Rows | Table Size | Index Size | Total Size |
|---|---|---|---|---|
| session_responses | 4,408 | 5736 kB | 5168 kB | 568 kB |
| evaluation_reports | 697 | 560 kB | 424 kB | 136 kB |
| interview_sessions | 797 | 472 kB | 312 kB | 160 kB |
| proctoring_events | 696 | 424 kB | 288 kB | 136 kB |
| candidates | 805 | 392 kB | 216 kB | 176 kB |
| contradictions | 0 | 48 kB | 8192 bytes | 40 kB |
| validation_results | 0 | 48 kB | 8192 bytes | 40 kB |
| job_posts | 1 | 32 kB | 8192 bytes | 24 kB |

## 3. Existing Database Indexes
| Table | Index Name | Index Definition |
|---|---|---|
| candidates | candidates_email_key | `CREATE UNIQUE INDEX candidates_email_key ON public.candidates USING btree (email)` |
| candidates | candidates_pkey | `CREATE UNIQUE INDEX candidates_pkey ON public.candidates USING btree (id)` |
| contradictions | contradictions_pkey | `CREATE UNIQUE INDEX contradictions_pkey ON public.contradictions USING btree (id)` |
| contradictions | idx_contradictions_session_id | `CREATE INDEX idx_contradictions_session_id ON public.contradictions USING btree (session_id)` |
| evaluation_reports | evaluation_reports_pkey | `CREATE UNIQUE INDEX evaluation_reports_pkey ON public.evaluation_reports USING btree (id)` |
| evaluation_reports | evaluation_reports_session_id_key | `CREATE UNIQUE INDEX evaluation_reports_session_id_key ON public.evaluation_reports USING btree (session_id)` |
| interview_sessions | idx_interview_sessions_candidate_id | `CREATE INDEX idx_interview_sessions_candidate_id ON public.interview_sessions USING btree (candidate_id)` |
| interview_sessions | idx_interview_sessions_job_post_id | `CREATE INDEX idx_interview_sessions_job_post_id ON public.interview_sessions USING btree (job_post_id)` |
| interview_sessions | interview_sessions_pkey | `CREATE UNIQUE INDEX interview_sessions_pkey ON public.interview_sessions USING btree (id)` |
| job_posts | job_posts_pkey | `CREATE UNIQUE INDEX job_posts_pkey ON public.job_posts USING btree (id)` |
| proctoring_events | idx_proctoring_events_session_id | `CREATE INDEX idx_proctoring_events_session_id ON public.proctoring_events USING btree (session_id)` |
| proctoring_events | proctoring_events_pkey | `CREATE UNIQUE INDEX proctoring_events_pkey ON public.proctoring_events USING btree (id)` |
| session_responses | idx_session_responses_session_id | `CREATE INDEX idx_session_responses_session_id ON public.session_responses USING btree (session_id)` |
| session_responses | idx_session_responses_session_question | `CREATE INDEX idx_session_responses_session_question ON public.session_responses USING btree (session_id, question_index)` |
| session_responses | session_responses_pkey | `CREATE UNIQUE INDEX session_responses_pkey ON public.session_responses USING btree (id)` |
| validation_results | idx_validation_results_session_id | `CREATE INDEX idx_validation_results_session_id ON public.validation_results USING btree (session_id)` |
| validation_results | validation_results_pkey | `CREATE UNIQUE INDEX validation_results_pkey ON public.validation_results USING btree (id)` |

## 4. Foreign Key Constraints & Index Status
| Table | Column | Foreign Table | Foreign Column | Constraint Name | Index Status |
|---|---|---|---|---|---|
| contradictions | session_id | interview_sessions | id | contradictions_session_id_fkey | idx_contradictions_session_id |
| evaluation_reports | session_id | interview_sessions | id | evaluation_reports_session_id_fkey | evaluation_reports_session_id_key |
| interview_sessions | candidate_id | candidates | id | interview_sessions_candidate_id_fkey | idx_interview_sessions_candidate_id |
| interview_sessions | job_post_id | job_posts | id | interview_sessions_job_post_id_fkey | idx_interview_sessions_job_post_id |
| proctoring_events | session_id | interview_sessions | id | proctoring_events_session_id_fkey | idx_proctoring_events_session_id |
| session_responses | session_id | interview_sessions | id | session_responses_session_id_fkey | idx_session_responses_session_question |
| session_responses | session_id | interview_sessions | id | session_responses_session_id_fkey | idx_session_responses_session_id |
| validation_results | session_id | interview_sessions | id | validation_results_session_id_fkey | idx_validation_results_session_id |

## 5. Slowest & Most Frequent Queries (pg_stat_statements)
> [!NOTE]
> `pg_stat_statements` is enabled. Below are the top slowest and most frequent queries recorded.

### Top 5 Slowest Queries (By Cumulative Run Time)
| Query | Call Count | Total Time (ms) | Mean Time (ms) | % DB Time |
|---|---|---|---|---|
| `SELECT   e.name,   n.nspname AS schema,   e.default_version,   x.extversion AS installed_version,   e.comment,   ev.sche...` | 270 | 73741.94 | 273.12 | 47.50% |
| `SELECT name FROM pg_timezone_names` | 24 | 20112.75 | 838.03 | 12.96% |
| `with table_privileges as ( -- Despite the name `table_privileges`, this includes other kinds of relations: -- views, mat...` | 153 | 11485.69 | 75.07 | 7.40% |
| `with f as (        -- CTE with sane arg_modes, arg_names, and arg_types. -- All three are always of the same length. -- ...` | 34 | 7504.26 | 220.71 | 4.83% |
| `with f as (        -- CTE with sane arg_modes, arg_names, and arg_types. -- All three are always of the same length. -- ...` | 18 | 4430.59 | 246.14 | 2.85% |

### Top 5 Most Frequent Queries
| Query | Call Count | Total Time (ms) | Mean Time (ms) |
|---|---|---|---|
| `select set_config('search_path', $1, true), set_config($2, $3, true), set_config('role', $4, true), set_config('request....` | 21,088 | 941.71 | 0.04 |
| `SELECT set_config($2, $1, $3)` | 10,851 | 133.67 | 0.01 |
| `BEGIN` | 10,851 | 10.90 | 0.00 |
| `SET LOCAL statement_timeout TO '30000ms'` | 10,851 | 102.52 | 0.01 |
| `COMMIT` | 10,080 | 9.34 | 0.00 |

## 6. Execution Plan Benchmarks (EXPLAIN ANALYZE)
> [!IMPORTANT]
> For empty or very small tables, the PostgreSQL Query Planner will default to Sequential Scans (Seq Scan) instead of Index Scans because loading the index table overhead is more expensive than scanning a few rows. In production-sized tables, these automatically switch to Index Scans as rows scale, provided the index is present.

### Query: Candidate Lookup (Login)
```sql
SELECT * FROM candidates WHERE email = 'locust_test_nonexistent@example.com';
```
**Execution Plan Output:**
```text
Index Scan using candidates_email_key on public.candidates  (cost=0.28..2.49 rows=1 width=102) (actual time=2.215..2.216 rows=0 loops=1)
  Output: id, name, email, applied_role, created_at
  Index Cond: (candidates.email = 'locust_test_nonexistent@example.com'::text)
  Buffers: shared hit=2
Query Identifier: 3424569413128097072
Planning:
  Buffers: shared hit=22
Planning Time: 0.369 ms
Execution Time: 2.246 ms
```
### Query: Fetch Job Posts
```sql
SELECT id, title FROM job_posts WHERE status = 'ACTIVE';
```
**Execution Plan Output:**
```text
Seq Scan on public.job_posts  (cost=0.00..12.50 rows=1 width=48) (actual time=0.634..0.635 rows=1 loops=1)
  Output: id, title
  Filter: (job_posts.status = 'ACTIVE'::text)
  Buffers: shared hit=1
Query Identifier: 6750570517604278278
Planning:
  Buffers: shared hit=35
Planning Time: 1.435 ms
Execution Time: 0.667 ms
```
### Query: Create Session
```sql
INSERT INTO interview_sessions (candidate_id, job_post_id, status, candidate_name) VALUES ('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'CREATED', 'Locust Audit') RETURNING id;
```
🚨 **Execution Plan Failed**: insert or update on table "interview_sessions" violates foreign key constraint "interview_sessions_candidate_id_fkey"
DETAIL:  Key (candidate_id)=(00000000-0000-0000-0000-000000000000) is not present in table "candidates".


### Query: Answer Question (Write)
```sql
INSERT INTO session_responses (session_id, question_index, question_text, candidate_answer) VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 1, 'Question 1', 'Answer 1') RETURNING id;
```
🚨 **Execution Plan Failed**: insert or update on table "session_responses" violates foreign key constraint "session_responses_session_id_fkey"
DETAIL:  Key (session_id)=(00000000-0000-0000-0000-000000000000) is not present in table "interview_sessions".


### Query: Answer Evaluation (Read & Order)
```sql
SELECT * FROM session_responses WHERE session_id = '00000000-0000-0000-0000-000000000000'::uuid ORDER BY question_index ASC;
```
**Execution Plan Output:**
```text
Index Scan using idx_session_responses_session_question on public.session_responses  (cost=0.28..6.97 rows=5 width=1195) (actual time=0.012..0.012 rows=0 loops=1)
  Output: id, session_id, question_index, question_text, candidate_answer, ideal_answer, question_snapshot, ideal_answer_snapshot, expected_key_points, detected_key_points, missing_key_points, deduction_reason, bonus_reason, response_duration_seconds, content_score, grammar_score, fluency_score, coverage, understanding, reasoning, depth, clarity, structure, confidence, consistency, answer_directness_score, tradeoff_reasoning_score, curiosity, self_correction, learning_potential, technical_errors, positive_evidence, verdict, feedback, candidate_name, answered_at
  Index Cond: (session_responses.session_id = '00000000-0000-0000-0000-000000000000'::uuid)
  Buffers: shared hit=4
Query Identifier: 8413002169295100594
Planning:
  Buffers: shared hit=125
Planning Time: 1.892 ms
Execution Time: 0.046 ms
```
### Query: Proctoring Log
```sql
INSERT INTO proctoring_events (session_id, event_type, severity, message) VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 'TAB_SWITCH', 'Low', 'Switched Tab') RETURNING id;
```
🚨 **Execution Plan Failed**: insert or update on table "proctoring_events" violates foreign key constraint "proctoring_events_session_id_fkey"
DETAIL:  Key (session_id)=(00000000-0000-0000-0000-000000000000) is not present in table "interview_sessions".


### Query: Report Creation
```sql
INSERT INTO evaluation_reports (session_id, total_score, technical_score, candidate_name) VALUES ('00000000-0000-0000-0000-000000000000'::uuid, 80, 85.0, 'Locust Audit') ON CONFLICT (session_id) DO UPDATE SET total_score = 80 RETURNING id;
```
🚨 **Execution Plan Failed**: insert or update on table "evaluation_reports" violates foreign key constraint "evaluation_reports_session_id_fkey"
DETAIL:  Key (session_id)=(00000000-0000-0000-0000-000000000000) is not present in table "interview_sessions".


### Query: View Dashboard (vw_candidate_master)
```sql
SELECT * FROM vw_candidate_master LIMIT 10;
```
**Execution Plan Output:**
```text
Limit  (cost=0.98..43.44 rows=10 width=278) (actual time=1.333..36.898 rows=10 loops=1)
  Output: c.id, s.id, c.name, c.email, j.title, s.started_at, ((s.duration_seconds / 60)), s.total_questions, ((SubPlan 1)), s.overall_score, e.risk_score, e.risk_level, e.hiring_recommendation, e.candidate_outcome, s.status, e.strengths, e.failures
  Buffers: shared hit=107 dirtied=7
  ->  Merge Left Join  (cost=0.98..3380.53 rows=796 width=278) (actual time=1.331..36.890 rows=10 loops=1)
        Output: c.id, s.id, c.name, c.email, j.title, s.started_at, (s.duration_seconds / 60), s.total_questions, (SubPlan 1), s.overall_score, e.risk_score, e.risk_level, e.hiring_recommendation, e.candidate_outcome, s.status, e.strengths, e.failures
        Inner Unique: true
        Merge Cond: (s.id = e.session_id)
        Buffers: shared hit=107 dirtied=7
        ->  Nested Loop Left Join  (cost=0.71..353.17 rows=796 width=175) (actual time=1.302..7.422 rows=10 loops=1)
              Output: c.id, c.name, c.email, s.id, s.started_at, s.duration_seconds, s.total_questions, s.overall_score, s.status, j.title
              Inner Unique: true
              Buffers: shared hit=44 dirtied=3
              ->  Nested Loop  (cost=0.55..332.98 rows=796 width=159) (actual time=1.275..7.360 rows=10 loops=1)
                    Output: c.id, c.name, c.email, s.id, s.started_at, s.duration_seconds, s.total_questions, s.overall_score, s.status, s.job_post_id
                    Inner Unique: true
                    Buffers: shared hit=42 dirtied=3
                    ->  Index Scan using interview_sessions_pkey on public.interview_sessions s  (cost=0.28..62.81 rows=796 width=85) (actual time=0.008..5.786 rows=10 loops=1)
                          Output: s.id, s.candidate_id, s.job_post_id, s.status, s.termination_reason, s.overall_score, s.total_questions, s.duration_seconds, s.started_at, s.completed_at, s.interview_metadata, s.candidate_name, s.created_at
                          Buffers: shared hit=12 dirtied=3
                    ->  Index Scan using candidates_pkey on public.candidates c  (cost=0.28..0.34 rows=1 width=90) (actual time=0.152..0.152 rows=1 loops=10)
                          Output: c.id, c.name, c.email, c.applied_role, c.created_at
                          Index Cond: (c.id = s.candidate_id)
                          Buffers: shared hit=30
              ->  Memoize  (cost=0.15..0.19 rows=1 width=48) (actual time=0.004..0.004 rows=1 loops=10)
                    Output: j.title, j.id
                    Cache Key: s.job_post_id
                    Cache Mode: logical
                    Hits: 9  Misses: 1  Evictions: 0  Overflows: 0  Memory Usage: 1kB
                    Buffers: shared hit=2
                    ->  Index Scan using job_posts_pkey on public.job_posts j  (cost=0.14..0.18 rows=1 width=48) (actual time=0.020..0.020 rows=1 loops=1)
                          Output: j.title, j.id
                          Index Cond: (j.id = s.job_post_id)
                          Buffers: shared hit=2
        ->  Index Scan using evaluation_reports_session_id_key on public.evaluation_reports e  (cost=0.28..75.63 rows=697 width=111) (actual time=0.007..0.203 rows=9 loops=1)
              Output: e.id, e.session_id, e.total_score, e.technical_score, e.communication_score, e.confidence_score, e.proctoring_score, e.hiring_recommendation, e.strengths, e.failures, e.final_verdict, e.verdict_justification, e.evaluation_logic, e.risk_score, e.risk_level, e.risk_reason, e.proctoring_summary, e.evaluation_weights_snapshot, e.evaluation_version, e.evaluation_model, e.evaluation_prompt_version, e.evaluated_at, e.trust_score, e.topic_coverage, e.knowledge_stability, e.reasoning_score, e.consistency_score, e.difficulty_weighted_performance, e.report_confidence, e.recommendation_status, e.score_calculation_version, e.candidate_name, e.candidate_outcome, e.created_at
              Buffers: shared hit=11
        SubPlan 1
          ->  Aggregate  (cost=3.68..3.69 rows=1 width=8) (actual time=2.918..2.918 rows=1 loops=10)
                Output: count(*)
                Buffers: shared hit=52 dirtied=4
                ->  Index Only Scan using idx_session_responses_session_id on public.session_responses  (cost=0.28..3.67 rows=5 width=0) (actual time=0.353..2.912 rows=6 loops=10)
                      Output: session_responses.session_id
                      Index Cond: (session_responses.session_id = s.id)
                      Heap Fetches: 32
                      Buffers: shared hit=52 dirtied=4
Query Identifier: 4688693554002807217
Planning:
  Buffers: shared hit=157 dirtied=3
Planning Time: 7.476 ms
Execution Time: 37.015 ms
```

## 7. Sequential Scans & Bottlenecks Identified
| Query Name | Target Table | Plan Step Details |
|---|---|---|
| Fetch Job Posts | public.job_posts | `Seq Scan on public.job_posts  (cost=0.00..12.50 rows=1 width=48) (actual time=0.634..0.635 rows=1 loops=1)` |

> [!CAUTION]
> Sequential Scans read every row of the table. In a large production system (e.g. 100k+ session responses or candidates), this will saturate CPU and crash database performance. These tables must be indexed immediately.

## 8. Missing Index Recommendations & Migration SQL
### Hot Path Composite Index Recommendation
The candidate answer evaluation read query (`SELECT * FROM session_responses WHERE session_id = ? ORDER BY question_index ASC`) is executed frequently for every candidate question.
- **Recommendation**: Create a **composite index** on `idx_session_responses_session_question`. This speeds up the lookup and avoids a separate sorting operation (`ORDER BY`) inside PostgreSQL because the index pages are pre-sorted by `question_index`.

### Database Migration SQL
Run this script in your Supabase SQL Editor to apply all indexing performance improvements:
```sql
CREATE INDEX IF NOT EXISTS idx_session_responses_session_question ON session_responses(session_id, question_index);
```
