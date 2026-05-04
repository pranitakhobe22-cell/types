import React, { useEffect, useState } from 'react';
import { AIService, EvaluationReport } from '../services/aiService';
import {
  CheckCircle, AlertCircle, ArrowLeft, Trophy, Target,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Star, ThumbsUp, ThumbsDown, BarChart2, Zap
} from 'lucide-react';
import { Logo } from './Logo';

interface EndScreenProps {
  candidate: { name: string; email: string; role: string };
  history: { question: string; answer: string; ideal_answer: string }[];
  onHome: () => void;
}

const ScoreRing: React.FC<{ score: number; size?: number }> = ({ score, size = 200 }) => {
  const r = size / 2 - 16;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (circumference * score) / 100;

  const color =
    score >= 85 ? '#10b981' :
    score >= 70 ? '#6366f1' :
    score >= 50 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="transparent"
        stroke={color}
        strokeWidth="14"
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
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-sm font-black text-slate-800">{value}<span className="text-slate-300 font-normal">/{max}</span></span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

const QuestionCard: React.FC<{ item: EvaluationReport['questionBreakdown'][0]; index: number }> = ({ item, index }) => {
  const [expanded, setExpanded] = useState(false);

  const verdictConfig: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    'Excellent': { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <Star size={14} className="text-emerald-500" /> },
    'Good': { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', icon: <ThumbsUp size={14} className="text-indigo-500" /> },
    'Partial': { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <TrendingDown size={14} className="text-amber-500" /> },
    'Poor': { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', icon: <ThumbsDown size={14} className="text-rose-500" /> },
  };
  const vc = verdictConfig[item.verdict] || verdictConfig['Partial'];

  const scoreColor =
    item.score >= 8 ? 'text-emerald-600' :
    item.score >= 6 ? 'text-indigo-600' :
    item.score >= 4 ? 'text-amber-600' : 'text-rose-600';

  return (
    <div className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${vc.bg}`}>
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 shrink-0 text-sm">
            Q{index + 1}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm leading-snug mb-2">{item.question}</p>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${vc.bg} ${vc.text}`}>
              {vc.icon}
              {item.verdict}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className={`text-3xl font-black ${scoreColor}`}>{item.score}</span>
            <span className="text-slate-300 text-sm">/10</span>
          </div>
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5">
          {/* Candidate's Answer */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Answer</p>
            <div className="bg-slate-50 rounded-2xl p-4">
              <p className="text-sm text-slate-700 leading-relaxed italic">
                "{item.candidateAnswer || 'No answer recorded'}"
              </p>
            </div>
          </div>

          {/* AI Feedback */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">AI Feedback</p>
            <p className="text-sm text-slate-700 leading-relaxed">{item.feedback}</p>
          </div>

          {/* Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.keyPointsHit && item.keyPointsHit.length > 0 && (
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Points Covered
                </p>
                <ul className="space-y-1.5">
                  {item.keyPointsHit.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {item.keyPointsMissed && item.keyPointsMissed.length > 0 && (
              <div>
                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertCircle size={12} /> Points Missed
                </p>
                <ul className="space-y-1.5">
                  {item.keyPointsMissed.map((pt, i) => (
                    <li key={i} className="flex gap-2 text-xs text-slate-600">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Ideal Answer Summary */}
          {item.idealAnswerSummary && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">What a Great Answer Includes</p>
              <p className="text-sm text-indigo-800 leading-relaxed">{item.idealAnswerSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const EndScreen: React.FC<EndScreenProps> = ({ candidate, history, onHome }) => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      if (!history || history.length === 0) {
        setLoading(false);
        return;
      }
      try {
        const result = await AIService.evaluateInterview(history);
        setReport(result as EvaluationReport);
      } catch (err) {
        console.error("EndScreen: Evaluation failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [history]);

  if (loading) {
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
          <p className="text-slate-500 font-medium">Evaluating each answer against expert benchmarks...</p>
        </div>
      </div>
    );
  }

  const hiringColors: Record<string, string> = {
    'Strong Hire': 'bg-emerald-600 text-white',
    'Hire': 'bg-indigo-600 text-white',
    'Consider': 'bg-amber-500 text-white',
    'Reject': 'bg-rose-600 text-white',
  };

  const categoryColors: Record<string, string> = {
    'Excellent': 'text-emerald-600 bg-emerald-50 border-emerald-200',
    'Good': 'text-indigo-600 bg-indigo-50 border-indigo-200',
    'Average': 'text-amber-600 bg-amber-50 border-amber-200',
    'Poor': 'text-rose-600 bg-rose-50 border-rose-200',
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <div className="max-w-5xl mx-auto px-6 py-12 pb-24 space-y-12">

        {/* Header */}
        <header className="flex justify-between items-end border-b border-slate-200 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="text-emerald-500" size={20} />
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Assessment Complete</span>
            </div>
            <h1 className="text-5xl font-black tracking-tight text-slate-900">{candidate.name}</h1>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              Technical Audit — <span className="text-slate-900 font-bold">{candidate.role} Domain</span>
            </p>
          </div>
          <div className="hidden md:block">
            <Logo className="w-12 h-12 opacity-80" />
          </div>
        </header>

        {report ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* --- SECTION 1: Score Overview --- */}
            <div className="grid md:grid-cols-12 gap-8">
              {/* Score Ring */}
              <div className="md:col-span-4 bg-white border border-slate-200 rounded-[48px] p-10 flex flex-col items-center justify-center space-y-6 shadow-sm">
                <div className="relative">
                  <ScoreRing score={report.totalScore} size={200} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-black text-slate-900">{report.totalScore}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Score</span>
                  </div>
                </div>
                <div className={`px-6 py-2.5 rounded-2xl font-black text-sm border ${categoryColors[report.category] || categoryColors['Average']}`}>
                  {report.category.toUpperCase()} PERFORMANCE
                </div>
                {report.hiringRecommendation && (
                  <div className={`px-6 py-2.5 rounded-2xl font-black text-sm ${hiringColors[report.hiringRecommendation] || 'bg-slate-600 text-white'}`}>
                    {report.hiringRecommendation.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Metrics */}
              <div className="md:col-span-8 space-y-6">
                <div className="bg-white border border-slate-200 rounded-[40px] p-10 shadow-sm">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BarChart2 size={16} className="text-indigo-500" /> Performance Metrics
                  </h3>
                  <div className="space-y-5">
                    {report.detailedAnalysis?.metrics && Object.entries(report.detailedAnalysis.metrics).map(([key, value]) => (
                      <MetricBar key={key} label={key} value={value as number} />
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-5">
                      <Trophy className="text-amber-500" size={18} /> Strengths
                    </h3>
                    <ul className="space-y-3">
                      {(report.detailedAnalysis?.strengths || []).map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-5">
                      <Target className="text-rose-500" size={18} /> Improvements Needed
                    </h3>
                    <ul className="space-y-3">
                      {(report.detailedAnalysis?.failures || []).map((f, i) => (
                        <li key={i} className="flex gap-3 text-sm font-medium text-slate-600">
                          <div className="mt-1.5 w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* --- SECTION 2: Per-Question Breakdown --- */}
            {report.questionBreakdown && report.questionBreakdown.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <Zap size={20} className="text-indigo-500" />
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Question-by-Question Analysis</h2>
                </div>
                <div className="space-y-4">
                  {report.questionBreakdown.map((item, i) => (
                    <QuestionCard key={i} item={item} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* --- SECTION 3: Final Verdict --- */}
            <div className="bg-slate-900 rounded-[40px] p-10 text-white shadow-2xl">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Strategic Verdict</h3>
              <p className="text-xl font-medium leading-relaxed italic text-white/90 mb-6">
                "{report.finalVerdict}"
              </p>
              {report.verdictJustification && (
                <p className="text-sm text-slate-400 leading-relaxed border-t border-white/10 pt-6">
                  {report.verdictJustification}
                </p>
              )}
              <div className="mt-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-sm">AI</div>
                  <div>
                    <p className="text-xs font-bold text-white">REINCREW ENGINE</p>
                    <p className="text-[10px] text-white/40">Verified Analysis Protocol</p>
                  </div>
                </div>
                <button
                  onClick={onHome}
                  className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-100 transition-all"
                >
                  <ArrowLeft size={18} />
                  Exit Dashboard
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-[40px] p-20 text-center space-y-6 shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-50 rounded-full mb-4">
              <AlertCircle className="text-rose-500" size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Analysis Incomplete</h2>
            <p className="text-slate-500 max-w-lg mx-auto text-lg">
              We encountered a technical issue while processing your interview audit.
              This can happen if the AI engine is under high load or if connectivity was interrupted.
            </p>
            <div className="pt-8">
              <button
                onClick={() => window.location.reload()}
                className="px-12 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
              >
                Retry Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
