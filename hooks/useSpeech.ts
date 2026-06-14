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

export const useSpeech = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Store available voices to pick from randomly
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const pendingTranscriptRef = useRef('');
  const updateTimeoutRef = useRef<number | null>(null);
  const questionStartIndexRef = useRef(0);
  const lastResultLengthRef = useRef(0);
  const accumulatedPrefixRef = useRef('');
  const shouldKeepListeningRef = useRef(false);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      setIsSupported(true);
      const recognition = new SpeechRecognitionCtor();
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      recognition.continuous = !isMobile;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        lastResultLengthRef.current = event.results.length;

        // If the browser natively flushed its buffer (length dropped), we must reset our start index
        // and save everything we've spoken so far into the prefix!
        if (event.results.length < questionStartIndexRef.current) {
            accumulatedPrefixRef.current = pendingTranscriptRef.current + ' ';
            questionStartIndexRef.current = 0;
        }

        const startIndex = questionStartIndexRef.current;
        for (let i = startIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }

        const newTranscript = (accumulatedPrefixRef.current + currentTranscript).toLowerCase();
        
        // No throttling, React 18 batches state updates natively
        pendingTranscriptRef.current = newTranscript;
        setTranscript(newTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech Recognition Error:", event.error);
        if (event.error === 'not-allowed' || event.error === 'aborted' || event.error === 'no-speech') {
          shouldKeepListeningRef.current = false;
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (shouldKeepListeningRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart speech recognition:", e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
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
      // Filter for English to ensure correct pronunciation of interview questions
      const englishVoices = allVoices.filter(v => v.lang.startsWith('en'));

      setAvailableVoices(englishVoices.length > 0 ? englishVoices : allVoices);
    };

    loadVoices();
    if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        shouldKeepListeningRef.current = true;
        recognitionRef.current.start();
        setIsListening(true);
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
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    pendingTranscriptRef.current = '';
    accumulatedPrefixRef.current = '';
    questionStartIndexRef.current = lastResultLengthRef.current;
  }, []);

  const speak = useCallback((text: string, options?: SpeakOptions | (() => void)) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech to prevent queue backup
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      currentUtteranceRef.current = utterance;

      // Handle overloaded argument for backward compatibility (if simplified call is used)
      const onEnd = typeof options === 'function' ? options : options?.onEnd;
      const onBoundary = typeof options === 'object' ? options?.onBoundary : undefined;

        let selectedVoice: SpeechSynthesisVoice | undefined;

        // Force Google's highly realistic native voices if in Chrome
        const googleVoices = availableVoices.filter(v => v.name.includes('Google'));
        if (googleVoices.length > 0) {
            selectedVoice = googleVoices.find(v => v.name === 'Google US English') || googleVoices[0];
        } else {
            // Fallback to other premium/neural voices
            const premiumVoices = availableVoices.filter(v => 
                ['Natural', 'Premium', 'Online', 'Neural'].some(k => v.name.includes(k))
            );
            selectedVoice = premiumVoices.length > 0 ? premiumVoices[0] : availableVoices.filter(v => !v.name.includes('Desktop'))[0] || availableVoices[0];
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
          // Keep pitch and rate extremely close to 1 for human naturalness
          utterance.pitch = 1.0;
          utterance.rate = 1.0;
        }

      utterance.onstart = () => setIsSpeaking(true);

      // Word boundary event for visualizer sync
      utterance.onboundary = (event) => {
        if (onBoundary) onBoundary();
      };

      const handleEnd = () => {
        // Verify this is the current utterance ending (prevent race conditions)
        if (currentUtteranceRef.current === utterance) {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          if (onEnd) onEnd();
        }
      };

      utterance.onend = handleEnd;

      utterance.onerror = (event: any) => {
        // Ignore cancel/interrupt as they are usually manual
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.error(`TTS Error: ${event.error}`);
        }
        handleEnd();
      };

      window.speechSynthesis.speak(utterance);

      // 6. Safety Timeout (Browser Bug Fix)
      // Force end if event doesn't fire within reasonable time
      // Calculation: avg 200ms per char + 3s buffer
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
    }
  }, []);

  const warmUp = useCallback(() => {
    // 1. Unlock Speech Synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      window.speechSynthesis.speak(utterance);
    }
    // We removed the aggressively hacked Mic start/stop here as it can permanently brick the recognition session on Chrome.
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
    warmUp
  };
};