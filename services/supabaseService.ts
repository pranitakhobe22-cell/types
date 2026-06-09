import { supabase } from './supabaseClient';
import { 
    Candidate, JobPost, Question, RoleSettings, 
    EvaluationResult, InterviewSession, ProctoringReport, 
    ProctorViolation, TimelineEvent, DashboardTelemetry
} from '../types';

export class SupabaseService {

    // ==========================================
    // COMPANIES
    // ==========================================
    static async getCompany() {
        const { data, error } = await supabase.from('companies').select('*').limit(1).single();
        if (error) throw error;
        return data;
    }

    // ==========================================
    // CANDIDATES
    // ==========================================
    static async upsertCandidate(candidate: Partial<Candidate> & { email: string }) {
        const { data, error } = await supabase
            .from('candidates')
            .upsert({
                name: candidate.name,
                email: candidate.email,
                phone: candidate.phone,
                id_number: candidate.idNumber,
                profile_photo_url: candidate.profilePhoto,
                id_card_image_url: candidate.idCardImage,
                candidate_consent: true, // Assuming true if they submitted the form
                consent_timestamp: new Date().toISOString()
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
    // JOB POSTS & QUESTIONS
    // ==========================================
    static async getJobByAccessKey(accessKey: string) {
        const { data, error } = await supabase
            .from('job_posts')
            .select(`
                *,
                questions (*),
                role_settings (*)
            `)
            .eq('access_key', accessKey)
            .is('deleted_at', null)
            .single();

        if (error) throw error;
        return data;
    }

    static async getAllJobs() {
        const { data, error } = await supabase
            .from('job_posts')
            .select(`
                *,
                questions (*),
                role_settings (*)
            `)
            .is('deleted_at', null);

        if (error) throw error;
        return data;
    }

    // ==========================================
    // ACCESS RECORDS
    // ==========================================
    static async validateAndConsumeAccessKey(accessKeyHash: string, candidateId: string) {
        // 1. Check if valid
        const { data: record, error: fetchError } = await supabase
            .from('access_records')
            .select('*')
            .eq('access_key_hash', accessKeyHash)
            .single();

        if (fetchError) throw fetchError;
        if (!record) return { valid: false, reason: 'Invalid key' };
        if (record.status !== 'ACTIVE') return { valid: false, reason: `Key is ${record.status}` };
        if (record.attempts_used >= record.max_attempts) return { valid: false, reason: 'Max attempts reached' };

        // 2. Consume it
        const { error: updateError } = await supabase
            .from('access_records')
            .update({
                attempts_used: record.attempts_used + 1,
                status: (record.attempts_used + 1 >= record.max_attempts) ? 'CONSUMED' : 'ACTIVE',
                used_by_candidate_id: candidateId,
                used_at: new Date().toISOString()
            })
            .eq('id', record.id);

        if (updateError) throw updateError;
        return { valid: true, record };
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
        
        await this.logStatusChange(data.id, null, 'CREATED', 'system', 'Session initialized');
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
            .update({ status: newStatus, termination_reason: reason })
            .eq('id', sessionId);

        if (error) throw error;
        
        await this.logStatusChange(sessionId, oldStatus, newStatus, 'system', reason);
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
        await this.updateSessionStatus(sessionId, 'COMPLETED', 'Interview finished normally');
    }

    static async logStatusChange(sessionId: string, oldStatus: string | null, newStatus: string, changedBy: string = 'system', reason?: string) {
        await supabase.from('interview_status_history').insert({
            session_id: sessionId,
            old_status: oldStatus,
            new_status: newStatus,
            changed_by: changedBy,
            reason: reason
        });
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
                    message: v.message,
                    snapshot_url: (v as any).snapshot_url || (v as any).clip_url,
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
                final_verdict: report.finalVerdict,
                scoring_basis: {
                    category: report.category || 'Average',
                    strengths: report.detailedAnalysis?.strengths || [],
                    failures: report.detailedAnalysis?.failures || []
                },
                evaluation_logic: {
                    hiring_recommendation: report.hiringRecommendation || 'Consider',
                    verdict_justification: report.verdictJustification,
                    question_breakdown: report.questionBreakdown || []
                }
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
