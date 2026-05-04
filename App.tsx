import React, { useState, useEffect } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { VoiceInterviewScreen } from './components/VoiceInterviewScreen';
import { EndScreen } from './components/EndScreen';
import { BackendService } from './services/backendService';

function App() {
  const [flowState, setFlowState] = useState<'landing' | 'interview' | 'completed'>('landing');
  const [candidate, setCandidate] = useState<{ name: string; email: string; role: string } | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<{ question: string; answer: string; ideal_answer: string }[]>([]);

  // Simple Theme Management (Light as default)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleStart = async (data: { name: string; email: string; role: string }) => {
    setCandidate(data);
    await BackendService.createSession(data);
    setFlowState('interview');
  };

  const handleInterviewComplete = async (history: { question: string; answer: string; ideal_answer: string }[]) => {
    setInterviewHistory(history);
    setFlowState('completed');
  };

  const handleReset = () => {
    setFlowState('landing');
    setCandidate(null);
    setInterviewHistory([]);
  };

  return (
    <div className={`${flowState === 'completed' ? 'min-h-screen overflow-y-auto' : 'h-screen overflow-hidden'} w-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500/10 transition-colors duration-500`}>
      {flowState === 'landing' && (
        <LandingScreen onStart={handleStart} />
      )}

      {flowState === 'interview' && candidate && (
        <VoiceInterviewScreen 
          candidate={candidate} 
          onComplete={handleInterviewComplete} 
        />
      )}

      {flowState === 'completed' && candidate && (
        <EndScreen 
          candidate={candidate} 
          history={interviewHistory} 
          onHome={handleReset} 
        />
      )}
    </div>
  );
}



export default App;
