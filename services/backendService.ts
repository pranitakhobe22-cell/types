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
    
    // Always initialize in localStorage as a primary cache/backup
    const initialSession: any = {
      id: sessionId,
      candidate_name: candidate.name,
      candidate_email: candidate.email,
      position: candidate.role,
      total_questions: 5,
      questions_attempted: 0,
      questions_skipped: 0,
      results: [],
      timestamp: new Date().toISOString(),
      status: 'IN_PROGRESS'
    };
    localStorage.setItem(sessionId, JSON.stringify(initialSession));
    localStorage.setItem('current_session_id', sessionId);

    if (!supabase) {
      console.warn('[BackendService] Supabase not initialized, using local storage only.');
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
          total_questions: 5,
          questions_attempted: 0,
          questions_skipped: 0,
          results: [],
          date: new Date().toLocaleDateString()
        }]);

      if (error) throw error;
      console.log('[BackendService] Supabase Session Created:', sessionId);
      return sessionId;
    } catch (err: any) {
      console.error('[BackendService] Supabase Error (createSession):', err.message);
      // We already saved to localStorage, so we can continue
      return sessionId;
    }
  },

  /**
   * Appends an answer and updates counts.
   */
  async saveResponse(response: { question: string; answer: string; ideal_answer: string; skipped?: boolean }) {
    const sessionId = localStorage.getItem('current_session_id');
    if (!sessionId) return;

    // 1. Always update localStorage first
    const localData = localStorage.getItem(sessionId);
    let session: any = null;
    if (localData) {
      session = JSON.parse(localData);
      session.results.push(response);
      if (response.skipped) session.questions_skipped++;
      else session.questions_attempted++;
      localStorage.setItem(sessionId, JSON.stringify(session));
      console.log('[BackendService] Response cached locally');
    }

    // 2. Try to update Supabase
    if (!supabase) return;

    try {
      // Get current state from Supabase to be safe (or use local if we want to be faster)
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
      // Data is already in localStorage, so it's not lost!
    }
  },

  /**
   * Marks the session as completed.
   */
  async completeSession() {
    const sessionId = localStorage.getItem('current_session_id');
    if (!sessionId) return;

    // 1. Update localStorage
    const data = localStorage.getItem(sessionId);
    if (data) {
      const session = JSON.parse(data);
      session.status = 'COMPLETED';
      localStorage.setItem(sessionId, JSON.stringify(session));
    }

    // 2. Update Supabase
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('interviews')
        .update({ status: 'COMPLETED' })
        .eq('id', sessionId);

      if (error) throw error;
      console.log('[BackendService] Session completed in Supabase');
    } catch (err: any) {
      console.error('[BackendService] Supabase Error (completeSession):', err.message);
    }
  },

  /**
   * Retrieves all sessions for the dashboard.
   */
  async getSessions(): Promise<InterviewSession[]> {
    let allSessions: InterviewSession[] = [];

    // 1. Get from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('session_')) {
        try {
          const session = JSON.parse(localStorage.getItem(key) || '{}');
          allSessions.push(session);
        } catch (e) { /* ignore */ }
      }
    }

    // 2. Merge with Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          // Merge logic: use Supabase data as the source of truth for matching IDs
          const supabaseIds = new Set(data.map((s: any) => s.id));
          
          // Filter out local sessions that are already in Supabase
          allSessions = allSessions.filter(ls => !supabaseIds.has(ls.id));
          
          // Add Supabase sessions
          allSessions = [...(data as any[]), ...allSessions];
        }
      } catch (err: any) {
        console.error('[BackendService] Supabase Error (getSessions):', err.message);
      }
    }

    // Sort by timestamp/date
    return allSessions.sort((a, b) => {
      const dateA = new Date(a.timestamp || 0).getTime();
      const dateB = new Date(b.timestamp || 0).getTime();
      return dateB - dateA;
    });
  }
};


