
import React, { useState } from 'react';
import { Candidate, EvaluationResult } from '../types';
import { ShieldCheck, Lock, CheckCircle, LogOut, RefreshCw, AlertCircle } from 'lucide-react';

interface SummaryScreenProps {
  candidate: Candidate;
  results: EvaluationResult[];
  onRestart: (shouldLogout?: boolean) => void;
}

const Container = ({ children }: { children?: React.ReactNode }) => (
  <div className="h-full w-full flex flex-col items-center bg-slate-50 overflow-hidden relative">
    <div className="w-full h-full overflow-y-auto p-6 md:p-10 flex flex-col items-center scroll-smooth">
        {children}
    </div>
  </div>
);

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ candidate, results, onRestart }) => {
  const [isAdminMode, setIsAdminMode] = useState(false);
  
  // Recalculate display score
  const totalQuestions = results.length || 1;
  const avgContent = results.reduce((acc, r) => acc + (r.contentScore || 0), 0) / totalQuestions;
  const avgComm = results.reduce((acc, r) => acc + (r.communicationScore || 0), 0) / totalQuestions;
  const avgConf = results.reduce((acc, r) => acc + (r.confidenceScore || 50), 0) / totalQuestions;
  const overallScore = (avgContent * 10 * 0.6) + (avgComm * 10 * 0.3) + (avgConf * 0.1);

  if (!isAdminMode) {
      return (
        <Container>
            <div className="w-full max-w-2xl animate-fade-in pt-4 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4 shadow-sm">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Interview Submitted</h2>
                <p className="text-slate-600 mb-6">
                    Responses securely recorded.
                </p>
                
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md mx-auto mb-8 text-left">
                    <div className="flex items-center gap-3 mb-4 text-slate-800 font-bold border-b border-slate-100 pb-3">
                        <ShieldCheck className="text-indigo-600" size={20} />
                        <span>Submission Receipt</span>
                    </div>
                    <div className="space-y-2 text-sm text-slate-500">
                        <div className="flex justify-between">
                            <span>Candidate ID:</span>
                            <span className="font-mono text-slate-700">{candidate.accessId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Role:</span>
                            <span className="font-medium text-slate-700">{candidate.position}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Questions:</span>
                            <span className="font-mono text-slate-700">{results.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Status:</span>
                            <span className="font-mono text-emerald-600 font-bold">VERIFIED</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                    onClick={() => onRestart(false)}
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                    <RefreshCw size={18} /> New Session
                    </button>
                    
                    <button
                    onClick={() => onRestart(true)}
                    className="px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                    <LogOut size={18} /> Log Out
                    </button>
                </div>
            </div>
        </Container>
    );
  }
}