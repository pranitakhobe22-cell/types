import { supabase } from './supabaseClient';
import { 
    Candidate, JobPost, Question, RoleSettings, 
    EvaluationResult, InterviewSession, ProctoringReport, 
    ProctorViolation, TimelineEvent, DashboardTelemetry
} from '../types';

export class SupabaseService {
    static logStatusChange: any;


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
            
        if (error) throw error;
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
    static async createSession(candidateId: string, jobPostId: string, deviceInfo: any, metadata: any) {
        const payload: any = {
            candidate_id: candidateId,
            status: 'CREATED'
        };
        if (jobPostId) payload.job_post_id = jobPostId;

        const { data, error } = await supabase
            .from('interview_sessions')
            .insert(payload)
            .select('*')
            .single();

        if (error) throw error;
        
        return data;
    }

    static async getAllSessions() {
        const { data, error } = await supabase
            .from('view_master_session_record')
            .select('*')
            .order('session_date', { ascending: false });

        if (error) throw error;
        
        // Patch: The database view often queries the wrong table (question_evaluations) instead of session_responses
        // We will fetch session_responses manually to ensure the Admin Dashboard has the full breakdown
        try {
            const { data: responses } = await supabase.from('session_responses').select('*');
            if (data && responses) {
                data.forEach(session => {
                    const sessionResponses = responses.filter(r => r.session_id === session.session_id);
                    // If the view missed the answers, manually attach them from session_responses
                    if (sessionResponses.length > 0 && (!session.all_questions_and_answers || session.all_questions_and_answers.length === 0)) {
                        session.all_questions_and_answers = sessionResponses.map(r => ({
                            question_text: r.question_text,
                            candidate_answer: r.candidate_answer,
                            content_score: r.content_score,
                            grammar_score: r.grammar_score,
                            fluency_score: r.fluency_score,
                            verdict: r.verdict,
                            feedback: r.feedback
                        }));
                    }
                });
            }
        } catch (e) {
            console.warn("Failed to manually join session_responses:", e);
        }

        return data;
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
    static async saveResponse(sessionId: string, questionIndex: number, result: any, idealAnswer: string) {
        const payload = {
            session_id: sessionId,
            question_index: questionIndex,
            question_text: result.questionText,
            candidate_answer: result.userAnswer,
            ideal_answer: idealAnswer,
            
            // Mapping EvaluationResult
            content_score: result.contentScore || null,
            grammar_score: result.grammarScore || null,
            fluency_score: result.fluencyScore || null,
            verdict: result.verdict || null,
            feedback: result.feedback || null,
            
            // Auditable Fields
            expected_key_points: result.matchedKeyPoints ? [...result.matchedKeyPoints, ...(result.missingKeyPoints || [])] : null,
            detected_key_points: result.matchedKeyPoints || null,
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
            throw error;
        }
    }

    // ==========================================
    // PROCTORING
    // ==========================================
    static async saveProctoringReport(sessionId: string, report: any, telemetry: DashboardTelemetry) {
        const events: any[] = [];
        
        // Convert Violations to Events
        if (report.violations && report.violations.length > 0) {
            report.violations.forEach((v: ProctorViolation) => {
                events.push({
                    session_id: sessionId,
                    event_type: v.type,
                    severity: v.severity > 5 ? 'High' : (v.severity > 2 ? 'Medium' : 'Low'),
                    risk_points: v.severity > 5 ? 15 : (v.severity > 2 ? 5 : 1),
                    message: v.message,
                    snapshot_url: v.snapshot_url,
                    clip_url: v.clip_url,
                    occurred_at: new Date(v.timestamp).toISOString()
                });
            });
        }

        // Convert Timeline to Events
        if (report.timeline && report.timeline.length > 0) {
            report.timeline.forEach((t: TimelineEvent) => {
                events.push({
                    session_id: sessionId,
                    event_type: t.event,
                    severity: t.severity > 5 ? 'High' : (t.severity > 2 ? 'Medium' : 'Low'),
                    risk_points: t.severity > 5 ? 10 : (t.severity > 2 ? 5 : 1),
                    message: t.detail || t.event,
                    occurred_at: new Date(t.timestamp).toISOString()
                });
            });
        }
        
        if (events.length > 0) {
            // Insert in chunks of 100
            for (let i = 0; i < events.length; i += 100) {
                const chunk = events.slice(i, i + 100);
                await supabase.from('proctoring_events').insert(chunk);
            }
        }
        
        return sessionId;
    }

    // ==========================================
    // EVALUATION REPORTS
    // ==========================================
    static async saveEvaluationReport(sessionId: string, report: any) {
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
                candidate_outcome: 'Pending'
            }, { onConflict: 'session_id' });

        if (error) {
            console.error("Supabase Evaluation Report Error Details:", error.message, error.details, error.hint);
            throw error;
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

        if (error) throw error;
        
        const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
        return urlData.publicUrl;
    }
}
