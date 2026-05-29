import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Send, Loader2, Edit3, CheckCircle, ArrowRight, Play } from 'lucide-react';
import { AIService, GeneratedQuestion } from '../services/aiService';
import { BackendService } from '../services/backendService';

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

interface VoiceInterviewScreenProps {
  candidate: { name: string; email: string; role: string };
  onComplete: (history: { question: string; answer: string; ideal_answer: string }[]) => void;
}

export const VoiceInterviewScreen: React.FC<VoiceInterviewScreenProps> = ({ candidate, onComplete }) => {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<{ question: string; answer: string; ideal_answer: string }[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  // Initialize Questions
  useEffect(() => {
    const init = async () => {
      try {
        const data = await AIService.generateQuestions(candidate.role, 'Intermediate', 'Technical', 5);
        setQuestions(data);
        setLoading(false);
        
        // Wait for voices to be ready before speaking
        const speakWhenReady = () => {
          const voices = synthRef.current.getVoices();
          if (voices.length > 0) {
            setTimeout(() => speakQuestion(data[0].question), 1500);
          } else {
            // Chrome/Edge load voices async
            synthRef.current.onvoiceschanged = () => {
              setTimeout(() => speakQuestion(data[0].question), 1500);
              synthRef.current.onvoiceschanged = null;
            };
          }
        };
        speakWhenReady();
      } catch (err) {
        console.error(err);
      }
    };
    init();

    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Restored to en-US as requested

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          fullTranscript += event.results[i][0].transcript;
        }
        setUserInput(fullTranscript);
      };

      recognition.onerror = (err: any) => {
        console.error("Speech Error:", err);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      synthRef.current.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const speakQuestion = (text: string) => {
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    // Safety watchdog: Chrome sometimes never fires onend (known bug).
    // Force-clear isAiSpeaking after estimated speech duration + 4s buffer.
    const watchdogMs = text.length * 80 + 4000;
    let watchdog: ReturnType<typeof setTimeout> | null = null;

    const clearSpeaking = () => {
      if (watchdog) { clearTimeout(watchdog); watchdog = null; }
      setIsAiSpeaking(false);
    };

    utterance.onstart = () => {
      setIsAiSpeaking(true);
      watchdog = setTimeout(() => {
        // Force-end if TTS onend never fires
        synthRef.current.cancel();
        setIsAiSpeaking(false);
        watchdog = null;
      }, watchdogMs);
    };
    utterance.onend = clearSpeaking;
    utterance.onerror = clearSpeaking;
    
    // Pick an Indian accent voice (en-IN)
    const voices = synthRef.current.getVoices();
    const indianVoice = voices.find(v => v.lang === 'en-IN' || v.name.includes('India') || v.name.includes('Rishi') || v.name.includes('Heera'));
    const premiumVoice = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
    
    if (indianVoice) {
      utterance.voice = indianVoice;
      utterance.rate = 0.9; // Slightly slower for better clarity
    } else if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    synthRef.current.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch(e) {}
    } else {
      setUserInput('');
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch(e) {
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
    await BackendService.saveResponse(newEntry);

    if (currentIndex < 4) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      setUserInput('');
      setIsEditing(false);
      setIsListening(false); // Force close mic state just in case
      try { recognitionRef.current?.stop(); } catch(e){}
      
      // Wait a moment then speak
      setTimeout(() => speakQuestion(questions[nextIdx].question), 1200);
    } else {
      setLoading(true);
      await BackendService.completeSession();
      onComplete(newHistory);
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium">Curating your specialized ${candidate.role} assessment...</p>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="h-screen bg-[#F8FAFC] flex flex-col overflow-hidden font-sans">
      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-100">
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
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-xs font-bold text-slate-500">QUESTION</span>
          <span className="text-sm font-black text-indigo-600">{currentIndex + 1} / 5</span>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-8 flex flex-col justify-center space-y-12">
        {/* AI Question Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isAiSpeaking ? 'bg-indigo-500 animate-ping' : 'bg-slate-300'}`} />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">AI Interviewer</span>
          </div>
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
              {currentQ?.question}
            </h1>
            <button 
              onClick={() => speakQuestion(currentQ.question)}
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
      </main>

      <footer className="p-8 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex items-center gap-6">
          <button
            onClick={toggleMic}
            disabled={isAiSpeaking}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening ? 'bg-rose-500 text-white shadow-xl shadow-rose-200' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            {isListening ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <button
            onClick={handleNext}
            disabled={!userInput.trim() || isAiSpeaking || (isListening && userInput.length === 0)}
            className="flex-1 bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-300 text-white h-20 rounded-[28px] font-bold text-xl shadow-xl shadow-slate-200/50 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {currentIndex < 4 ? 'Next Question' : 'Complete Interview'}
            <ArrowRight size={24} />
          </button>
        </div>
      </footer>
    </div>
  );
};
