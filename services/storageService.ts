
import { InterviewSession, AdminConfig, EvaluationResult, Candidate, JobPost, Question, RoleSettings } from "../types";

const SESSIONS_KEY = 'reicrew_sessions_v3';
const CONFIG_KEY = 'reicrew_config_v3';
const JOBS_KEY = 'reicrew_jobs_v3';
const PROFILES_KEY = 'reicrew_profiles_v3';

export const DEFAULT_SETTINGS: RoleSettings = {
  difficulty: 'Medium',
  preset: 'Normal',
  weights: {
    concept: 50,
    grammar: 20,
    fluency: 20,
    camera: 10
  },
  proctoring: {
    maxWarnings: 3,
    sensitivity: 'Medium',
    includeInScore: true
  }
};

// Seed Data for Jobs with HR Reference Logic
// Seed Data for Jobs with HR Reference Logic
const SEED_JOBS: JobPost[] = [
  {
    id: 'test-id',
    accessKey: 'test-key',
    company: 'REICREW AI TEST',
    title: 'AI Software Engineer (Test)',
    description: 'General AI and Software Engineering test interview.',
    status: 'ACTIVE',
    mode: 'AI',
    settings: { ...DEFAULT_SETTINGS, difficulty: 'Medium', preset: 'Normal' },
    questions: [
      {
        id: 1,
        question: "Explain the concept of Reactive programming in modern web development.",
        difficulty: 'medium',
        category: 'Web Dev',
        ideal_answer: "Reactive programming is a declarative programming paradigm concerned with data streams and the propagation of change.",
        evaluationGuide: ["Data streams", "Propagation of change", "Declarative"],
        maxScore: 10
      }
    ]
  },
  {
    id: 'job-mech',
    accessKey: 'MECH123',
    company: 'REICREW',
    title: 'Mechanical Engineering',
    description: 'Thermodynamics, Fluid Mechanics, and manufacturing processes.',
    status: 'ACTIVE',
    mode: 'AI',
    settings: { ...DEFAULT_SETTINGS, difficulty: 'Medium', preset: 'Normal' },
    questions: [
      {
        id: 1,
        question: "Explain the Second Law of Thermodynamics and its practical implications.",
        difficulty: 'medium',
        category: 'Thermodynamics',
        ideal_answer: "The Second Law states that entropy of an isolated system always increases. Practically, it means heat cannot spontaneously flow from a cold body to a hot body, and no heat engine can have 100% efficiency.",
        evaluationGuide: ["Entropy increases", "Heat flow direction", "Efficiency limits"],
        maxScore: 10
      },
      {
        id: 2,
        question: "What is the difference between stress and strain?",
        difficulty: 'easy',
        category: 'Mechanics',
        ideal_answer: "Stress is force per unit area; strain is the deformation.",
        evaluationGuide: ["Force/Area", "Deformation"],
        maxScore: 10
      },
      {
        id: 3,
        question: "Describe the working principle of a 4-stroke petrol engine.",
        difficulty: 'medium',
        category: 'IC Engines',
        ideal_answer: "Intake, Compression, Power, Exhaust strokes.",
        evaluationGuide: ["4 strokes", "Spark plug", "Valves"],
        maxScore: 10
      },
      {
        id: 4,
        question: "What defines a fluid's viscosity?",
        difficulty: 'easy',
        category: 'Fluid Mechanics',
        ideal_answer: "Viscosity is a measure of a fluid's resistance to flow.",
        evaluationGuide: ["Resistance to flow", "Internal friction"],
        maxScore: 10
      },
      {
        id: 5,
        question: "Explain the purpose of heat treatment in metals.",
        difficulty: 'medium',
        category: 'Manufacturing',
        ideal_answer: "To alter physical/chemical properties (hardening, annealing).",
        evaluationGuide: ["Hardness", "Ductility", "Microstructure"],
        maxScore: 10
      }
    ]
  },
  {
    id: 'job-cs',
    accessKey: 'CS123',
    company: 'REICREW',
    title: 'Computer Science',
    description: 'Operating Systems, DBMS, and Computer Networks.',
    status: 'ACTIVE',
    mode: 'AI',
    settings: { ...DEFAULT_SETTINGS, difficulty: 'Hard', preset: 'Strict' },
    questions: [
      {
        id: 1,
        question: "What is the difference between a Process and a Thread?",
        difficulty: 'medium',
        category: 'Operating Systems',
        ideal_answer: "A process is an executing program (isolated); a thread is a unit of execution within a process (shared memory).",
        evaluationGuide: ["Memory isolation", "Shared resources", "Context switch"],
        maxScore: 10
      },
      {
        id: 2,
        question: "Explain the ACID properties in a Database Management System.",
        difficulty: 'medium',
        category: 'DBMS',
        ideal_answer: "Atomicity, Consistency, Isolation, Durability.",
        evaluationGuide: ["All or nothing", "Valid state", "Transaction independence", "Saved permanently"],
        maxScore: 10
      },
      {
        id: 3,
        question: "Describe the OSI model layers.",
        difficulty: 'hard',
        category: 'Networks',
        ideal_answer: "Physical, Data Link, Network, Transport, Session, Presentation, Application.",
        evaluationGuide: ["7 Layers", "Encapsulation", "Specific functions"],
        maxScore: 10
      },
      {
        id: 4,
        question: "How does Garbage Collection work in Java/Python?",
        difficulty: 'medium',
        category: 'Languages',
        ideal_answer: "Automatic memory management that reclaims memory used by objects no longer referenced.",
        evaluationGuide: ["Reference counting", "Reachability", "Memory leak prevention"],
        maxScore: 10
      },
      {
        id: 5,
        question: "What is the difference between TCP and UDP?",
        difficulty: 'medium',
        category: 'Networks',
        ideal_answer: "TCP is connection-oriented/reliable; UDP is connectionless/fast but unreliable.",
        evaluationGuide: ["Reliability", "Connection setup", "Speed"],
        maxScore: 10
      }
    ]
  }
];

const DEFAULT_CONFIG: AdminConfig = {
  eyeTrackingSensitivity: 7,
  warningThreshold: 3,
  aiStrictness: 8,
  enableEyeTracking: true,
  enableFaceDetection: true,
  defaultDifficulty: 'Medium',
  eyeAwayThreshold: 15,
  faceMissingThreshold: 20,
  headMovementThreshold: 0.15
};

import { supabase } from './supabaseClient';



export const StorageService = {
  // --- Sessions ---
  // NOTE: Session CRUD is handled by SupabaseService.getAllSessions() / createSession() / completeSession()
  // which correctly reference the v6 schema table 'interview_sessions'.
  // Legacy getSessions() and saveSession() referencing a non-existent 'interviews' table were removed.

  // --- Config ---
  getConfig: async (): Promise<AdminConfig> => {
    try {
      const stored = localStorage.getItem(CONFIG_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    } catch (e) { return DEFAULT_CONFIG; }
  },

  saveConfig: async (config: AdminConfig) => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  // --- Jobs ---
  getJobs: async (): Promise<JobPost[]> => {
    try {
      // 1. Try Supabase first (Source of Truth)
      const { data, error } = await supabase.from('job_posts').select('*');
      
      if (!error && data && data.length > 0) {
        const remoteJobs = data.map(j => ({
          id: j.id,
          title: j.title,
          description: j.description || '',
          mode: j.mode || 'AI',
          status: j.status || 'ACTIVE',
          company: j.company || 'General',
          accessKey: j.access_key || '',
          questions: j.questions ? (typeof j.questions === 'string' ? JSON.parse(j.questions) : j.questions) : [],
          settings: j.settings ? (typeof j.settings === 'string' ? JSON.parse(j.settings) : j.settings) : DEFAULT_SETTINGS
        })) as JobPost[];
        
        // Sync to local cache
        localStorage.setItem(JOBS_KEY, JSON.stringify(remoteJobs));
        return remoteJobs;
      }

      if (error) console.warn("Supabase jobs fetch error:", error);
    } catch (e) {
      console.warn("Error fetching jobs from Supabase:", e);
    }

    // 2. Fallback to Local Storage
    const stored = localStorage.getItem(JOBS_KEY);
    if (stored) {
      const localJobs = JSON.parse(stored);
      if (localJobs.length > 0) return localJobs;
    }

    // 3. Final Fallback to Seed Data
    console.log("Using seed data as final fallback");
    localStorage.setItem(JOBS_KEY, JSON.stringify(SEED_JOBS));
    return SEED_JOBS;
  },

  getJobById: async (id: string): Promise<JobPost | undefined> => {
    try {
      const { data, error } = await supabase.from('job_posts').select('*').eq('id', id).single();
      if (!error && data) {
        return {
          id: data.id,
          title: data.title,
          description: data.description || '',
          mode: data.mode || 'AI',
          status: data.status || 'ACTIVE',
          company: data.company || 'General',
          accessKey: data.access_key || '',
          questions: data.questions ? (typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions) : [],
          settings: data.settings ? (typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings) : DEFAULT_SETTINGS
        } as JobPost;
      }
    } catch (e) {}
    
    // Fallback to local search
    const jobs = await StorageService.getJobs();
    return jobs.find(j => j.id === id);
  },

  saveJobs: async (jobs: JobPost[]) => {
    // 1. Local sync (for UI responsiveness)
    localStorage.setItem(JOBS_KEY, JSON.stringify(jobs));

    // 2. Sync to Supabase
    try {
      const { error } = await supabase.from('job_posts').upsert(
        jobs.map(j => ({
          id: j.id,
          title: j.title,
          description: j.description,
          status: j.status,
          questions: j.questions,
          settings: j.settings,
          access_key: j.accessKey, // Map camelCase accessKey to snake_case access_key
          company: j.company,
          mode: j.mode
        }))
      );
      if (error) throw error;
      console.log("Jobs synced to Supabase successfully");
    } catch (e) {
      console.warn("Supabase jobs sync failed (local updated):", e);
    }
  },

  deleteJob: async (jobId: string) => {
    // 1. Update Local
    try {
      const stored = localStorage.getItem(JOBS_KEY);
      if (stored) {
        const jobs: JobPost[] = JSON.parse(stored);
        const updatedJobs = jobs.filter(j => j.id !== jobId);
        localStorage.setItem(JOBS_KEY, JSON.stringify(updatedJobs));
      }
    } catch (e) {}

    // 2. Delete from Supabase
    try {
      const { error } = await supabase.from('job_posts').delete().eq('id', jobId);
      if (error) throw error;
    } catch (e) {
      console.error("Delete job from Supabase failed", e);
    }
  },

  // --- User Profiles ---
  getUserProfile: async (accessId: string): Promise<Candidate | null> => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (!stored) return null;
      const profiles = JSON.parse(stored);
      return profiles[accessId] || null;
    } catch (e) { return null; }
  },

  saveUserProfile: async (candidate: Candidate) => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      const profiles = stored ? JSON.parse(stored) : {};
      if (candidate.accessId) {
        profiles[candidate.accessId] = candidate;
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      }
    } catch (e) { console.error(e); }
  },

  clearUserProfile: (accessId: string) => {
    try {
      const stored = localStorage.getItem(PROFILES_KEY);
      if (stored) {
        const profiles = JSON.parse(stored);
        delete profiles[accessId];
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
      }
    } catch (e) { }
  }
};
