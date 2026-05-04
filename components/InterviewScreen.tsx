
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Candidate, Question, InterviewStatus, EvaluationResult, VisualMetrics, WarningEvent, RoleSettings } from '../types';
import { startInterview, submitAnswer } from '../services/apiService';
import { StorageService } from '../services/storageService';
import { useSpeech } from '../hooks/useSpeech';
import { useAudioLevel } from '../hooks/useAudioLevel';
import { CameraMonitor } from './CameraMonitor';
import { Mic, Volume2, ShieldAlert, ShieldCheck, Loader2, PlayCircle, RotateCcw, FileText } from 'lucide-react';
import { VisualizerOrb } from './VisualizerOrb';

interface InterviewScreenProps {
  candidate: Candidate;
  onComplete: (results: EvaluationResult[], warnings: WarningEvent[], status: 'COMPLETED' | 'TERMINATED') => void;
}

const MemoizedCameraMonitor = React.memo(CameraMonitor);

export const InterviewScreen: React.FC<InterviewScreenProps> = ({ candidate, onComplete }) => {
  const [status, setStatus] = useState<InterviewStatus>(InterviewStatus.IDLE);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionsList, setQuestionsList] = useState<Question[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [processingMsg, setProcessingMsg] = useState('Evaluating answer...');
  const [voicePulse, setVoicePulse] = useState(0);
  const [previousTranscript, setPreviousTranscript] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [settings, setSettings] = useState<RoleSettings | null>(null);
  const [isLockdownViolation, setIsLockdownViolation] = useState(false);
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const audioLevel = useAudioLevel(stream);

  const warningLogRef = useRef<WarningEvent[]>([]);
  const statusRef = useRef<InterviewStatus>(status);
  // Default fallback
  const configRef = useRef<any>({ warningThreshold: 3, ...settings?.proctoring });
  const shouldSpeakRef = useRef(true);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const [visualMetrics, setVisualMetrics] = useState<VisualMetrics>({
    isPresent: true,
    isLookingAtCamera: true,
    currentExpression: 'Neutral',
    confidenceLevel: 50
  });

  const {
    isListening,
    transcript,
    resetTranscript,
    startListening,
    stopListening,
    abortListening,
    speak,
    stopSpeaking,
    warmUp
  } = useSpeech();

  useEffect(() => {
    if (isCameraReady && status === InterviewStatus.IDLE) {
      const init = async () => {
        setStatus(InterviewStatus.LOADING_QUESTION);
        // Parallel fetch
        const [interviewData, adminConfig] = await Promise.all([
          startInterview(candidate),
          StorageService.getConfig()
        ]);

        setCurrentQuestion(interviewData.question);
        setQuestionsList(interviewData.questionsList || []);
        setTotalQuestions(interviewData.totalQuestions);
        if (interviewData.settings) setSettings(interviewData.settings);

        // Update config ref
        configRef.current = adminConfig;

        // NEW: Wait for user gesture on mobile
        setStatus(InterviewStatus.READY);
      };
      init();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraReady]);

  const handleStartInterview = async () => {
    warmUp(); // Unlock audio/mic context
    shouldSpeakRef.current = true;
    setStatus(InterviewStatus.ASKING);

    // Attempt fullscreen on start if not already there
    await enterFullscreen();
  };

  useEffect(() => {
    if (status === InterviewStatus.ASKING && currentQuestion) {
      // ... existing code ...
      resetTranscript();
      setLiveTranscript('');

      if (shouldSpeakRef.current) {
        speak(currentQuestion.question, {
          onBoundary: () => {
            setVoicePulse(p => p + 1);
          },
          onEnd: () => {
            if (statusRef.current !== InterviewStatus.LOCKED) {
              setStatus(InterviewStatus.LISTENING);
            }
          }
        });
      }
    }
  }, [status, currentQuestion, speak, resetTranscript]);

  useEffect(() => {
    if (status === InterviewStatus.LISTENING) {
      startListening();
    }
  }, [status, startListening]);

  // Mic Watchdog: Ensure listening stays active during the LISTENING phase
  useEffect(() => {
    let watchdogInterval: any;
    if (status === InterviewStatus.LISTENING && !isListening) {
      console.log("Mic watchdog: Restarting listening...");
      startListening();

      // Retry continuously if the browser throws InvalidStateError and silently ignores the start block
      watchdogInterval = setInterval(() => {
        // Only run if somehow it's still not listening
        console.log("Mic watchdog: Retrying...");
        startListening();
      }, 1000);
    }

    return () => {
      if (watchdogInterval) clearInterval(watchdogInterval);
    };
  }, [status, isListening, startListening]);

  // Handle live transcript updates
  useEffect(() => {
    if (status === InterviewStatus.LISTENING) {
      setLiveTranscript(transcript);
      const lower = transcript.toLowerCase();
      if (lower.includes('please repeat') || lower.includes('repeat question')) {
        stopListening();
        resetTranscript();
        setLiveTranscript('');
        setStatus(InterviewStatus.ASKING);
      }
    }
  }, [transcript, status, stopListening, resetTranscript]);

  // Lockdown Mode Logic
  useEffect(() => {
    if (status === InterviewStatus.IDLE) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && status !== InterviewStatus.COMPLETED && status !== InterviewStatus.LOCKED) {
        handleWarning(warningLogRef.current.length + 1, 'TAB_SWITCH', "Tab/App switching detected! This is an integrity violation.");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && status !== InterviewStatus.COMPLETED && status !== InterviewStatus.LOCKED) {
        setIsLockdownViolation(true);
        handleWarning(warningLogRef.current.length + 1, 'TAB_SWITCH', "Full-screen exited! Re-enter lockdown immediately.");
      } else if (document.fullscreenElement) {
        setIsLockdownViolation(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen request failed", err);
    }
  }, []);

  const handleWarning = useCallback((count: number, type: WarningEvent['type'] = 'GAZE', customMsg?: string) => {
    const config = configRef.current;
    const now = new Date();

    const newWarning = {
      timestamp: now.toISOString(),
      type: type,
      message: customMsg || `Integrity Violation Detected.`
    };

    warningLogRef.current.push(newWarning);

    // STRICT: 3 Warnings Limit (Terminate on 4th)
    const MAX_ALLOWED_WARNINGS = 3; 
    
    if (warningLogRef.current.length > MAX_ALLOWED_WARNINGS && statusRef.current !== InterviewStatus.LOCKED) {
      statusRef.current = InterviewStatus.LOCKED;
      setStatus(InterviewStatus.LOCKED);
      stopListening();
      stopSpeaking();
      
      // Persist block status
      localStorage.setItem(`blocked_${candidate.accessId}`, 'true');
      
      // Delay completion to show the lockdown UI
      setTimeout(() => {
        onComplete(results, warningLogRef.current, 'TERMINATED');
      }, 3000);
      return;
    }

    // Optional: Secondary Time-based strike (4 in 40s) for rapid violations
    if (warningLogRef.current.length >= 4) {
      const lastFour = warningLogRef.current.slice(-4);
      const firstOfFour = new Date(lastFour[0].timestamp).getTime();
      if (now.getTime() - firstOfFour <= 40000 && statusRef.current !== InterviewStatus.LOCKED) {
         // This condition is technically redundant if we terminate on > 3, 
         // but good for legacy compatibility if we ever raise the limit.
      }
    }
  }, [candidate.accessId, onComplete, results, stopListening, stopSpeaking]);

  const handleCameraStreamReady = useCallback((stream: MediaStream) => {
    setIsCameraReady(true);
    setStream(stream);
  }, []);

  const processSubmission = async () => {
    if (!currentQuestion || !liveTranscript.trim()) return;

    stopListening();
    setStatus(InterviewStatus.THINKING);
    setProcessingMsg("Analysing Response...");

    const { evaluation: result } = await submitAnswer(
      candidate,
      currentQuestion,
      liveTranscript,
      visualMetrics,
      settings || undefined
    );

    const updatedResults = [...results, result];
    setResults(updatedResults);
    setProcessingMsg("Response Recorded.");

    setTimeout(() => {
      const currentIndex = questionsList.findIndex(q => q.id === currentQuestion.id);
      const nextQuestion = (currentIndex >= 0 && currentIndex < questionsList.length - 1) 
        ? questionsList[currentIndex + 1] 
        : null;

      if (nextQuestion) {
        setLiveTranscript('');
        setPreviousTranscript(null); // Clear previous attempt
        resetTranscript();
        setCurrentQuestion(nextQuestion);
        shouldSpeakRef.current = true;
        setStatus(InterviewStatus.ASKING);
      } else {
        onComplete(updatedResults, warningLogRef.current, 'COMPLETED');
      }
    }, 1500);
  };

  const handleRespeak = () => {
    if (!liveTranscript.trim()) return;
    setPreviousTranscript(liveTranscript);
    setLiveTranscript('');
    resetTranscript();

    // 1. Stop Listening
    stopListening();
    shouldSpeakRef.current = false; // Prevent AI from speaking again

    // 2. Reset Status
    setStatus(InterviewStatus.ASKING); // Temporary state to flush UI

    // 3. Restart after safety buffer
    setTimeout(() => {
      setStatus(InterviewStatus.LISTENING); // Re-trigger effect
    }, 500);
  };

  const toggleTypingMode = () => {
    if (!isTypingMode) {
      stopListening();
      setIsTypingMode(true);
    } else {
      setIsTypingMode(false);
      setStatus(InterviewStatus.LISTENING);
    }
  };

  if (status === InterviewStatus.LOCKED) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-900/90 text-white p-8">
        <div className="max-w-2xl text-center bg-red-950 border-4 border-red-600 p-12 rounded-3xl shadow-2xl">
          <ShieldAlert size={80} className="text-red-500 mx-auto mb-6 animate-pulse" />
          <h2 className="text-4xl font-bold mb-4">INTERVIEW TERMINATED</h2>
          <p className="text-xl text-red-200 mb-8">Multiple integrity violations detected.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full max-w-[1920px] mx-auto flex flex-col p-4 gap-4 relative overflow-hidden">

      {/* Lockdown Recovery Overlay */}
      {isLockdownViolation && status !== InterviewStatus.LOCKED && status !== InterviewStatus.COMPLETED && (
        <div className="fixed inset-0 bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center border-4 border-red-500 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert size={48} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">LOCKDOWN VIOLATION</h2>
            <p className="text-slate-600 mb-8">
              The interview has been paused because you exited full-screen mode.
              Switching tabs or exiting full-screen is strictly prohibited.
            </p>
            <button
              onClick={async () => {
                await enterFullscreen();
                setIsLockdownViolation(false);
              }}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <ShieldCheck size={20} />
              RE-ENTER LOCKDOWN
            </button>
            <p className="mt-4 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              Violation has been recorded in the proctoring log
            </p>
          </div>
        </div>
      )}

      {status === InterviewStatus.READY && (
        <div className="absolute inset-0 bg-slate-900/80 z-50 flex flex-col items-center justify-center backdrop-blur-md p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Volume2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">Ready to Start?</h2>
            <p className="text-slate-500 mb-8 text-sm">
              Ensure your volume is up and you are in a quiet environment.
              The AI will begin speaking the first question.
            </p>
            <button
              onClick={handleStartInterview}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
            >
              <PlayCircle size={20} />
              BEGIN INTERVIEW
            </button>
          </div>
        </div>
      )}

      {!isCameraReady && (
        <div className="absolute inset-0 bg-slate-50/95 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <Loader2 size={64} className="text-indigo-600 animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-slate-800">Establishing Secure Connection</h2>
          <div className="flex flex-col items-center gap-1 mt-2">
            <p className="text-slate-500">Checking video feed for integrity monitoring...</p>
            <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest animate-pulse">Initializing Vision Engine</p>
          </div>
        </div>
      )}

      {/* Top Bar - Compact */}
      <div className="flex-none h-14 bg-white rounded-xl shadow-sm border border-slate-100 px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xs">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">{candidate.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Question</span>
            <span className="text-sm font-mono font-bold text-indigo-600">{results.length + 1} / {totalQuestions}</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            <ShieldCheck size={14} />
            <span>Monitored</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0 overflow-hidden">

        {/* LEFT PANEL: AI Avatar */}
        <div className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex-col items-center justify-center p-4 relative overflow-hidden">
          <VisualizerOrb status={status} pulse={voicePulse} />
          <div className="mt-4 text-center space-y-1 z-10">
            <h3 className="font-bold text-slate-700 text-sm">AI Interviewer</h3>
            <p className="text-[10px] text-slate-400">
              {status === InterviewStatus.ASKING ? "Speaking..." : "Listening..."}
            </p>
          </div>
        </div>

        {/* CENTER PANEL: Content */}
        <div className="lg:col-span-6 flex flex-col gap-4 min-h-0 h-full">
          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center shrink-0 max-h-[30%] overflow-y-auto">
            {currentQuestion ? (
              <>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2">Current Question</span>
                <h2 className="text-lg md:text-xl font-light text-slate-800 leading-snug">
                  "{currentQuestion.question}"
                </h2>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="animate-spin text-indigo-300" size={24} />
                <p className="text-xs text-slate-400">Loading...</p>
              </div>
            )}
          </div>

          {/* Answer Box */}
          <div className="flex-1 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 p-4 flex flex-col relative overflow-hidden transition-colors focus-within:border-indigo-400 focus-within:bg-white min-h-0">
            {status === InterviewStatus.THINKING ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-20 backdrop-blur-sm">
                <Loader2 size={40} className="text-indigo-600 animate-spin mb-3" />
                <p className="text-indigo-900 font-medium animate-pulse text-sm">{processingMsg}</p>
              </div>
            ) : (
              <div className="flex h-full gap-4">
                {/* Previous Attempt (Left Pane) */}
                {previousTranscript && (
                  <div className="hidden md:flex flex-1 flex-col bg-slate-100 rounded-xl p-3 border border-slate-200 opacity-60">
                    <span className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">Previous Attempt</span>
                    <p className="text-slate-600 font-serif italic text-sm leading-relaxed overflow-y-auto pr-2">{previousTranscript}</p>
                  </div>
                )}

                {/* Current Active Input (Right Pane) */}
                <div className="flex-1 flex flex-col h-full">
                  <div className="flex justify-between items-center mb-2 shrink-0">
                    <label className="text-xs font-bold text-slate-600 flex items-center gap-2">
                      <Mic size={16} className={status === InterviewStatus.LISTENING ? "text-red-500 animate-pulse" : "text-slate-400"} />
                      <span>{status === InterviewStatus.LISTENING ? "Recording..." : "Mic Standby"}</span>
                      {previousTranscript && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full ml-2">Retrying</span>}
                    </label>

                    {/* Live Audio Meter - Real Monitoring */}
                    {status === InterviewStatus.LISTENING && !isTypingMode && (
                        <div className="flex items-center gap-1 h-3">
                            {[...Array(12)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`w-1.5 rounded-full transition-all duration-75 ${
                                        audioLevel > (i * 6) ? 'bg-indigo-500' : 'bg-slate-200'
                                    }`}
                                    style={{ 
                                        height: `${Math.min(100, 20 + (audioLevel > (i * 6) ? (audioLevel * 1.5) : 0))}%`,
                                        opacity: audioLevel > (i * 6) ? 1 : 0.4
                                    }}
                                />
                            ))}
                        </div>
                    )}
                  </div>

                  <textarea
                    value={liveTranscript}
                    onChange={(e) => isTypingMode && setLiveTranscript(e.target.value)}
                    readOnly={!isTypingMode}
                    placeholder={
                      isTypingMode ? "Type your response here..." :
                      (status === InterviewStatus.LISTENING ? "Start speaking..." : "Listen to the question...")
                    }
                    className={`flex-1 w-full bg-transparent border-none focus:ring-0 text-slate-700 text-base resize-none p-2 leading-relaxed ${isTypingMode ? 'bg-white/50 rounded-xl' : ''}`}
                  />

                  <div className="shrink-0 pt-2 mt-2 border-t border-slate-200/50 flex flex-wrap gap-2 md:gap-3">
                    {/* Fallback Toggle */}
                    <button
                      onClick={toggleTypingMode}
                      className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                        isTypingMode 
                        ? 'bg-indigo-600 border-indigo-600 text-white' 
                        : 'bg-white border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 shadow-sm'
                      }`}
                    >
                      {isTypingMode ? <Mic size={14} /> : <FileText size={14} />}
                      {isTypingMode ? "Switch to Typing" : "Switch to Typing"}
                    </button>

                    <div className="flex-1" />

                    {/* Respeak Button */}
                    {!isTypingMode && (
                        <button
                          onClick={handleRespeak}
                          disabled={!liveTranscript.trim() || status !== InterviewStatus.LISTENING}
                          className={`px-4 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${!liveTranscript.trim() || status !== InterviewStatus.LISTENING
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent shadow-none'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm'
                            }`}
                          title="Discard and Try Again"
                        >
                          <RotateCcw size={18} />
                          <span className="hidden sm:inline">Respeak</span>
                        </button>
                    )}

                    <button
                      onClick={processSubmission}
                      disabled={!liveTranscript.trim() || status !== InterviewStatus.LISTENING}
                      className={`flex-1 py-3 rounded-xl font-bold text-base transition-all shadow-md ${!liveTranscript.trim() || status !== InterviewStatus.LISTENING
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                        }`}
                    >
                      Submit Answer
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Monitor */}
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0 h-full">
          <div className="bg-black rounded-2xl overflow-hidden shadow-md shrink-0 h-48 lg:h-auto lg:aspect-[4/3] relative">
            <MemoizedCameraMonitor
              onWarning={handleWarning}
              onMetricsUpdate={setVisualMetrics}
              isLocked={false}
              interviewStatus={status}
              onStreamReady={handleCameraStreamReady}
              sensitivity={settings?.proctoring.sensitivity || 'Medium'}
            />
          </div>

          <div className="flex-1 bg-slate-900 rounded-2xl p-4 text-slate-300 flex flex-col shadow-sm overflow-y-auto min-h-0">
            <h4 className="text-white font-bold flex items-center gap-2 mb-3 pb-2 border-b border-slate-700 text-sm">
              <ShieldAlert className="text-amber-500" size={16} />
              <span>Live Proctoring</span>
            </h4>
            <div className="space-y-4 text-[10px] md:text-sm">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-1.5 rounded-full ${visualMetrics.isLookingAtCamera ? 'bg-emerald-500' : 'bg-red-500 animate-ping'}`} />
                <div className="flex-1">
                  <p className="font-bold text-slate-100">Eye Tracking</p>
                  <p className="text-slate-400 text-xs">{visualMetrics.isLookingAtCamera ? "Engagement: Good" : "Focus: Looking Away"}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-1.5 rounded-full ${visualMetrics.currentExpression === 'Speaking' ? 'bg-blue-500' : 'bg-slate-600'}`} />
                <div className="flex-1">
                  <p className="font-bold text-slate-100">Lip Sync / Mouth</p>
                  <p className="text-slate-400 text-xs">{visualMetrics.currentExpression === 'Speaking' ? "Activity Detected" : "Status: Quiet"}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 font-bold uppercase tracking-tighter text-[9px]">Strikes</span>
                  <span className={`font-mono font-bold ${warningLogRef.current.length >= 2 ? 'text-red-500' : 'text-slate-300'}`}>
                    {warningLogRef.current.length} / 3
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${warningLogRef.current.length >= 2 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(warningLogRef.current.length / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
