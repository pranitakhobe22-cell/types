import { supabase } from './supabaseClient';

export interface InterviewSession {
  id: string;
  candidate_id?: string;
  candidate_name: string;
  candidate_email: string;
  position: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  total_questions: number;
  questions_attempted: number;
  questions_skipped: number;
  results: {
    question: string;
    answer: string;
    ideal_answer: string;
    skipped?: boolean;
  }[];
  timestamp: string;
}

export const BackendService = {
  /**
   * Initializes a new session in Supabase.
   */
  async createSession(candidate: { name: string; email: string; role: string }): Promise<string> {
    const sessionId = `session_${Date.now()}`;
    
    // Fallback to localStorage
    if (!supabase) {
      const session: any = {
        candidate_name: candidate.name,
        candidate_email: candidate.email,
        position: candidate.role,
        total_questions: 0,
        questions_attempted: 0,
        questions_skipped: 0,
        results: [],
        timestamp: new Date().toISOString(),
        status: 'IN_PROGRESS'
      };
      localStorage.setItem(sessionId, JSON.stringify(session));
      localStorage.setItem('current_session_id', sessionId);
      return sessionId;
    }

    try {
      const { error } = await supabase
        .from('interviews')
        .insert([{
          id: sessionId,
          candidate_id: candidate.email,
          candidate_name: candidate.name,
          candidate_email: candidate.email,
          position: candidate.role,
          status: 'IN_PROGRESS',
          total_questions: 5, // Default or dynamically fetched
          questions_attempted: 0,
          questions_skipped: 0,
          results: [],
          date: new Date().toLocaleDateString()
        }]);

      if (error) throw error;

      localStorage.setItem('current_session_id', sessionId);
      console.log('[BackendService] Supabase Session Created:', sessionId);
      return sessionId;
    } catch (err: any) {
      console.error('[BackendService] Supabase Error (createSession):', err.message);
      localStorage.setItem('current_session_id', sessionId);
      return sessionId;
    }
  },

  /**
   * Appends an answer and updates counts.
   */
  async saveResponse(response: { question: string; answer: string; ideal_answer: string; skipped?: boolean }) {
    const sessionId = localStorage.getItem('current_session_id');
    if (!sessionId) return;

    if (!supabase) {
      const data = localStorage.getItem(sessionId);
      if (data) {
        const session = JSON.parse(data);
        session.results.push(response);
        if (response.skipped) session.questions_skipped++;
        else session.questions_attempted++;
        localStorage.setItem(sessionId, JSON.stringify(session));
      }
      return;
    }

    try {
      // Get current state
      const { data, error: fetchError } = await supabase
        .from('interviews')
        .select('results, questions_attempted, questions_skipped')
        .eq('id', sessionId)
        .single();

      if (fetchError) throw fetchError;

      const currentResults = data.results || [];
      const updatedResults = [...currentResults, response];
      
      const updateData: any = { 
        results: updatedResults 
      };

      if (response.skipped) {
        updateData.questions_skipped = (data.questions_skipped || 0) + 1;
      } else {
        updateData.questions_attempted = (data.questions_attempted || 0) + 1;
      }

      const { error: updateError } = await supabase
        .from('interviews')
        .update(updateData)
        .eq('id', sessionId);

      if (updateError) throw updateError;
      console.log('[BackendService] Detailed response saved to Supabase');
    } catch (err: any) {
      console.error('[BackendService] Supabase Error (saveResponse):', err.message);
    }
  },

  /**
   * Marks the session as completed.
   */
  async completeSession() {
    const sessionId = localStorage.getItem('current_session_id');
    if (!sessionId) return;

    if (!supabase) {
      const data = localStorage.getItem(sessionId);
      if (data) {
        const session = JSON.parse(data);
        session.status = 'COMPLETED';
        localStorage.setItem(sessionId, JSON.stringify(session));
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'COMPLETED' })
        .eq('id', sessionId);

      if (error) throw error;
    } catch (err: any) {
      console.error('[BackendService] Supabase Error (completeSession):', err.message);
    }
  },

  /**
   * Retrieves all sessions for the dashboard.
   */
  async getSessions(): Promise<InterviewSession[]> {
    if (!supabase) {
      // (localStorage logic...)
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('interviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    } catch (err: any) {
      console.error('[BackendService] Supabase Error (getSessions):', err.message);
      return [];
    }
  }
};


