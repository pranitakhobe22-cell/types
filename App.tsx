import React, { useState, useEffect } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { DynamicInterviewScreen } from './components/DynamicInterviewScreen';
import { EndScreen } from './components/EndScreen';
import { AdminDashboard } from './components/AdminDashboard';

import { HealthService, SystemHealth } from './services/healthService';
import { AlertTriangle, Server, Database, Lock, Loader2, CheckCircle2 } from 'lucide-react';

function App() {
  const [flowState, setFlowState] = useState<'landing' | 'interview' | 'completed'>('landing');
  const [candidate, setCandidate] = useState<{ name: string; email: string; role: string } | null>(null);
  const [interviewHistory, setInterviewHistory] = useState<{ question: string; answer: string; ideal_answer: string }[]>([]);
  
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  // Check URL for Admin route on load
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin')) {
      setIsAdminRoute(true);
    }

    // Run health check
    const checkSystem = async () => {
      setIsCheckingHealth(true);
      const h = await HealthService.checkSystemHealth();
      setHealth(h);
      setIsCheckingHealth(false);
    };

    checkSystem();

    // Re-check every 60 seconds
    const interval = setInterval(checkSystem, 60000);
    return () => clearInterval(interval);
  }, []);

  // Simple Theme Management (Light as default)
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const handleStart = async (data: { name: string; email: string; role: string }) => {
    // Clear old invalid session IDs
    localStorage.removeItem('current_session_id');
    setCandidate(data);
    
    try {
        const { SupabaseService } = await import('./services/supabaseService');
        const { getDeviceFingerprint } = await import('./services/deviceFingerprint');
        
        const candidateRecord = await SupabaseService.upsertCandidate({ name: data.name, email: data.email, role: data.role } as any);
        const fp = await getDeviceFingerprint();
        
        const session = await SupabaseService.createSession(candidateRecord.id, undefined as any, fp, {});
        localStorage.setItem('current_session_id', session.id);
        
        setFlowState('interview');
    } catch (e: any) {
        console.error("Failed to start session in Supabase:", e);
        alert(`Failed to start session. Database Error: ${e.message || JSON.stringify(e)}`);
        setCandidate(null);
    }
  };

  const handleInterviewComplete = async (
    history: { question: string; answer: string; ideal_answer: string }[],
    proctoringReport: any,
    evalReport: any
  ) => {
    try {
        const { SupabaseService } = await import('./services/supabaseService');
        const sessionId = localStorage.getItem('current_session_id');
        if (sessionId) {
            const savePromises: Promise<any>[] = [];
            
            if (evalReport) {
                savePromises.push(SupabaseService.saveEvaluationReport(sessionId, evalReport));
            }
            if (proctoringReport) {
                savePromises.push(SupabaseService.saveProctoringReport(sessionId, proctoringReport, {} as any));
            }
            
            savePromises.push(
                SupabaseService.completeSession(
                    sessionId, 
                    proctoringReport?.sessionDurationMs ? Math.round(proctoringReport.sessionDurationMs / 1000) : 0
                )
            );

            await Promise.all(savePromises);
        }
    } catch (e) {
        console.error("Failed to complete session:", e);
    }
    setInterviewHistory(history);
    setFlowState('completed');
  };

  const handleReset = () => {
    setFlowState('landing');
    setCandidate(null);
    setInterviewHistory([]);
  };

  const isSystemHealthy = health?.database && health?.storage && health?.auth;
  
  // Is this the very first health check on load?
  const isInitialLoad = isCheckingHealth && health === null;

  // Blocking System Configuration Screen
  if (isInitialLoad || (!isCheckingHealth && !isSystemHealthy && !isAdminRoute)) {
    return (
      <div className="min-h-screen w-screen bg-[#F8FAFC] flex items-center justify-center p-4 text-slate-900">
        <div className="bg-white max-w-md w-full p-8 rounded-2xl shadow-xl border border-slate-200">
          
          <div className="flex flex-col items-center mb-8">
            {isInitialLoad ? (
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            ) : (
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-4 border border-red-200">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            )}
            <h1 className="text-2xl font-bold text-slate-800">
              {isCheckingHealth ? "Verifying System" : "System Configuration Error"}
            </h1>
            <p className="text-slate-500 text-center mt-2 text-sm">
              {isCheckingHealth 
                ? "Connecting to Supabase services..."
                : "Unable to start platform. Critical services are unreachable."}
            </p>
          </div>

          {!isCheckingHealth && health && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between ${health.database ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <Database className={health.database ? 'text-emerald-500' : 'text-red-500'} size={20} />
                  <span className="font-medium text-sm">Database Tables</span>
                </div>
                {health.database ? <CheckCircle2 className="text-emerald-500" size={20} /> : <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-100 rounded-md">OFFLINE</span>}
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${health.storage ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <Server className={health.storage ? 'text-emerald-500' : 'text-red-500'} size={20} />
                  <span className="font-medium text-sm">Storage Buckets</span>
                </div>
                {health.storage ? <CheckCircle2 className="text-emerald-500" size={20} /> : <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-100 rounded-md">MISSING</span>}
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${health.auth ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-3">
                  <Lock className={health.auth ? 'text-emerald-500' : 'text-red-500'} size={20} />
                  <span className="font-medium text-sm">Authentication</span>
                </div>
                {health.auth ? <CheckCircle2 className="text-emerald-500" size={20} /> : <span className="text-xs font-bold text-red-600 px-2 py-1 bg-red-100 rounded-md">UNREACHABLE</span>}
              </div>

              {health.errors.length > 0 && (
                <div className="mt-6 p-4 bg-slate-900 rounded-xl overflow-hidden">
                  <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Error Logs</h3>
                  <div className="space-y-1">
                    {health.errors.map((err, i) => (
                      <p key={i} className="text-xs font-mono text-red-400 break-words">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={() => window.location.reload()}
                className="w-full mt-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Admin Route
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500/10 transition-colors duration-500">
        <AdminDashboard health={health} onLogout={() => { window.location.pathname = '/'; }} />
      </div>
    );
  }

  // Main App Flow
  return (
    <div className="min-h-[100dvh] overflow-x-hidden w-screen bg-[#F8FAFC] text-slate-900 selection:bg-indigo-500/10 transition-colors duration-500 flex flex-col">
      {flowState === 'landing' && (
        <LandingScreen onStart={handleStart} />
      )}

      {flowState === 'interview' && candidate && (
        <DynamicInterviewScreen 
          candidate={candidate} 
          onComplete={(history, proctoringReport, evalReport) => {
            console.log("Proctoring Report:", proctoringReport);
            handleInterviewComplete(history, proctoringReport, evalReport);
          }} 
        />
      )}

      {flowState === 'completed' && candidate && (
        <EndScreen 
          history={interviewHistory} 
          candidate={candidate} 
          onHome={handleReset} 
        />
      )}
    </div>
  );
}

export default App;
