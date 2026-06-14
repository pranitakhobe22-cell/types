import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Mic, MicOff, Volume2, Send, Loader2, Edit3, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { AIService, GeneratedQuestion } from '../services/aiService';
import { submitAnswer } from '../services/apiService';
import { useSpeech } from '../hooks/useSpeech';
import { CameraMonitor } from './CameraMonitor';
import { MonitoringDashboard } from './MonitoringDashboard';
import { SupabaseService } from '../services/supabaseService';
import { MediaCaptureService, RollingRecorder } from '../services/mediaCaptureService';
import { 
  InterviewMediaResources, RawDetectionFrame, ProctorViolation, TimelineEvent, 
  HeartbeatMetrics, ProctoringEngineState, ProctoringReport, DashboardTelemetry 
} from '../types';
import { getDeviceFingerprint } from '../services/deviceFingerprint';

// Speech Recognition Types removed, using useSpeech hook
import { ProctoringState, ProctoringAction } from '../types';

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

const generateViolationId = () => Math.random().toString(36).substring(2, 9);
const VIOLATION_COOLDOWN = 5000;

const baseReducer = (state: ProctoringState, action: ProctoringAction): ProctoringState => {
  const now = Date.now();
  switch (action.type) {
    case 'SET_UNSUPPORTED_BROWSER': return { ...state, engineState: 'UNSUPPORTED_BROWSER' };
    case 'SET_PERMISSION_DENIED': return { ...state, engineState: 'PERMISSION_DENIED' };
    case 'ENGINE_READY': return { ...state, engineState: 'READY', monitoringStartTime: state.monitoringStartTime || now };
    case 'HEARTBEAT': return { ...state, heartbeat: action.metrics, heartbeatCount: state.heartbeatCount + 1 };
    
    case 'UPDATE_VIOLATION_MEDIA': {
      const violations = state.violations.map(v => 
        v.id === action.id ? { ...v, snapshot_url: action.snapshotUrl || undefined, clip_url: action.clipUrl || undefined } : v
      );
      return { ...state, violations };
    }

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
      return { ...state, violations: [...state.violations, v], timeline: [...state.timeline, t], violationScore: state.violationScore + 2, lastViolationTime: now };
    }

    case 'FULLSCREEN_EXIT': {
      if (now - state.lastViolationTime < VIOLATION_COOLDOWN) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'FULLSCREEN_EXIT', severity: 3, timestamp: now, message: 'Exited fullscreen mode' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'FULLSCREEN_EXIT', severity: 3 };
      return { ...state, fullscreenExitEvents: state.fullscreenExitEvents + 1, violations: [...state.violations, v], timeline: [...state.timeline, t], violationScore: state.violationScore + 3, lastViolationTime: now };
    }

    case 'COPY_PASTE': {
      if (now - state.lastViolationTime < VIOLATION_COOLDOWN) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'COPY_PASTE', severity: 2, timestamp: now, message: 'Clipboard action detected' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'COPY_PASTE', severity: 2 };
      return { ...state, copyPasteEvents: state.copyPasteEvents + 1, violations: [...state.violations, v], timeline: [...state.timeline, t], violationScore: state.violationScore + 2, lastViolationTime: now };
    }

    case 'CAMERA_LOST': {
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'CAMERA_LOST', severity: 4, timestamp: now, message: 'Camera disconnected' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'CAMERA_LOST', severity: 4 };
      return { ...state, cameraReconnectCount: state.cameraReconnectCount + 1, violations: [...state.violations, v], timeline: [...state.timeline, t], currentRiskScore: state.currentRiskScore + 4, overallRiskScore: state.overallRiskScore + 4 };
    }

    case 'MICROPHONE_LOST': {
      if (!state.microphoneHealthy) return state;
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'MICROPHONE_LOST', severity: 2, timestamp: now, message: 'Microphone disconnected or muted' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MICROPHONE_LOST', severity: 2 };
      return { ...state, microphoneHealthy: false, violations: [...state.violations, v], timeline: [...state.timeline, t], currentRiskScore: state.currentRiskScore + 2, overallRiskScore: state.overallRiskScore + 2 };
    }

    case 'MICROPHONE_RECOVERED': {
      if (state.microphoneHealthy) return state;
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MICROPHONE_RECOVERED', severity: 0 };
      return { ...state, microphoneHealthy: true, timeline: [...state.timeline, t] };
    }

    case 'NETWORK_LOST': return { ...state, networkHealthy: false };
    case 'NETWORK_RECOVERED': return { ...state, networkHealthy: true };

    case 'DETECTION_FRAME': {
      console.log("REDUCER RECEIVED FRAME", action.frame);
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
            const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'NO_FACE', severity: 3, detail: 'Face missing >15s' };
            newState.violations = [...newState.violations, v];
            newState.timeline = [...newState.timeline, t];
            newState.violationScore += 3;
            newState.lastViolationTime = now;
          }
        }
      } else {
        if (newState.noFaceState === 'VIOLATION_CREATED') {
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'FACE_RECOVERED', severity: 0, detail: 'Face detected' };
          newState.timeline = [...newState.timeline, t];
        }
        newState.noFaceState = 'FACE_PRESENT';
        newState.noFaceStartTime = null;
      }

      // Multiple Faces State Machine
      if (action.frame.faceCount > 1) {
        if (newState.multiFaceState === 'SINGLE_FACE') {
          newState.multiFaceState = 'MULTI_FACE_START';
          newState.multiFaceStartTime = now;
        } else if (newState.multiFaceState === 'MULTI_FACE_START' && newState.multiFaceStartTime && now - newState.multiFaceStartTime > 3000) {
          newState.multiFaceState = 'VIOLATION_CREATED' as any;
          if (now - state.lastViolationTime >= VIOLATION_COOLDOWN) {
            const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'MULTIPLE_FACES', severity: 5, timestamp: now, message: 'Multiple faces detected for 3s' };
            const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MULTIPLE_FACES', severity: 5 };
            newState.violations = [...newState.violations, v];
            newState.timeline = [...newState.timeline, t];
            newState.violationScore += 5;
            newState.lastViolationTime = now;
          }
        }
      } else {
        if (newState.multiFaceState === 'VIOLATION_CREATED' as any) {
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MULTIPLE_FACES_RESOLVED', severity: 0, detail: 'Single face restored' };
          newState.timeline = [...newState.timeline, t];
        }
        newState.multiFaceState = 'SINGLE_FACE';
        newState.multiFaceStartTime = null;
      }

      // Gaze State Machine (Holistic Away Detection)
      const isAway = action.frame.gazeDirection !== 'center' || Math.abs(action.frame.headYaw) > 30 || action.frame.facePosition === 'PARTIAL_OUT';
      if (isAway && action.frame.faceCount > 0) {
        if (newState.gazeState === 'LOOKING') {
          newState.gazeState = 'AWAY_START';
          newState.gazeAwayStartTime = now;
        } else if (newState.gazeState === 'AWAY_START' && newState.gazeAwayStartTime && now - newState.gazeAwayStartTime > 12000) {
          newState.gazeState = 'VIOLATION_CREATED';
          const reason = action.frame.facePosition === 'PARTIAL_OUT' ? 'Face partially out' : 
                         Math.abs(action.frame.headYaw) > 30 ? 'Head turned away' : 
                         `Looking ${action.frame.gazeDirection}`;
          // NO PENALTY YET - Just log the data!
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'GAZE_AWAY_LOG_ONLY', severity: 0, detail: reason };
          newState.timeline = [...newState.timeline, t];
          newState.totalGazeAwayDurationMs += (now - newState.gazeAwayStartTime);
        }
      } else {
        if (newState.gazeState === 'VIOLATION_CREATED') {
          newState.gazeState = 'COOLDOWN';
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'GAZE_RESOLVED', severity: 0, detail: 'Returned to screen' };
          newState.timeline = [...newState.timeline, t];
        } else {
          newState.gazeState = 'LOOKING';
        }
        // Only clear gaze start time if they are looking back at screen AND face is present
        // If face is absent, we don't clear it so we don't spam transitions.
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
        newState.currentRiskScore !== state.currentRiskScore;

      return isChanged ? newState : state;
    }
    default: return state;
  }
};

const MAX_TIMELINE_EVENTS = 250;
const proctoringReducer = (state: ProctoringState, action: ProctoringAction): ProctoringState => {
  const newState = baseReducer(state, action);
  if (newState.timeline.length > MAX_TIMELINE_EVENTS) {
    return {
      ...newState,
      timeline: newState.timeline.slice(newState.timeline.length - MAX_TIMELINE_EVENTS)
    };
  }
  return newState;
};

interface DynamicInterviewScreenProps {
  candidate: { name: string; email: string; role: string; customTopic?: string; isDemo?: boolean; jobPostId?: string };
  onComplete: (history: { question: string; answer: string; ideal_answer: string }[], proctoringReport: ProctoringReport, evalReport: any) => void;
}

export const DynamicInterviewScreen: React.FC<DynamicInterviewScreenProps> = ({ candidate, onComplete }) => {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ question: string; answer: string; ideal_answer: string; evaluation?: any }[]>([]);
  const {
    isListening, transcript, setTranscript, resetTranscript,
    startListening, stopListening, isSupported, speak, stopSpeaking, isSpeaking, warmUp
  } = useSpeech();
  
  const [interimSpeech, setInterimSpeech] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Evaluating your response...');
  const [isEditing, setIsEditing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const [isMobileMonitorOpen, setIsMobileMonitorOpen] = useState(false);
  const MAX_QUESTIONS = 5;

  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    console.log('TRANSCRIPT UPDATED', Date.now(), transcript);
  }, [transcript]);

  const [proctoring, dispatch] = useReducer(proctoringReducer, createInitialState());
  const [toastWarning, setToastWarning] = useState<{ message: string, type: 'warning' | 'danger' } | null>(null);
  const sessionIdRef = useRef<string>(localStorage.getItem('current_session_id') || "");

  useEffect(() => {
    if (!sessionIdRef.current) {
      alert("Fatal Error: Interview session not found. Please restart the interview.");
      window.location.href = '/';
    }
  }, []);

  const mediaRef = useRef<InterviewMediaResources | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const rollingRecorderRef = useRef<RollingRecorder | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const heartbeatSamplesRef = useRef<{timestamp: number; fps: number}[]>([]);
  const latestHeartbeatRef = useRef<{fps: number, health: string}>({ fps: 0, health: 'GOOD' });

  // Dashboard Telemetry
  const defaultTelemetry: DashboardTelemetry = {
    faceDetected: false,
    trackingConfidence: 0,
    monitoringQualityScore: 0,
    gazeDirection: 'center',
    gazeDurationMs: 0,
    headPitch: 0,
    headYaw: 0,
    headRoll: 0,
    fps: 0,
    facePosition: 'CENTERED',
    detectionHealth: 'INITIALIZING',
    lastUpdated: Date.now()
  };
  const telemetryRef = useRef<DashboardTelemetry>(defaultTelemetry);
  const [telemetry, setTelemetry] = useState<DashboardTelemetry>(defaultTelemetry);
  
  const healthStatsRef = useRef({
    totalFrames: 0,
    framesWithFace: 0,
    confidenceSum: 0,
    stalledPeriods: 0,
    longestNoFaceStart: null as number | null,
    longestNoFaceDurationMs: 0,
    longestGazeAwayStart: null as number | null,
    longestGazeAwayDurationMs: 0,
    currentGazeDirection: 'center' as string,
    currentGazeDirectionStart: Date.now() as number
  });

  useEffect(() => {
    // 300ms Sampling for UI stability (no hidden state machine)
    const interval = setInterval(() => {
      setTelemetry(telemetryRef.current);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // 1. Initialize Proctoring Media
  useEffect(() => {
    const checkBrowserSupport = (): boolean => {
      const hasGetUserMedia = !!(navigator.mediaDevices?.getUserMedia);
      const hasWebGL = (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
        } catch { return false; }
      })();
      return hasGetUserMedia && hasWebGL;
    };

    if (!checkBrowserSupport()) {
      dispatch({ type: 'SET_UNSUPPORTED_BROWSER' });
      return;
    }

    let mounted = true;

    const initMediaAndDevice = async () => {
      try {
        // Record Device Fingerprint
        const fp = await getDeviceFingerprint();
        console.log("[Device Fingerprint]", fp);
        // TODO: Save device fingerprint to session via SupabaseService once the session ID is properly mapped

        const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          audio: !isMobileDevice,
        });

        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        mediaRef.current = {
          stream,
          videoTrack: stream.getVideoTracks()[0],
          audioTrack: stream.getAudioTracks()[0],
        };
        
        // Initialize rolling recorder
        rollingRecorderRef.current = new RollingRecorder(stream, 10, 5);
        
        setCameraReady(true);

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.addEventListener('ended', () => dispatch({ type: 'MICROPHONE_LOST' }));
          audioTrack.addEventListener('mute', () => { setTimeout(() => { if (audioTrack.muted) dispatch({ type: 'MICROPHONE_LOST' }) }, 3000) });
          audioTrack.addEventListener('unmute', () => dispatch({ type: 'MICROPHONE_RECOVERED' }));
        }

        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.addEventListener('ended', () => dispatch({ type: 'CAMERA_LOST' }));

      } catch (err) {
        console.error("Camera access denied:", err);
        dispatch({ type: 'SET_PERMISSION_DENIED' });
      }
    };
    initMediaAndDevice();

    return () => {
      mounted = false;
      if (rollingRecorderRef.current) rollingRecorderRef.current.stop();
      if (mediaRef.current) mediaRef.current.stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Handle Violations: Upload snapshots and clips
  const prevViolationsLengthRef = useRef(0);
  useEffect(() => {
    if (proctoring.violations.length > prevViolationsLengthRef.current) {
      const newViolations = proctoring.violations.slice(prevViolationsLengthRef.current);
      prevViolationsLengthRef.current = proctoring.violations.length;

      const sessionStrId = candidate.email.replace(/[^a-zA-Z0-9]/g, '');

      newViolations.forEach(async (violation) => {
        try {
          let snapshotUrl = null;
          let clipUrl = null;

          if (videoElRef.current) {
            const snapshotBlob = await MediaCaptureService.captureSnapshot(videoElRef.current);
            snapshotUrl = await SupabaseService.uploadFile('proctoring-snapshots', `${sessionStrId}_${violation.id}.jpg`, snapshotBlob, 'image/jpeg');
          }

          if (rollingRecorderRef.current) {
            const clipBlob = rollingRecorderRef.current.captureClip();
            if (clipBlob) {
              clipUrl = await SupabaseService.uploadFile('proctoring-clips', `${sessionStrId}_${violation.id}.webm`, clipBlob, 'video/webm');
            }
          }

          dispatch({ type: 'UPDATE_VIOLATION_MEDIA', id: violation.id, snapshotUrl, clipUrl });

          console.log(`[MediaCapture] Violation media uploaded for ${violation.type}: snapshot=${snapshotUrl}, clip=${clipUrl}`);

        } catch (err) {
          console.error("Failed to capture violation media:", err);
        }
      });
    }
  }, [proctoring.violations, candidate.email]);

  // 2. Setup System Event Listeners
  useEffect(() => {
    const handleVis = () => { if (document.hidden) dispatch({ type: 'TAB_HIDDEN' }) };
    const handleBlur = () => { dispatch({ type: 'TAB_HIDDEN' }) };
    const handleFullscreen = () => { 
        if (!document.fullscreenElement) dispatch({ type: 'FULLSCREEN_EXIT' });
    };
    const handleClipboard = (e: any) => { dispatch({ type: 'COPY_PASTE' }) };
    const handleUnload = (e: any) => { dispatch({ type: 'REFRESH_ATTEMPT' }); e.preventDefault(); e.returnValue = ''; };
    const handleOffline = () => dispatch({ type: 'NETWORK_LOST' });
    const handleOnline = () => dispatch({ type: 'NETWORK_RECOVERED' });
    
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    const interval = setInterval(() => dispatch({ type: 'DECAY_RISK' }), 30000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVis);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearInterval(interval);
    };
  }, []);

  // 3. Initialize Interview
  useEffect(() => {
    if (!hasStarted || questions.length > 0) return;
    if (proctoring.engineState === 'UNSUPPORTED_BROWSER' || proctoring.engineState === 'PERMISSION_DENIED') return;

    let mounted = true;
    const initInterview = async () => {
      try {
        const savedStateStr = localStorage.getItem('reicrew_autosave_' + sessionIdRef.current);
        if (savedStateStr) {
          try {
            const savedState = JSON.parse(savedStateStr);
            if (savedState.questions && savedState.questions.length > 0) {
              if (!mounted) return;
              setQuestions(savedState.questions);
              setCurrentIndex(savedState.currentIndex || 0);
              setHistory(savedState.history || []);
              if (savedState.transcript) {
                  setTimeout(() => setTranscript(savedState.transcript), 100);
              }
              setLoading(false);
              setTimeout(() => { if (mounted) speakQuestion(savedState.questions[savedState.currentIndex || 0].question); }, 800);
              return;
            }
          } catch (e) {
            console.warn("Failed to parse recovery state", e);
          }
        }

        const data = await AIService.generateQuestions(candidate.role, 'Intermediate', 'Technical', 5);
        if (!mounted) return;
        setQuestions(data);
        setLoading(false);
        
        // Background task to populate ideal answers without blocking the interview start
        AIService.populateIdealAnswers(candidate.role, data).catch(console.error);
        
        // Wait for voices to be ready before speaking
        const speakWhenReady = () => {
           setTimeout(() => { if (mounted) speakQuestion(data[0].question); }, 800);
        };
        speakWhenReady();
      } catch (err) {
        console.error(err);
      }
    };
    initInterview();

    return () => {
      mounted = false;
      synthRef.current.cancel();
    };
  }, [hasStarted, candidate.role, proctoring.engineState, questions.length]);

  // Auto-save effect
  useEffect(() => {
    if (hasStarted && questions.length > 0) {
      localStorage.setItem('reicrew_autosave_' + sessionIdRef.current, JSON.stringify({
        sessionId: sessionIdRef.current,
        currentIndex,
        transcript,
        questions,
        history
      }));
    }
  }, [transcript, currentIndex, hasStarted, questions, history]);

  // Handle offline sync warning
  useEffect(() => {
    const handleOffline = () => {
       // Alerting user of offline state
       console.warn("Connection lost. Responses are being stored locally.");
    };
    window.addEventListener('offline', handleOffline);
    return () => window.removeEventListener('offline', handleOffline);
  }, []);

  // Handle Warning and Termination Logic
  useEffect(() => {
     if (proctoring.violationScore >= 15 && !isProcessingRef.current && hasStarted) {
        setToastWarning({ message: "Interview Terminated: Multiple integrity violations detected.", type: 'danger' });
        setIsProcessing(true);
        isProcessingRef.current = true;
        setLoadingText("Terminating interview...");
        setLoading(true);
        stopListening();
        
        setTimeout(async () => {
            const proctoringReport = compileReport();
            let evalReport = null;
            try {
              evalReport = await AIService.evaluateInterview(history);
            } catch (e) {
              console.error("Evaluation failed during termination:", e);
            }
            onComplete(history, proctoringReport, evalReport);
        }, 100);
     } else if (proctoring.violationScore >= 10 && proctoring.violationScore < 15 && hasStarted) {
        setToastWarning({ message: `Severe Warning: Integrity violations detected. Score: ${proctoring.violationScore}/15. Further violations will terminate the interview.`, type: 'danger' });
     } else if (proctoring.violationScore >= 5 && proctoring.violationScore < 10 && hasStarted) {
        setToastWarning({ message: `Warning: Please remain focused on the interview. Score: ${proctoring.violationScore}/15.`, type: 'warning' });
     }
  }, [proctoring.violationScore, hasStarted, history]);

  useEffect(() => {
     if (toastWarning && toastWarning.type !== 'danger' && proctoring.violationScore < 15) {
        const t = setTimeout(() => setToastWarning(null), 5000);
        return () => clearTimeout(t);
     }
  }, [toastWarning, proctoring.violationScore]);

  const speakQuestion = (text: string) => {
    speak(text);
  };

  const toggleMic = () => {
    if (!isSupported) {
        alert("Speech recognition is not supported on this device/browser. Please type your answer directly.");
        setIsEditing(true);
        return;
    }
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNext = async () => {
    if (!transcript.trim() || isSpeaking || isProcessingRef.current) return;

    if (!navigator.onLine) {
        alert("Connection lost. Please wait until your connection is restored to submit your answer.");
        return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    setLoadingText("Evaluating your response...");
    setLoading(true);
    stopListening();

    const currentQ = questions[currentIndex];
    
    let evaluationResult = null;
    try {
        const result = await submitAnswer(candidate as any, currentQ as any, transcript, undefined, undefined);
        evaluationResult = result.evaluation;
        
        // Retry logic for Supabase save
        let retries = 3;
        while (retries > 0) {
            try {
                console.log("Attempting to save response to Supabase...", {
                    sessionId: sessionIdRef.current,
                    currentIndex,
                    questionText: evaluationResult?.questionText,
                    userAnswer: evaluationResult?.userAnswer,
                    idealAnswer: currentQ.ideal_answer
                });
                await SupabaseService.saveResponse(sessionIdRef.current, currentIndex, evaluationResult, currentQ.ideal_answer);
                break; // success
            } catch (err: any) {
                console.error(`Supabase save attempt failed (${4 - retries}/3):`, err?.message || err, err?.details || "", err?.hint || "", err);
                retries--;
                if (retries === 0) throw err;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
    } catch (error: any) {
        console.error("Failed to save response after retries:", error?.message || error, {
            error,
            message: error?.message,
            details: error?.details,
            hint: error?.hint
        });
        alert(`Failed to save your response: ${error?.message || "Unknown database error"}. Please check your connection and try again.`);
        setLoading(false);
        setIsProcessing(false);
        isProcessingRef.current = false;
        return; // Halt if save fails
    }

    const newEntry = { 
      question: currentQ.question, 
      answer: transcript, 
      ideal_answer: currentQ.ideal_answer,
      evaluation: evaluationResult
    };

    const newHistory = [...history, newEntry];
    setHistory(newHistory);

    if (currentIndex < MAX_QUESTIONS - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      resetTranscript();
      setIsEditing(false);
      
      setLoading(false);
      setIsProcessing(false);
      isProcessingRef.current = false;
      setTimeout(() => {
        speakQuestion(questions[nextIdx].question);
      }, 300);
    } else {
      setLoadingText("Compiling your results...");
      const proctoringReport = compileReport();
      let evalReport = null;
      try {
        evalReport = await AIService.evaluateInterview(newHistory);
      } catch (e) {
        console.error("Evaluation failed:", e);
      }
      onComplete(newHistory, proctoringReport, evalReport);
    }
  };

  const compileReport = (): ProctoringReport => {
    const now = Date.now();
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
      fullscreenExitEvents: violations.filter(v => v.type === 'FULLSCREEN_EXIT').length,
      copyPasteEvents: violations.filter(v => v.type === 'COPY_PASTE').length,
      microphoneLostEvents: violations.filter(v => v.type === 'MICROPHONE_LOST').length,
      violationScore: proctoring.violationScore,
      integrityScore: Math.max(0, 100 - proctoring.violationScore * 10),
      totalGazeAwayDurationMs: proctoring.totalGazeAwayDurationMs,
      violations,
      timeline,
      sessionDurationMs: now - proctoring.sessionStartTime,
      monitoringDurationMs: proctoring.monitoringStartTime ? now - proctoring.monitoringStartTime : 0,
      heartbeatCount: proctoring.heartbeatCount,
      heartbeatSamples: heartbeatSamplesRef.current,
      cameraReconnectCount: proctoring.cameraReconnectCount,
      maxConcurrentFaces: proctoring.maxConcurrentFaces,
      browserInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      },
      healthSummary: {
        monitoringCoveragePercent: healthStatsRef.current.totalFrames > 0 ? Math.round((healthStatsRef.current.framesWithFace / healthStatsRef.current.totalFrames) * 1000) / 10 : 100,
        averageTrackingConfidence: healthStatsRef.current.totalFrames > 0 ? Math.round(healthStatsRef.current.confidenceSum / healthStatsRef.current.totalFrames) : 100,
        totalDetectionFrames: healthStatsRef.current.totalFrames,
        stalledPeriods: healthStatsRef.current.stalledPeriods,
        longestNoFaceDurationMs: healthStatsRef.current.longestNoFaceDurationMs,
        longestGazeAwayDurationMs: healthStatsRef.current.longestGazeAwayDurationMs
      }
    };
  };

  const handleHeartbeat = (metrics: HeartbeatMetrics) => {
    dispatch({ type: 'HEARTBEAT', metrics });
    latestHeartbeatRef.current = { fps: metrics.fps, health: metrics.detectionHealth };
    
    if (metrics.fps === 0 || metrics.lastDetectionAgoMs > 2000) {
      healthStatsRef.current.stalledPeriods++;
    }

    heartbeatSamplesRef.current.push({
      timestamp: Date.now(),
      fps: metrics.fps
    });
  };

  // Rendering gates
  if (proctoring.engineState === 'UNSUPPORTED_BROWSER') {
    return (
      <div className="h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md text-center shadow-2xl border border-slate-700">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Browser Not Supported</h2>
          <p className="text-slate-300">This interview requires a modern browser with camera and WebGL support. Please use Chrome, Edge, or Firefox.</p>
        </div>
      </div>
    );
  }

  if (proctoring.engineState === 'PERMISSION_DENIED') {
    return (
      <div className="h-screen bg-[#0f172a] flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md text-center shadow-2xl border border-slate-700">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Permissions Denied</h2>
          <p className="text-slate-300 mb-6">We need camera and microphone access to conduct this interview. Please allow permissions and try again.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Reload Page
          </button>
        </div>
      </div>
    );
  }



  const currentQ = questions[currentIndex];

  return (
    <div className="flex-1 bg-[#F8FAFC] flex flex-col md:h-[100dvh] md:overflow-hidden font-sans relative">
      {/* Top Banner for Warnings */}
      {toastWarning && (
        <div className={`fixed top-0 left-0 w-full z-[100] text-center p-3 font-bold text-white shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-top-4 fade-in duration-300 ${toastWarning.type === 'danger' ? 'bg-red-600' : 'bg-orange-500'}`}>
          <AlertTriangle size={20} />
          {toastWarning.message}
        </div>
      )}
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 z-50">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out"
          style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
        />
      </div>

      <header className="px-4 py-4 md:px-8 md:py-6 flex justify-between items-center border-b border-slate-200 bg-white sticky top-0 z-[60]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-lg">
            {candidate.role === 'CSE' ? 'CS' : 'EE'}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 tracking-tight">{candidate.name}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{candidate.role} Candidate</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMonitorOpen(true)}
            className="md:hidden px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold border border-indigo-100"
          >
            Show Monitoring
          </button>
          <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="hidden md:inline text-xs font-bold text-slate-500">QUESTION</span>
            <span className="text-sm font-black text-indigo-600">{currentIndex + 1} / 5</span>
          </div>
        </div>
      </header>

      {/* Two-Column Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row md:overflow-hidden relative">
        
        {/* Right Column: V8 Monitoring Sidebar */}
        <aside className={`
          ${isMobileMonitorOpen ? 'fixed inset-0 z-[100] bg-slate-900 flex pt-16 px-4 pb-4 overflow-y-auto' : 'hidden md:flex'}
          md:relative md:order-last md:w-[320px] lg:w-[380px] md:max-w-[35vw] shrink-0 md:bg-slate-900 text-white md:border-l border-slate-700 flex-col shadow-xl md:z-[70]
        `}>
          {isMobileMonitorOpen && (
            <button 
              onClick={() => setIsMobileMonitorOpen(false)}
              className="md:hidden absolute top-4 right-4 text-slate-300 bg-slate-800 p-2 rounded-full font-bold"
            >
              Close
            </button>
          )}
          <div className="p-0 md:p-4 flex flex-col gap-4 mt-8 md:mt-0">
            
            {/* Camera Preview */}
            <div className="w-full aspect-[4/3] bg-black rounded-xl overflow-hidden relative shadow-2xl md:shadow-lg shrink-0">
              <CameraMonitor 
                mediaStream={mediaRef.current?.stream || undefined}
                onVideoReady={(v) => { videoElRef.current = v; }}
                onDetectionFrame={frame => {
                  dispatch({ type: 'DETECTION_FRAME', frame });
                  
                  const stats = healthStatsRef.current;
                  stats.totalFrames++;
                  if (frame.faceDetected) {
                    stats.framesWithFace++;
                    stats.confidenceSum += frame.confidence * 100;
                    if (stats.longestNoFaceStart !== null) {
                      const duration = Date.now() - stats.longestNoFaceStart;
                      if (duration > stats.longestNoFaceDurationMs) stats.longestNoFaceDurationMs = duration;
                      stats.longestNoFaceStart = null;
                    }
                  } else if (stats.longestNoFaceStart === null) {
                    stats.longestNoFaceStart = Date.now();
                  }

                  const isAway = frame.gazeDirection !== 'center' || Math.abs(frame.headYaw) > 30 || frame.facePosition === 'PARTIAL_OUT';

                  if (isAway && frame.faceCount > 0) {
                    if (stats.longestGazeAwayStart === null) stats.longestGazeAwayStart = Date.now();
                  } else {
                    if (stats.longestGazeAwayStart !== null) {
                      const duration = Date.now() - stats.longestGazeAwayStart;
                      if (duration > stats.longestGazeAwayDurationMs) stats.longestGazeAwayDurationMs = duration;
                      stats.longestGazeAwayStart = null;
                    }
                  }

                  if (frame.gazeDirection !== stats.currentGazeDirection) {
                    stats.currentGazeDirection = frame.gazeDirection;
                    stats.currentGazeDirectionStart = Date.now();
                  }
                  const gazeDurationMs = Date.now() - stats.currentGazeDirectionStart;
                  
                  // Calculate monitoring quality score
                  const fps = latestHeartbeatRef.current.fps;
                  const fpsScore = Math.min(100, Math.max(0, (fps / 24) * 100));
                  const facePresenceScore = frame.faceDetected ? 100 : 0;
                  const monitoringQualityScore = Math.round(
                      (frame.trackingConfidence * 0.6) + 
                      (fpsScore * 0.2) + 
                      (facePresenceScore * 0.2)
                  );

                  telemetryRef.current = {
                    faceDetected: frame.faceDetected,
                    trackingConfidence: frame.trackingConfidence,
                    monitoringQualityScore,
                    gazeDirection: frame.gazeDirection,
                    gazeDurationMs,
                    headPitch: frame.headPitch,
                    headYaw: frame.headYaw,
                    headRoll: frame.headRoll,
                    fps: latestHeartbeatRef.current.fps,
                    facePosition: frame.facePosition,
                    detectionHealth: latestHeartbeatRef.current.health,
                    lastUpdated: Date.now()
                  };
                }}
                onHeartbeat={handleHeartbeat}
                onEngineReady={() => dispatch({ type: 'ENGINE_READY' })}
                devOverlay={true} 
              />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg">
                <div className={`w-1.5 h-1.5 rounded-full ${cameraReady ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                  {cameraReady ? 'Live' : 'Init'}
                </span>
              </div>
            </div>

            {/* V8 Dashboard UI Components */}
            <div className="flex-1 hidden md:block">
              {telemetry && (
                <MonitoringDashboard 
                    telemetry={telemetry} 
                    proctoring={proctoring} 
                />
              )}
            </div>

          </div>
        </aside>

        {/* Left Column: Interview UI */}
        <div className="flex-1 flex flex-col md:h-full relative md:overflow-hidden bg-[#F8FAFC]">
          <main className="flex-1 w-full p-4 md:p-8 flex flex-col justify-start md:justify-center space-y-6 md:space-y-12 pb-8 md:pb-8 md:overflow-y-auto">
        {!hasStarted ? (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-12 md:mt-0">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900">Ready to begin?</h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">Please ensure you are in a quiet room with good lighting. Your camera and microphone will be monitored during the interview.</p>
            <button 
              onClick={() => {
                // Silent audio unlock to bypass Autoplay policies
                const unlock = new SpeechSynthesisUtterance('');
                unlock.volume = 0;
                window.speechSynthesis.speak(unlock);
                document.documentElement.requestFullscreen().catch(e => console.warn("Fullscreen error", e));
                setHasStarted(true);
              }}
              disabled={!cameraReady || proctoring.engineState !== 'READY'}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 disabled:shadow-none transition-all active:scale-95"
            >
              {(!cameraReady || proctoring.engineState !== 'READY') ? 'Initializing Engine...' : 'Start Interview'}
            </button>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 h-full animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium text-lg">{loadingText}</p>
          </div>
        ) : (
          <>
            {/* AI Question Section */}
            <div className="space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pr-28 md:pr-48 mt-8 md:mt-0">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-indigo-500 animate-ping' : 'bg-slate-300'}`} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Interviewer</span>
              </div>
              <div className="relative">
                <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                  {currentQ?.question}
                </h1>
                <button 
                  onClick={() => speakQuestion(currentQ?.question || '')}
                  className="absolute -right-10 md:-right-12 top-0 p-2 md:p-3 text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Repeat Question"
                >
                  <Volume2 size={24} />
                </button>
              </div>
            </div>

            {/* User Response Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {isListening ? 'Listening...' : isEditing ? 'Editing Response' : 'Your Response'}
              </span>
            </div>
            {!isListening && transcript && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 size={14} />
                {isEditing ? 'Save Edit' : 'Edit Answer'}
              </button>
            )}
          </div>

          <div className={`min-h-[120px] md:min-h-[160px] bg-white border-2 rounded-[24px] md:rounded-[32px] p-4 md:p-8 transition-all ${
            isListening ? 'border-rose-200 shadow-xl shadow-rose-100/50' : 
            isEditing || transcript ? 'border-indigo-200 shadow-xl shadow-indigo-100/50' : 
            'border-slate-100 shadow-sm'
          }`}>
          <div className="relative">
              <textarea
                className={`w-full h-28 md:h-40 p-3 md:p-4 bg-slate-50 border-2 rounded-2xl resize-none outline-none transition-all text-sm md:text-base text-slate-700 font-medium ${isListening ? 'border-indigo-400 bg-indigo-50/30' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'}`}
                value={transcript || ""}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  setIsEditing(true);
                }}
                placeholder={isListening ? "Listening..." : "Type or speak your answer here..."}
              />
              {interimSpeech && (
                <div className="absolute bottom-4 left-4 right-16 pointer-events-none">
                  <span className="bg-slate-800/80 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg shadow-lg backdrop-blur-sm animate-pulse">
                    {interimSpeech}
                  </span>
                </div>
              )}
          </div>
        </div>
      </div>
          </>
        )}
      </main>

      <footer className="sticky bottom-0 p-4 md:p-8 bg-white border-t border-slate-200 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:shadow-none z-[60]">
        <div className="max-w-4xl mx-auto flex items-center gap-3 md:gap-6">
          <button
            onClick={toggleMic}
            disabled={!hasStarted || isSpeaking}
            className={`w-16 h-16 md:w-20 md:h-20 shrink-0 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            {isListening ? <MicOff size={28} /> : <Mic size={28} />}
          </button>

          <button
            onClick={handleNext}
            disabled={!hasStarted || !transcript.trim() || isSpeaking || isProcessing || (isListening && transcript.length === 0)}
            className="flex-1 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white h-16 md:h-20 rounded-2xl md:rounded-[28px] font-bold text-lg md:text-xl shadow-xl shadow-slate-200/50 transition-all flex items-center justify-center gap-2 md:gap-3 active:scale-[0.98]"
          >
            <span className="truncate">{currentIndex < 4 ? 'Next Question' : 'Complete Interview'}</span>
            <ArrowRight size={20} className="shrink-0" />
          </button>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
};
