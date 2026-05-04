
export interface Candidate {
  name: string;
  position?: string;
  company?: string;
  accessId?: string;
  jobPostId?: string;
  customTopic?: string; // For Mini Demo Mode
  isDemo?: boolean;

  // Identity Verification Fields
  email?: string;
  phone?: string;
  idNumber?: string;
  profilePhoto?: string;
  idCardImage?: string;
  isVerified?: boolean;
}

export interface Question {
  id: number | string;
  question: string; // Renamed from text to match spec
  ideal_answer: string; // Renamed from referenceAnswer to match spec
  topic?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  keyPoints?: string[];
  maxScore?: number;
}

export interface RoleSettings {
  difficulty: 'Very Easy' | 'Easy' | 'Medium' | 'Hard' | 'Very Hard';
  preset: 'Relaxed' | 'Normal' | 'Strict' | 'Custom';
  weights: {
    concept: number;   // 0-100
    grammar: number;   // 0-100
    fluency: number;   // 0-100
    camera: number;    // 0-100
  };
  proctoring: {
    maxWarnings: number; // 1-5
    sensitivity: 'Low' | 'Medium' | 'High';
    includeInScore: boolean;
  };
}

export interface JobPost {
  id: string; // This is the interview_id
  accessKey: string;
  company: string;
  title: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  questions: Question[];
  settings: RoleSettings;
  mode: 'AI' | 'Custom';
}

export interface EvaluationResult {
  questionId: number;
  questionText: string;
  userAnswer: string;

  // Granular Scoring
  contentScore: number; // Concept
  grammarScore: number;
  fluencyScore: number;
  communicationScore?: number;

  // Qualitative Analysis
  matchedKeyPoints: string[];
  missingKeyPoints: string[];
  verdict: 'Pass' | 'Borderline' | 'Fail';
  feedback: string;

  // Strict Evaluation Segments (New)
  analysis?: {
    technicalAccuracy: number;
    problemSolving: number;
    practicalExecution: number;
    communication: number;
    redFlags?: string[];
  };

  // Visual/Legacy
  confidenceScore: number; // 0-100 (Visual)
  expressionAnalysis: string; // Summary of visual analysis
  timestamp: string;
}

export interface CategoryScore {
  raw: number;
  weighted: number;
  maxWeight: number;
}

export interface StrictEvaluationReport {
  categories: {
    technicalAccuracy: CategoryScore;
    problemSolving: CategoryScore;
    practicalExecution: CategoryScore;
    communication: CategoryScore;
    adaptability: CategoryScore;
    cultureFit: CategoryScore;
    confidenceModifier: number;
  };
  totalScore: number;
  detailedAnalysis: {
    strengths: string[];
    failures: string[];
    missedOpportunities: string[];
    depthVsSurface: string;
  };
  redFlags: string[];
  finalVerdict: 'STRONG HIRE' | 'HIRE' | 'BORDERLINE' | 'REJECT';
  verdictJustification: string;
}

export interface WarningEvent {
  timestamp: string;
  type: 'GAZE' | 'FACE_MISSING' | 'MULTIPLE_FACES' | 'TAB_SWITCH';
  message: string;
}

export interface InterviewSession {
  id: string;
  candidate: Candidate;
  date: string;
  status: 'COMPLETED' | 'TERMINATED' | 'IN_PROGRESS';
  overallScore: number; // 0-100
  results: EvaluationResult[];
  warnings: WarningEvent[];
  durationSeconds: number;
}

export interface AdminConfig {
  eyeTrackingSensitivity: number;
  warningThreshold: number;
  aiStrictness: number;
  enableEyeTracking: boolean;
  enableFaceDetection: boolean;
  defaultDifficulty: 'Easy' | 'Medium' | 'Hard';
  eyeAwayThreshold: number; // in frames
  faceMissingThreshold: number; // in frames
  headMovementThreshold: number; // translation delta
}

export enum InterviewStatus {
  IDLE = 'IDLE',
  READY = 'READY', // Camera ready, waiting for user "Start" gesture
  LOADING_QUESTION = 'LOADING_QUESTION',
  ASKING = 'ASKING', // TTS playing
  LISTENING = 'LISTENING', // Mic active
  THINKING = 'THINKING', // AI evaluating
  FEEDBACK = 'FEEDBACK', // Showing result
  COMPLETED = 'COMPLETED',
  LOCKED = 'LOCKED'
}

export interface SpeechState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
}

export interface VisualMetrics {
  isPresent: boolean;
  isLookingAtCamera: boolean;
  currentExpression: string;
  confidenceLevel: number;
}

export type InterviewState = 'welcome' | 'setup' | 'camera-check' | 'active' | 'rules' | 'completed' | 'conduct-setup';