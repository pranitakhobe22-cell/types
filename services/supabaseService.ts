import { supabase } from './supabaseClient';
import { 
    Candidate, JobPost, Question, RoleSettings, 
    EvaluationResult, InterviewSession, ProctoringReport, 
    ProctorViolation, TimelineEvent, DashboardTelemetry,
    ProctoringSettings, DEFAULT_PROCTORING_SETTINGS,
    ensureFeedbackStructure
} from '../types';
import { ErrorLogService } from './errorLogService';
import { CSE_QUESTION_BANK, ECE_QUESTION_BANK, APTITUDE_QUESTION_BANK } from './questionBank';

export class SupabaseService {
    static logStatusChange: any;

    static async seedDefaultJobsIfMissing() {
        try {
            const { data: existingJobs, error } = await supabase.from('job_posts').select('id, title');
            if (error) throw error;

            const existingTitles = existingJobs ? existingJobs.map(j => j.title.toLowerCase()) : [];
            
            const seedRoles = [
                {
                    title: 'Computer Science (CSE)',
                    description: 'Core evaluation for Computer Science fundamentals, DBMS, OS, Networking, and DSA.',
                    questions: CSE_QUESTION_BANK,
                    accessKey: 'CS123',
                    settings: {
                        difficulty: 'Medium',
                        preset: 'Normal',
                        assessmentType: 'VOICE_INTERVIEW',
                        weights: { concept: 50, grammar: 20, fluency: 20, camera: 10 },
                        proctoring: { 
                            maxWarnings: 3, 
                            sensitivity: 'Medium', 
                            includeInScore: true,
                            enabled: true,
                            camera: { mode: 'auto' }
                        }
                    }
                },
                {
                    title: 'Electronics (ECE)',
                    description: 'Core evaluation for Electronics, Embedded Systems, Signal Processing, and Circuits.',
                    questions: ECE_QUESTION_BANK,
                    accessKey: 'ECE123',
                    settings: {
                        difficulty: 'Medium',
                        preset: 'Normal',
                        assessmentType: 'VOICE_INTERVIEW',
                        weights: { concept: 50, grammar: 20, fluency: 20, camera: 10 },
                        proctoring: { 
                            maxWarnings: 3, 
                            sensitivity: 'Medium', 
                            includeInScore: true,
                            enabled: true,
                            camera: { mode: 'auto' }
                        }
                    }
                },
                {
                    title: 'Aptitude',
                    description: 'Placement preparation and campus hiring aptitude test.',
                    questions: APTITUDE_QUESTION_BANK,
                    accessKey: 'APT123',
                    settings: {
                        difficulty: 'Medium',
                        preset: 'Normal',
                        assessmentType: 'MCQ',
                        weights: { concept: 100, grammar: 0, fluency: 0, camera: 0 },
                        proctoring: { 
                            maxWarnings: 3, 
                            sensitivity: 'Medium', 
                            includeInScore: true,
                            enabled: true,
                            camera: { mode: 'auto' }
                        }
                    }
                }
            ];

            for (const role of seedRoles) {
                if (!existingTitles.includes(role.title.toLowerCase())) {
                    console.log(`Seeding default job post: ${role.title}`);
                    const { error: insertError } = await supabase.from('job_posts').insert({
                        title: role.title,
                        description: role.description,
                        mode: 'AI',
                        status: 'ACTIVE',
                        difficulty: 'Medium',
                        company: 'Reicrew AI',
                        access_key: role.accessKey,
                        questions: role.questions,
                        settings: role.settings
                    });
                    if (insertError) {
                        console.error(`Failed to seed ${role.title}:`, insertError.message);
                        ErrorLogService.logError('database', `Failed to seed default job post ${role.title}: ${insertError.message}`, insertError);
                    }
                }
            }
        } catch (e: any) {
            console.error("Database seeding check failed:", e);
            ErrorLogService.logError('system', `Database seeding check failed: ${e.message || e}`, e);
        }
    }


    // ==========================================
    // CANDIDATES
    // ==========================================
    static async upsertCandidate(candidate: { name: string, email: string, role?: string }) {
        const { data, error } = await supabase
            .from('candidates')
            .upsert({
                name: candidate.name,
                email: candidate.email,
                applied_role: candidate.role
            }, { onConflict: 'email' })
            .select('*')
            .single();
            
        if (error) {
            ErrorLogService.logError('database', `Upsert candidate failed for email ${candidate.email}: ${error.message}`, error);
            throw error;
        }
        return data;
    }

    static async getCandidateByEmail(email: string) {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .eq('email', email)
            .single();
            
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
        return data;
    }

    // ==========================================
    // JOB POSTS
    // ==========================================
    static async getJobById(jobId: string) {
        const { data, error } = await supabase
            .from('job_posts')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error) throw error;
        return data;
    }

    static async getAllJobs() {
        const { data, error } = await supabase
            .from('job_posts')
            .select('*');

        if (error) throw error;
        return data;
    }



    // ==========================================
    // INTERVIEW SESSIONS
    // ==========================================
    static async createSession(candidateId: string, jobPostId: string, deviceInfo: any, metadata: any, candidateName?: string) {
        let jobSettingsSnapshot = {};
        try {
            if (jobPostId) {
                const { data: job } = await supabase
                    .from('job_posts')
                    .select('settings')
                    .eq('id', jobPostId)
                    .single();
                if (job && job.settings) {
                    jobSettingsSnapshot = job.settings;
                }
            }
        } catch (jobErr) {
            console.warn("[createSession] Failed to fetch job settings for snapshot:", jobErr);
        }

        const payload: any = {
            candidate_id: candidateId,
            status: 'CREATED',
            interview_metadata: {
                device_info: deviceInfo || {},
                job_settings_snapshot: jobSettingsSnapshot,
                ...metadata
            }
        };
        if (jobPostId) payload.job_post_id = jobPostId;
        if (candidateName) payload.candidate_name = candidateName;

        const { data, error } = await supabase
            .from('interview_sessions')
            .insert(payload)
            .select('*')
            .single();

        if (error) {
            ErrorLogService.logError('database', `Create session failed: ${error.message}`, error, undefined, candidateName);
            throw error;
        }
        
        return data;
    }

    static async getSession(sessionId: string) {
        const { data, error } = await supabase
            .from('interview_sessions')
            .select('*')
            .eq('id', sessionId)
            .single();
        if (error) throw error;
        return data;
    }

    static async updateSessionMetadata(sessionId: string, patch: any) {
        // Fetch current session
        const { data: current } = await supabase
            .from('interview_sessions')
            .select('interview_metadata')
            .eq('id', sessionId)
            .single();
            
        const currentMeta = current?.interview_metadata || {};
        const updatedMeta = {
            ...currentMeta,
            ...patch,
            runtime: {
                ...(currentMeta.runtime || {}),
                ...(patch.runtime || {})
            }
        };

        const { error } = await supabase
            .from('interview_sessions')
            .update({ interview_metadata: updatedMeta })
            .eq('id', sessionId);
            
        if (error) {
            console.error("[supabaseService] updateSessionMetadata error:", error);
        }
    }

    static async getAllSessions() {
        // 1. Fetch from vw_candidate_master (excluding non-completed sessions that are just 'CREATED')
        const { data: masterRecords, error } = await supabase
            .from('vw_candidate_master')
            .select('*')
            .neq('session_status', 'CREATED')
            .order('interview_date', { ascending: false });

        if (error) {
            console.error("Supabase getAllSessions error:", error);
            ErrorLogService.logError('database', `Get all sessions failed: ${error.message}`, error);
            throw error;
        }

        if (!masterRecords) return [];

        try {
            // 2. Fetch session_responses for Q&A details
            const { data: responses } = await supabase.from('session_responses').select('*');
            // 3. Fetch evaluation_reports for the full master report JSON
            const { data: reports } = await supabase.from('evaluation_reports').select('*');
            // 4. Fetch proctoring_events
            const { data: violations } = await supabase.from('proctoring_events').select('*');

            // 5. Merge them in memory
            return masterRecords.map(record => {
                const sessionId = record.session_id;

                const sessionResponses = responses ? responses.filter(r => r.session_id === sessionId) : [];
                const sessionReport = reports ? reports.find(r => r.session_id === sessionId) : null;
                const sessionViolations = violations ? violations.filter(v => v.session_id === sessionId) : [];

                return {
                    session_id: record.session_id,
                    candidate_name: record.candidate_name,
                    candidate_email: record.candidate_email,
                    job_title: record.role, // Align with AdminDashboard rs.job_title
                    role: record.role,      // Also provide role
                    session_status: record.session_status,
                    session_date: record.interview_date,
                    total_score: record.overall_score,
                    duration_minutes: record.duration_minutes,
                    questions_asked: record.questions_asked,
                    questions_answered: record.questions_answered,
                    strengths: record.strengths || [],
                    weaknesses: record.weaknesses || [],
                    risk_score: record.risk_score,
                    risk_level: record.risk_level,
                    recommendation: record.recommendation,
                    candidate_outcome: record.candidate_outcome,
                    
                    // Joined tables data formatted for AdminDashboard
                    all_questions_and_answers: sessionResponses.map(r => ({
                        question_text: r.question_text,
                        candidate_answer: r.candidate_answer,
                        content_score: r.content_score,
                        grammar_score: r.grammar_score,
                        fluency_score: r.fluency_score,
                        verdict: r.verdict,
                        feedback: ensureFeedbackStructure(r.feedback)
                    })),
                    all_proctoring_events: sessionViolations.map(v => ({
                        type: v.event_type || v.type,
                        severity: v.severity,
                        message: v.detail || v.message,
                        time: v.occurred_at || v.timestamp,
                        snapshot_url: v.snapshot_url,
                        clip_url: v.clip_url
                    })),
                    evaluation_logic: sessionReport ? sessionReport.evaluation_logic : null,
                    final_verdict: sessionReport ? sessionReport.final_verdict : null,
                    verdict_justification: sessionReport ? sessionReport.verdict_justification : null,
                    is_deleted: record.is_deleted
                };
            });
        } catch (e) {
            console.warn("Failed to manually join session data:", e);
            // Fallback: return masterRecords with raw mapping
            return masterRecords.map(record => ({
                session_id: record.session_id,
                candidate_name: record.candidate_name,
                candidate_email: record.candidate_email,
                job_title: record.role,
                role: record.role,
                session_status: record.session_status,
                session_date: record.interview_date,
                total_score: record.overall_score,
                duration_minutes: record.duration_minutes,
                questions_asked: record.questions_asked,
                questions_answered: record.questions_answered,
                strengths: record.strengths || [],
                weaknesses: record.weaknesses || [],
                is_deleted: record.is_deleted
            }));
        }
    }

    static async updateSessionStatus(sessionId: string, newStatus: string, reason?: string) {
        const { data: session } = await supabase.from('interview_sessions').select('status').eq('id', sessionId).single();
        const oldStatus = session?.status;

        const { error } = await supabase
            .from('interview_sessions')
            .update({ 
                status: newStatus, 
                termination_reason: reason,
                completed_at: newStatus === 'TERMINATED' ? new Date().toISOString() : undefined 
            })
            .eq('id', sessionId);

        if (error) throw error;
    }

    static async completeSession(sessionId: string, durationSeconds: number, status: 'COMPLETED' | 'TERMINATED' = 'COMPLETED') {
        const { error } = await supabase
            .from('interview_sessions')
            .update({ 
                status: status,
                completed_at: new Date().toISOString(),
                duration_seconds: durationSeconds
            })
            .eq('id', sessionId);

        if (error) throw error;
    }



    // ==========================================
    // SESSION RESPONSES
    // ==========================================
    static async saveResponse(sessionId: string, questionIndex: number, result: any, idealAnswer: string, candidateName?: string) {
        const payload = {
            session_id: sessionId,
            candidate_name: candidateName || null,
            question_index: questionIndex,
            question_text: result.questionText,
            candidate_answer: result.userAnswer,
            ideal_answer: idealAnswer,
            
            // Mapping EvaluationResult
            content_score: result.contentScore || null,
            grammar_score: result.grammarScore || null,
            fluency_score: result.fluencyScore || null,
            verdict: (() => {
                if (!result.verdict) return null;
                const v = String(result.verdict).toLowerCase();
                if (v.includes('excel') || v.includes('good') || v.includes('pass')) return 'Pass';
                if (v.includes('border') || v.includes('partial')) return 'Borderline';
                if (v.includes('fail') || v.includes('poor')) return 'Fail';
                return 'Borderline';
            })(),
            feedback: result.feedback ? JSON.stringify(result.feedback) : null,
            
            // Auditable Fields — use explainedConcepts (actually demonstrated) for detected, mentionedConcepts for identified
            expected_key_points: result.mentionedConcepts ? [...result.mentionedConcepts, ...(result.missingKeyPoints || [])] : (result.matchedKeyPoints ? [...result.matchedKeyPoints, ...(result.missingKeyPoints || [])] : null),
            detected_key_points: result.explainedConcepts?.length ? result.explainedConcepts : (result.matchedKeyPoints || null),
            missing_key_points: result.missingKeyPoints || null,
            
            // We can store confidence score & expression in question_snapshot or ignore them 
            // since they don't have dedicated columns in the v5 schema.
            // Using deduction_reason as a placeholder for visual analysis feedback if needed
            deduction_reason: result.expressionAnalysis || null
        };

        const { error } = await supabase
            .from('session_responses')
            .insert(payload);

        if (error) {
            console.error("Supabase Save Response Error:", error);
            ErrorLogService.logError('database', `Save response failed for index ${questionIndex}: ${error.message}`, error, sessionId, candidateName);
            throw error;
        }
    }

    // ==========================================
    // PROCTORING
    // ==========================================
    static async insertProctoringEvents(events: any[]) {
        if (events.length === 0) return;
        const { error } = await supabase.from('proctoring_events').insert(events);
        if (error) {
            console.error("Supabase insertProctoringEvents Error:", error);
            throw error;
        }
    }

    static async saveProctoringReport(
        sessionId: string, 
        report: any, 
        telemetry: DashboardTelemetry, 
        candidateName?: string,
        flushedEventIds: string[] = []
    ) {
        const flushedSet = new Set(flushedEventIds);
        const events: any[] = [];
        
        // Convert Violations to Events
        if (report.violations && report.violations.length > 0) {
            report.violations.forEach((v: ProctorViolation) => {
                if (!flushedSet.has(v.id)) {
                    events.push({
                        session_id: sessionId,
                        candidate_name: candidateName || null,
                        event_type: v.type,
                        severity: v.severity > 5 ? 'High' : (v.severity > 2 ? 'Medium' : 'Low'),
                        risk_points: v.severity > 5 ? 15 : (v.severity > 2 ? 5 : 1),
                        message: v.message,
                        snapshot_url: v.snapshot_url,
                        clip_url: v.clip_url,
                        occurred_at: new Date(v.timestamp).toISOString()
                    });
                }
            });
        }

        // Convert Timeline to Events
        if (report.timeline && report.timeline.length > 0) {
            report.timeline.forEach((t: TimelineEvent) => {
                if (t.id && !flushedSet.has(t.id)) {
                    events.push({
                        session_id: sessionId,
                        candidate_name: candidateName || null,
                        event_type: t.event,
                        severity: t.severity > 5 ? 'High' : (t.severity > 2 ? 'Medium' : 'Low'),
                        risk_points: t.severity > 5 ? 10 : (t.severity > 2 ? 5 : 1),
                        message: t.detail || t.event,
                        occurred_at: new Date(t.timestamp).toISOString()
                    });
                }
            });
        }
        
        if (events.length > 0) {
            // Insert in chunks of 100
            for (let i = 0; i < events.length; i += 100) {
                const chunk = events.slice(i, i + 100);
                const { error } = await supabase.from('proctoring_events').insert(chunk);
                if (error) {
                    console.error("Supabase Save Proctoring Report Chunk Error:", error);
                    throw error;
                }
            }
        }
        
        return sessionId;
    }

    // ==========================================
    // EVALUATION REPORTS
    // ==========================================
    static async saveEvaluationReport(sessionId: string, report: any, candidateName?: string) {
        // Enforce strict Enum matching for the Postgres CHECK constraint
        const allowedRecommendations = ['Strong Hire', 'Hire', 'Consider', 'Reject'];
        let sanitizedRecommendation = 'Consider';
        
        const rec = report.executiveSummary?.recommendation || report.hiringRecommendation;
        if (rec) {
            const normalized = rec.trim();
            const match = allowedRecommendations.find(r => r.toLowerCase() === normalized.toLowerCase());
            if (match) {
                sanitizedRecommendation = match;
            } else if (normalized.toLowerCase().includes('strong')) {
                sanitizedRecommendation = 'Strong Hire';
            } else if (normalized.toLowerCase().includes('reject') || normalized.toLowerCase().includes('fail')) {
                sanitizedRecommendation = 'Reject';
            } else if (normalized.toLowerCase().includes('hire')) {
                sanitizedRecommendation = 'Hire';
            }
        }

        const integrity = report.proctoringSummary?.integrityScore ?? 100;
        const riskScore = 100 - integrity;
        const riskLevel = riskScore > 60 ? 'Critical' : riskScore > 40 ? 'High' : riskScore > 15 ? 'Medium' : 'Low';
        const riskReason = report.contradictions ? report.contradictions.map((c: any) => c.explanation) : [];

        const { error } = await supabase
            .from('evaluation_reports')
            .upsert({
                session_id: sessionId,
                candidate_name: candidateName || null,
                total_score: report.overallScores?.difficultyWeightedPerformance ?? report.totalScore ?? 50,
                technical_score: report.executiveSummary?.technicalScore ?? null,
                communication_score: report.overallScores?.communicationScore ?? null,
                confidence_score: report.overallScores?.consistencyScore ?? null,
                proctoring_score: integrity,
                final_verdict: report.executiveSummary?.summary ?? report.finalVerdict ?? "",
                hiring_recommendation: sanitizedRecommendation,
                strengths: report.strengths || [],
                failures: report.weaknesses || [],
                verdict_justification: report.executiveSummary?.summary ?? report.verdictJustification ?? "",
                evaluation_logic: report, // The full MasterEvaluationReport
                risk_score: riskScore,
                risk_level: riskLevel,
                risk_reason: riskReason,
                proctoring_summary: report.proctoringSummary || {},
                evaluation_weights_snapshot: {},
                evaluation_version: report.metadata?.evaluationVersion ?? "11.0",
                evaluation_model: report.metadata?.modelUsed ?? "gemini-2.5-flash-lite",
                evaluation_prompt_version: "11.0",
                evaluated_at: new Date().toISOString(),
                candidate_outcome: 'PENDING',

                // New columns
                trust_score: report.executiveSummary?.trustScore ?? null,
                topic_coverage: report.executiveSummary?.topicCoverage ?? null,
                knowledge_stability: report.executiveSummary?.knowledgeStability ?? null,
                reasoning_score: report.overallScores?.reasoningScore ?? null,
                consistency_score: report.overallScores?.consistencyScore ?? null,
                difficulty_weighted_performance: report.overallScores?.difficultyWeightedPerformance ?? null,
                report_confidence: report.executiveSummary?.reportConfidence ?? null,
                recommendation_status: report.executiveSummary?.recommendationStatus ?? null,
                score_calculation_version: report.metadata?.scoreCalculationVersion ?? null
            }, { onConflict: 'session_id' });

        if (error) {
            console.error("Supabase Evaluation Report Error Details:", error.message, error.details, error.hint);
            ErrorLogService.logError('database', `Save evaluation report failed: ${error.message}`, error, sessionId, candidateName);
            throw error;
        }

        // Sync the overall_score back to the main interview_sessions table
        const finalScore = report.overallScores?.difficultyWeightedPerformance ?? report.totalScore ?? 50;
        const { error: sessionUpdateError } = await supabase
            .from('interview_sessions')
            .update({ overall_score: finalScore })
            .eq('id', sessionId);

        if (sessionUpdateError) {
            console.error("Error updating overall_score in interview_sessions:", sessionUpdateError.message);
        }

        // Save contradictions
        if (report.contradictions && report.contradictions.length > 0) {
            try {
                await supabase.from('contradictions').delete().eq('session_id', sessionId);
                
                const contradictionPayloads = report.contradictions.map((c: any) => ({
                    session_id: sessionId,
                    candidate_name: candidateName || null,
                    q_index1: Number(c.qIndex1),
                    q_index2: Number(c.qIndex2),
                    explanation: c.explanation,
                    severity: c.severity || 'medium',
                    status: c.status || 'possible',
                    confidence: Number(c.confidence ?? 80)
                }));
                const { error: contrErr } = await supabase.from('contradictions').insert(contradictionPayloads);
                if (contrErr) console.error("Error saving contradictions:", contrErr.message);
            } catch (e) {
                console.error("Contradictions save exception:", e);
            }
        }

        // Save validation results
        if (report.validationResults && report.validationResults.length > 0) {
            try {
                await supabase.from('validation_results').delete().eq('session_id', sessionId);
                
                const validationPayloads = report.validationResults.map((vr: any) => ({
                    session_id: sessionId,
                    candidate_name: candidateName || null,
                    parent_question: vr.parentQuestion,
                    parent_score: Number(vr.parentScore),
                    followup_question: vr.followupQuestion,
                    followup_score: Number(vr.followupScore),
                    reliability: Number(vr.reliability)
                }));
                const { error: valErr } = await supabase.from('validation_results').insert(validationPayloads);
                if (valErr) console.error("Error saving validation results:", valErr.message);
            } catch (e) {
                console.error("Validation results save exception:", e);
            }
        }
    }

    // ==========================================
    // STORAGE UPLOADS
    // ==========================================
    static async uploadFile(bucket: string, path: string, file: Blob, mimeType: string) {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                contentType: mimeType,
                upsert: true
            });

        if (error) {
            ErrorLogService.logError('database', `Upload file to bucket "${bucket}" failed: ${error.message}`, error);
            throw error;
        }
        
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return urlData.publicUrl;
    }

    // ==========================================
    // SYSTEM SETTINGS & METRICS
    // ==========================================
    static async getSystemSettings(key: string): Promise<any | null> {
        try {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('system_settings')
                .select('value')
                .eq('key', key)
                .single();
            if (error) {
                if (error.code === 'PGRST116') return null; // Row not found
                throw error;
            }
            return data?.value || null;
        } catch (e) {
            console.error(`Failed to get system settings for key ${key}:`, e);
            return null;
        }
    }

    static async saveSystemSettings(key: string, value: any, updatedBy: string = 'Super Admin'): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase
                .from('system_settings')
                .upsert({
                    key,
                    value,
                    updated_at: new Date().toISOString(),
                    updated_by: updatedBy
                }, { onConflict: 'key' });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error(`Failed to save system settings for key ${key}:`, e);
            return false;
        }
    }

    static async getSystemSettingsMetadata(key: string): Promise<{ updated_at: string, updated_by: string } | null> {
        try {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('system_settings')
                .select('updated_at, updated_by')
                .eq('key', key)
                .single();
            if (error) throw error;
            return data;
        } catch (e) {
            return null;
        }
    }

    static async incrementSystemUsageStats(promptTokens: number, completionTokens: number): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase.rpc('increment_usage_stats', {
                p_prompt_tokens: promptTokens,
                p_completion_tokens: completionTokens
            });
            if (error) throw error;
            return true;
        } catch (e) {
            console.error("Failed to increment system usage stats:", e);
            return false;
        }
    }

    static async getSystemUsageStats(): Promise<{ prompt_tokens: number, completion_tokens: number, total_tokens: number, total_calls: number } | null> {
        try {
            if (!supabase) return null;
            const { data, error } = await supabase
                .from('system_usage_stats')
                .select('*')
                .eq('key', 'openrouter_usage')
                .single();
            if (error) {
                if (error.code === 'PGRST116') return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0, total_calls: 0 };
                throw error;
            }
            return {
                prompt_tokens: Number(data.prompt_tokens || 0),
                completion_tokens: Number(data.completion_tokens || 0),
                total_tokens: Number(data.total_tokens || 0),
                total_calls: Number(data.total_calls || 0)
            };
        } catch (e) {
            console.error("Failed to get system usage stats:", e);
            return null;
        }
    }

    static async softDeleteSession(sessionId: string): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase
                .from('interview_sessions')
                .update({
                    is_deleted: true,
                    deleted_at: new Date().toISOString()
                })
                .eq('id', sessionId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error(`Failed to soft delete session ${sessionId}:`, e);
            return false;
        }
    }

    static async restoreSession(sessionId: string): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase
                .from('interview_sessions')
                .update({
                    is_deleted: false,
                    deleted_at: null
                })
                .eq('id', sessionId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error(`Failed to restore session ${sessionId}:`, e);
            return false;
        }
    }

    static async hardDeleteSession(sessionId: string): Promise<boolean> {
        try {
            if (!supabase) return false;
            const { error } = await supabase
                .from('interview_sessions')
                .delete()
                .eq('id', sessionId);
            if (error) throw error;
            return true;
        } catch (e) {
            console.error(`Failed to hard delete session ${sessionId}:`, e);
            return false;
        }
    }

    static async initializeSystemSettings(): Promise<boolean> {
        try {
            if (!supabase) return false;
            const settings = await SupabaseService.getSystemSettings('proctoring_settings');
            if (!settings) {
                console.log("Seeding default proctoring settings in system_settings table...");
                await SupabaseService.saveSystemSettings('proctoring_settings', DEFAULT_PROCTORING_SETTINGS, 'System Initializer');
            }
            return true;
        } catch (e) {
            console.error("Failed to initialize system settings:", e);
            return false;
        }
    }

    // ─── Phone Camera Proctoring: Pairing Token Management ───────────────

    /**
     * Generate an 8-character uppercase alphanumeric pairing token with 10-minute expiry.
     * The token is one-time-use: once a phone connects, consumed_at is set.
     */
    static async generatePairingToken(sessionId: string): Promise<string> {
        if (!supabase) throw new Error('Supabase not initialized');

        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I/O/0/1 to avoid confusion
        let token = '';
        const randomValues = new Uint8Array(8);
        crypto.getRandomValues(randomValues);
        for (let i = 0; i < 8; i++) {
            token += chars[randomValues[i] % chars.length];
        }

        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

        const { error } = await supabase.from('proctoring_pairing_tokens').insert({
            session_id: sessionId,
            token,
            expires_at: expiresAt,
        });

        if (error) {
            // If token collision (extremely rare with 8 chars), retry once
            if (error.code === '23505') {
                return SupabaseService.generatePairingToken(sessionId);
            }
            throw error;
        }

        console.log(`[PairingToken] Generated token ${token} for session ${sessionId}, expires ${expiresAt}`);
        return token;
    }

    /**
     * Resolve a pairing token to a session. Returns null if expired, already consumed, or not found.
     */
    static async getSessionFromToken(token: string): Promise<{
        sessionId: string;
        candidateName: string;
    } | null> {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('proctoring_pairing_tokens')
            .select('session_id, consumed_at, expires_at')
            .eq('token', token.toUpperCase().trim())
            .single();

        if (error || !data) return null;

        // Check if already consumed
        if (data.consumed_at) {
            console.warn(`[PairingToken] Token ${token} already consumed`);
            return null;
        }

        // Check expiry
        if (new Date(data.expires_at) < new Date()) {
            console.warn(`[PairingToken] Token ${token} expired`);
            return null;
        }

        // Fetch candidate name from the linked session
        const { data: session, error: sessionError } = await supabase
            .from('interview_sessions')
            .select('id, candidate_name')
            .eq('id', data.session_id)
            .single();

        if (sessionError || !session) return null;

        return {
            sessionId: session.id,
            candidateName: session.candidate_name,
        };
    }

    /**
     * Mark a pairing token as consumed (one-time-use) and bind the phone's connectionId.
     * Returns false if the token was already consumed or not found.
     */
    static async consumePairingToken(token: string, connectionId: string): Promise<boolean> {
        if (!supabase) return false;

        const { data, error } = await supabase
            .from('proctoring_pairing_tokens')
            .update({
                consumed_at: new Date().toISOString(),
                connection_id: connectionId,
            })
            .eq('token', token.toUpperCase().trim())
            .is('consumed_at', null)
            .select('id')
            .single();

        if (error || !data) {
            console.warn(`[PairingToken] Failed to consume token ${token}:`, error);
            return false;
        }

        console.log(`[PairingToken] Token ${token} consumed by connection ${connectionId}`);
        return true;
    }
}
