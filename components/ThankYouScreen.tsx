import React, { useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, ShieldCheck, Share2, Home, RefreshCw, BarChart, Download, FileText, Mail, Calendar, ExternalLink, AlertCircle, RotateCcw, TrendingUp, Star, MessageSquare, Mic, Target, Eye, Award, Shield, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { EvaluationResult, WarningEvent, StrictEvaluationReport } from '../types';
import { AIService } from '../services/aiService';

interface ThankYouScreenProps {
    status: 'COMPLETED' | 'TERMINATED';
    results?: EvaluationResult[];
    warnings?: WarningEvent[];
    onRetest: () => void;
    onHome: () => void;
}

export const ThankYouScreen: React.FC<ThankYouScreenProps> = ({ status, results = [], warnings = [], onRetest, onHome }) => {
    const isTerminated = status === 'TERMINATED';

    // Evaluation State
    const [overallEvaluation, setOverallEvaluation] = useState<StrictEvaluationReport | null>(null);
    const [isLoadingEval, setIsLoadingEval] = useState(false);

    // Feedback States
    const [feedbackRating, setFeedbackRating] = useState(0);
    const [feedbackProblem, setFeedbackProblem] = useState('');
    const [feedbackImprovement, setFeedbackImprovement] = useState('');
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    React.useEffect(() => {
        if (results.length > 0 && !isTerminated) {
            const fetchEvaluation = async () => {
                setIsLoadingEval(true);
                try {
                    const answers = results.map(r => ({
                        question: r.questionText,
                        answer: r.userAnswer,
                        ideal_answer: "Professional and accurate response."
                    }));
                    const report = await AIService.evaluateInterview(answers);
                    setOverallEvaluation(report);
                } catch (err) {
                    console.error("Failed to fetch strict evaluation:", err);
                } finally {
                    setIsLoadingEval(false);
                }
            };
            fetchEvaluation();
        }
    }, [results, isTerminated]);

    const handleFeedbackSubmit = () => {
        console.log("Feedback Submitted:", {
            rating: feedbackRating,
            problem: feedbackProblem,
            improvement: feedbackImprovement
        });
        setFeedbackSubmitted(true);
    };

    const analytics = useMemo(() => {
        if (overallEvaluation) {
            return {
                score: overallEvaluation.totalScore,
                feedback: overallEvaluation.verdictJustification,
                verdict: overallEvaluation.finalVerdict
            };
        }

        if (results.length === 0) return { score: 0, feedback: "No data available.", verdict: 'REJECT' };

        const avgScore = results.reduce((acc, curr) => acc + (curr.contentScore + curr.grammarScore + curr.fluencyScore) / 3, 0) / results.length;
        const normalizedScore = Math.round(avgScore * 10);

        let feedback = "Excellent performance! You showed strong understanding.";
        if (normalizedScore < 50) feedback = "Consider reviewing the core concepts and practicing your communication skills.";
        else if (normalizedScore < 75) feedback = "Good effort, but there is room for improvement in technical depth and fluency.";

        return { score: normalizedScore, feedback, verdict: normalizedScore > 70 ? 'HIRE' : 'BORDERLINE' };
    }, [results, overallEvaluation]);

    if (isTerminated) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white text-center">
                <div className="max-w-md w-full bg-red-950/20 border-2 border-red-500/30 p-12 rounded-[2.5rem] backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(239,68,68,0.4)]">
                        <span className="text-5xl font-black">X</span>
                    </div>
                    <h1 className="text-4xl font-black mb-4 tracking-tighter">SESSION TERMINATED</h1>
                    <p className="text-red-200/70 mb-8 leading-relaxed">
                        The proctoring system detected multiple integrity violations during your session.
                        As per standard guidelines, the interview has been locked.
                    </p>
                    <div className="bg-red-950/40 rounded-2xl p-4 mb-8 text-left border border-red-500/20">
                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Violation Summary</p>
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 text-sm">
                                <AlertCircle size={16} className="text-red-400" />
                                <span>Strikes: {warnings.length} Recorded</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <Shield size={16} className="text-red-400" />
                                <span>Protocol: Strict Enforcement</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <button onClick={onRetest} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                            <RotateCcw size={20} /> TRY AGAIN
                        </button>
                        <button onClick={onHome} className="opacity-60 hover:opacity-100 transition-opacity text-sm font-bold flex items-center justify-center gap-2">
                            <Home size={18} /> BACK TO HOME
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
            <div className="max-w-5xl w-full flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                {/* Header Summary Card */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        {/* Score Ring */}
                        <svg className="w-48 h-48 transform -rotate-90">
                            <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                            <circle
                                cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent"
                                strokeDasharray={552}
                                strokeDashoffset={552 - (552 * analytics.score) / 100}
                                className="text-indigo-600 transition-all duration-1000 ease-out"
                                strokeLinecap="round"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-5xl font-black text-slate-800">{analytics.score}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Strict Score</span>
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                            <Logo className="w-8 h-8" />
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">Expert Evaluation</h1>
                        </div>
                        <div className="mb-4">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black tracking-[0.2em] uppercase border-2 ${analytics.verdict === 'STRONG HIRE' ? 'bg-emerald-500 text-white border-emerald-400' :
                                    analytics.verdict === 'HIRE' ? 'bg-indigo-500 text-white border-indigo-400' :
                                        analytics.verdict === 'BORDERLINE' ? 'bg-amber-500 text-white border-amber-400' :
                                            'bg-red-500 text-white border-red-400'
                                }`}>
                                {analytics.verdict}
                            </span>
                        </div>
                        <p className="text-lg text-slate-600 mb-6 font-medium leading-relaxed max-w-xl">
                            {analytics.feedback}
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                <ShieldCheck size={16} className="text-indigo-400" /> Evidence-Based
                            </div>
                            {overallEvaluation?.redFlags && overallEvaluation.redFlags.length > 0 && (
                                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
                                    <AlertTriangle size={16} /> {overallEvaluation.redFlags.length} Red Flags
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex flex-col gap-3">
                        <button onClick={onHome} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-2 group">
                            Done <Home size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button onClick={onRetest} className="px-8 py-4 bg-white text-slate-600 border-2 border-slate-100 rounded-2xl font-bold hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                            <RotateCcw size={18} /> Retake
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Detailed Analysis Cards */}
                    <div className="md:col-span-8 flex flex-col gap-6">
                        {isLoadingEval && (
                            <div className="bg-white rounded-3xl p-12 border border-indigo-100 shadow-sm flex flex-col items-center justify-center animate-pulse">
                                <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                                <p className="text-slate-600 font-bold">Generating Strict Evidence-Based Report...</p>
                                <p className="text-slate-400 text-xs mt-2 italic">Deducing logic, detecting inconsistencies, and validating accuracy.</p>
                            </div>
                        )}

                        {overallEvaluation && (
                            <div className="bg-white rounded-[3rem] p-8 md:p-10 border border-indigo-100 shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-6 opacity-10">
                                    <BarChart size={120} className="text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-8 border-b pb-4 flex items-center gap-3">
                                    <ShieldCheck className="text-indigo-600" /> Strict Category Breakdown
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-10">
                                    {[
                                        { label: 'Technical Accuracy', key: 'technicalAccuracy', color: 'bg-blue-600' },
                                        { label: 'Problem Solving', key: 'problemSolving', color: 'bg-indigo-600' },
                                        { label: 'Practical Execution', key: 'practicalExecution', color: 'bg-violet-600' },
                                        { label: 'Communication', key: 'communication', color: 'bg-emerald-600' },
                                        { label: 'Adaptability', key: 'adaptability', color: 'bg-amber-600' },
                                        { label: 'Culture Fit', key: 'cultureFit', color: 'bg-rose-600' }
                                    ].map((cat) => {
                                        const score = (overallEvaluation.categories as any)[cat.key];
                                        return (
                                            <div key={cat.key} className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{cat.label}</span>
                                                    <span className="text-sm font-bold text-slate-800">{score.raw}/100</span>
                                                </div>
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${cat.color} transition-all duration-1000 ease-out delay-300`}
                                                        style={{ width: `${score.raw}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    Weighted: {score.weighted}/{score.maxWeight}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 mb-8">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <TrendingUp size={14} className="text-indigo-500" /> Thinking Depth Analysis
                                    </h4>
                                    <p className="text-sm text-slate-700 leading-relaxed italic">
                                        "{overallEvaluation.detailedAnalysis.depthVsSurface}"
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                                            <CheckCircle size={14} /> Proven Strengths
                                        </h4>
                                        <ul className="space-y-2">
                                            {overallEvaluation.detailedAnalysis.strengths.map((s, i) => (
                                                <li key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/30">
                                                    <span className="text-emerald-500 font-bold">•</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                            <AlertTriangle size={14} /> Critical Failures
                                        </h4>
                                        <ul className="space-y-2">
                                            {overallEvaluation.detailedAnalysis.failures.map((f, i) => (
                                                <li key={i} className="text-xs text-slate-600 flex items-start gap-2 bg-red-50/50 p-2 rounded-lg border border-red-100/30">
                                                    <span className="text-red-500 font-bold">•</span>
                                                    {f}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3 ml-2 mt-8">
                            <Star className="text-amber-500 fill-amber-500" size={20} /> Question Breakdown
                        </h2>
                        {results.map((res, idx) => (
                            <div key={idx} className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <MessageSquare size={120} />
                                </div>
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <div className="flex-1">
                                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mb-2 block">Question {idx + 1}</span>
                                        <h3 className="text-lg font-bold text-slate-800 leading-snug">{res.questionText}</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-2xl p-3 text-center min-w-[70px]">
                                        <span className="block text-xl font-black text-slate-800">{Math.round((res.contentScore + res.grammarScore + res.fluencyScore) / 3 * 10)}</span>
                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Score</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="space-y-2">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Mic size={12} /> Your Response</h4>
                                        <p className="text-sm text-slate-600 italic leading-relaxed bg-slate-50/50 p-4 rounded-2xl border border-slate-50">"{res.userAnswer}"</p>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Target size={12} /> Key Points Analysis</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {res.matchedKeyPoints.map((kp, kidx) => (
                                                <span key={kidx} className="bg-emerald-50 text-emerald-600 text-[11px] font-bold px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1.5">
                                                    <CheckCircle size={10} /> {kp}
                                                </span>
                                            ))}
                                            {res.missingKeyPoints.map((kp, kidx) => (
                                                <span key={kidx} className="bg-red-50 text-red-400 text-[11px] font-bold px-3 py-1 rounded-full border border-red-100 flex items-center gap-1.5">
                                                    <AlertCircle size={10} /> {kp}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-50 flex flex-wrap gap-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-1 text-slate-200 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${res.contentScore * 10}%` }}></div>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500">Technical: {res.contentScore}/10</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-1 text-slate-200 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${res.grammarScore * 10}%` }}></div>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500">Grammar: {res.grammarScore}/10</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-1 text-slate-200 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500" style={{ width: `${res.fluencyScore * 10}%` }}></div>
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-500">Fluency: {res.fluencyScore}/10</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sidebar: Improvements & Integrity */}
                    <div className="md:col-span-4 flex flex-col gap-8">
                        {/* Improvement Plan */}
                        <div className="bg-indigo-600 text-white rounded-[2.5rem] p-8 shadow-xl shadow-indigo-100 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <TrendingUp size={24} /> Personalized Roadmap
                                </h3>
                                <ul className="space-y-6">
                                    <li className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                                        <div>
                                            <p className="font-bold text-sm mb-1">Bridge Knowledge Gaps</p>
                                            <p className="text-indigo-100 text-xs leading-relaxed">Focus on missed key points like {results[0]?.missingKeyPoints[0] || 'Technical depth'} to strengthen your core fundamentals.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                                        <div>
                                            <p className="font-bold text-sm mb-1">Refine Communication</p>
                                            <p className="text-indigo-100 text-xs leading-relaxed">Work on your {results[0]?.fluencyScore < 7 ? 'fluency and pacing' : 'vocabulary and expression'} for better presentation.</p>
                                        </div>
                                    </li>
                                    <li className="flex gap-4">
                                        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                                        <div>
                                            <p className="font-bold text-sm mb-1">Body Language</p>
                                            <p className="text-indigo-100 text-xs leading-relaxed">Practice maintaining steady eye contact and active listening during AI prompts.</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        </div>

                        {/* Integrity Report */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Shield size={16} className="text-emerald-500" /> Integrity Report
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-xs text-slate-500 flex items-center gap-2">
                                        <Eye size={14} /> Eye Contact Stability
                                    </span>
                                    <span className={`text-xs font-bold ${warnings.filter(w => w.type === 'GAZE').length > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                        {warnings.filter(w => w.type === 'GAZE').length > 0 ? 'Good (Warning Ref)' : 'Excellent'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-xs text-slate-500 flex items-center gap-2">
                                        <Award size={14} /> Interaction Patterns
                                    </span>
                                    <span className="text-xs font-bold text-emerald-500">Natural</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-xs text-slate-500 flex items-center gap-2">
                                        <AlertCircle size={14} /> Proctored Warnings
                                    </span>
                                    <span className={`text-xs font-bold ${warnings.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {warnings.length} / 3 Strikes
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Feedback Section */}
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-slate-100 flex flex-col items-center">
                    <div className="max-w-2xl w-full text-center">
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Share Your Experience</h2>
                        <p className="text-slate-500 mb-8 text-sm uppercase tracking-widest font-bold">Help us improve the ReiCrew AI experience</p>

                        <div className="flex flex-col gap-8">
                            {/* Star Rating */}
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Rate the Interview</p>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            onClick={() => setFeedbackRating(star)}
                                            className={`transition-all transform hover:scale-110 active:scale-95 ${feedbackRating >= star ? 'text-amber-400' : 'text-slate-200'
                                                }`}
                                        >
                                            <Star size={36} fill={feedbackRating >= star ? "currentColor" : "none"} strokeWidth={1.5} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col items-start gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Encountered Problems?</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px] resize-none"
                                        placeholder="Describe any technical issues or bugs..."
                                        value={feedbackProblem}
                                        onChange={(e) => setFeedbackProblem(e.target.value)}
                                    />
                                </div>
                                <div className="flex flex-col items-start gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">What should we change?</label>
                                    <textarea
                                        className="w-full bg-slate-50 border-none rounded-[2rem] p-6 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/20 transition-all min-h-[120px] resize-none"
                                        placeholder="Suggestions for improvements..."
                                        value={feedbackImprovement}
                                        onChange={(e) => setFeedbackImprovement(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleFeedbackSubmit}
                                disabled={feedbackRating === 0 || feedbackSubmitted}
                                className={`w-full py-5 rounded-[2rem] font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3 ${feedbackSubmitted
                                    ? 'bg-emerald-500 text-white cursor-default'
                                    : (feedbackRating === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100')
                                    }`}
                            >
                                {feedbackSubmitted ? (
                                    <><CheckCircle size={24} /> FEEDBACK RECEIVED</>
                                ) : (
                                    <><Target size={24} /> SUBMIT FEEDBACK</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="text-center text-slate-400 text-xs py-10 font-medium">ReiCrew AI © 2026 • Verified Intelligence Assessment System</p>
            </div>
        </div>
    );
};

