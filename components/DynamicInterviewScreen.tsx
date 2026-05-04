import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, User, Mic, Square, CheckCircle, ArrowRight } from 'lucide-react';
import { AIService, GeneratedQuestion } from '../services/aiService';
import { VisualizerOrb } from './VisualizerOrb';

interface DynamicInterviewScreenProps {
  candidate: { name: string; email: string; role: string };
  onComplete: (history: { question: string; answer: string; ideal_answer: string }[]) => void;
}

export const DynamicInterviewScreen: React.FC<DynamicInterviewScreenProps> = ({ candidate, onComplete }) => {
  const [history, setHistory] = useState<{ question: string; answer: string; ideal_answer: string }[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<GeneratedQuestion | null>(null);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFinishing, setIsFinishing] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const MAX_QUESTIONS = 5;

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load first question
    const loadFirstQuestion = async () => {
      try {
        const questions = await AIService.generateQuestions(candidate.role, 'Intermediate', 'Technical', 1);
        setCurrentQuestion(questions[0]);
        setQuestionCount(1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFirstQuestion();
  }, [candidate.role]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, currentQuestion, loading]);

  const handleSend = async () => {
    if (!userInput.trim() || !currentQuestion || loading) return;

    const newQA = {
      question: currentQuestion.question,
      answer: userInput,
      ideal_answer: currentQuestion.ideal_answer
    };

    const newHistory = [...history, newQA];
    setHistory(newHistory);
    setUserInput('');
    setLoading(true);

    if (questionCount >= MAX_QUESTIONS) {
      setIsFinishing(true);
      setTimeout(() => onComplete(newHistory), 1500);
      return;
    }

    try {
      const nextQ = await AIService.generateNextDynamicQuestion(candidate.role, newHistory);
      setCurrentQuestion(nextQ);
      setQuestionCount(prev => prev + 1);
    } catch (err) {
      console.error(err);
      // Fallback if dynamic fails? Or retry.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-[#0f172a] text-slate-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex justify-between items-center z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
            {candidate.name[0]}
          </div>
          <div>
            <h2 className="font-bold text-sm">{candidate.name}</h2>
            <p className="text-xs text-slate-400">{candidate.role} Interview</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs font-mono text-slate-300">Question {questionCount}/{MAX_QUESTIONS}</span>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-8 scrollbar-hide">
        {history.map((item, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex gap-4 max-w-3xl">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Loader2 size={16} className="text-indigo-400" />
              </div>
              <div className="bg-slate-800/50 p-4 rounded-2xl rounded-tl-none border border-slate-700 text-slate-200">
                {item.question}
              </div>
            </div>
            <div className="flex gap-4 max-w-3xl ml-auto flex-row-reverse">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-none text-white shadow-lg shadow-indigo-600/10">
                {item.answer}
              </div>
            </div>
          </div>
        ))}

        {currentQuestion && !isFinishing && (
          <div className="flex gap-4 max-w-3xl animate-in slide-in-from-left duration-300">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Loader2 size={16} className="text-indigo-400" />
            </div>
            <div className="bg-slate-800/50 p-6 rounded-2xl rounded-tl-none border border-slate-700 text-slate-200 shadow-xl">
              <p className="text-lg leading-relaxed">{currentQuestion.question}</p>
            </div>
          </div>
        )}

        {loading && !isFinishing && (
          <div className="flex gap-4 items-center text-slate-500 animate-pulse">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin" />
            </div>
            <span className="text-sm italic">AI is thinking...</span>
          </div>
        )}

        {isFinishing && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center animate-in zoom-in duration-500">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-2xl font-bold">Interview Completed</h3>
            <p className="text-slate-400">Finalizing your evaluation report...</p>
          </div>
        )}

        <div ref={chatEndRef} />
      </main>

      {/* Input Section */}
      <footer className="p-4 md:p-8 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent">
        <div className="max-w-4xl mx-auto relative group">
          <div className="absolute inset-0 bg-indigo-500/10 blur-2xl group-focus-within:bg-indigo-500/20 transition-all rounded-full" />
          
          <div className="relative flex flex-col items-center">
            {/* Visualizer Orb for that AI feel */}
            <div className="mb-4 transform scale-75 opacity-50">
              <VisualizerOrb isActive={loading} />
            </div>

            <div className="w-full flex items-end gap-3 bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-2 rounded-3xl shadow-2xl focus-within:border-indigo-500 transition-all">
              <textarea
                rows={1}
                placeholder="Type your response here..."
                className="flex-1 bg-transparent border-none outline-none text-slate-100 p-4 resize-none min-h-[56px] max-h-40 scrollbar-hide text-lg"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={loading || isFinishing}
              />
              <button
                onClick={handleSend}
                disabled={!userInput.trim() || loading || isFinishing}
                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 font-semibold uppercase tracking-widest">
              Press Enter to send response
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
