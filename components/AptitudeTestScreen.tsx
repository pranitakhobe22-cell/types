import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Camera, AlertTriangle, CheckCircle, ArrowRight, Clock, ShieldAlert, Check } from 'lucide-react';
import { AIService } from '../services/aiService';
import { APTITUDE_QUESTION_BANK } from '../services/questionBank';
import { CameraMonitor } from './CameraMonitor';
import { SupabaseService } from '../services/supabaseService';
import { 
  ProctoringReport, ProctoringState, ProctoringAction, 
  Question, TimelineEvent, ProctorViolation, RawDetectionFrame, HeartbeatMetrics
} from '../types';
import { ErrorLogService } from '../services/errorLogService';

const generateViolationId = () => Math.random().toString(36).substring(2, 9);
const VIOLATION_COOLDOWN = 5000;
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

const createInitialState = (): ProctoringState => ({
  engineState: 'INITIALIZING',
  currentRiskScore: 0,
  overallRiskScore: 0,
  heartbeat: {
    fps: 0, lastDetectionAgoMs: 0, trackingConfidence: 0, engineState: 'INITIALIZING',
    gazeDirection: '',
    detectionHealth: 'GOOD'
  },
  violations: [],
  timeline: [],
  gazeState: 'LOOKING', gazeAwayStartTime: null,
  multiFaceState: 'SINGLE_FACE', multiFaceStartTime: null,
  noFaceState: 'FACE_PRESENT', noFaceStartTime: null,
  sessionStartTime: Date.now(),
  monitoringStartTime: null,
  cameraReconnectCount: 0,
  maxConcurrentFaces: 1,
  microphoneHealthy: true,
  networkHealthy: true,
  heartbeatCount: 0,
  fullscreenExitEvents: 0,
  copyPasteEvents: 0,
  violationScore: 0,
  integrityScore: 100,
  totalGazeAwayDurationMs: 0,
  lastViolationTime: 0
});

const proctoringReducer = (state: ProctoringState, action: ProctoringAction): ProctoringState => {
  const now = Date.now();
  switch (action.type) {
    case 'SET_UNSUPPORTED_BROWSER': return { ...state, engineState: 'UNSUPPORTED_BROWSER' };
    case 'SET_PERMISSION_DENIED': return { ...state, engineState: 'PERMISSION_DENIED' };
    case 'ENGINE_READY': return { ...state, engineState: 'READY', monitoringStartTime: state.monitoringStartTime || now };
    case 'HEARTBEAT': return { ...state, heartbeat: action.metrics, heartbeatCount: state.heartbeatCount + 1 };
    
    case 'DECAY_RISK': {
      if (state.currentRiskScore === 0) return state;
      const floor = Math.floor(state.overallRiskScore * 0.25);
      const newScore = Math.max(floor, state.currentRiskScore - 1);
      return { ...state, currentRiskScore: newScore };
    }

    case 'TAB_HIDDEN': {
      if (now - state.lastViolationTime < VIOLATION_COOLDOWN) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'TAB_HIDDEN', severity: 2, timestamp: now, message: 'Browser tab hidden' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'TAB_HIDDEN', severity: 2 };
      const newViolationScore = state.violationScore + 2;
      return { 
        ...state, 
        violations: [...state.violations, v], 
        timeline: [...state.timeline, t], 
        violationScore: newViolationScore, 
        integrityScore: Math.max(0, 100 - newViolationScore * 5),
        lastViolationTime: now 
      };
    }

    case 'FULLSCREEN_EXIT': {
      if (now - state.lastViolationTime < VIOLATION_COOLDOWN) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'FULLSCREEN_EXIT', severity: 3, timestamp: now, message: 'Exited fullscreen mode' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'FULLSCREEN_EXIT', severity: 3 };
      const newViolationScore = state.violationScore + 3;
      return { 
        ...state, 
        fullscreenExitEvents: state.fullscreenExitEvents + 1, 
        violations: [...state.violations, v], 
        timeline: [...state.timeline, t], 
        violationScore: newViolationScore, 
        integrityScore: Math.max(0, 100 - newViolationScore * 5),
        lastViolationTime: now 
      };
    }

    case 'COPY_PASTE': {
      if (now - state.lastViolationTime < VIOLATION_COOLDOWN) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'COPY_PASTE', severity: 2, timestamp: now, message: 'Clipboard action detected' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'COPY_PASTE', severity: 2 };
      const newViolationScore = state.violationScore + 2;
      return { 
        ...state, 
        copyPasteEvents: state.copyPasteEvents + 1, 
        violations: [...state.violations, v], 
        timeline: [...state.timeline, t], 
        violationScore: newViolationScore, 
        integrityScore: Math.max(0, 100 - newViolationScore * 5),
        lastViolationTime: now 
      };
    }

    case 'CAMERA_LOST': {
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'CAMERA_LOST', severity: 4, timestamp: now, message: 'Camera disconnected' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'CAMERA_LOST', severity: 4 };
      const newViolationScore = state.violationScore + 4;
      return { 
        ...state, 
        cameraReconnectCount: state.cameraReconnectCount + 1, 
        violations: [...state.violations, v], 
        timeline: [...state.timeline, t], 
        violationScore: newViolationScore,
        integrityScore: Math.max(0, 100 - newViolationScore * 5),
        lastViolationTime: now
      };
    }

    case 'MICROPHONE_LOST': {
      if (!state.microphoneHealthy) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'MICROPHONE_LOST', severity: 2, timestamp: now, message: 'Microphone disconnected or muted' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MICROPHONE_LOST', severity: 2 };
      const newViolationScore = state.violationScore + 2;
      return { 
        ...state, 
        microphoneHealthy: false, 
        violations: [...state.violations, v], 
        timeline: [...state.timeline, t], 
        violationScore: newViolationScore,
        integrityScore: Math.max(0, 100 - newViolationScore * 5),
        lastViolationTime: now
      };
    }

    case 'MICROPHONE_RECOVERED': return { ...state, microphoneHealthy: true };
    case 'NETWORK_LOST': return { ...state, networkHealthy: false };
    case 'NETWORK_RECOVERED': return { ...state, networkHealthy: true };

    case 'DETECTION_FRAME': {
      let newState = { ...state };
      if (action.frame.faceCount > state.maxConcurrentFaces) newState.maxConcurrentFaces = action.frame.faceCount;

      // No Face State Machine
      if (action.frame.faceCount === 0) {
        if (newState.noFaceState === 'FACE_PRESENT') {
          newState.noFaceState = 'NO_FACE_START';
          newState.noFaceStartTime = now;
        } else if (newState.noFaceState === 'NO_FACE_START' && newState.noFaceStartTime && now - newState.noFaceStartTime > 15000) {
          newState.noFaceState = 'VIOLATION_CREATED';
          if (now - state.lastViolationTime >= VIOLATION_COOLDOWN) {
            const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'NO_FACE', severity: 3, timestamp: now, message: 'No face detected for 15s' };
            const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'NO_FACE', severity: 3 };
            newState.violations = [...newState.violations, v];
            newState.timeline = [...newState.timeline, t];
            newState.violationScore += 3;
            newState.integrityScore = Math.max(0, 100 - newState.violationScore * 5);
            newState.lastViolationTime = now;
          }
        }
      } else {
        newState.noFaceState = 'FACE_PRESENT';
        newState.noFaceStartTime = null;
      }

      // Multiple Faces State Machine
      if (action.frame.faceCount > 1) {
        if (newState.multiFaceState === 'SINGLE_FACE') {
          newState.multiFaceState = 'MULTI_FACE_START';
          newState.multiFaceStartTime = now;
        } else if (newState.multiFaceState === 'MULTI_FACE_START' && newState.multiFaceStartTime && now - newState.multiFaceStartTime > 3000) {
          newState.multiFaceState = 'MULTI_FACE_CONFIRMED';
          if (now - state.lastViolationTime >= VIOLATION_COOLDOWN) {
            const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'MULTIPLE_FACES', severity: 5, timestamp: now, message: 'Multiple faces detected for 3s' };
            const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MULTIPLE_FACES', severity: 5 };
            newState.violations = [...newState.violations, v];
            newState.timeline = [...newState.timeline, t];
            newState.violationScore += 5;
            newState.integrityScore = Math.max(0, 100 - newState.violationScore * 5);
            newState.lastViolationTime = now;
          }
        }
      } else {
        newState.multiFaceState = 'SINGLE_FACE';
        newState.multiFaceStartTime = null;
      }

      // Gaze State Machine (Holistic Away Detection)
      // Reduced sensitivity: Away > 5-6 sec -> violation (we check 5500 ms)
      const isAway = action.frame.gazeDirection !== 'center' || Math.abs(action.frame.headYaw) > 30 || action.frame.facePosition === 'PARTIAL_OUT';
      if (isAway && action.frame.faceCount > 0) {
        if (newState.gazeState === 'LOOKING') {
          newState.gazeState = 'AWAY_START';
          newState.gazeAwayStartTime = now;
        } else if (newState.gazeState === 'AWAY_START' && newState.gazeAwayStartTime && now - newState.gazeAwayStartTime > 5500) {
          newState.gazeState = 'VIOLATION_CREATED';
          if (now - state.lastViolationTime >= VIOLATION_COOLDOWN) {
            const reason = action.frame.facePosition === 'PARTIAL_OUT' ? 'Face partially out of camera view' : 
                           Math.abs(action.frame.headYaw) > 30 ? 'Head turned away from screen' : 
                           `Looking ${action.frame.gazeDirection}`;
            const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'GAZE_AWAY', severity: 2, timestamp: now, message: reason };
            const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'GAZE_AWAY', severity: 2, detail: reason };
            newState.violations = [...newState.violations, v];
            newState.timeline = [...newState.timeline, t];
            newState.violationScore += 2;
            newState.integrityScore = Math.max(0, 100 - newState.violationScore * 5);
            newState.lastViolationTime = now;
          }
          newState.totalGazeAwayDurationMs += (now - newState.gazeAwayStartTime);
        }
      } else {
        newState.gazeState = 'LOOKING';
        if (action.frame.faceCount > 0) {
          newState.gazeAwayStartTime = null;
        }
      }

      const isChanged = 
        newState.maxConcurrentFaces !== state.maxConcurrentFaces ||
        newState.noFaceState !== state.noFaceState ||
        newState.multiFaceState !== state.multiFaceState ||
        newState.gazeState !== state.gazeState ||
        newState.violations.length !== state.violations.length ||
        newState.timeline.length !== state.timeline.length ||
        newState.violationScore !== state.violationScore;

      return isChanged ? newState : state;
    }
    default: return state;
  }
};

const selectBalancedQuestions = (): Question[] => {
  const quant = APTITUDE_QUESTION_BANK.filter(q => q.category === 'Quantitative');
  const logical = APTITUDE_QUESTION_BANK.filter(q => q.category === 'Logical');
  const analytical = APTITUDE_QUESTION_BANK.filter(q => q.category === 'Analytical');
  const verbal = APTITUDE_QUESTION_BANK.filter(q => q.category === 'Verbal');

  const pick = (arr: any[], count: number) => {
    return [...arr].sort(() => 0.5 - Math.random()).slice(0, count);
  };

  const chosen = [
    ...pick(quant, 3),
    ...pick(logical, 3),
    ...pick(analytical, 2),
    ...pick(verbal, 2)
  ];
  
  return chosen.sort(() => 0.5 - Math.random());
};

interface AptitudeTestScreenProps {
  candidate: { name: string; email: string; role: string; customTopic?: string; isDemo?: boolean; jobPostId?: string };
  onComplete: (history: { question: string; answer: string; ideal_answer: string; questionData?: any; timeSpentSeconds?: number }[], proctoringReport: ProctoringReport, evalReport: any) => void;
}

export const AptitudeTestScreen: React.FC<AptitudeTestScreenProps> = ({ candidate, onComplete }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [index: number]: string }>({});
  const [remainingTimeSeconds, setRemainingTimeSeconds] = useState(60);
  const [timeSpentArray, setTimeSpentArray] = useState<number[]>(new Array(10).fill(0));
  const [hasStarted, setHasStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Submitting answers and compiling results...');
  const [cameraReady, setCameraReady] = useState(false);
  const [toastWarning, setToastWarning] = useState<{ message: string; type: 'warning' | 'danger' } | null>(null);

  const sessionIdRef = useRef<string>(localStorage.getItem('current_session_id') || "");
  const [proctoring, dispatch] = useReducer(proctoringReducer, createInitialState());
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isTerminatedRef = useRef<boolean>(false);

  // 1. Initialize assessment questions, session recovery
  useEffect(() => {
    const recoveryKey = `reicrew_mcq_recovery_${sessionIdRef.current}`;
    const savedStr = localStorage.getItem(recoveryKey);
    let initialized = false;

    if (savedStr) {
      try {
        const saved = JSON.parse(savedStr);
        if (saved && (Date.now() - saved.startedAt < SESSION_TTL_MS)) {
          setQuestions(saved.questions);
          setCurrentIndex(saved.currentIndex);
          setSelectedAnswers(saved.selectedAnswers || {});
          setRemainingTimeSeconds(saved.remainingTimeSeconds);
          setTimeSpentArray(saved.timeSpentArray || new Array(10).fill(0));
          setHasStarted(true);
          initialized = true;
        } else {
          localStorage.removeItem(recoveryKey);
        }
      } catch (e) {
        console.warn("Failed to parse recovery state for Aptitude", e);
      }
    }

    if (!initialized) {
      const selected = selectBalancedQuestions();
      setQuestions(selected);
      // Create initial recovery payload
      localStorage.setItem(recoveryKey, JSON.stringify({
        startedAt: Date.now(),
        questions: selected,
        currentIndex: 0,
        selectedAnswers: {},
        remainingTimeSeconds: 60,
        timeSpentArray: new Array(10).fill(0)
      }));
    }
  }, []);

  // 2. Prevent right-click, select all, and copy-paste shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      dispatch({ type: 'COPY_PASTE' });
      setToastWarning({ message: "Right-click context menu is disabled for security.", type: 'warning' });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCopy = e.ctrlKey && (e.key === 'c' || e.key === 'C');
      const isPaste = e.ctrlKey && (e.key === 'v' || e.key === 'V');
      const isSelectAll = e.ctrlKey && (e.key === 'a' || e.key === 'A');
      const isInspect = e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I'));

      if (isCopy || isPaste || isSelectAll || isInspect) {
        e.preventDefault();
        dispatch({ type: 'COPY_PASTE' });
        setToastWarning({ message: "Security Warning: Keyboard shortcuts are restricted.", type: 'warning' });
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 3. Tab focus and fullscreen triggers
  useEffect(() => {
    const handleVis = () => {
      if (document.hidden) {
        dispatch({ type: 'TAB_HIDDEN' });
      }
    };
    const handleBlur = () => {
      dispatch({ type: 'TAB_HIDDEN' });
    };
    const handleFullscreen = () => { 
      if (!document.fullscreenElement) {
        dispatch({ type: 'FULLSCREEN_EXIT' });
      }
    };

    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, []);

  // 4. Timer interval per question and total time spent
  useEffect(() => {
    if (!hasStarted || loading || isTerminatedRef.current) return;

    timerRef.current = setInterval(() => {
      setRemainingTimeSeconds((prev) => {
        if (prev <= 1) {
          // Time expired! Auto-next
          handleNextQuestion(true);
          return 60;
        }
        return prev - 1;
      });

      setTimeSpentArray((prev) => {
        const next = [...prev];
        next[currentIndex] = (next[currentIndex] || 0) + 1;
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, currentIndex, loading]);

  // 5. Update recovery state locally
  useEffect(() => {
    if (!hasStarted || questions.length === 0) return;
    const recoveryKey = `reicrew_mcq_recovery_${sessionIdRef.current}`;
    const savedStr = localStorage.getItem(recoveryKey);
    let startedAt = Date.now();
    try {
      if (savedStr) startedAt = JSON.parse(savedStr).startedAt;
    } catch (e) {}

    localStorage.setItem(recoveryKey, JSON.stringify({
      startedAt,
      questions,
      currentIndex,
      selectedAnswers,
      remainingTimeSeconds,
      timeSpentArray
    }));
  }, [currentIndex, selectedAnswers, remainingTimeSeconds, timeSpentArray, questions, hasStarted]);

  // 6. Terminate interview on extreme proctoring violations
  useEffect(() => {
    if (proctoring.violationScore >= 15 && !isTerminatedRef.current && hasStarted) {
      isTerminatedRef.current = true;
      setToastWarning({ message: "Test Terminated: Multiple integrity violations detected.", type: 'danger' });
      submitAndComplete(true);
    } else if (proctoring.violationScore >= 10 && proctoring.violationScore < 15 && hasStarted) {
      setToastWarning({ message: `Severe Warning: Integrity violations detected. Score: ${proctoring.violationScore}/15. Further violations will terminate your test.`, type: 'danger' });
    } else if (proctoring.violationScore >= 5 && proctoring.violationScore < 10 && hasStarted) {
      setToastWarning({ message: `Warning: Please remain focused on the screen. Warning Score: ${proctoring.violationScore}/15.`, type: 'warning' });
    }
  }, [proctoring.violationScore, hasStarted]);

  // Toast warning automatic fade out
  useEffect(() => {
    if (toastWarning && toastWarning.type !== 'danger') {
      const t = setTimeout(() => setToastWarning(null), 5000);
      return () => clearTimeout(t);
    }
  }, [toastWarning]);

  const handleDetectionFrame = (frame: RawDetectionFrame) => {
    dispatch({ type: 'DETECTION_FRAME', frame });
  };

  const handleEngineReady = () => {
    dispatch({ type: 'ENGINE_READY' });
  };

  const handleHeartbeat = (metrics: HeartbeatMetrics) => {
    dispatch({ type: 'HEARTBEAT', metrics });
  };

  const compileProctorReport = (): ProctoringReport => {
    const elapsedMs = Date.now() - proctoring.sessionStartTime;
    const violations = proctoring.violations.map(v => ({ ...v, sessionId: sessionIdRef.current }));
    const timeline = proctoring.timeline.map(t => ({ ...t, sessionId: sessionIdRef.current }));

    return {
      sessionId: sessionIdRef.current,
      currentRiskScore: proctoring.currentRiskScore,
      overallRiskScore: proctoring.overallRiskScore,
      noFaceEvents: violations.filter(v => v.type === 'NO_FACE').length,
      gazeAwayEvents: violations.filter(v => v.type === 'GAZE_AWAY').length,
      multipleFaceEvents: violations.filter(v => v.type === 'MULTIPLE_FACES').length,
      tabSwitchEvents: violations.filter(v => v.type === 'TAB_HIDDEN').length,
      fullscreenExitEvents: proctoring.fullscreenExitEvents,
      copyPasteEvents: proctoring.copyPasteEvents,
      violationScore: proctoring.violationScore,
      integrityScore: proctoring.integrityScore,
      totalGazeAwayDurationMs: proctoring.totalGazeAwayDurationMs,
      microphoneLostEvents: violations.filter(v => v.type === 'MICROPHONE_LOST').length,
      violations,
      timeline,
      sessionDurationMs: elapsedMs,
      monitoringDurationMs: proctoring.monitoringStartTime ? (Date.now() - proctoring.monitoringStartTime) : elapsedMs,
      heartbeatCount: proctoring.heartbeatCount,
      heartbeatSamples: [],
      cameraReconnectCount: proctoring.cameraReconnectCount,
      maxConcurrentFaces: proctoring.maxConcurrentFaces,
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      },
      healthSummary: {
        monitoringCoveragePercent: 100,
        averageTrackingConfidence: 90,
        totalDetectionFrames: proctoring.heartbeatCount * 15,
        stalledPeriods: 0,
        longestNoFaceDurationMs: 0,
        longestGazeAwayDurationMs: 0
      }
    };
  };

  const handleNextQuestion = (isTimeout = false) => {
    if (isTimeout) {
      // Auto-submit current question as unattempted or empty if not answered
      setSelectedAnswers((prev) => {
        if (prev[currentIndex] === undefined) {
          return { ...prev, [currentIndex]: 'Unattempted' };
        }
        return prev;
      });
    }

    if (currentIndex < 9) {
      setCurrentIndex((prev) => prev + 1);
      setRemainingTimeSeconds(60);
    } else {
      // Completed the 10th question!
      submitAndComplete(false);
    }
  };

  const submitAndComplete = async (terminated = false) => {
    setLoading(true);
    setLoadingText(terminated ? "Test terminated. Compiling report..." : "Assessment complete. Saving evaluation...");
    if (timerRef.current) clearInterval(timerRef.current);

    const recoveryKey = `reicrew_mcq_recovery_${sessionIdRef.current}`;
    localStorage.removeItem(recoveryKey);

    const proctorReport = compileProctorReport();

    // Map history array structure
    const historyData = questions.map((q, idx) => {
      const selected = selectedAnswers[idx] || 'Unattempted';
      return {
        question: q.question,
        answer: selected,
        ideal_answer: q.answer || '',
        questionData: q,
        timeSpentSeconds: timeSpentArray[idx] || 0
      };
    });

    let evalReport = null;
    try {
      evalReport = await AIService.evaluateInterview(historyData, sessionIdRef.current, proctorReport);
    } catch (e) {
      console.error("Failed to generate AI evaluation report for MCQ:", e);
    }

    onComplete(historyData, proctorReport, evalReport);
  };

  // SVG timer properties
  const radius = 24;
  const stroke = 4;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (remainingTimeSeconds / 60) * circumference;

  const currentQ = questions[currentIndex];
  const hasSelected = selectedAnswers[currentIndex] !== undefined;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-6">
      {/* Toast Warnings */}
      {toastWarning && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${
          toastWarning.type === 'danger' 
            ? 'bg-rose-50 border-rose-200 text-rose-600' 
            : 'bg-amber-50 border-amber-200 text-amber-600'
        }`}>
          <ShieldAlert className="shrink-0" />
          <span className="font-semibold text-sm">{toastWarning.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-3xl shadow-sm mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-xl">A</div>
          <div>
            <h2 className="text-base font-extrabold text-slate-800">Aptitude Path</h2>
            <p className="text-slate-400 text-xs font-medium">MCQ Assessment</p>
          </div>
        </div>

        {/* Indicators */}
        <div className="hidden md:flex items-center gap-2">
          {Array.from({ length: 10 }).map((_, idx) => {
            const isDone = selectedAnswers[idx] !== undefined;
            const isCurrent = idx === currentIndex;
            return (
              <div 
                key={idx} 
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  isCurrent ? 'bg-indigo-600 scale-125 ring-4 ring-indigo-50' : 
                  isDone ? 'bg-indigo-200' : 'bg-slate-100'
                }`}
              />
            );
          })}
        </div>

        {/* Live Proctor and Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-700 text-xs font-bold uppercase tracking-wider">Secure</span>
          </div>

          <div className="relative flex items-center justify-center">
            <svg height="48" width="48" className="transform -rotate-90">
              <circle
                stroke="#E2E8F0"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke={remainingTimeSeconds <= 15 ? "#EF4444" : "#4F46E5"}
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
            </svg>
            <span className={`absolute text-xs font-black ${remainingTimeSeconds <= 15 ? 'text-rose-500 animate-pulse' : 'text-slate-700'}`}>
              {remainingTimeSeconds}s
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch mb-6">
        {/* Left Side: Proctor Preview */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900 aspect-video lg:aspect-square rounded-3xl overflow-hidden shadow-md relative border border-slate-800">
            <CameraMonitor
              onDetectionFrame={handleDetectionFrame}
              onEngineReady={handleEngineReady}
              onHeartbeat={handleHeartbeat}
              devOverlay={false}
              onVideoReady={() => setCameraReady(true)}
            />
            <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${proctoring.engineState === 'READY' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span className="text-white text-[10px] font-mono tracking-wider">
                {proctoring.engineState === 'READY' ? 'VISION LOGGED' : 'CALIBRATING'}
              </span>
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm flex flex-col justify-between flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Clock size={16} className="text-indigo-500" />
                Assessment Instructions
              </h3>
              <ul className="text-xs text-slate-500 space-y-2.5 font-medium">
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-black">•</span>
                  Each question has a strict 60s timer limit.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-black">•</span>
                  Timer resets automatically when moving to the next question.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-black">•</span>
                  Forward-only navigation. You cannot return to previous questions.
                </li>
                <li className="flex gap-2">
                  <span className="text-indigo-500 font-black">•</span>
                  Integrity proctoring actively monitors gaze, tab switches, and shortcuts.
                </li>
              </ul>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4">
              <div className="flex justify-between items-center text-xs font-bold text-slate-400 mb-1">
                <span>INTEGRITY STATUS</span>
                <span className={proctoring.integrityScore < 70 ? 'text-rose-500' : 'text-emerald-500'}>
                  {proctoring.integrityScore}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    proctoring.integrityScore < 50 ? 'bg-rose-500' : 
                    proctoring.integrityScore < 75 ? 'bg-amber-400' : 
                    'bg-emerald-500'
                  }`}
                  style={{ width: `${proctoring.integrityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: MCQ Panel */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 flex flex-col justify-between shadow-sm">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 h-full py-20">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-bold text-lg">{loadingText}</p>
            </div>
          ) : currentQ ? (
            <div className="space-y-6">
              {/* Question Index & Category */}
              <div className="flex items-center gap-3">
                <span className="bg-indigo-50 text-indigo-600 text-xs font-extrabold px-3 py-1.5 rounded-xl uppercase tracking-wider">
                  {currentQ.category}
                </span>
                <span className="text-slate-400 text-xs font-bold">
                  Question {currentIndex + 1} of 10
                </span>
                {currentQ.difficulty && (
                  <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${
                    currentQ.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                    currentQ.difficulty === 'hard' ? 'bg-rose-50 text-rose-600' :
                    'bg-amber-50 text-amber-600'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-800 leading-snug">
                {currentQ.question}
              </h1>

              {/* Optional Question Image */}
              {currentQ.imageUrl && (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-64 flex justify-center bg-slate-50 p-2">
                  <img src={currentQ.imageUrl} alt="Question Diagram" className="object-contain max-h-60" />
                </div>
              )}

              {/* Options Selection Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {currentQ.options?.map((opt, oIdx) => {
                  const optKey = String.fromCharCode(65 + oIdx); // A, B, C, D
                  const isSelected = selectedAnswers[currentIndex] === optKey;

                  return (
                    <button
                      key={oIdx}
                      onClick={() => {
                        setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optKey }));
                      }}
                      className={`group text-left p-5 rounded-2xl border-2 transition-all duration-300 flex items-center justify-between active:scale-[0.99] ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100' 
                          : 'border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-50 group-hover:bg-slate-100 text-slate-500'
                        }`}>
                          {optKey}
                        </div>
                        <span className="text-slate-700 font-semibold text-sm">{opt}</span>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          <Check size={12} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full py-20 text-slate-400">
              No questions found.
            </div>
          )}

          {/* Navigation Controls */}
          {!loading && (
            <div className="border-t border-slate-100 pt-6 mt-8 flex items-center justify-between">
              <span className="text-slate-400 text-xs font-semibold">
                * Note: Answers are saved dynamically as you make a selection.
              </span>
              <button
                onClick={() => handleNextQuestion(false)}
                disabled={!hasSelected}
                className="bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-md hover:shadow-xl shadow-indigo-100 disabled:shadow-none"
              >
                <span>{currentIndex < 9 ? 'Next Question' : 'Complete Assessment'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
