import { useState, useEffect, useCallback, useRef } from 'react';

// Polyfill definitions for browser speech API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
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

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscriptState] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [micStatus, setMicStatus] = useState<MicStatus>('off');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const shouldKeepListeningRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');
  const currentSessionFinalRef = useRef('');
  const latestTranscriptRef = useRef('');

  // Restart loop protection
  const lastRestartTimeRef = useRef<number>(0);
  const restartRetryCountRef = useRef<number>(0);
  const MAX_RESTARTS = 20;

  // Sync latest transcript ref whenever state changes
  useEffect(() => {
    latestTranscriptRef.current = transcript;
  }, [transcript]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true; // continuous is supported natively by Chrome; others will fall back
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        // Reset restart retry counts on successful speech results
        restartRetryCountRef.current = 0;
        setMicStatus('listening');

        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = 0; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += text + ' ';
          } else {
            interimTranscript += text;
          }
        }

        currentSessionFinalRef.current = finalTranscript;
        const currentCombined = (finalTranscript + interimTranscript).trim();
        const fullTranscript = accumulatedTranscriptRef.current 
          ? (accumulatedTranscriptRef.current + ' ' + currentCombined).trim()
          : currentCombined;
        setTranscriptState(fullTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed') {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
          setMicStatus('error');
          return;
        }

        if (event.error === 'aborted') {
          // Handled manually or during tab blur. Keep status state.
          return;
        }

        setMicStatus('error');
      };

      recognition.onend = () => {
        // Safely commit latest transcript (preventing stale closures)
        accumulatedTranscriptRef.current = latestTranscriptRef.current;
        currentSessionFinalRef.current = '';

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
            console.error("Speech Recognition restart storm blocked. Stopping microphone.");
            shouldKeepListeningRef.current = false;
            setIsListening(false);
            setMicStatus('error');
            return;
          }

          setMicStatus('reconnecting');
          setTimeout(() => {
            if (shouldKeepListeningRef.current) {
              try {
                recognition.start();
                setMicStatus('listening');
              } catch (e) {
                console.error("Failed to restart speech recognition:", e);
                setMicStatus('error');
                setIsListening(false);
              }
            }
          }, 1000);
        } else {
          setIsListening(false);
          setMicStatus('off');
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

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
      if (!document.hidden && shouldKeepListeningRef.current && recognitionRef.current) {
        if (micStatus === 'reconnecting' || micStatus === 'off' || micStatus === 'error') {
          console.log("Visibility recovered: attempting to restart microphone recognition");
          try {
            recognitionRef.current.abort(); // Clean abort first
            setTimeout(() => {
              if (shouldKeepListeningRef.current) {
                try {
                  recognitionRef.current?.start();
                  setMicStatus('listening');
                  setIsListening(true);
                } catch (e) {
                  // Already running
                }
              }
            }, 300);
          } catch (e) {
            // Ignore abort error
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [micStatus]);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Expose a custom setTranscript that synchronizes internal refs for manual edits
  const setTranscript = useCallback((newVal: string) => {
    setTranscriptState(newVal);
    accumulatedTranscriptRef.current = newVal;
    currentSessionFinalRef.current = '';
    latestTranscriptRef.current = newVal;
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldKeepListeningRef.current = true;
        restartRetryCountRef.current = 0;
        recognitionRef.current.start();
        setIsListening(true);
        setMicStatus('listening');
      } catch (e) {
        // Ignore if already started
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current.stop();
      setIsListening(false);
      setMicStatus('off');
    }
  }, []);

  const resetTranscript = useCallback(() => {
    accumulatedTranscriptRef.current = '';
    currentSessionFinalRef.current = '';
    latestTranscriptRef.current = '';
    setTranscriptState('');
    if (recognitionRef.current) {
        shouldKeepListeningRef.current = true;
        try {
            recognitionRef.current.stop();
        } catch (e) {
            // Ignore if already stopped
        }
    }
  }, []);

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
    if (recognitionRef.current) {
      shouldKeepListeningRef.current = false;
      recognitionRef.current.abort();
      setIsListening(false);
      setMicStatus('off');
    }
  }, []);

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