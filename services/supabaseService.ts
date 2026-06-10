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

    static async completeSession(sessionId: string, durationSeconds: number) {
        const { error } = await supabase
            .from('interview_sessions')
            .update({ 
                status: 'COMPLETED',
                completed_at: new Date().toISOString(),
                duration_seconds: durationSeconds
            })
            .eq('id', sessionId);

        if (error) throw error;
    }



    // ==========================================
    // SESSION RESPONSES
    // ==========================================
    static async saveResponse(sessionId: string, questionIndex: number, result: any, speechMetrics: any) {
        const { error } = await supabase
            .from('session_responses')
            .insert({
                session_id: sessionId,
                question_index: questionIndex,
                question_text: result.questionText,
                candidate_answer: result.userAnswer,
                content_score: result.contentScore,
                grammar_score: result.grammarScore,
                fluency_score: result.fluencyScore,
                confidence_score: result.confidenceScore,
                verdict: result.verdict,
                feedback: result.feedback,
                question_snapshot: result.questionSnapshot,
                ideal_answer_snapshot: result.idealAnswerSnapshot,
                expected_key_points: result.expectedKeyPoints,
                detected_key_points: result.detectedKeyPoints,
                missing_key_points: result.missingKeyPoints,
                deduction_reason: result.deductionReason,
                bonus_reason: result.bonusReason,
                response_duration_seconds: result.responseDurationSeconds,
                expression_analysis: result.expressionAnalysis,
                speech_rate_wpm: speechMetrics?.wpm,
                pause_count: speechMetrics?.pauses,
                filler_word_count: speechMetrics?.fillers
            });

        if (error) throw error;
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
        const { error } = await supabase
            .from('evaluation_reports')
            .upsert({
                session_id: sessionId,
                total_score: report.totalScore,
                technical_score: report.technicalScore,
                communication_score: report.communicationScore,
                confidence_score: report.confidenceScore,
                proctoring_score: report.proctoringScore,
                final_verdict: report.finalVerdict,
                hiring_recommendation: report.hiringRecommendation || 'Consider',
                strengths: report.detailedAnalysis?.strengths || [],
                failures: report.detailedAnalysis?.failures || [],
                verdict_justification: report.verdictJustification,
                evaluation_logic: report.evaluationLogic || {},
                risk_score: report.riskScore,
                risk_level: report.riskLevel,
                risk_reason: report.riskReason || [],
                proctoring_summary: report.proctoringSummary || {},
                evaluation_weights_snapshot: report.evaluationWeightsSnapshot || {},
                evaluation_version: report.evaluationVersion,
                evaluation_model: report.evaluationModel,
                evaluation_prompt_version: report.evaluationPromptVersion,
                evaluated_at: report.evaluatedAt || new Date().toISOString(),
                candidate_outcome: report.candidateOutcome
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
