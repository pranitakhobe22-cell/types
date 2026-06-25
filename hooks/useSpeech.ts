import { useState, useEffect, useCallback, useRef } from 'react';
import { normalizeSpeechText, logLowConfidenceSTT } from '../services/speechDictionary';

// Polyfill definitions for browser speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: any) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeakOptions {
  onEnd?: () => void;
  onBoundary?: () => void;
}

export type MicStatus = 'off' | 'listening' | 'processing' | 'reconnecting' | 'error';

export const useSpeech = (activeQuestionId?: string | number) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscriptState] = useState('');
  const [interimTranscript, setInterimTranscriptState] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [micStatus, setMicStatus] = useState<MicStatus>('off');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const shouldKeepListeningRef = useRef(false);
  const finalChunksRef = useRef<string[]>([]);
  const finalTranscriptRef = useRef('');
  const interimTranscriptStateRef = useRef('');

  const activeQuestionIdRef = useRef<string | number | undefined>(activeQuestionId);
  const recognitionSessionIdRef = useRef<string | null>(null);
  const isRecognitionRunningRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Restart loop protection
  const lastRestartTimeRef = useRef<number>(0);
  const restartRetryCountRef = useRef<number>(0);
  const MAX_RESTARTS = 20;

  // Browser capability check on mount
  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setIsSupported(true);
    } else {
      setIsSupported(false);
      if (import.meta.env.DEV) {
        console.warn("[STT-DEBUG] SpeechRecognition API not supported in this browser.");
      }
    }
  }, []);

  // Cleanup SpeechRecognition session helper
  const cleanupRecognition = useCallback(() => {
    recognitionSessionIdRef.current = null;
    isRecognitionRunningRef.current = false;

    // Clear any active restart timers immediately
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      if (import.meta.env.DEV) {
        console.log("[STT-DEBUG] Cleaning up SpeechRecognition session");
      }
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (e) {
        // Ignore abort errors
      }
      recognitionRef.current = null;
    }
  }, []);

  // Debounced React state updates to prevent rendering storms
  const updateDebouncedTranscript = useCallback((finalText: string, interimText: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setTranscriptState(finalText);
      setInterimTranscriptState(interimText);
    }, 250);
  }, []);

  // Sync activeQuestionId changes
  useEffect(() => {
    activeQuestionIdRef.current = activeQuestionId;

    if (import.meta.env.DEV) {
      console.log(`[STT-DEBUG] activeQuestionId changed to: ${activeQuestionId}`);
    }

    // Force complete session cleanup on question boundary
    cleanupRecognition();

    // Reset transcript buffers
    finalChunksRef.current = [];
    finalTranscriptRef.current = '';
    interimTranscriptStateRef.current = '';

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setTranscriptState('');
    setInterimTranscriptState('');

    // Ensure mic is turned off by default for the new question
    shouldKeepListeningRef.current = false;
    setIsListening(false);
    setMicStatus('off');
  }, [activeQuestionId, cleanupRecognition]);

  // Main listener starter
  const startListeningForQuestion = useCallback((qId: string | number) => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setIsSupported(false);
      return;
    }

    if (isRecognitionRunningRef.current) {
      if (import.meta.env.DEV) {
        console.log("[STT-DEBUG] Recognition already running. Ignoring duplicate start request.");
      }
      return;
    }

    cleanupRecognition();

    const currentSessionId = Math.random().toString(36).substring(2, 9);
    recognitionSessionIdRef.current = currentSessionId;
    isRecognitionRunningRef.current = true;
    shouldKeepListeningRef.current = true;

    if (import.meta.env.DEV) {
      console.log(`[STT-DEBUG] Starting recognition for Q: ${qId}, Session ID: ${currentSessionId}`);
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = 'en-US';

    let lastProcessedIndex = 0;

    recognition.onresult = (event: any) => {
      // Closure Session Validation
      if (currentSessionId !== recognitionSessionIdRef.current) {
        if (import.meta.env.DEV) {
          console.log(`[STT-DEBUG] Discarding STT result: session ${currentSessionId} is inactive.`);
        }
        return;
      }

      restartRetryCountRef.current = 0;
      setMicStatus('listening');

      let interimText = '';
      const startIndex = Math.max(lastProcessedIndex, event.resultIndex);

      for (let i = startIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result && result[0]) {
          const confidence = result[0].confidence;

          if (import.meta.env.DEV) {
            console.log(`[STT-DEBUG] Session ${currentSessionId} Result index ${i}: "${result[0].transcript}" | isFinal: ${result.isFinal} | confidence: ${confidence}`);
          }

          if (result.isFinal) {
            // Lower confidence threshold filter to 0.45 to prevent discarding valid tech jargon
            if (confidence !== undefined && confidence > 0 && confidence < 0.45) {
              if (import.meta.env.DEV) {
                console.log(`[STT-DEBUG] Discarding extremely low confidence final result (${confidence}): "${result[0].transcript}"`);
              }
              lastProcessedIndex = i + 1;
              continue;
            }

            const rawText = result[0].transcript.trim();
            if (rawText) {
              const normalized = normalizeSpeechText(rawText);
              
              // Log unknown low-confidence technical words (confidence between 0.45 and 0.6 and no dictionary replacement happened)
              if (confidence !== undefined && confidence >= 0.45 && confidence < 0.6) {
                if (normalized.toLowerCase() === rawText.toLowerCase()) {
                  logLowConfidenceSTT(rawText, normalized, confidence, activeQuestionIdRef.current);
                }
              }

              if (normalized) {
                finalChunksRef.current.push(normalized);
              }
            }
            lastProcessedIndex = i + 1;
          } else {
            interimText += result[0].transcript;
          }
        }
      }

      const combinedFinal = finalChunksRef.current.join(' ').trim();
      finalTranscriptRef.current = combinedFinal;
      interimTranscriptStateRef.current = interimText;

      updateDebouncedTranscript(combinedFinal, interimText);
    };

    recognition.onerror = (event: any) => {
      if (currentSessionId !== recognitionSessionIdRef.current) return;

      console.error(`[STT-ERROR] Speech Recognition Error in session ${currentSessionId}:`, event.error);

      if (event.error === 'not-allowed') {
        shouldKeepListeningRef.current = false;
        setIsListening(false);
        setMicStatus('error');
        isRecognitionRunningRef.current = false;
        return;
      }

      if (event.error === 'aborted') {
        isRecognitionRunningRef.current = false;
        return;
      }

      setMicStatus('error');
    };

    recognition.onend = () => {
      isRecognitionRunningRef.current = false;

      // Closure Session Validation
      if (currentSessionId !== recognitionSessionIdRef.current) {
        if (import.meta.env.DEV) {
          console.log(`[STT-DEBUG] Session ${currentSessionId} ended (old session). Not restarting.`);
        }
        return;
      }

      if (shouldKeepListeningRef.current) {
        const now = Date.now();
        const timeSinceLastRestart = now - lastRestartTimeRef.current;

        if (timeSinceLastRestart < 1500) {
          restartRetryCountRef.current += 1;
        } else {
          restartRetryCountRef.current = 1;
        }

        lastRestartTimeRef.current = now;

        if (restartRetryCountRef.current > MAX_RESTARTS) {
          console.error("[STT-ERROR] Restart storm blocked. Stopping microphone.");
          shouldKeepListeningRef.current = false;
          setIsListening(false);
          setMicStatus('error');
          return;
        }

        const restartDelay = timeSinceLastRestart < 1500 ? 1000 : 250;
        setMicStatus('reconnecting');

        if (import.meta.env.DEV) {
          console.log(`[STT-DEBUG] Reconnecting speech recognition in ${restartDelay}ms...`);
        }

        restartTimeoutRef.current = setTimeout(() => {
          if (shouldKeepListeningRef.current && currentSessionId === recognitionSessionIdRef.current) {
            try {
              isRecognitionRunningRef.current = false;
              startListeningForQuestion(qId);
            } catch (e) {
              console.error("[STT-ERROR] Failed to restart speech recognition:", e);
              setMicStatus('error');
              setIsListening(false);
            }
          }
        }, restartDelay);
      } else {
        setIsListening(false);
        setMicStatus('off');
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      setMicStatus('listening');
    } catch (e) {
      console.error("[STT-ERROR] Error starting SpeechRecognition instance:", e);
      isRecognitionRunningRef.current = false;
      setMicStatus('error');
      setIsListening(false);
    }
  }, [cleanupRecognition, updateDebouncedTranscript]);

  // Mobile stability session rotation
  useEffect(() => {
    if (!isListening) return;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    const intervalId = setInterval(() => {
      if (recognitionRef.current && shouldKeepListeningRef.current) {
        if (import.meta.env.DEV) {
          console.log("[STT-DEBUG] Rotating mobile session to prevent Chrome browser crashes...");
        }
        recognitionRef.current.stop();
      }
    }, 25000); // 25 seconds

    return () => clearInterval(intervalId);
  }, [isListening]);

  // Initialize Text-to-Speech Voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return;

      const allVoices = window.speechSynthesis.getVoices();
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));

      setAvailableVoices(englishVoices.length > 0 ? englishVoices : allVoices);
    };

    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Visibility Change recovery listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && shouldKeepListeningRef.current) {
        if (micStatus === 'reconnecting' || micStatus === 'off' || micStatus === 'error') {
          if (import.meta.env.DEV) {
            console.log("[STT-DEBUG] Visibility recovered: attempting to restart microphone recognition");
          }
          const activeQId = activeQuestionIdRef.current;
          if (activeQId) {
            cleanupRecognition();
            // Store restart timeout ref to prevent leak
            restartTimeoutRef.current = setTimeout(() => {
              if (shouldKeepListeningRef.current && activeQId === activeQuestionIdRef.current) {
                startListeningForQuestion(activeQId);
              }
            }, 300);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [micStatus, cleanupRecognition, startListeningForQuestion]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
    };
  }, []);

  // Expose a custom setTranscript that synchronizes internal refs for manual edits
  const setTranscript = useCallback((newVal: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setTranscriptState(newVal);
    setInterimTranscriptState('');
    finalChunksRef.current = newVal ? [newVal] : [];
    finalTranscriptRef.current = newVal;
    interimTranscriptStateRef.current = '';
  }, []);

  const startListening = useCallback((qId?: string | number) => {
    const targetQId = qId || activeQuestionIdRef.current;
    if (!targetQId) {
      console.warn("[STT-WARN] Cannot start listening without an active question ID.");
      return;
    }
    startListeningForQuestion(targetQId);
  }, [startListeningForQuestion]);

  const stopListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    cleanupRecognition();

    // Immediately flush transcript states and cancel debounces
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setTranscriptState(finalTranscriptRef.current);
    setInterimTranscriptState('');

    setIsListening(false);
    setMicStatus('off');
  }, [cleanupRecognition]);

  const resetTranscript = useCallback(() => {
    finalChunksRef.current = [];
    finalTranscriptRef.current = '';
    interimTranscriptStateRef.current = '';

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setTranscriptState('');
    setInterimTranscriptState('');

    shouldKeepListeningRef.current = false;
    cleanupRecognition();
    setIsListening(false);
    setMicStatus('off');
  }, [cleanupRecognition]);

  const speak = useCallback((text: string, options?: SpeakOptions | (() => void)) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      const onEnd = typeof options === 'function' ? options : options?.onEnd;
      const onBoundary = typeof options === 'object' ? options?.onBoundary : undefined;

      let selectedVoice: SpeechSynthesisVoice | undefined;

      const googleVoices = availableVoices.filter(v => v.name.includes('Google'));
      if (googleVoices.length > 0) {
        selectedVoice = googleVoices.find(v => v.name === 'Google US English') || googleVoices[0];
      } else {
        const premiumVoices = availableVoices.filter(v =>
          ['Natural', 'Premium', 'Online', 'Neural'].some(k => v.name.includes(k))
        );
        selectedVoice = premiumVoices.length > 0 ? premiumVoices[0] : availableVoices.filter(v => !v.name.includes('Desktop'))[0] || availableVoices[0];
      }

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onboundary = () => { if (onBoundary) onBoundary(); };

      const handleEnd = () => {
        if (currentUtteranceRef.current === utterance) {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          if (onEnd) onEnd();
        }
      };

      utterance.onend = handleEnd;
      utterance.onerror = (event: any) => {
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.error(`TTS Error: ${event.error}`);
        }
        handleEnd();
      };

      window.speechSynthesis.speak(utterance);

      const timeoutDuration = (text.length * 200) + 3000;
      setTimeout(() => {
        if (currentUtteranceRef.current === utterance && window.speechSynthesis.speaking) {
          window.speechSynthesis.cancel();
          handleEnd();
        }
      }, timeoutDuration);

    } else {
      console.warn("TTS not supported");
      const onEnd = typeof options === 'function' ? options : options?.onEnd;
      if (onEnd) onEnd();
    }
  }, [availableVoices]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    }
  }, []);

  const abortListening = useCallback(() => {
    shouldKeepListeningRef.current = false;
    cleanupRecognition();
    setIsListening(false);
    setMicStatus('off');
  }, [cleanupRecognition]);

  const warmUp = useCallback(() => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    setTranscript,
    resetTranscript,
    startListening,
    stopListening,
    abortListening,
    isSupported,
    speak,
    stopSpeaking,
    isSpeaking,
    warmUp,
    micStatus
  };
};