# Reicrew AI — Connectivity & Data Integrity Audit Report

**Generated**: 2026-06-23 19:26:19

**Score**: 39/42 (92%)

---

## CRUD

| Test | Status | Detail |
|---|---|---|
| INSERT candidates | ✅ PASS | id=0442a2b5… |
| SELECT candidates | ✅ PASS |  |
| UPDATE candidates | ✅ PASS | HTTP 200 |
| SELECT job_posts | ✅ PASS | Found 1 job(s) |
| INSERT interview_sessions | ✅ PASS | id=ed4a3c4a… |
| TRIGGER candidate_name (sessions) | ✅ PASS | name='Audit Test Candidate' |
| SELECT interview_sessions | ✅ PASS |  |
| UPDATE interview_sessions | ✅ PASS |  |
| INSERT session_responses (3 Q&As) | ✅ PASS |  |
| SELECT session_responses | ✅ PASS | Expected 3, got 3 |
| INSERT proctoring_events (2 events) | ✅ PASS |  |
| INSERT evaluation_reports | ✅ PASS |  |
| INSERT contradictions | ✅ PASS |  |
| INSERT validation_results | ✅ PASS |  |
| UPDATE session → COMPLETED | ✅ PASS |  |

## FK

| Test | Status | Detail |
|---|---|---|
| candidate → session link | ✅ PASS | Found 1 session(s) |
| session → responses link | ✅ PASS | Expected 3, got 3 |
| session → evaluation_reports link | ✅ PASS | Got 1 |
| session → proctoring_events link | ✅ PASS | Got 2 |
| session → contradictions link | ✅ PASS | Got 1 |
| session → validation_results link | ✅ PASS | Got 1 |

## ORPHAN

| Test | Status | Detail |
|---|---|---|
| session_responses → orphaned rows | ✅ PASS | Checked 20 unique sessions, 0 orphaned |
| proctoring_events → orphaned rows | ✅ PASS | Checked 20 unique sessions, 0 orphaned |

## VIEWS

| Test | Status | Detail |
|---|---|---|
| SELECT vw_candidate_master | ✅ PASS | 5 row(s) returned |
| SELECT vw_candidate_qa_details | ✅ PASS | 5 row(s) returned |
| SELECT vw_candidate_proctoring | ✅ PASS | 5 row(s) returned |
| SELECT vw_candidate_evaluation | ✅ PASS | 5 row(s) returned |
| SELECT vw_candidate_scoring_breakdown | ✅ PASS | 0 row(s) returned |
| SELECT vw_interview_timeline | ✅ PASS | 5 row(s) returned |
| SELECT vw_candidate_report_export | ✅ PASS | 5 row(s) returned |
| vw_candidate_master data accuracy | ✅ PASS | candidate_name=✓, overall_score=✓, session_status=✓, recommendation=✓ |

## COUNTS

| Test | Status | Detail |
|---|---|---|
| candidates | ✅ PASS | 806 rows |
| job_posts | ✅ PASS | 1 rows |
| interview_sessions | ✅ PASS | 798 rows |
| session_responses | ✅ PASS | 4407 rows |
| evaluation_reports | ✅ PASS | 698 rows |
| proctoring_events | ✅ PASS | 698 rows |
| contradictions | ✅ PASS | 1 rows |
| validation_results | ✅ PASS | 1 rows |

## STORAGE

| Test | Status | Detail |
|---|---|---|
| Bucket 'identity-documents' | ❌ FAIL | MISSING |
| Bucket 'proctoring-snapshots' | ❌ FAIL | MISSING |
| Bucket 'proctoring-clips' | ❌ FAIL | MISSING |

