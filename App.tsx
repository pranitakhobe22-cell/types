import React, { useState, useEffect } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { VoiceInterviewScreen } from './components/VoiceInterviewScreen';
import { EndScreen } from './components/EndScreen';
import { AdminDashboard } from './components/AdminDashboard';
import { BackendService } from './services/backendService';
import { supabase } from './services/supabaseClient';
import { Cloud, CloudOff } from 'lucide-react';

function App() {
  const [flowState, setFlowState] = useState<'landing' | 'interview' | 'completed'>('landing');
  const [candidate, setCandidate] = useState<{ name: string; email: string; role: string } | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<{ question: string; answer: string; ideal_answer: string }[]>([]);
  const [isCloudEnabled, setIsCloudEnabled] = useState(!!supabase);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Simple Theme Management (Light as default)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    setIsCloudEnabled(!!supabase);
  }, []);

  // Secret shortcut to open Admin Dashboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && e.altKey && e.code === 'KeyA') {
        setIsAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      {/* Admin Dashboard Overlay */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-[100] animate-in fade-in zoom-in duration-300">
          <AdminDashboard onLogout={() => setIsAdminOpen(false)} />
        </div>
      )}

      {/* Cloud Status Indicator */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-full shadow-sm text-[10px] font-bold uppercase tracking-wider">
        {isCloudEnabled ? (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-600">Cloud Sync Active</span>
            <Cloud size={12} className="text-indigo-500" />
          </>
        ) : (
          <>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-slate-600">Local Mode</span>
            <CloudOff size={12} className="text-slate-400" />
          </>
        )}
      </div>
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
