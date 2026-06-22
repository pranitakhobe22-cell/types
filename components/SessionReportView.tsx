import React, { useState } from 'react';
import { MasterEvaluationReport, ProctoringReport } from '../types';
import {
  CheckCircle, AlertCircle, ArrowLeft, Trophy, Target,
  TrendingUp, TrendingDown, ChevronDown, ChevronUp,
  Star, ThumbsUp, ThumbsDown, BarChart2,
  ShieldAlert, AlertTriangle, Shield, Brain, MessageSquare, Scale, HelpCircle, Activity, Info, Check
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

const getPerformanceDetails = (score: number) => {
  if (score >= 9.0) return { label: 'Excellent', color: 'bg-purple-50 text-purple-700 border-purple-200' };
  if (score >= 8.0) return { label: 'Strong', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 6.0) return { label: 'Competent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
  if (score >= 4.0) return { label: 'Developing', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (score >= 2.0) return { label: 'Early Understanding', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Not Demonstrated', color: 'bg-rose-50 text-rose-700 border-rose-200' };
};

const renderStars = (score: number) => {
  const filled = Math.min(5, Math.max(0, Math.round(score / 2)));
  return (
    <span className="text-indigo-600 tracking-wider">
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  );
};

const QuestionCard: React.FC<{ item: MasterEvaluationReport['questionBreakdown'][0]; index: number; mode?: 'admin' | 'candidate' }> = ({ item, index, mode = 'candidate' }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (item.options && item.options.length > 0) {
    const isCorrect = item.userAnswer?.trim().toUpperCase() === item.correctAnswer?.trim().toUpperCase() || (item.score === 10);
    const isUnattempted = !item.userAnswer || item.userAnswer === 'Unattempted' || item.userAnswer === 'NONE';
    const statusColor = isCorrect 
      ? 'text-emerald-600' 
      : (isUnattempted ? 'text-amber-500' : 'text-rose-600');
    const statusText = isCorrect 
      ? 'Correct' 
      : (isUnattempted ? 'Unattempted' : 'Incorrect');

    return (
      <div className={`bg-white border rounded-3xl overflow-hidden shadow-sm transition-all duration-300 ${
        expanded ? 'ring-2 ring-indigo-500/10' : ''
      }`}>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-6 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white shrink-0 text-xs bg-slate-900`}>
              Q{index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase border border-indigo-100">
                  {item.difficulty || 'medium'}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  isCorrect ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                  isUnattempted ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                  'bg-rose-50 text-rose-700 border border-rose-100'
                }`}>
                  {statusText}
                </span>
                {item.timeSpentSeconds !== undefined && (
                  <span className="text-slate-400 text-[10px] font-semibold">
                    Time spent: {item.timeSpentSeconds}s
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-800 text-sm leading-snug">{item.questionText}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className={`text-xl font-black ${statusColor}`}>
                {isCorrect ? '10' : '0'}
              </span>
              <span className="text-slate-350 text-xs font-bold">/10</span>
            </div>
            {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
          </div>
        </button>

        {expanded && (
          <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5 bg-slate-50/50">
            {item.imageUrl && (
              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 flex justify-center bg-slate-50 p-2">
                <img src={item.imageUrl} alt="Question Diagram" className="object-contain max-h-56" />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {item.options.map((opt, oIdx) => {
                const optKey = String.fromCharCode(65 + oIdx);
                const isSelected = item.userAnswer === optKey;
                const isCorrectOpt = item.correctAnswer === optKey;

                let cardStyle = 'border-slate-100 bg-white text-slate-700';
                let iconEl = null;

                if (isSelected) {
                  if (isCorrectOpt) {
                    cardStyle = 'border-emerald-500 bg-emerald-50/40 text-emerald-800 font-bold';
                    iconEl = <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white"><Check size={12} strokeWidth={3} /></div>;
                  } else {
                    cardStyle = 'border-rose-500 bg-rose-50/40 text-rose-800 font-bold';
                    iconEl = <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold">X</div>;
                  }
                } else if (isCorrectOpt) {
                  cardStyle = 'border-emerald-500 bg-emerald-50/30 text-emerald-800 font-semibold';
                  iconEl = <div className="w-5 h-5 rounded-full bg-emerald-500/50 flex items-center justify-center text-white"><Check size={12} strokeWidth={3} /></div>;
                }

                return (
                  <div key={oIdx} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${cardStyle}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                        isSelected 
                          ? (isCorrectOpt ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
                          : (isCorrectOpt ? 'bg-emerald-500/30 text-emerald-700' : 'bg-slate-100 text-slate-500')
                      }`}>
                        {optKey}
                      </div>
                      <span className="text-xs">{opt}</span>
                    </div>
                    {iconEl}
                  </div>
                );
              })}
            </div>

            {item.explanation && (
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Info size={12} /> Solution Explanation
                </span>
                <p className="text-slate-650 text-xs leading-relaxed font-semibold">
                  {item.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const scoreText = item.evaluationError ? 'Error' : `${item.score}`;
  const scoreColor =
    scoreText === 'Error' ? 'text-rose-600 font-bold' :
    item.score >= 8 ? 'text-emerald-600' :
    item.score >= 6 ? 'text-indigo-600' :
    item.score >= 4 ? 'text-amber-600' : 'text-rose-600';

  const hasError = !!item.evaluationError;
  const performance = getPerformanceDetails(item.score);

  // Sub-metrics base values
  const knowledgeScoreVal = item.knowledgeScore ?? item.analysis?.understanding ?? 0;
  const problemSolvingScoreVal = item.problemSolvingScore ?? item.analysis?.reasoning ?? 0;
  const communicationScoreVal = item.analysis?.communication ?? 0;
  const confidenceGapVal = item.confidenceGap ?? 0;

  // Extract raw details
  const rawContent = 0.60 * knowledgeScoreVal + 0.40 * problemSolvingScoreVal;
  const diff = item.score - rawContent;
  const evidenceBonus = diff > 0 ? Math.round(diff * 10) / 10 : 0;
  const errorPenalty = diff < 0 ? Math.round(Math.abs(diff) * 10) / 10 : 0;

  const kStars = Math.min(5, Math.max(0, Math.round(knowledgeScoreVal / 2)));
  const pStars = Math.min(5, Math.max(0, Math.round(problemSolvingScoreVal / 2)));
  const cStars = Math.min(5, Math.max(0, Math.round(communicationScoreVal / 2)));

  const kLabels = ["Very Limited", "Limited", "Basic", "Competent", "Strong", "Excellent"];
  const pLabels = ["Not Assessed", "Limited", "Basic", "Competent", "Strong", "Excellent"];
  const cLabels = ["Minimal", "Basic", "Clear", "Effective", "Strong", "Excellent"];

  const kLabel = kLabels[kStars];
  const pLabel = pLabels[pStars];
  const cLabel = cLabels[cStars];

  let confidenceStatus = "Honest Self-Assessment";
  let confidenceGuidance = "Your confidence matched your demonstrated knowledge.";
  if (confidenceGapVal > 2) {
    confidenceStatus = "Possible Overconfidence";
    confidenceGuidance = "You sounded very confident, but your explanation contained several technical gaps.";
  } else if (confidenceGapVal < -2) {
    confidenceStatus = "Underconfident";
    confidenceGuidance = "Your answer demonstrated stronger understanding than your delivery suggested.";
  }

  // Gaps and What went well logic
  const userAnswerLower = (item.userAnswer || '').toLowerCase();
  const isHonestNo = userAnswerLower.includes("don't know") || 
                     userAnswerLower.includes("do not know") || 
                     userAnswerLower.includes("unfamiliar") || 
                     userAnswerLower.includes("haven't went") ||
                     userAnswerLower.includes("not sure") ||
                     userAnswerLower.includes("no idea");

  const whatWentWell: string[] = [];
  if (item.score <= 2 && isHonestNo) {
    whatWentWell.push("You answered honestly instead of guessing.");
  } else if (item.matchedKeyPoints && item.matchedKeyPoints.length > 0) {
    item.matchedKeyPoints.slice(0, 2).forEach(pt => {
      whatWentWell.push(`You correctly explained: ${pt}`);
    });
  } else {
    whatWentWell.push("You attempted the question and kept communication open.");
  }

  const whyScoreLow: string[] = [];
  if (item.score <= 2 && isHonestNo) {
    whyScoreLow.push("No explanation of the concept was provided.");
    whyScoreLow.push("Core concepts were not discussed.");
    whyScoreLow.push("No examples or reasoning were given.");
  } else {
    if (item.missingKeyPoints && item.missingKeyPoints.length > 0) {
      item.missingKeyPoints.slice(0, 2).forEach(pt => {
        whyScoreLow.push(`Missing explanation of: ${pt}`);
      });
    }
    if (item.technicalErrors && item.technicalErrors.length > 0) {
      whyScoreLow.push("Your answer contained technical inaccuracies.");
    }
    if (whyScoreLow.length === 0 && item.score < 8) {
      whyScoreLow.push("Lacks sufficient depth or practical trade-off analysis.");
    }
  }

  const improvements: string[] = [];
  if (item.missingKeyPoints && item.missingKeyPoints.length > 0) {
    item.missingKeyPoints.slice(0, 3).forEach(pt => {
      improvements.push(`Explain that: ${pt}`);
    });
  } else {
    improvements.push("Elaborate on real-world edge cases and tradeoffs.");
    improvements.push("Incorporate concrete examples from your previous projects.");
  }

  let estimatedScoreRange = "8-9 / 10";
  if (item.score <= 2) {
    estimatedScoreRange = "6-7 / 10";
  } else if (item.score <= 5) {
    estimatedScoreRange = "7-8 / 10";
  } else if (item.score <= 8) {
    estimatedScoreRange = "8-9 / 10";
  } else {
    estimatedScoreRange = "9-10 / 10";
  }

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
            {scoreText !== 'Error' && <span className="text-slate-350 text-xs font-bold">/10</span>}
          </div>
          {expanded ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5 bg-slate-50/50">
          
          {/* 1. Score Explanation (Advanced) - placed right under the marks header */}
          {!hasError && (
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Calculation Details</span>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors outline-none"
                >
                  {showAdvanced ? 'Hide Explanation' : 'Show Score Explanation'}
                </button>
              </div>
              {showAdvanced && (
                <div className="mt-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 font-mono text-[11px] text-slate-650 space-y-2">
                  <p className="font-bold text-[10px] text-slate-500 uppercase tracking-wider">How it was calculated:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600">
                    <div>Knowledge Score: <span className="font-bold">{knowledgeScoreVal.toFixed(1)}</span></div>
                    <div>Problem Solving Score: <span className="font-bold">{problemSolvingScoreVal.toFixed(1)}</span></div>
                    <div>Communication Score: <span className="font-bold">{communicationScoreVal.toFixed(1)}</span></div>
                  </div>
                  <div className="border-t border-slate-200/80 my-2 pt-2 space-y-1 text-slate-600">
                    <div>Raw Content Score (60% Knowledge + 40% Problem Solving): <span className="font-bold">{rawContent.toFixed(1)}</span></div>
                    <div>Evidence Bonus: <span className="text-emerald-600 font-bold">+{evidenceBonus.toFixed(1)}</span></div>
                    <div>Error Penalty: <span className="text-rose-600 font-bold">-{errorPenalty.toFixed(1)}</span></div>
                  </div>
                  <div className="border-t border-slate-200 pt-2 font-black text-slate-800 text-[11px] flex justify-between items-center">
                    <span>Final Adjusted Score:</span>
                    <span className="bg-slate-200 px-2 py-0.5 rounded">{item.score} / 10</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. Candidate's Answer */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Your Answer</p>
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
              {/* 3. Mentor Feedback */}
              {item.feedback && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mentor Feedback</p>
                  <p className="text-sm text-slate-750 leading-relaxed font-semibold bg-white p-4 rounded-2xl border border-slate-200/60 italic">
                    "{item.feedback}"
                  </p>
                </div>
              )}

              {/* 4. Why You Got This Score (What Went Well & Low score reasons) */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-50/20 border border-emerald-100/50 p-4 rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle size={14} /> What went well
                  </h5>
                  <ul className="space-y-1">
                    {whatWentWell.map((w, i) => (
                      <li key={i} className="text-xs text-slate-650 font-semibold flex items-start gap-1.5 leading-relaxed">
                        <span className="text-emerald-500 font-bold">✓</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50/20 border border-rose-100/50 p-4 rounded-2xl space-y-2">
                  <h5 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1">
                    <AlertCircle size={14} /> Why the score is low
                  </h5>
                  <ul className="space-y-1">
                    {whyScoreLow.map((w, i) => (
                      <li key={i} className="text-xs text-slate-650 font-semibold flex items-start gap-1.5 leading-relaxed">
                        <span className="text-rose-500 font-bold">✗</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 5. What Recruiters Expected */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Target size={14} className="text-indigo-500" /> What Recruiters Expected
                </p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {item.matchedKeyPoints.map((pt, i) => (
                    <li key={i} className="text-xs text-slate-650 font-semibold flex items-center gap-1.5 leading-snug">
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span className="line-through text-slate-400">{pt}</span>
                    </li>
                  ))}
                  {item.missingKeyPoints.map((pt, i) => (
                    <li key={i} className="text-xs text-slate-650 font-semibold flex items-center gap-1.5 leading-snug">
                      <span className="text-slate-350 font-bold">•</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 6. How To Improve */}
              <div className="bg-indigo-50/30 border border-indigo-150 p-5 rounded-3xl space-y-3">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Brain size={14} /> How To Improve
                </p>
                <ul className="space-y-1.5">
                  {improvements.map((imp, i) => (
                    <li key={i} className="text-xs text-slate-700 font-semibold flex items-start gap-1.5 leading-relaxed">
                      <span className="text-indigo-500 font-black">•</span>
                      {imp}
                    </li>
                  ))}
                </ul>
                <div className="pt-2.5 border-t border-indigo-100/50 flex justify-between items-center text-xs font-bold text-indigo-800">
                  <span>Estimated score if these points were covered:</span>
                  <span className="bg-indigo-100/80 px-2 py-0.5 rounded-lg">{estimatedScoreRange}</span>
                </div>
              </div>

              {/* 7. Performance Level */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Performance Profile</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${performance.color}`}>
                    {performance.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Stars and Labels */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                      <span>Knowledge Demonstrated</span>
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="text-[10px] text-slate-400 font-medium">({kLabel})</span>
                        {renderStars(knowledgeScoreVal)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium text-slate-650">
                      <span>Problem Solving</span>
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="text-[10px] text-slate-400 font-medium">({pLabel})</span>
                        {renderStars(problemSolvingScoreVal)}
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-medium text-slate-600">
                      <span>Communication</span>
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <span className="text-[10px] text-slate-400 font-medium">({cLabel})</span>
                        {renderStars(communicationScoreVal)}
                      </div>
                    </div>
                  </div>

                  {/* Confidence Alignment info */}
                  <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-150 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">
                      Confidence Alignment
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold mb-2">
                      {confidenceGuidance}
                    </p>
                    <div className="text-[11px] font-bold text-slate-700">
                      Status: <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        Math.abs(confidenceGapVal) <= 2 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>{confidenceStatus}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

const getCandidateFriendlyRecommendation = (rec: string) => {
  if (rec === 'Strong Hire') return 'Exceptional Alignment';
  if (rec === 'Hire') return 'Strong Potential';
  if (rec === 'Consider') return 'Growing Foundations';
  return 'Needs Development';
};

export const SessionReportView: React.FC<SessionReportViewProps> = ({
  candidate,
  evalReport,
  sessionId,
  onHome,
  mode = 'candidate'
}) => {
  const report = evalReport;
  const isAptitudeReport = !!report.aptitudeSummary || candidate.role === 'APTITUDE' || report.questionBreakdown?.some(q => q.options && q.options.length > 0);

  if (isAptitudeReport) {
    const aptSummary = report.aptitudeSummary || {
      correct: report.questionBreakdown?.filter(q => q.score === 10).length || 0,
      incorrect: report.questionBreakdown?.filter(q => q.score === 0 && q.userAnswer !== 'Unattempted').length || 0,
      unattempted: report.questionBreakdown?.filter(q => q.userAnswer === 'Unattempted').length || 0,
      accuracy: report.executiveSummary?.technicalScore || 0,
      trustScore: report.executiveSummary?.trustScore || 100,
      timeSpentSeconds: 0,
      categoryBreakdown: {},
      improvements: report.topImprovements || []
    };

    const integrityScoreVal = report.proctoringSummary?.integrityScore ?? aptSummary.trustScore ?? 100;
    const finalAccuracy = aptSummary.accuracy ?? Math.round((aptSummary.correct / 10) * 100);
    
    const durationSeconds = aptSummary.timeSpentSeconds || (report.proctoringSummary?.sessionDurationMs ? Math.round(report.proctoringSummary.sessionDurationMs / 1000) : 0);
    const formatDuration = (sec: number) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
      <div className="w-full text-slate-900 font-sans animate-in fade-in duration-500">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="text-indigo-600" size={16} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  {mode === 'admin' ? 'Candidate Aptitude Readiness Report (Admin)' : 'Your Aptitude Growth Report'}
                </span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
                {mode === 'admin' ? candidate.name : `Hi, ${candidate.name}!`}
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Role Focus: <span className="text-slate-900 font-bold">Aptitude Test</span> | Date: <span className="text-slate-700 font-semibold">{new Date().toLocaleDateString()}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {mode === 'admin' && (
                <div className="text-right hidden md:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Evaluation Mode</p>
                  <p className="text-xs font-mono font-bold text-slate-700">Objective MCQ</p>
                </div>
              )}
              <Logo className="w-10 h-10 opacity-70" />
            </div>
          </header>

          {/* Core Decision Cards */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Performance score card */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aptitude Accuracy</span>
              <div className="relative flex items-center justify-center">
                <ScoreRing score={finalAccuracy} size={140} />
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-slate-800">{aptSummary.correct}/10</span>
                  <span className="text-xs text-slate-400 block mt-0.5">{finalAccuracy}% Accuracy</span>
                </div>
              </div>
            </div>

            {/* Integrity / Trust Score Card (Separate!) */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Integrity / Trust Score</span>
              <div className="relative flex items-center justify-center">
                <ScoreRing score={integrityScoreVal} size={140} />
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-slate-800">{integrityScoreVal}%</span>
                  <span className="text-xs text-slate-400 block mt-0.5">Trust Integrity</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics stats */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col justify-between space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-500">Correct Answers</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">{aptSummary.correct}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-500">Incorrect Answers</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full">{aptSummary.incorrect}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-medium">
                  <span className="text-slate-500">Unattempted</span>
                  <span className="font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">{aptSummary.unattempted}</span>
                </div>
                {durationSeconds > 0 && (
                  <div className="flex justify-between items-center text-xs font-medium border-t border-slate-100 pt-2.5">
                    <span className="text-slate-500">Time Taken</span>
                    <span className="font-bold text-slate-800">{formatDuration(durationSeconds)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* AI Executive Summary Block */}
          {report.executiveSummary?.summary && (
            <section className="bg-white border border-slate-200 rounded-[32px] p-6 md:p-8 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-2">
                <Info size={16} /> Executive Summary
              </h3>
              <p className="text-slate-700 text-sm leading-relaxed font-semibold italic">
                "{report.executiveSummary.summary}"
              </p>
            </section>
          )}

          {/* Category-wise Performance and AI Actionable Improvements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category accuracy bars */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BarChart2 size={16} className="text-indigo-600" /> Category Breakdown
              </h3>
              <div className="space-y-4">
                {Object.keys(aptSummary.categoryBreakdown || {}).length > 0 ? (
                  Object.entries(aptSummary.categoryBreakdown).map(([cat, data]: [string, any]) => (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-slate-650">{cat}</span>
                        <span className="text-slate-800">{data.correct}/{data.total} ({data.accuracy}%)</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                          style={{ width: `${data.accuracy}%` }} 
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback category calculations from questionBreakdown
                  ['Quantitative', 'Logical', 'Analytical', 'Verbal'].map(cat => {
                    const catQs = report.questionBreakdown?.filter(q => q.category === cat) || [];
                    const total = catQs.length;
                    const correct = catQs.filter(q => q.score === 10).length;
                    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
                    if (total === 0) return null;

                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-650">{cat}</span>
                          <span className="text-slate-800">{correct}/{total} ({pct}%)</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                            style={{ width: `${pct}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* AI Actionable Improvements */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Trophy size={16} className="text-indigo-600" /> Actionable Improvements
              </h3>
              <div className="grid gap-3">
                {(aptSummary.improvements || []).slice(0, 3).map((imp: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 font-semibold leading-relaxed">
                    <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 border-indigo-400 bg-white shrink-0 text-xs font-black text-indigo-600">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-700">{imp}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Gaze Warnings and Proctor Details */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-500" /> Proctor violations & logs
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tab Switches</span>
                <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.tabSwitches ?? 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Camera Away / Gaze</span>
                <span className="text-xl font-black text-slate-700 mt-1 block">
                  {report.proctoringSummary?.faceAwayEvents ?? report.proctoringSummary?.gazeAwayEvents ?? 0}
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Multiple Person</span>
                <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.multiplePersonEvents ?? 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Warnings Issued</span>
                <span className="text-xl font-black text-slate-700 mt-1 block">{report.proctoringSummary?.warningsIssued ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Detailed Question breakdown */}
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-indigo-600" /> Detailed Question Proofs
              </h2>
            </div>
            <div className="space-y-4">
              {report.questionBreakdown && report.questionBreakdown.length > 0 ? (
                report.questionBreakdown.map((item, idx) => (
                  <QuestionCard key={idx} item={item} index={idx} mode={mode} />
                ))
              ) : (
                <p className="text-xs font-medium text-slate-400 italic">No question breakdown available.</p>
              )}
            </div>
          </section>

          {/* Home button footer */}
          {onHome && (
            <footer className="flex justify-between items-center bg-slate-900 text-white rounded-[32px] p-6 shadow-xl mt-12">
              <div>
                <h4 className="text-sm font-bold">Feedback Record Finalized</h4>
                <p className="text-[10px] text-slate-400 mt-1">Your report has been saved to your profile.</p>
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
  }

  const hiringColors: Record<string, string> = {
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

  // 1. Candidate View Rendering
  if (mode === 'candidate') {
    const performanceScore = report.executiveSummary?.interviewPerformanceScore ?? report.overallScores?.interviewPerformanceScore ?? 0;
    const candidateLevel = report.executiveSummary?.candidateLevel ?? 'Foundation Building';
    const growthPotential = report.executiveSummary?.growthPotential ?? report.overallScores?.growthPotential ?? 0;
    const improvementOpportunity = report.executiveSummary?.improvementOpportunity ?? report.overallScores?.improvementOpportunity ?? 0;
    const confidenceGap = report.executiveSummary?.confidenceGap ?? report.overallScores?.confidenceGap ?? 0;
    const topImprovements = report.topImprovements || [];

    const levelColors: Record<string, string> = {
      'Exceptional': 'bg-purple-50 text-purple-700 border-purple-200',
      'Advanced': 'bg-emerald-50 text-emerald-700 border-emerald-200',
      'Strong': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Job Ready': 'bg-blue-50 text-blue-700 border-blue-200',
      'Developing': 'bg-amber-50 text-amber-700 border-amber-200',
      'Foundation Building': 'bg-rose-50 text-rose-700 border-rose-200',
    };

    let confidenceGuidance = "Your confidence is well-aligned with your technical understanding. Great job speaking clearly and accurately.";
    if (confidenceGap > 2) {
      confidenceGuidance = "You present yourself with high confidence, but make sure to back it up with deep technical details and direct examples to match your self-assurance.";
    } else if (confidenceGap < -2) {
      confidenceGuidance = "You have strong technical knowledge but speak with caution. Work on presenting your answers more assertively to showcase your capability.";
    }

    let integrityGuidance = "Excellent focus and integrity. You kept your attention on the screen and fully respected interview guidelines.";
    if (integrityScore < 70) {
      integrityGuidance = "Interview guidelines were breached multiple times (e.g. tab switches or gaze away). Make sure to stay fully focused on the camera and avoid switching tabs in future interviews.";
    } else if (integrityScore < 90) {
      integrityGuidance = "Good integrity. There were minor gaze shifts or movements, but overall you stayed aligned with standard expectations.";
    }

    const friendlyRecommendation = getCandidateFriendlyRecommendation(report.executiveSummary?.recommendation || 'Consider');

    return (
      <div className="w-full text-slate-900 font-sans animate-in fade-in duration-500">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-6 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="text-indigo-600" size={16} />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Personalized Growth Report</span>
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Hi, {candidate.name}!</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Role Focus: <span className="text-slate-900 font-bold">{candidate.role} Branch</span> | Date: <span className="text-slate-700 font-semibold">{new Date().toLocaleDateString()}</span>
              </p>
            </div>
            <Logo className="w-10 h-10 opacity-70" />
          </header>

          {/* Performance Overview & Level */}
          <div className="grid md:grid-cols-12 gap-6">
            
            {/* Overall Score & Level Card */}
            <div className="md:col-span-5 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Interview Performance</span>
              
              <div className="relative flex items-center justify-center">
                <ScoreRing score={performanceScore} size={150} />
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-slate-800">{performanceScore}%</span>
                  <span className="text-xs text-slate-400 block mt-0.5">overall</span>
                </div>
              </div>

              <div className="space-y-1.5 w-full">
                <span className={`inline-block px-4 py-1.5 rounded-2xl text-xs font-black uppercase tracking-wider border ${levelColors[candidateLevel] || 'bg-slate-50 border-slate-200'}`}>
                  {candidateLevel}
                </span>
                <p className="text-xs font-semibold text-slate-500 mt-2">
                  Alignment Band: <span className="text-indigo-600 font-black">{friendlyRecommendation}</span>
                </p>
              </div>
            </div>

            {/* Growth Profiles & Confidence Alignment */}
            <div className="md:col-span-7 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Activity size={16} className="text-indigo-600" /> Key Profiles
                </h3>
                
                {/* Growth Potential */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Growth Potential</span>
                    <span className="text-slate-800">{growthPotential}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${growthPotential}%` }} />
                  </div>
                </div>

                {/* Improvement Opportunity */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 uppercase tracking-wider">Improvement Opportunity</span>
                    <span className="text-slate-800">{improvementOpportunity}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-700" style={{ width: `${improvementOpportunity}%` }} />
                  </div>
                </div>
              </div>

              {/* Confidence Alignment Section */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Scale size={14} className="text-indigo-500" /> Confidence Alignment
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    Math.abs(confidenceGap) <= 2 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {Math.abs(confidenceGap) <= 2 ? 'Aligned' : confidenceGap > 0 ? 'Over-Confident' : 'Under-Confident'}
                  </span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed font-medium">
                  {confidenceGuidance}
                </p>
              </div>
            </div>

          </div>

          {/* Detailed Question Breakdown */}
          <section className="space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-indigo-600" /> Question-by-Question Breakdown
              </h2>
            </div>
            <div className="space-y-4">
              {report.questionBreakdown && report.questionBreakdown.length > 0 ? (
                report.questionBreakdown.map((item, idx) => (
                  <QuestionCard key={idx} item={item} index={idx} mode={mode} />
                ))
              ) : (
                <p className="text-xs font-medium text-slate-400 italic">No question breakdown available.</p>
              )}
            </div>
          </section>

          {/* Top 3 Actionable Improvements Checklist */}
          {topImprovements.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Trophy size={16} className="text-indigo-600" /> Top Actionable Improvements
              </h3>
              <div className="grid gap-3">
                {topImprovements.slice(0, 3).map((imp, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 border-indigo-400 bg-white shrink-0 text-xs font-black text-indigo-600">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-slate-700 font-semibold leading-relaxed">{imp}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Focus Areas */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Strengths */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="text-emerald-500" size={16} /> Key Strengths
              </h3>
              <div className="space-y-2">
                {report.strengths && report.strengths.length > 0 ? (
                  report.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/50">
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{str}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No key strengths identified.</p>
                )}
              </div>
            </div>

            {/* Focus Areas */}
            <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Target className="text-rose-500" size={16} /> Areas for Growth
              </h3>
              <div className="space-y-2">
                {report.weaknesses && report.weaknesses.length > 0 ? (
                  report.weaknesses.map((weak, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-rose-50/20 p-3 rounded-2xl border border-rose-100/50">
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{weak}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No focus areas identified.</p>
                )}
              </div>
            </div>

          </div>

          {/* Interview Integrity Card */}
          <div className="bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center border-r border-slate-100 pr-0 md:pr-6">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Interview Integrity</span>
              <div className="relative flex items-center justify-center">
                <ScoreRing score={integrityScore} size={100} />
                <div className="absolute text-center">
                  <span className="text-xl font-black text-slate-800">{integrityScore}%</span>
                </div>
              </div>
            </div>
            <div className="md:col-span-8 space-y-2">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert size={16} className="text-indigo-600" /> Proctoring & Integrity Status
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {integrityGuidance}
              </p>
            </div>
          </div>

          {/* Footer Action */}
          {onHome && (
            <footer className="flex justify-between items-center bg-slate-900 text-white rounded-[32px] p-6 shadow-xl mt-12">
              <div>
                <h4 className="text-sm font-bold">Feedback Record Finalized</h4>
                <p className="text-[10px] text-slate-400 mt-1">Your report has been saved to your student profile.</p>
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
  }

  // 2. Admin (Recruiter) View Rendering
  const readinessScore = report.executiveSummary?.readinessScore ?? report.overallScores?.readinessScore ?? 0;
  const performanceScore = report.executiveSummary?.interviewPerformanceScore ?? report.overallScores?.interviewPerformanceScore ?? 0;
  const reliabilityScore = report.executiveSummary?.answerReliabilityScore ?? report.overallScores?.answerReliabilityScore ?? 0;

  return (
    <div className="w-full text-slate-900 font-sans animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Recruiter Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="text-indigo-600" size={16} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Technical Readiness Report (Admin View)</span>
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

        {/* 1. Decision Grid & Primary Scores */}
        <div className="grid md:grid-cols-12 gap-6">
          
          {/* Recommendation Ring Card */}
          <div className="md:col-span-4 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hiring Recommendation</span>
            
            <div className="relative flex items-center justify-center">
              <ScoreRing score={report.overallScores?.trustAdjustedScore ?? 0} size={130} />
              <div className="absolute text-center">
                <span className="text-2xl font-black text-slate-800">{report.overallScores?.trustAdjustedScore ?? 0}%</span>
                <span className="text-[10px] text-slate-400 block">Trust Score</span>
              </div>
            </div>

            <div className="space-y-1 w-full">
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${hiringColors[report.executiveSummary?.recommendation ?? 'Consider']}`}>
                {report.executiveSummary?.recommendation ?? 'Consider'}
              </span>
              {isInsufficientEvidence && (
                <div className="text-[10px] text-rose-500 font-bold mt-1 uppercase flex items-center justify-center gap-1">
                  <AlertTriangle size={12} /> Insufficient Evidence
                </div>
              )}
            </div>
          </div>

          {/* Primary Scores & Reliability Card */}
          <div className="md:col-span-8 bg-white border border-slate-200 rounded-[32px] p-6 shadow-sm grid md:grid-cols-3 gap-4 items-center justify-between">
            <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recruiter Readiness</span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">
                {readinessScore}%
              </span>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Integrity-adjusted</p>
            </div>
            <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Candidate Performance</span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">
                {performanceScore}%
              </span>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Unadjusted</p>
            </div>
            <div className="flex flex-col p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Answer Reliability</span>
              <span className="text-3xl font-black text-slate-800 mt-2 block">
                {reliabilityScore}%
              </span>
              <p className="text-[10px] text-slate-500 font-semibold mt-1">Consistency check</p>
            </div>
          </div>

        </div>

        {/* Executive Summary Paragraph */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">Executive Summary & Verdict Rationale</h3>
          <p className="text-slate-700 text-sm leading-relaxed font-semibold italic">
            "{report.executiveSummary?.summary || 'No summary evaluation available.'}"
          </p>
        </section>

        {/* 2. Detailed Dimension Scores */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <Activity size={18} className="text-indigo-600" /> Overall Technical & Communication Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Knowledge Score</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.knowledgeScore ?? 0)}/100
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Reasoning Score</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.reasoningScore ?? 0)}/100
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Communication</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.communicationScore ?? 0)}/100
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consistency Score</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(report.overallScores?.consistencyScore ?? 0)}/100
              </span>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Session Integrity</span>
              <span className="text-2xl font-black text-slate-800 mt-1 block">
                {Math.round(integrityScore)}/100
              </span>
            </div>
          </div>
        </section>

        {/* 3. Cross-Question Technical Contradictions */}
        {report.contradictions && report.contradictions.length > 0 && (
          <section className="bg-rose-50/20 border border-rose-200 rounded-[32px] p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={18} /> Cross-Question Technical Contradictions Detected
            </h3>
            <div className="space-y-3">
              {report.contradictions.map((c, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-rose-200/60 shadow-sm space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500">
                      Between Question #{c.qIndex1} and #{c.qIndex2}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      c.severity === 'high' ? 'bg-red-100 text-red-700' :
                      c.severity === 'medium' ? 'bg-orange-100 text-orange-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {c.severity} severity
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                    {c.explanation}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 4. Proctoring Details & Warnings */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert size={20} className="text-rose-500" /> Proctoring Summary & Event Breakdown
            </h3>
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

        {/* 5. Strengths & Weaknesses */}
        <section className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Brain size={20} className="text-indigo-600" /> Recruiter Assessment Notes
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Trophy className="text-emerald-500" size={16} /> Key Strengths
              </h4>
              <div className="space-y-2">
                {report.strengths && report.strengths.length > 0 ? (
                  report.strengths.map((str, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-emerald-50/20 p-3 rounded-2xl border border-emerald-100/50">
                      <CheckCircle className="text-emerald-500 shrink-0 mt-0.5" size={14} />
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">{str}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-medium text-slate-400 italic">No key strengths identified.</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Target className="text-rose-500" size={16} /> Identified Technical Gaps
              </h4>
              <div className="space-y-2">
                {report.weaknesses && report.weaknesses.length > 0 ? (
                  report.weaknesses.map((weak, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 bg-rose-50/20 p-3 rounded-2xl border border-rose-100/50">
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

        {/* 6. Question Breakdown */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <MessageSquare size={24} className="text-indigo-600" /> Detailed Question Proofs
            </h2>
          </div>
          <div className="space-y-4">
            {report.questionBreakdown && report.questionBreakdown.length > 0 ? (
              report.questionBreakdown.map((item, idx) => (
                <QuestionCard key={idx} item={item} index={idx} mode={mode} />
              ))
            ) : (
              <p className="text-xs font-medium text-slate-400 italic">No question breakdown available.</p>
            )}
          </div>
        </section>

        {/* Action Button Footer */}
        {onHome && (
          <footer className="flex justify-between items-center bg-slate-900 text-white rounded-[32px] p-8 shadow-xl mt-12">
            <div>
              <h4 className="text-sm font-bold">Unified Recruiter Report Compiled</h4>
              <p className="text-[10px] text-slate-400 mt-1">Full master evaluation record saved to database.</p>
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
