import React, { useState } from 'react';
import { MasterEvaluationReport, ProctoringReport } from '../types';
import {
  CheckCircle, AlertCircle, ArrowLeft, Trophy, Target,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Star, ThumbsUp, ThumbsDown, BarChart2,
  ShieldAlert, AlertTriangle, Shield, Brain, MessageSquare, Scale, HelpCircle, Activity, Info
} from 'lucide-react';
import { Logo } from './Logo';

interface SessionReportViewProps {
  candidate: { name: string; email: string; role: string };
  evalReport: MasterEvaluationReport;
  proctoringReport?: ProctoringReport | null;
  sessionId?: string | null;
  onHome?: () => void;
  mode?: 'admin' | 'candidate';
}

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 160 }) => {
  const r = size / 2 - 12;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * score) / 100;

  const color =
    score >= 85 ? '#10b981' :
    score >= 70 ? '#6366f1' :
    score >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="transparent"
        stroke={color}
        strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
};

const MetricBar: React.FC<{ label: string; value: number; max?: number }> = ({ label, value, max = 10 }) => {
  const pct = (value / max) * 100;
  const color =
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-indigo-500' :
    pct >= 40 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-black text-slate-800">{value}<span className="text-slate-300 font-normal">/{max}</span></span>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{ item: MasterEvaluationReport['questionBreakdown'][0]; index: number }> = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);

  const scoreText = item.evaluationError ? 'Error' : `${item.score}`;
  const scoreColor =
    scoreText === 'Error' ? 'text-rose-600 font-bold' :
    item.score >= 8 ? 'text-emerald-600' :
    item.score >= 6 ? 'text-indigo-600' :
    item.score >= 4 ? 'text-amber-600' : 'text-rose-600';

  const hasError = !!item.evaluationError;

  return (
    <div className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${
      hasError ? 'border-rose-200 bg-rose-50/10' : ''
    } ${expanded ? 'ring-2 ring-indigo-500/10' : ''}`}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shrink-0 text-xs ${
            hasError ? 'bg-rose-500' : 'bg-slate-900'
          }`}>
            Q{index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                item.difficulty === 'hard' ? 'bg-red-50 text-red-600 border border-red-100' :
                item.difficulty === 'medium' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                'bg-slate-50 text-slate-600 border border-slate-100'
              }`}>
                {item.difficulty}
              </span>
              {hasError ? (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase">
                  <AlertTriangle size={10} /> Eval Error
                </div>
              ) : (
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  item.transcriptionQualityScore >= 80 ? 'bg-emerald-50 text-emerald-600' :
                  item.transcriptionQualityScore >= 50 ? 'bg-amber-50 text-amber-600' :
                  'bg-rose-50 text-rose-600'
                }`}>
                  {item.transcriptionQualityScore}% confidence
                </div>
              )}
            </div>
            <p className="font-bold text-slate-800 text-sm leading-snug">{item.questionText}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className={`text-2xl font-black ${scoreColor}`}>{scoreText}</span>
            {scoreText !== 'Error' && <span className="text-slate-300 text-xs">/10</span>}
          </div>
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5 bg-slate-50/50">
          {/* Candidate's Answer */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Candidate Response</p>
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{item.userAnswer || 'No answer recorded'}"
              </p>
            </div>
          </div>

          {hasError ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex gap-3 items-start text-sm">
              <AlertTriangle className="shrink-0 mt-0.5 text-rose-600" size={16} />
              <div>
                <p className="font-bold">AI Evaluation Failed</p>
                <p className="text-xs text-rose-700 leading-relaxed mt-1">This question could not be evaluated by the AI due to the following error:</p>
                <code className="block bg-rose-100 p-2 rounded mt-2 font-mono text-[10px] break-words text-rose-900 border border-rose-200">
                  {item.evaluationError}
                </code>
              </div>
            </div>
          ) : (
            <>
              {/* AI Feedback */}
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Evaluation Feedback</p>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">{item.feedback}</p>
              </div>

              {/* Technical Errors */}
              {item.technicalErrors && item.technicalErrors.length > 0 && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 space-y-2">
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={14} /> Fact Mismatches & Technical Errors
                  </p>
                  <div className="space-y-1.5">
                    {item.technicalErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-rose-800">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          err.severity === 'high' ? 'bg-red-200 text-red-800' :
                          err.severity === 'medium' ? 'bg-orange-200 text-orange-800' :
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {err.severity}
                        </span>
                        <p className="leading-relaxed">{err.error}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {item.matchedKeyPoints && item.matchedKeyPoints.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle size={12} /> Key Concepts Covered
                    </p>
                    <ul className="space-y-1.5">
                      {item.matchedKeyPoints.map((pt, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-600 font-medium">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {item.missingKeyPoints && item.missingKeyPoints.length > 0 && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle size={12} /> Key Concepts Missed
                    </p>
                    <ul className="space-y-1.5">
                      {item.missingKeyPoints.map((pt, i) => (
                        <li key={i} className="flex gap-2 text-xs text-slate-600 font-medium">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Sub-Metrics */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Dimension Scores</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricBar label="Coverage" value={item.analysis?.coverage ?? 5} />
                  <MetricBar label="Understanding" value={item.analysis?.understanding ?? 5} />
                  <MetricBar label="Reasoning" value={item.analysis?.reasoning ?? 5} />
                  <MetricBar label="Communication" value={item.analysis?.communication ?? 5} />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export const SessionReportView: React.FC<SessionReportViewProps> = ({
  candidate,
  evalReport,
  sessionId,
  onHome,
  mode = 'candidate'
}) => {
  const report = evalReport;  const hiringColors: Record<string, string> = {
    'Strong Hire': 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Hire': 'bg-indigo-50 text-indigo-700 border-indigo-200',
    'Consider': 'bg-amber-50 text-amber-700 border-amber-200',
    'Reject': 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const integrityScore = report.proctoringSummary?.integrityScore ?? 100;
  const isInsufficientEvidence = report.executiveSummary?.recommendationStatus === 'insufficient_evidence';

  // Stability assessment
  const stability = report.executiveSummary?.knowledgeStability ?? 100;
  let stabilityDescription = "Consistent high performance across all evaluated topics, indicating stable core knowledge.";
  if (stability < 65) {
    stabilityDescription = "High score variance (knowledge cliffs detected). The candidate showed strong understanding in certain questions but struggled significantly in others, indicating unstable domain familiarity.";
  } else if (stability < 85) {
    stabilityDescription = "Moderate score variance. The candidate performed well on some topics but showed minor gaps on others.";
  }

  return (
    <div className="w-full text-slate-900 font-sans animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Recruiter Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-indigo-600" size={16} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Interview Report</span>
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">{candidate.name}</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Applied Role: <span className="text-slate-900 font-bold">{candidate.role} Branch</span> | Session ID: <span className="font-mono text-slate-700 text-xs">{sessionId || "N/A"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Version</p>
              <p className="text-xs font-mono font-bold text-slate-700">v11.0 / Cost: ${report.telemetry?.sessionApiCostEstimate ?? "0.02"}</p>
            </div>
            <Logo className="w-10 h-10 opacity-70" />
          </div>
        </header>

        {/* 1. Candidate Question-by-Question Proof Cards */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare size={24} className="text-indigo-600" /> Detailed Question Evaluation
            </h2>
            <p className="text-sm text-slate-500 mt-1">Detailed analysis of candidate responses and technical scores.</p>
          </div>

          <div className="space-y-4">
            {report.questionBreakdown && report.questionBreakdown.length > 0 ? (
              report.questionBreakdown.map((item, idx) => (
                <QuestionCard key={idx} item={item} index={idx} />
              ))
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">No question breakdown available.</p>
            )}
          </div>
        </section>

        {/* 2. Integrity Verification & Gaze Summary */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert size={20} className="text-rose-500" /> Integrity Verification & Gaze Summary
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Session Integrity Score:</span>
              <span className={`px-3 py-1 rounded-xl text-xs font-black border ${
                integrityScore >= 90 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                integrityScore >= 70 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {integrityScore}% Integrity
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tab Switches</span>
              <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.tabSwitches ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Camera Away</span>
              <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.faceAwayEvents ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Multiple Person</span>
              <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.multiplePersonEvents ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Warnings Issued</span>
              <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.warningsIssued ?? 0}</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gaze Deviations</span>
              <span className="text-xl font-black text-slate-700 mt-1 block">
                {report.proctoringSummary?.gazeAwayEvents ?? report.proctoringSummary?.faceAwayEvents ?? 0}
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Gaze Away Time</span>
              <span className="text-xl font-black text-slate-700 mt-1 block">
                {report.proctoringSummary?.totalGazeAwayDurationMs !== undefined 
                  ? `${(report.proctoringSummary.totalGazeAwayDurationMs / 1000).toFixed(1)}s` 
                  : "0.0s"}
              </span>
            </div>
          </div>
        </section>

        {/* 3. Strengths & Improvement Areas */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Brain size={20} className="text-indigo-600" /> Strengths & Improvement Areas
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              report.executiveSummary?.reportConfidence === 'High' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              report.executiveSummary?.reportConfidence === 'Medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {report.executiveSummary?.reportConfidence ?? 'High'} Confidence
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Key Strengths */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="text-emerald-500" size={16} /> Key Strengths
              </h4>
              <div className="space-y-2">
                {report.strengths && report.strengths.length > 0 ? (
                  report.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/50">
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{str}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No key strengths identified.</p>
                )}
              </div>
            </div>

            {/* Key Areas for Growth / Weaknesses */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Target className="text-rose-500" size={16} /> Gaps & Improvement Areas
              </h4>
              <div className="space-y-2">
                {report.weaknesses && report.weaknesses.length > 0 ? (
                  report.weaknesses.map((weak, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-rose-50/30 p-3 rounded-2xl border border-rose-100/50">
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{weak}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No significant technical gaps identified.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. Recruiter Evaluation & Verdict (Redesigned Light Theme, at the end) */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                <Shield size={12} /> Recruiter Decision Summary
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Recruiter Evaluation & Final Verdict</h2>
              <p className="text-sm text-slate-500">
                Overall score is computed based on difficulty-weighted performance adjusted for session integrity, not a simple average.
              </p>
            </div>
            
            {/* Final Score Circle */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-3xl border border-slate-200/60 shadow-sm shrink-0">
              <div className="relative flex items-center justify-center">
                <ScoreRing score={report.overallScores?.trustAdjustedScore ?? 0} size={80} />
                <div className="absolute text-center">
                  <span className="text-sm font-black text-slate-800">{report.overallScores?.trustAdjustedScore ?? 0}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Score</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${hiringColors[report.executiveSummary?.recommendation ?? 'Consider']}`}>
                  {report.executiveSummary?.recommendation ?? 'Consider'}
                </span>
              </div>
            </div>
          </div>

          {/* Verdict Rationale */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Verdict Rationale</h3>
            <p className="text-slate-700 text-sm leading-relaxed font-medium italic">
              "{report.executiveSummary?.summary || 'No summary evaluation available.'}"
            </p>
          </div>

          {/* Evaluated Whole Scores */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Knowledge Score</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.knowledgeScore ?? 0)}<span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logical Reasoning</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.reasoningScore ?? 0)}<span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spoken Communication</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.communicationScore ?? 0)}<span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consistency Score</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.consistencyScore ?? 0)}<span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Integrity</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(integrityScore)}<span className="text-xs text-slate-400 font-normal">/100</span>
              </span>
            </div>
          </div>
        </section>

        {/* Action Button Footer */}
        {mode === 'candidate' && onHome && (
          <footer className="flex justify-between items-center bg-slate-900 text-white rounded-[32px] p-8 shadow-xl mt-12">
            <div>
              <h4 className="text-sm font-bold">Unified Recruiter Report Compiled</h4>
              <p className="text-[10px] text-slate-400 mt-1">Full master evaluation record saved to db.evaluation_logic</p>
            </div>
            <button
              type="button"
              onClick={onHome}
              className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={16} /> Return to Home
            </button>
          </footer>
        )}

      </div>
    </div>
  );
};
