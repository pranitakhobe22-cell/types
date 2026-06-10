
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
       | 'CAMERA_LOST' | 'MICROPHONE_LOST' | 'REFRESH_ATTEMPT';
  severity: number;
  timestamp: number;
  message: string;
  snapshot_url?: string;
  clip_url?: string;
};

export type TimelineEvent = {
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
  microphoneLostEvents: number;
  violations: ProctorViolation[];
  timeline: TimelineEvent[];
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
};

export type ProctoringAction = 
  | { type: 'DETECTION_FRAME'; frame: RawDetectionFrame }
  | { type: 'ENGINE_READY' }
  | { type: 'HEARTBEAT'; metrics: HeartbeatMetrics }
  | { type: 'TAB_HIDDEN' }
  | { type: 'REFRESH_ATTEMPT' }
  | { type: 'CAMERA_LOST' }
  | { type: 'MICROPHONE_LOST' }
  | { type: 'MICROPHONE_RECOVERED' }
  | { type: 'NETWORK_LOST' }
  | { type: 'NETWORK_RECOVERED' }
  | { type: 'DECAY_RISK' }
  | { type: 'SET_UNSUPPORTED_BROWSER' }
  | { type: 'SET_PERMISSION_DENIED' }
  | { type: 'UPDATE_VIOLATION_MEDIA'; id: string; snapshotUrl: string | null; clipUrl: string | null };

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