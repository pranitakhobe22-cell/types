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

  const verdict = item.score >= 8 ? 'Excellent' : item.score >= 6 ? 'Good' : item.score >= 4 ? 'Borderline' : 'Fail';

  const verdictConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Excellent': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <Star size={14} className="text-emerald-500" /> },
    'Good': { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', icon: <ThumbsUp size={14} className="text-indigo-500" /> },
    'Borderline': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <TrendingDown size={14} className="text-amber-500" /> },
    'Fail': { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: <ThumbsDown size={14} className="text-rose-500" /> },
  };
  const vc = verdictConfig[verdict] || verdictConfig['Borderline'];

  const scoreColor =
    item.score >= 8 ? 'text-emerald-600' :
    item.score >= 6 ? 'text-indigo-600' :
    item.score >= 4 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${expanded ? 'ring-2 ring-indigo-500/10' : ''}`}>
      {/* Header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center font-black text-white shrink-0 text-xs">
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
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                item.transcriptionQualityScore >= 80 ? 'bg-emerald-50 text-emerald-600' :
                item.transcriptionQualityScore >= 50 ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
              }`}>
                {item.transcriptionQualityScore}% confidence
              </div>
            </div>
            <p className="font-bold text-slate-800 text-sm leading-snug">{item.questionText}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className={`text-2xl font-black ${scoreColor}`}>{item.score}</span>
            <span className="text-slate-300 text-xs">/10</span>
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
  const report = evalReport;

  const hiringColors: Record<string, string> = {
    'Strong Hire': 'bg-emerald-600 text-white shadow-emerald-100/50 border border-emerald-400',
    'Hire': 'bg-indigo-600 text-white shadow-indigo-100/50 border border-indigo-400',
    'Consider': 'bg-amber-500 text-white shadow-amber-100/50 border border-amber-400',
    'Reject': 'bg-rose-600 text-white shadow-rose-100/50 border border-rose-400',
  };

  const integrityScore = report.proctoringSummary?.integrityScore ?? 100;
  const isInsufficientEvidence = report.executiveSummary?.recommendationStatus === 'insufficient_evidence';

  // Section 5 Stability assessment
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
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unified Recruiter Decision Report</span>
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

        {/* SECTION 1 & SECTION 2: Executive Summary & Overall Score Matrix */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Section 1: Executive Summary */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Brain size={14} className="text-indigo-500" /> Section 1: Executive Summary
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                  report.executiveSummary?.reportConfidence === 'High' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  report.executiveSummary?.reportConfidence === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {report.executiveSummary?.reportConfidence ?? 'High'} Confidence
                </span>
              </div>

              {isInsufficientEvidence ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start text-amber-800 text-sm">
                  <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                  <div>
                    <p className="font-bold">Recommendation Status: Insufficient Evidence</p>
                    <p className="text-xs text-amber-700 leading-relaxed mt-0.5">The evaluator completed with low confidence due to very brief responses and coverage under 50%. Proceed with caution.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider ${hiringColors[report.executiveSummary?.recommendation ?? 'Consider']}`}>
                      {report.executiveSummary?.recommendation ?? 'Consider'}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">
                      {report.executiveSummary?.recommendation === 'Strong Hire' && 'Highly Recommended Candidate'}
                      {report.executiveSummary?.recommendation === 'Hire' && 'Recommended for Next Stages'}
                      {report.executiveSummary?.recommendation === 'Consider' && 'Requires Panel Discussion'}
                      {report.executiveSummary?.recommendation === 'Reject' && 'Does Not Meet Technical Thresholds'}
                    </span>
                  </div>
                </div>
              )}

              <p className="text-slate-600 text-sm font-medium leading-relaxed italic bg-slate-50 p-4 rounded-2xl border border-slate-100">
                "{report.executiveSummary?.summary || 'No summary evaluation available.'}"
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 border-t border-slate-100 pt-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tech Score</p>
                <p className="text-2xl font-black text-slate-800">{report.executiveSummary?.technicalScore ?? 0}<span className="text-xs text-slate-400">/100</span></p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trust Score</p>
                <p className="text-2xl font-black text-slate-800">{report.executiveSummary?.trustScore ?? 0}<span className="text-xs text-slate-400">/100</span></p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Topic Coverage</p>
                <p className="text-2xl font-black text-slate-800">{report.executiveSummary?.topicCoverage ?? 0}%</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stability</p>
                <p className="text-2xl font-black text-slate-800">{report.executiveSummary?.knowledgeStability ?? 0}%</p>
              </div>
            </div>
          </div>

          {/* Section 2: Overall Score Matrix */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <BarChart2 size={14} className="text-indigo-500" /> Section 2: Overall Score Matrix
              </h3>
              
              {/* Highlighted Overall Score Card */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 mb-6 flex items-center justify-between gap-4 shadow-sm">
                <div className="space-y-1 flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Trust-Adjusted Final Score</p>
                  <p className="text-3xl font-black text-slate-900">
                    {report.overallScores?.trustAdjustedScore ?? 0}%
                  </p>
                  <p className="text-[10px] font-bold text-slate-500 leading-tight">
                    {report.overallScores?.trustAdjustedScore >= 85 ? 'Strong recommendation to hire' :
                     report.overallScores?.trustAdjustedScore >= 70 ? 'Recommended for hire' :
                     report.overallScores?.trustAdjustedScore >= 50 ? 'Requires panel review' : 'Under technical threshold'}
                  </p>
                </div>
                <div className="relative flex items-center justify-center shrink-0">
                  <ScoreRing score={report.overallScores?.trustAdjustedScore ?? 0} size={80} />
                  <div className="absolute text-center">
                    <span className="text-xs font-black text-slate-800">{report.overallScores?.trustAdjustedScore ?? 0}%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Knowledge Performance</span>
                  <span className="text-sm font-black text-slate-800">{report.overallScores?.knowledgeScore ?? 0}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Logical Reasoning</span>
                  <span className="text-sm font-black text-slate-800">{report.overallScores?.reasoningScore ?? 0}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Spoken Communication</span>
                  <span className="text-sm font-black text-slate-800">{report.overallScores?.communicationScore ?? 0}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Consistency Score</span>
                  <span className="text-sm font-black text-slate-800">{report.overallScores?.consistencyScore ?? 0}%</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                  <span className="text-xs text-slate-500 font-medium">Difficulty-Weighted Score</span>
                  <span className="text-sm font-black text-slate-800">{report.overallScores?.difficultyWeightedPerformance ?? 0}%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between mt-6">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-indigo-500" />
                <span className="text-xs font-bold text-slate-600">Benchmark Percentile:</span>
              </div>
              <span className="text-sm font-black text-indigo-600">{report.benchmarkComparison?.percentile ?? 50}th Percentile</span>
            </div>
          </div>
        </div>

        {/* SECTION 3 & SECTION 4: Strengths & Weaknesses */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Section 3: Strengths */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Trophy size={14} className="text-emerald-500" /> Section 3: Strengths
            </h3>
            <div className="space-y-3">
              {report.strengths && report.strengths.length > 0 ? (
                report.strengths.map((str, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-emerald-50/30 p-3 rounded-2xl border border-emerald-100/50">
                    <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm font-semibold text-slate-700">{str}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs font-medium text-slate-400 italic">No explicit key strengths identified.</p>
              )}
            </div>
          </div>

          {/* Section 4: Weaknesses */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Target size={14} className="text-rose-500" /> Section 4: Weaknesses & Gaps
            </h3>
            <div className="space-y-3">
              {report.weaknesses && report.weaknesses.length > 0 ? (
                report.weaknesses.map((weak, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-rose-50/30 p-3 rounded-2xl border border-rose-100/50">
                    <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={16} />
                    <p className="text-sm font-semibold text-slate-700">{weak}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs font-medium text-slate-400 italic">No significant technical gaps identified.</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 5 & SECTION 6: Subject Matter Adaptability & Depth & Real-time Problem Solving */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Section 5: Subject Matter Adaptability & Depth */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Scale size={14} className="text-indigo-500" /> Section 5: Subject Matter Adaptability & Depth
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-indigo-50 border border-indigo-100 p-4 rounded-2xl shrink-0 w-24">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Mastery %</p>
                    <p className="text-2xl font-black text-indigo-600">{report.executiveSummary?.knowledgeStability ?? 100}%</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Domain Performance Stability</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{stabilityDescription}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Recruiter Benefit:</span>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">Identifies if the candidate has standard knowledge consistency across fundamental vs scenario questions, highlighting domain gaps.</p>
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Candidate Benefit:</span>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">Demonstrates your ability to maintain consistent reasoning quality under varying difficulty levels.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-6 flex items-start gap-2.5">
              <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-normal">Adaptability measures consistency in logic when moving from easy technical terms to hard scenario-based prompts.</p>
            </div>
          </div>

          {/* Section 6: Real-time Problem Solving & Conceptual Integrity */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <HelpCircle size={14} className="text-indigo-500" /> Section 6: Real-time Problem Solving & Conceptual Integrity
            </h3>

            <div className="mb-4 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[10px] leading-relaxed text-slate-500">
                <span className="font-bold text-slate-700">Recruiter Benefit:</span> Detects rote learning vs deep comprehension by probing on initial high scores.
              </div>
              <div className="text-[10px] leading-relaxed text-slate-500">
                <span className="font-bold text-slate-700">Candidate Benefit:</span> Allows you to elaborate and clarify your core knowledge, reducing initial penalties.
              </div>
            </div>

            {report.validationResults && report.validationResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">Core Technical Topic</th>
                      <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Initial Assessment</th>
                      <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-center">Depth Probe Response</th>
                      <th className="py-2 text-[10px] font-black text-slate-400 uppercase tracking-wider text-right">Validation Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.validationResults.map((val, idx) => (
                      <tr key={idx} className="border-b border-slate-50 text-xs">
                        <td className="py-3 font-semibold text-slate-700 max-w-[200px] truncate" title={val.parentQuestion}>
                          {val.parentQuestion}
                        </td>
                        <td className="py-3 text-center font-bold text-slate-800">{val.parentScore}%</td>
                        <td className="py-3 text-center font-bold text-slate-800">{val.followupScore}%</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded font-black ${
                            val.reliability >= 80 ? 'bg-emerald-50 text-emerald-700' :
                            val.reliability >= 50 ? 'bg-amber-50 text-amber-700' :
                            'bg-rose-50 text-rose-700'
                          }`}>
                            {val.reliability}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <Info className="text-slate-400 mb-2" size={20} />
                <p className="text-xs text-slate-500 font-medium">No validation trials triggered. (Trials are automatically triggered when initial technical question scores exceed 8.0).</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 7 & SECTION 8: Logical Reasoning & Technical Consistency */}
        <div className="grid md:grid-cols-12 gap-6">
          {/* Section 7: Logical Reasoning & Technical Consistency */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
              <AlertTriangle size={14} className="text-rose-500" /> Section 7: Logical Reasoning & Technical Consistency
            </h3>

            <div className="mb-4 space-y-1 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              <div className="text-[10px] leading-relaxed text-slate-500">
                <span className="font-bold text-slate-700">Recruiter Benefit:</span> Ensures candidates explain tech stacks with logical rigor, flagging guesses or contradictions.
              </div>
              <div className="text-[10px] leading-relaxed text-slate-500">
                <span className="font-bold text-slate-700">Candidate Benefit:</span> Highlights conceptual areas where you may need to align your technical understanding.
              </div>
            </div>

            {report.contradictions && report.contradictions.length > 0 ? (
              <div className="space-y-3">
                {report.contradictions.map((c, idx) => (
                  <div key={idx} className={`p-4 rounded-2xl border flex gap-3 items-start ${
                    c.status === 'confirmed' ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-amber-50 border-amber-100 text-amber-900'
                  }`}>
                    <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase">Alignment Check: Question {c.qIndex1} vs Question {c.qIndex2}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          c.status === 'confirmed' ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed">{c.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50 text-emerald-800 text-xs">
                <CheckCircle className="text-emerald-500 shrink-0" size={16} />
                <p className="font-semibold">No conceptual logical contradictions detected. The candidate demonstrated a coherent mental model.</p>
              </div>
            )}
          </div>

          {/* Section 8: Performance Timeline */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-5">
                <Activity size={14} className="text-indigo-500" /> Section 8: Performance Timeline
              </h3>

              <div className="flex items-end justify-between h-28 px-4 border-b border-slate-100 pb-2">
                {report.performanceTrend?.timeline ? (
                  report.performanceTrend.timeline.map((point, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                      <span className="text-[10px] font-bold text-slate-400">{point.score}%</span>
                      <div 
                        className={`w-6 rounded-t transition-all duration-1000 ${
                          point.score >= 80 ? 'bg-emerald-500' :
                          point.score >= 60 ? 'bg-indigo-500' :
                          point.score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                        }`}
                        style={{ height: `${point.score * 0.6}px` }}
                      />
                      <span className="text-[10px] font-black text-slate-400">Q{point.qIndex}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-300 text-xs text-center w-full pb-8 italic">No timeline data</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-bold text-slate-600">Performance Trend:</span>
              <div className="flex items-center gap-1">
                {report.performanceTrend?.trend === 'improving' && (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <TrendingUp size={14} /> Improving
                  </span>
                )}
                {report.performanceTrend?.trend === 'declining' && (
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                    <TrendingDown size={14} /> Declining
                  </span>
                )}
                {report.performanceTrend?.trend === 'stable' && (
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                    <Info size={14} /> Stable Performance
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 9: Proctoring & Integrity Summary */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <ShieldAlert size={14} className="text-rose-500" /> Section 9: Integrity Verification & Gaze Summary
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
            
            {/* Eye Tracking Additions */}
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

        {/* SECTION 10: Question-by-Question Deep Dive (Candidate Evidence Cards) */}
        <section className="space-y-6">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare size={14} className="text-indigo-500" /> Section 10: Candidate Question-by-Question Proof Cards
          </h3>

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
