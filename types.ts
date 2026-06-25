
export interface Question {
  id: number | string;
  question: string; // Renamed from text to match spec
  ideal_answer?: string; // Kept optional for backward compatibility during transition
  category?: string;
  type?: 'Fundamentals' | 'Core' | 'Scenario' | 'Behavioral Experience' | 'Behavioral Situation';
  difficulty?: 'easy' | 'medium' | 'hard';
  evaluationGuide: string[];
  maxScore?: number;
  isFollowUp?: boolean;
  discriminationWeight?: number;
  version?: number;
  updatedAt?: string;
  // MCQ/Aptitude Extensions
  options?: string[];
  answer?: string;
  explanation?: string;
  imageUrl?: string;
  timeLimit?: number;
}

export interface Candidate {
  name: string;
  position?: string;
  company?: string;
  accessId?: string;
  jobPostId?: string;
  customTopic?: string; // For Mini Demo Mode
  isDemo?: boolean;
  role?: string;

  // Identity Verification Fields
  email?: string;
  phone?: string;
  idNumber?: string;
  profilePhoto?: string;
  idCardImage?: string;
  isVerified?: boolean;
}
// Note: Keep other types the same, we will append MasterEvaluationReport at the end.

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

export interface FeedbackStructure {
  observation: string;
  demonstrated: string[];
  gaps: string[];
  nextSteps: string[];
}

export function formatFeedbackToString(feedback: any): string {
  if (!feedback) return "";
  if (typeof feedback === 'string') {
    if (feedback.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(feedback);
        return formatFeedbackToString(parsed);
      } catch (e) {
        // ignore and return string
      }
    }
    return feedback;
  }
  let parts: string[] = [];
  if (feedback.observation) {
    parts.push(`Observation: ${feedback.observation}`);
  }
  if (feedback.demonstrated && feedback.demonstrated.length > 0) {
    parts.push(`Demonstrated: ${feedback.demonstrated.join(', ')}`);
  }
  if (feedback.gaps && feedback.gaps.length > 0) {
    parts.push(`Gaps: ${feedback.gaps.join(', ')}`);
  }
  if (feedback.nextSteps && feedback.nextSteps.length > 0) {
    parts.push(`Next Steps: ${feedback.nextSteps.join(', ')}`);
  }
  return parts.join(' | ');
}

export function ensureFeedbackStructure(feedback: any): FeedbackStructure {
  if (!feedback) {
    return { observation: "", demonstrated: [], gaps: [], nextSteps: [] };
  }
  if (typeof feedback === 'object' && 'observation' in feedback) {
    return feedback as FeedbackStructure;
  }
  if (typeof feedback === 'string') {
    const trimmed = feedback.trim();
    if (trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return {
            observation: parsed.observation || "",
            demonstrated: parsed.demonstrated || [],
            gaps: parsed.gaps || [],
            nextSteps: parsed.nextSteps || []
          };
        }
      } catch (e) {
        // ignore and fall through
      }
    }
    return {
      observation: feedback,
      demonstrated: [],
      gaps: [],
      nextSteps: []
    };
  }
  return { observation: "", demonstrated: [], gaps: [], nextSteps: [] };
}

export interface EvaluationResult {
  questionId: number;
  questionText: string;
  userAnswer: string;

  // Granular Scoring
  contentScore: number; // Concept (adjusted content score)
  knowledgeScore?: number; // NEW
  problemSolvingScore?: number; // NEW
  learningPotentialScore?: number; // NEW
  confidenceGap?: number; // NEW
  grammarScore: number;
  fluencyScore: number;
  communicationScore?: number;
  honestyScore?: number; // 0-10
  knowledgeAdmissionScore?: number; // 0-10
  bluffRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  misconceptionRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
  confidenceCalibration?: 'UNDERCONFIDENT' | 'CALIBRATED' | 'OVERCONFIDENT';

  // Qualitative Analysis
  mentionedConcepts: string[];   // Concepts the candidate named/identified
  explainedConcepts: string[];   // Concepts the candidate actually explained with understanding
  matchedKeyPoints: string[];    // Backward compat: = mentionedConcepts
  missingKeyPoints: string[];
  answerType: 'honest_unknown' | 'keyword_list_only' | 'incorrect_attempt' | 'mixed_understanding' | 'partial_explanation' | 'full_explanation';
  answerQuality: 'HONEST_UNKNOWN' | 'KEYWORD_LIST' | 'INCORRECT_ATTEMPT' | 'SURFACE_LEVEL' | 'COMPETENT' | 'STRONG' | 'EXPERT';
  verdict: 'Excellent' | 'Good' | 'Pass' | 'Borderline' | 'Fail';
  feedback: FeedbackStructure;

  // Strict Evaluation Segments (New)
  analysis?: {
    technicalAccuracy: number;
    problemSolving: number;
    practicalExecution: number;
    communication: number;
    redFlags?: string[];
    // New Version 11 scores
    coverage?: number;
    understanding?: number;
    reasoning?: number;
    depth?: number;
    clarity?: number;
    structure?: number;
    confidence?: number;
    consistency?: number;
    answerDirectnessScore?: number;
    tradeoffReasoningScore?: number;
    curiosity?: number; // NEW
    selfCorrection?: number; // NEW
    learningPotential?: number; // NEW
    technicalErrors?: { error: string; severity: 'low' | 'medium' | 'high' }[];
  };

  // Adaptive & Behavioral Extensions
  behavioralMetrics?: {
    communication: number;
    problemSolving: number;
    ownership: number;
    teamwork: number;
    adaptability: number;
    leadershipPotential: number;
    responseStructure: number;
    evidenceStrength: number;
  };
  transcriptQuality?: number;
  evaluationPending?: boolean;
  evaluationConfidence?: number; // 0-100: how confident is the evaluation (low for local fallback, high for AI)
  evaluationError?: string; // Captured error message if evaluation failed
  followupResult?: {
    reliability: number; // 0-100
  };
  strengths?: string[];
  improvements?: string[];
  recommendedFocusAreas?: string[];
  highestDifficultyReached?: 'easy' | 'medium' | 'hard';

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

// ─────────────────────────────────────────────────────────────────────────────
// NEW PROCTORING TYPES (v7)
// ─────────────────────────────────────────────────────────────────────────────

export type InterviewMediaResources = {
  stream: MediaStream;
  videoTrack: MediaStreamTrack;
  audioTrack: MediaStreamTrack;
};

export type RawDetectionFrame = {
  faceCount: number;
  faceDetected: boolean;
  landmarkCount: number;
  trackingConfidence: number;  // 0.0–100 based on scale/centering/tracking
  gazeDirection: 'center' | 'left' | 'right' | 'up' | 'down' | 'away';
  isHeadTurned: boolean;
  isMouthMoving: boolean;
  expression: string;
  timestamp: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  facePosition: 'CENTERED' | 'PARTIAL_OUT';
};

export type ProctorViolation = {
  id: string;
  sessionId: string;           // Correlation ID
  type: 'TAB_HIDDEN' | 'NO_FACE' | 'GAZE_AWAY' | 'MULTIPLE_FACES'
       | 'CAMERA_LOST' | 'MICROPHONE_LOST' | 'REFRESH_ATTEMPT'
       | 'FULLSCREEN_EXIT' | 'COPY_PASTE';
  severity: number;
  timestamp: number;
  message: string;
  snapshot_url?: string;
  clip_url?: string;
};

export type TimelineEvent = {
  id?: string;
  sessionId: string;
  timestamp: number;
  event: string;
  severity: number;
  detail?: string;
};

export type ProctoringEngineState =
  | 'INITIALIZING' | 'READY' | 'PERMISSION_DENIED' | 'UNSUPPORTED_BROWSER'
  | 'ERROR' | 'RECOVERING' | 'CONNECTION_LOST' | 'TERMINATED';

export type HeartbeatMetrics = {
  fps: number;
  lastDetectionAgoMs: number;
  trackingConfidence: number;
  gazeDirection: string;
  detectionHealth: 'GOOD' | 'LOW_LIGHT' | 'PARTIAL_FACE' | 'UNSTABLE';
  engineState: ProctoringEngineState;
};

export type DashboardTelemetry = {
  faceDetected: boolean;
  trackingConfidence: number;
  monitoringQualityScore: number;
  gazeDirection: string;
  gazeDurationMs: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  fps: number;
  facePosition: string;
  detectionHealth: string;
  lastUpdated: number;
};

export type MonitoringHealthSummary = {
  monitoringCoveragePercent: number;
  averageTrackingConfidence: number;
  totalDetectionFrames: number;
  stalledPeriods: number;
  longestNoFaceDurationMs: number;
  longestGazeAwayDurationMs: number;
};

export type ProctoringReport = {
  sessionId: string;
  currentRiskScore: number;
  overallRiskScore: number;
  noFaceEvents: number;
  gazeAwayEvents: number;
  multipleFaceEvents: number;
  tabSwitchEvents: number;
  fullscreenExitEvents: number;
  copyPasteEvents: number;
  violationScore: number;
  integrityScore: number;
  totalGazeAwayDurationMs: number;
  microphoneLostEvents: number;
  violations: ProctorViolation[];
  timeline: TimelineEvent[];
  flushedEventIds?: string[];
  sessionDurationMs: number;
  monitoringDurationMs: number;
  heartbeatCount: number;        // Total heartbeats emitted during session
  heartbeatSamples: { timestamp: number; fps: number }[]; // For backend validation
  cameraReconnectCount: number;
  maxConcurrentFaces: number;
  browserInfo: {
    userAgent: string;
    platform: string;
    viewportWidth: number;
    viewportHeight: number;
  };
  healthSummary: MonitoringHealthSummary;
};

export type ProctoringState = {
  engineState: ProctoringEngineState;
  currentRiskScore: number;
  overallRiskScore: number;
  heartbeat: HeartbeatMetrics;
  violations: ProctorViolation[];
  timeline: TimelineEvent[];
  gazeState: 'LOOKING' | 'AWAY_START' | 'VIOLATION_CREATED' | 'COOLDOWN';
  gazeAwayStartTime: number | null;
  multiFaceState: 'SINGLE_FACE' | 'MULTI_FACE_START' | 'MULTI_FACE_CONFIRMED';
  multiFaceStartTime: number | null;
  noFaceState: 'FACE_PRESENT' | 'NO_FACE_START' | 'VIOLATION_CREATED';
  noFaceStartTime: number | null;
  sessionStartTime: number;
  monitoringStartTime: number | null;
  cameraReconnectCount: number;
  maxConcurrentFaces: number;
  microphoneHealthy: boolean;
  networkHealthy: boolean;
  heartbeatCount: number;
  fullscreenExitEvents: number;
  copyPasteEvents: number;
  violationScore: number;
  integrityScore: number;
  totalGazeAwayDurationMs: number;
  lastViolationTime: number;
  settings?: ProctoringSettings;
  cameraOffStartTime?: number | null;
  micOffStartTime?: number | null;
};

export type ProctoringAction = 
  | { type: 'DETECTION_FRAME'; frame: RawDetectionFrame }
  | { type: 'ENGINE_READY' }
  | { type: 'HEARTBEAT'; metrics: HeartbeatMetrics }
  | { type: 'TAB_HIDDEN' }
  | { type: 'FULLSCREEN_EXIT' }
  | { type: 'COPY_PASTE' }
  | { type: 'REFRESH_ATTEMPT' }
  | { type: 'CAMERA_LOST' }
  | { type: 'MICROPHONE_LOST' }
  | { type: 'MICROPHONE_RECOVERED' }
  | { type: 'NETWORK_LOST' }
  | { type: 'NETWORK_RECOVERED' }
  | { type: 'DECAY_RISK' }
  | { type: 'SET_UNSUPPORTED_BROWSER' }
  | { type: 'SET_PERMISSION_DENIED' }
  | { type: 'UPDATE_VIOLATION_MEDIA'; id: string; snapshotUrl: string | null; clipUrl: string | null }
  | { type: 'SET_SETTINGS'; settings: ProctoringSettings };

// ─────────────────────────────────────────────────────────────────────────────

export interface InterviewSession {
  id: string;
  candidate: Candidate;
  date: string;
  status: 'COMPLETED' | 'TERMINATED' | 'IN_PROGRESS';
  overallScore: number; // 0-100
  results: EvaluationResult[];
  warnings: WarningEvent[];
  durationSeconds: number;
  isDeleted?: boolean;
  deletedAt?: string;
  evaluationReport?: any;
  proctoringReport?: any;
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

export interface MasterEvaluationReport {
  executiveSummary: {
    recommendation: 'Strong Hire' | 'Hire' | 'Consider' | 'Reject';
    recommendationStatus: 'normal' | 'insufficient_evidence';
    technicalScore: number; // 0-100
    trustScore: number; // 0-100 (trustAdjustedScore)
    readinessScore?: number; // NEW
    interviewPerformanceScore?: number; // NEW
    candidateLevel?: string; // NEW
    growthPotential?: number; // NEW
    improvementOpportunity?: number; // NEW
    confidenceGap?: number; // NEW
    answerReliabilityScore?: number; // NEW
    topicCoverage: number; // 0-100
    knowledgeStability: number; // 0-100 (knowledgeStabilityScore)
    reportConfidence: 'High' | 'Medium' | 'Low';
    summary: string;
    honestyScore?: number; // 0-100%
    bluffRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
    bluffIncidents?: number;
    knowledgeAdmissionScore?: number; // 0-100%
  };
  overallScores: {
    knowledgeScore: number; // 0-100
    reasoningScore: number; // 0-100
    communicationScore: number; // 0-100
    consistencyScore: number; // 0-100
    difficultyWeightedPerformance: number; // 0-100
    trustAdjustedScore: number; // 0-100
    readinessScore?: number; // NEW
    interviewPerformanceScore?: number; // NEW
    growthPotential?: number; // NEW
    improvementOpportunity?: number; // NEW
    confidenceGap?: number; // NEW
    answerReliabilityScore?: number; // NEW
    honestyScore?: number; // 0-100%
    bluffRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
    bluffIncidents?: number;
    knowledgeAdmissionScore?: number; // 0-100%
  };
  strengths: string[];
  weaknesses: string[];
  topImprovements?: string[]; // NEW
  validationResults: {
    parentQuestion: string;
    parentScore: number;
    followupQuestion: string;
    followupScore: number;
    reliability: number; // 0-100
  }[];
  contradictions: {
    qIndex1: number;
    qIndex2: number;
    explanation: string;
    severity: 'low' | 'medium' | 'high';
    status: 'confirmed' | 'possible' | 'insufficient_evidence';
    confidence: number; // 0-100
  }[];
  performanceTrend: {
    timeline: { qIndex: number; score: number }[];
    trend: 'improving' | 'stable' | 'declining';
  };
  proctoringSummary: {
    faceAwayEvents: number;
    multiplePersonEvents: number;
    tabSwitches: number;
    warningsIssued: number;
    integrityScore: number;
    totalGazeAwayDurationMs?: number;
    longestGazeAwayDurationMs?: number;
  };
  questionBreakdown: {
    questionText: string;
    difficulty: 'easy' | 'medium' | 'hard';
    score: number; // 0-10
    userAnswer: string;
    feedback: FeedbackStructure;
    mentionedConcepts?: string[];
    explainedConcepts?: string[];
    matchedKeyPoints: string[];
    missingKeyPoints: string[];
    answerType?: 'honest_unknown' | 'keyword_list_only' | 'incorrect_attempt' | 'mixed_understanding' | 'partial_explanation' | 'full_explanation';
    answerQuality?: 'HONEST_UNKNOWN' | 'KEYWORD_LIST' | 'INCORRECT_ATTEMPT' | 'SURFACE_LEVEL' | 'COMPETENT' | 'STRONG' | 'EXPERT';
    honestyScore?: number;
    knowledgeAdmissionScore?: number;
    bluffRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
    misconceptionRisk?: 'LOW' | 'MEDIUM' | 'HIGH';
    confidenceCalibration?: 'UNDERCONFIDENT' | 'CALIBRATED' | 'OVERCONFIDENT';
    technicalErrors: { error: string; severity: 'low' | 'medium' | 'high' }[];
    analysis: {
      coverage: number; // 0-10
      understanding: number; // 0-10
      reasoning: number; // 0-10
      communication: number; // 0-10
    };
    speechMetrics?: { fillerRate: number; pauseRate: number; speakingRate: number };
    transcriptionQualityScore: number; // 0-100
    followupResult?: {
      reliability: number; // 0-100
    };
    evaluationError?: string;
    // MCQ/Aptitude Extensions in Breakdown
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    imageUrl?: string;
    timeSpentSeconds?: number;
  }[];
  benchmarkComparison: {
    percentile: number;
    comparedAgainst: string;
    sampleSize: number;
  };
  telemetry: {
    followupTriggerRate: number;
    sessionApiCostEstimate: number;
    modelCalls: number;
  };
  metadata: {
    evaluationVersion: string;
    scoreCalculationVersion: string;
    modelUsed: string;
    evaluationMode: 'full_ai' | 'fallback_heuristic' | 'mixed';
    roleLevel: 'intern' | 'junior' | 'mid' | 'senior';
  };
  // Aptitude Summary Extension
  aptitudeSummary?: {
    correct: number;
    incorrect: number;
    unattempted: number;
    accuracy: number;
    trustScore: number;
    timeSpentSeconds: number;
    categoryBreakdown: {
      [category: string]: {
        total: number;
        correct: number;
        accuracy: number;
      }
    };
    improvements: string[];
  };
}

export interface ErrorLog {
  id: string;
  timestamp: string;
  category: 'interview' | 'evaluation' | 'database' | 'system' | 'api' | 'proctoring';
  message: string;
  details?: string;
  sessionId?: string;
  candidateName?: string;
}

export interface ProctoringSettings {
  faceMissingWarningSec: number;
  faceMissingTerminateSec: number;
  tabSwitchWarningCount: number;
  tabSwitchTerminateCount: number;
  multipleFacesWarningCount: number;
  multipleFacesTerminateCount: number;
  cameraOffWarningSec: number;
  cameraOffTerminateSec: number;
  micOffWarningSec: number;
  micOffTerminateSec: number;
  fullscreenExitWarningCount: number;
  fullscreenExitTerminateCount: number;
}

export const DEFAULT_PROCTORING_SETTINGS: ProctoringSettings = {
  faceMissingWarningSec: 10,
  faceMissingTerminateSec: 30,
  tabSwitchWarningCount: 2,
  tabSwitchTerminateCount: 5,
  multipleFacesWarningCount: 1,
  multipleFacesTerminateCount: 3,
  cameraOffWarningSec: 10,
  cameraOffTerminateSec: 30,
  micOffWarningSec: 10,
  micOffTerminateSec: 30,
  fullscreenExitWarningCount: 1,
  fullscreenExitTerminateCount: 3,
};