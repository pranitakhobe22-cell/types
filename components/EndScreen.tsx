import React from 'react';
import { MasterEvaluationReport, ProctoringReport } from '../types';
import { Logo } from './Logo';
import { SessionReportView } from './SessionReportView';

interface EndScreenProps {
  candidate: { name: string; email: string; role: string };
  history: { question: string; answer: string; ideal_answer: string; difficulty?: string; category?: string }[];
  evalReport?: MasterEvaluationReport | null;
  proctoringReport?: ProctoringReport | null;
  onHome: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ candidate, evalReport, proctoringReport, onHome }) => {
  if (!evalReport) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 space-y-8">
        <div className="relative">
          <div className="w-24 h-24 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Logo className="w-10 h-10" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Analyzing Your Interview</h2>
          <p className="text-slate-500 font-medium">Evaluating responses against calibration metrics...</p>
        </div>
      </div>
    );
  }

  const currentSessionId = localStorage.getItem('current_session_id') || "N/A";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24 px-6 py-10">
      <SessionReportView
        candidate={candidate}
        evalReport={evalReport}
        proctoringReport={proctoringReport}
        sessionId={currentSessionId}
        onHome={onHome}
        mode="candidate"
      />
    </div>
  );
};
