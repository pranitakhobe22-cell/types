import React, { useState, useEffect, useRef, useReducer } from 'react';
import { Mic, MicOff, Volume2, Send, Loader2, Edit3, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react';
import { AIService, GeneratedQuestion } from '../services/aiService';
import { CameraMonitor } from './CameraMonitor';
import { MonitoringDashboard } from './MonitoringDashboard';
import { 
  InterviewMediaResources, RawDetectionFrame, ProctorViolation, TimelineEvent, 
  HeartbeatMetrics, ProctoringEngineState, ProctoringReport, DashboardTelemetry 
} from '../types';

// Speech Recognition Types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

import { ProctoringState, ProctoringAction } from '../types';

const createInitialState = (): ProctoringState => ({
  engineState: 'INITIALIZING',
  currentRiskScore: 0,
  overallRiskScore: 0,
  heartbeat: {
    fps: 0, lastDetectionAgoMs: 0, faceConfidence: 0, engineState: 'INITIALIZING',
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
  heartbeatCount: 0
});

const generateViolationId = () => Math.random().toString(36).substring(2, 9);

const baseReducer = (state: ProctoringState, action: ProctoringAction): ProctoringState => {
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
      const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'TAB_HIDDEN', severity: 3, timestamp: now, message: 'Browser tab hidden' };
      const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'TAB_HIDDEN', severity: 3 };
      return { ...state, violations: [...state.violations, v], timeline: [...state.timeline, t], currentRiskScore: state.currentRiskScore + 3, overallRiskScore: state.overallRiskScore + 3 };
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
      let newState = { ...state };
      if (action.frame.faceCount > state.maxConcurrentFaces) newState.maxConcurrentFaces = action.frame.faceCount;

      // No Face State Machine
      if (action.frame.faceCount === 0) {
        if (newState.noFaceState === 'FACE_PRESENT') {
          newState.noFaceState = 'NO_FACE_START';
          newState.noFaceStartTime = now;
        } else if (newState.noFaceState === 'NO_FACE_START' && newState.noFaceStartTime && now - newState.noFaceStartTime > 3000) {
          newState.noFaceState = 'VIOLATION_CREATED';
          const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'NO_FACE', severity: 3, timestamp: now, message: 'No face detected for 3s' };
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'NO_FACE', severity: 3, detail: 'Face missing >3s' };
          newState.violations = [...newState.violations, v];
          newState.timeline = [...newState.timeline, t];
          newState.currentRiskScore += 3;
          newState.overallRiskScore += 3;
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
        } else if (newState.multiFaceState === 'MULTI_FACE_START' && newState.multiFaceStartTime && now - newState.multiFaceStartTime > 2000) {
          newState.multiFaceState = 'VIOLATION_CREATED' as any;
          const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'MULTIPLE_FACES', severity: 5, timestamp: now, message: 'Multiple faces detected' };
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'MULTIPLE_FACES', severity: 5 };
          newState.violations = [...newState.violations, v];
          newState.timeline = [...newState.timeline, t];
          newState.currentRiskScore += 5;
          newState.overallRiskScore += 5;
        }
      } else {
        newState.multiFaceState = 'SINGLE_FACE';
        newState.multiFaceStartTime = null;
      }

      // Gaze State Machine
      if (action.frame.gazeDirection === 'away') {
        if (newState.gazeState === 'LOOKING') {
          newState.gazeState = 'AWAY_START';
          newState.gazeAwayStartTime = now;
        } else if (newState.gazeState === 'AWAY_START' && newState.gazeAwayStartTime && now - newState.gazeAwayStartTime > 2000) {
          newState.gazeState = 'VIOLATION_CREATED';
          const v: ProctorViolation = { id: generateViolationId(), sessionId: '', type: 'GAZE_AWAY', severity: 1, timestamp: now, message: 'Looking away from screen' };
          const t: TimelineEvent = { sessionId: '', timestamp: now, event: 'GAZE_AWAY', severity: 1 };
          newState.violations = [...newState.violations, v];
          newState.timeline = [...newState.timeline, t];
          newState.currentRiskScore += 1;
          newState.overallRiskScore += 1;
        }
      } else {
        if (newState.gazeState === 'VIOLATION_CREATED') newState.gazeState = 'COOLDOWN';
        else newState.gazeState = 'LOOKING';
        newState.gazeAwayStartTime = null;
      }

      return newState;
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
  candidate: { name: string; email: string; role: string };
  onComplete: (history: { question: string; answer: string; ideal_answer: string }[], report?: ProctoringReport) => void;
}

export const DynamicInterviewScreen: React.FC<DynamicInterviewScreenProps> = ({ candidate, onComplete }) => {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ question: string; answer: string; ideal_answer: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const MAX_QUESTIONS = 5;

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  const [proctoring, dispatch] = useReducer(proctoringReducer, createInitialState());
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const mediaRef = useRef<InterviewMediaResources | null>(null);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const heartbeatSamplesRef = useRef<{timestamp: number; fps: number}[]>([]);
  const latestHeartbeatRef = useRef<{fps: number, health: string}>({ fps: 0, health: 'GOOD' });

  // Dashboard Telemetry
  const telemetryRef = useRef<DashboardTelemetry | null>(null);
  const [telemetry, setTelemetry] = useState<DashboardTelemetry | null>(null);
  
  const healthStatsRef = useRef({
    totalFrames: 0,
    framesWithFace: 0,
    confidenceSum: 0,
    stalledPeriods: 0,
    longestNoFaceStart: null as number | null,
    longestNoFaceDurationMs: 0,
    longestGazeAwayStart: null as number | null,
    longestGazeAwayDurationMs: 0
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(telemetryRef.current);
    }, 500);
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

    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: { ideal: 30 } },
          audio: true,
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
        setCameraReady(true);

        const audioTrack = stream.getAudioTracks()[0];
        audioTrack.addEventListener('ended', () => dispatch({ type: 'MICROPHONE_LOST' }));
        audioTrack.addEventListener('mute', () => { setTimeout(() => { if (audioTrack.muted) dispatch({ type: 'MICROPHONE_LOST' }) }, 3000) });
        audioTrack.addEventListener('unmute', () => dispatch({ type: 'MICROPHONE_RECOVERED' }));

        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.addEventListener('ended', () => dispatch({ type: 'CAMERA_LOST' }));

      } catch (err) {
        console.error("Camera access denied:", err);
        dispatch({ type: 'SET_PERMISSION_DENIED' });
      }
    };
    initMedia();

    return () => {
      mounted = false;
      if (mediaRef.current) mediaRef.current.stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  // 2. Setup System Event Listeners
  useEffect(() => {
    const handleVis = () => { if (document.hidden) dispatch({ type: 'TAB_HIDDEN' }) };
    const handleUnload = (e: any) => { dispatch({ type: 'REFRESH_ATTEMPT' }); e.preventDefault(); e.returnValue = ''; };
    const handleOffline = () => dispatch({ type: 'NETWORK_LOST' });
    const handleOnline = () => dispatch({ type: 'NETWORK_RECOVERED' });
    
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    const interval = setInterval(() => dispatch({ type: 'DECAY_RISK' }), 30000);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVis);
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
        const data = await AIService.generateQuestions(candidate.role, 'Intermediate', 'Technical', 5);
        if (!mounted) return;
        setQuestions(data);
        setLoading(false);
        
        // Wait for voices to be ready before speaking
        const speakWhenReady = () => {
          const voices = synthRef.current.getVoices();
          if (voices.length > 0) {
            setTimeout(() => { if (mounted) speakQuestion(data[0].question); }, 1500);
          } else {
            synthRef.current.onvoiceschanged = () => {
              setTimeout(() => { if (mounted) speakQuestion(data[0].question); }, 1500);
              synthRef.current.onvoiceschanged = null;
            };
          }
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

  // 4. Setup Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; 

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      // We append to the current input if it's final, otherwise just show interim
      setUserInput(prev => {
         const base = prev.replace(/\s*\[.*?\]\s*/g, ''); // clear old interims if we marked them
         if (finalTranscript) return base + ' ' + finalTranscript;
         if (interimTranscript) return base + ' [' + interimTranscript + ']';
         return prev;
      });
    };

    recognition.onerror = (err: any) => {
      console.error("Speech Error:", err);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, []);

  const speakQuestion = (text: string) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    const watchdogMs = text.length * 80 + 4000;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const clearSpeaking = () => {
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
      setIsAiSpeaking(false);
    };

    utterance.onstart = () => {
      setIsAiSpeaking(true);
      watchdog = setTimeout(() => {
        synthRef.current.cancel();
        setIsAiSpeaking(false);
        watchdog = null;
      }, watchdogMs);
    };
    utterance.onend = clearSpeaking;
    utterance.onerror = clearSpeaking;
    
    const voices = synthRef.current.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Rishi') || v.name.includes('Heera'));
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
    
    if (indianVoice) {
      utterance.voice = indianVoice;
      utterance.rate = 0.9;
    } else if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    synthRef.current.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch(e) {}
    } else {
      setUserInput('');
      setIsListening(true);
      try { recognitionRef.current.start(); } catch(e) {
        console.error("Failed to start mic:", e);
        setIsListening(false);
      }
    }
  };

  const handleNext = async () => {
    if (!userInput.trim() || isAiSpeaking) return;

    const currentQ = questions[currentIndex];
    const newEntry = { 
      question: currentQ.question, 
      answer: userInput, 
      ideal_answer: currentQ.ideal_answer 
    };

    const newHistory = [...history, newEntry];
    setHistory(newHistory);
    // await BackendService.saveResponse(newEntry); // handled by parent if needed

    if (currentIndex < MAX_QUESTIONS - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setUserInput('');
      setIsEditing(false);
      setIsListening(false);
      try { recognitionRef.current?.stop(); } catch(e){}
      
      setTimeout(() => speakQuestion(questions[nextIdx].question), 1200);
    } else {
      setLoading(true);
      const report = compileReport();
      onComplete(newHistory, report);
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
      microphoneLostEvents: violations.filter(v => v.type === 'MICROPHONE_LOST').length,
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
        averageFaceConfidence: healthStatsRef.current.totalFrames > 0 ? Math.round(healthStatsRef.current.confidenceSum / healthStatsRef.current.totalFrames) : 100,
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
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-sans relative">
      
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100 z-50">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out"
          style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
        />
      </div>

      <header className="px-8 py-6 flex justify-between items-center border-b border-slate-200 bg-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-bold shadow-lg">
            {candidate.role === 'CSE' ? 'CS' : 'EE'}
          </div>
          <div>
            <h2 className="font-bold text-slate-900 tracking-tight">{candidate.name}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{candidate.role} Candidate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 ml-4 md:ml-0 md:mr-60">
          <span className="text-xs font-bold text-slate-500">QUESTION</span>
          <span className="text-sm font-black text-indigo-600">{currentIndex + 1} / 5</span>
        </div>
      </header>

      {/* Two-Column Main Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* Right Column: V8 Monitoring Sidebar */}
        <aside className="md:order-last w-full md:w-[320px] lg:w-[380px] md:max-w-[35vw] shrink-0 bg-slate-900 text-white md:border-l border-slate-700 overflow-y-auto flex flex-col shadow-xl z-40 transition-all">
          <div className="p-4 flex flex-col gap-4">
            
            {/* Camera Preview */}
            <div className="w-24 h-32 self-center md:w-full md:h-auto md:aspect-[4/3] bg-black rounded-xl overflow-hidden relative shadow-lg shrink-0">
              <CameraMonitor 
                mediaStream={mediaRef.current?.stream || undefined}
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

                  if (frame.gazeDirection === 'away') {
                    if (stats.longestGazeAwayStart === null) stats.longestGazeAwayStart = Date.now();
                  } else if (stats.longestGazeAwayStart !== null) {
                    const duration = Date.now() - stats.longestGazeAwayStart;
                    if (duration > stats.longestGazeAwayDurationMs) stats.longestGazeAwayDurationMs = duration;
                    stats.longestGazeAwayStart = null;
                  }

                  telemetryRef.current = {
                    faceConfidence: Math.round(frame.confidence * 100),
                    gazeDirection: frame.gazeDirection,
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
            <div className="flex-1">
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
        <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F8FAFC]">
          <main className="flex-1 overflow-y-auto w-full p-4 md:p-8 flex flex-col justify-center space-y-12 pb-24 md:pb-8">
        {!hasStarted ? (
          <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <h1 className="text-4xl font-extrabold text-slate-900">Ready to begin?</h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">Please ensure you are in a quiet room with good lighting. Your camera and microphone will be monitored during the interview.</p>
            <button 
              onClick={() => setHasStarted(true)}
              disabled={!cameraReady || proctoring.engineState !== 'READY'}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 disabled:shadow-none transition-all active:scale-95"
            >
              {(!cameraReady || proctoring.engineState !== 'READY') ? 'Initializing Engine...' : 'Start Interview'}
            </button>
          </div>
        ) : loading && questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center space-y-4 h-full animate-in fade-in duration-500">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            <p className="text-slate-500 font-medium text-lg">Curating your specialized {candidate.role} assessment...</p>
          </div>
        ) : (
          <>
            {/* AI Question Section */}
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 pr-12 md:pr-48">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-indigo-500 animate-ping' : 'bg-slate-300'}`} />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Interviewer</span>
              </div>
              <div className="relative">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
                  {currentQ?.question}
                </h1>
                <button 
                  onClick={() => speakQuestion(currentQ?.question || '')}
                  className="absolute -right-12 top-0 p-3 text-slate-400 hover:text-indigo-600 transition-colors"
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
            {!isListening && userInput && (
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 transition-colors"
              >
                <Edit3 size={14} />
                {isEditing ? 'Save Edit' : 'Edit Answer'}
              </button>
            )}
          </div>

          <div className={`min-h-[160px] bg-white border-2 rounded-[32px] p-8 transition-all ${
            isListening ? 'border-rose-200 shadow-xl shadow-rose-100/50' : 
            isEditing ? 'border-indigo-200 shadow-xl shadow-indigo-100/50' : 
            'border-slate-100 shadow-sm'
          }`}>
            {isEditing ? (
              <textarea
                className="w-full h-full bg-transparent border-none outline-none text-xl text-slate-800 placeholder:text-slate-300 resize-none font-medium"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                autoFocus
              />
            ) : (
              <p className={`text-xl font-medium leading-relaxed ${userInput ? 'text-slate-800' : 'text-slate-300 italic'}`}>
                {userInput || "Click the microphone and start speaking..."}
              </p>
            )}
          </div>
        </div>
          </>
        )}
      </main>

      <footer className="p-4 md:p-8 bg-white border-t border-slate-200 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <button
            onClick={toggleMic}
            disabled={!hasStarted || isAiSpeaking}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button
            onClick={handleNext}
            disabled={!hasStarted || !userInput.trim() || isAiSpeaking || (isListening && userInput.length === 0)}
            className="flex-1 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white h-20 rounded-[28px] font-bold text-xl shadow-xl shadow-slate-200/50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {currentIndex < 4 ? 'Next Question' : 'Complete Interview'}
            <ArrowRight size={24} />
          </button>
        </div>
      </footer>
        </div>
      </div>
    </div>
  );
};
