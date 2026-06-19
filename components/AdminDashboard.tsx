import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { InterviewSession, Question, ErrorLog, JobPost } from '../types';
import {
    Users, LogOut, Search, Shield, Edit, Plus, Save, X, Trash2,
    Activity, ToggleLeft, ToggleRight, ChevronRight, Link, Copy, CheckCircle,
    Server, Database, AlertTriangle, Terminal, CheckCircle2, BookOpen, RefreshCw, FileText,
    Download, Sliders
} from 'lucide-react';

import { SystemHealth } from '../services/healthService';
import { SupabaseService } from '../services/supabaseService';
import { SessionReportView } from './SessionReportView';
import { ErrorLogService } from '../services/errorLogService';
import { getQuestionsForRole } from '../services/aiService';

interface AdminDashboardProps {
    onLogout: () => void;
    health?: SystemHealth | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, health }) => {
    // Tab state
    const [activeTab, setActiveTab] = useState<'candidates' | 'questions' | 'system' | 'errors'>('candidates');

    // Candidate Sessions state
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Questions Editor state
    const [selectedRole, setSelectedRole] = useState<'CSE' | 'ECE'>('CSE');
    const [questionsList, setQuestionsList] = useState<Question[]>([]);
    const [questionsFilter, setQuestionsFilter] = useState<string>('all');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Error Logs state
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [errorsFilter, setErrorsFilter] = useState<string>('all');
    const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

    // Loading indicator
    const [isLoading, setIsLoading] = useState(true);

    // Load initial candidate sessions and error logs
    const loadSessionsAndErrors = async () => {
        setIsLoading(true);
        try {
            // Load Sessions
            const rawSessions = await SupabaseService.getAllSessions();
            if (rawSessions) {
                const mappedSessions: InterviewSession[] = rawSessions.map(rs => ({
                    id: rs.session_id,
                    candidate: {
                        name: rs.candidate_name || 'Unknown',
                        email: rs.candidate_email || '',
                        role: rs.job_title || 'Unknown',
                        profilePhoto: rs.profile_photo_url,
                        idCardImage: rs.id_card_image_url
                    },
                    status: rs.session_status,
                    date: rs.session_date,
                    overallScore: rs.total_score || 0,
                    proctoringReport: {
                        violations: rs.all_proctoring_events ? rs.all_proctoring_events.map((v: any) => ({
                            type: v.type || v.event_type,
                            severity: v.severity === 'High' ? 10 : (v.severity === 'Medium' ? 5 : 1),
                            message: v.message,
                            timestamp: new Date(v.time || v.occurred_at).getTime(),
                            snapshot_url: v.snapshot_url,
                            clip_url: v.clip_url
                        })) : []
                    },
                    evaluationReport: {
                        total_score: rs.total_score,
                        final_verdict: rs.final_verdict,
                        scoring_basis: rs.scoring_basis,
                        evaluation_logic: rs.evaluation_logic
                    },
                    results: rs.all_questions_and_answers ? rs.all_questions_and_answers.map((qb: any) => ({
                        questionText: qb.question_text,
                        userAnswer: qb.candidate_answer,
                        contentScore: qb.content_score,
                        grammarScore: qb.grammar_score,
                        fluencyScore: qb.fluency_score,
                        confidenceScore: qb.confidence_score,
                        verdict: qb.verdict,
                        feedback: qb.feedback
                    })) : []
                } as unknown as InterviewSession));

                const sortedSessions = [...mappedSessions].sort((a, b) => {
                    const dateA = a.date ? new Date(a.date).getTime() : 0;
                    const dateB = b.date ? new Date(b.date).getTime() : 0;
                    return dateB - dateA;
                });
                setSessions(sortedSessions);
            }
        } catch (err) {
            console.error("Failed to load sessions:", err);
            ErrorLogService.logError('system', "Failed to load interview sessions on admin dashboard", err);
        }

        // Load error logs from service
        setErrorLogs(ErrorLogService.getErrors());
        setIsLoading(false);
    };

    // Load candidate sessions on mount and whenever tab changes to refresh
    useEffect(() => {
        loadSessionsAndErrors();
    }, [activeTab]);

    // Load Questions when selectedRole changes
    useEffect(() => {
        const loadQuestions = async () => {
            setIsLoading(true);
            try {
                // Try fetching corresponding job post from database
                const jobs = await SupabaseService.getAllJobs();
                const matchedJob = jobs.find(j => 
                    j.title.toLowerCase().includes(selectedRole.toLowerCase()) || 
                    (selectedRole === 'CSE' && j.title.toLowerCase().includes('computer')) ||
                    (selectedRole === 'ECE' && j.title.toLowerCase().includes('electron'))
                );
                
                if (matchedJob && matchedJob.questions && matchedJob.questions.length > 0) {
                    const parsed = typeof matchedJob.questions === 'string' ? JSON.parse(matchedJob.questions) : matchedJob.questions;
                    setQuestionsList(parsed);
                    console.log(`Loaded ${parsed.length} questions from database for ${selectedRole}`);
                } else {
                    // Fallback to local storage or default bank
                    const fallback = getQuestionsForRole(selectedRole);
                    setQuestionsList(fallback);
                    console.log(`Loaded ${fallback.length} fallback questions for ${selectedRole}`);
                }
            } catch (err) {
                console.error("Failed to fetch questions:", err);
                const fallback = getQuestionsForRole(selectedRole);
                setQuestionsList(fallback);
            }
            setIsLoading(false);
        };
        loadQuestions();
    }, [selectedRole]);

    // Question bank action: Save custom edits
    const handleSaveQuestions = async () => {
        setIsSaving(true);
        setSuccessMessage(null);
        try {
            // 1. Sync to local storage backup
            localStorage.setItem(`reicrew_questions_${selectedRole.toLowerCase()}`, JSON.stringify(questionsList));
            
            // 2. Sync to Supabase job posts
            const jobs = await SupabaseService.getAllJobs();
            const matchedJob = jobs.find(j => 
                j.title.toLowerCase().includes(selectedRole.toLowerCase()) || 
                (selectedRole === 'CSE' && j.title.toLowerCase().includes('computer')) ||
                (selectedRole === 'ECE' && j.title.toLowerCase().includes('electron'))
            );

            if (matchedJob) {
                const updatedJob: JobPost = {
                    ...matchedJob,
                    questions: questionsList
                };
                // Sync using existing StorageService or SupabaseService
                await StorageService.saveJobs(jobs.map(j => j.id === matchedJob.id ? updatedJob : j));
                console.log(`Successfully synced edited questions for ${selectedRole} to database`);
            } else {
                console.warn(`No job post found matching ${selectedRole} to sync database questions.`);
            }

            setSuccessMessage("Questions saved successfully! All future interviews will use this updated bank.");
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (err: any) {
            console.error("Failed to save questions:", err);
            ErrorLogService.logError('database', `Failed to save questions for ${selectedRole}: ${err.message || err}`, err);
            alert("Failed to save questions to database. Changes saved locally only.");
        } finally {
            setIsSaving(false);
        }
    };

    // Question bank action: Restore default question sets
    const handleResetQuestions = () => {
        if (window.confirm("Are you sure you want to restore the default questions? This will erase all custom edits for this role.")) {
            localStorage.removeItem(`reicrew_questions_${selectedRole.toLowerCase()}`);
            // Re-load questions from defaults
            const defaults = getQuestionsForRole(selectedRole);
            setQuestionsList(defaults);
            setSuccessMessage("Questions reset to default. Click 'Save Changes' to apply this to the database.");
            setTimeout(() => setSuccessMessage(null), 5000);
        }
    };

    // Question bank action: Edit fields inside the list
    const handleUpdateQuestion = (qId: number | string, field: keyof Question, value: any) => {
        const updated = questionsList.map(q => {
            if (q.id === qId) {
                const updatedQ = { ...q, [field]: value };
                // Keep keyConcepts in sync if keyPoints is modified
                if (field === 'keyPoints' && Array.isArray(value)) {
                    updatedQ.keyConcepts = value.map(pt => ({
                        concept: pt,
                        importance: 'medium'
                    }));
                }
                return updatedQ;
            }
            return q;
        });
        setQuestionsList(updated);
    };

    // Question bank action: Add new blank question template
    const handleAddQuestion = () => {
        const newQ: Question = {
            id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            question: "Enter question text here...",
            difficulty: 'medium',
            type: questionsFilter !== 'all' ? (questionsFilter as any) : 'Core',
            topic: "General",
            category: "Technical",
            ideal_answer: "Provide the reference answer model for the grading AI.",
            keyPoints: ["Point 1", "Point 2"],
            keyConcepts: [
                { concept: "Point 1", importance: "medium" },
                { concept: "Point 2", importance: "medium" }
            ],
            maxScore: 10
        };
        setQuestionsList([...questionsList, newQ]);
    };

    // Question bank action: Delete question from array
    const handleDeleteQuestion = (qId: number | string) => {
        if (window.confirm("Delete this question? Remember to click 'Save Changes' to apply.")) {
            setQuestionsList(questionsList.filter(q => q.id !== qId));
        }
    };

    // Error log actions
    const handleClearErrorLogs = () => {
        if (window.confirm("Are you sure you want to clear all system error logs?")) {
            ErrorLogService.clearErrors();
            setErrorLogs([]);
            setExpandedErrorId(null);
        }
    };

    // CSV Candidate export helper
    const handleDownloadCSV = () => {
        if (sessions.length === 0) return;
        
        const headers = ['Candidate Name', 'Email', 'Role', 'Date', 'Status', 'Overall Score'];
        const rows = sessions.map(s => [
            s.candidate.name,
            s.candidate.email,
            s.candidate.role,
            new Date(s.date).toLocaleDateString(),
            s.status,
            `${s.overallScore}%`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `reicrew_candidates_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Filters candidate session search
    const filteredSessions = sessions.filter(s =>
        s.candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.candidate.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filters question bank list based on visual interview flow stages
    const filteredQuestions = questionsList.filter(q => {
        if (questionsFilter === 'all') return true;
        // Map flow stages to question types
        return q.type === questionsFilter;
    });

    // Filters error logs
    const filteredErrors = errorLogs.filter(err => {
        if (errorsFilter === 'all') return true;
        return err.category === errorsFilter;
    });

    // Count statistics for the flow diagram stages
    const getStageCount = (type: string) => {
        return questionsList.filter(q => q.type === type).length;
    };

    return (
        <div className="h-screen w-screen flex bg-[#F8FAFC] overflow-hidden font-sans text-slate-900 selection:bg-indigo-500/10">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col shrink-0 border-r border-slate-900 shadow-xl">
                <div className="p-6 flex items-center gap-3 text-white border-b border-slate-900">
                    <Shield className="text-indigo-500 shrink-0" size={28} />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Reicrew AI</h1>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Admin Portal</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1.5">
                    {[
                        { id: 'candidates', icon: FileText, label: 'Evaluation Reports' },
                        { id: 'questions', icon: BookOpen, label: 'Interview Flow Editor' },
                        { id: 'system', icon: Activity, label: 'System Health' },
                        { id: 'errors', icon: AlertTriangle, label: 'System Error Logs' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { 
                                setActiveTab(item.id as any); 
                                setSelectedSession(null); 
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                                activeTab === item.id 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                                    : 'hover:bg-slate-900/60 hover:text-white text-slate-400'
                            }`}
                        >
                            <item.icon size={18} className="shrink-0" /> 
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-900 bg-slate-950/50">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all duration-300 text-sm font-medium">
                        <LogOut size={18} className="shrink-0" /> Exit Portal
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'candidates' && (selectedSession ? `Session Report: ${selectedSession.candidate.name}` : 'Evaluation Reports & History')}
                            {activeTab === 'questions' && `Questions & Flow Editor: ${selectedRole}`}
                            {activeTab === 'system' && 'Infrastructure & System Health'}
                            {activeTab === 'errors' && 'Structured Error Logs'}
                        </h2>
                    </div>

                    {selectedSession && activeTab === 'candidates' && (
                        <button 
                            onClick={() => setSelectedSession(null)} 
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                        >
                            ← Back to List
                        </button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                    
                    {/* TAB 1: EVALUATION REPORTS / SESSION HISTORY */}
                    {activeTab === 'candidates' && !selectedSession && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            {/* Summary Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">{sessions.length}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Total Interviews</p>
                                    </div>
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <FileText size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">
                                            {sessions.length > 0 
                                                ? `${Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / sessions.length)}%` 
                                                : '0%'}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Average Score</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <CheckCircle2 size={24} />
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">
                                            {sessions.reduce((acc, s) => acc + (s.proctoringReport?.violations?.length || 0), 0)}
                                        </p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">Integrity Flags</p>
                                    </div>
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
                                        <AlertTriangle size={24} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/60 px-4 py-2.5 rounded-xl w-full sm:max-w-md focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/5 transition-all">
                                        <Search size={18} className="text-slate-400 shrink-0" />
                                        <input
                                            placeholder="Search by candidate name or email..."
                                            className="bg-transparent outline-none text-sm w-full text-slate-800 placeholder:text-slate-400"
                                            value={searchTerm}
                                            onChange={e => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        onClick={handleDownloadCSV}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 active:scale-[0.98]"
                                    >
                                        <Download size={14} className="shrink-0" /> EXPORT ALL DATA
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4">Candidate</th>
                                                <th className="px-6 py-4">Assessment Path</th>
                                                <th className="px-6 py-4">Date Conducted</th>
                                                <th className="px-6 py-4">Overall Score</th>
                                                <th className="px-6 py-4">Status</th>
                                                <th className="px-6 py-4 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredSessions.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium bg-slate-50/20">
                                                        No candidate interview sessions found.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredSessions.map((s) => (
                                                    <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="font-semibold text-slate-800">{s.candidate.name}</div>
                                                            <div className="text-xs text-slate-400 mt-0.5">{s.candidate.email}</div>
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-600 font-medium">
                                                            {s.candidate.role}
                                                        </td>
                                                        <td className="px-6 py-4 text-slate-500">
                                                            {new Date(s.date).toLocaleDateString()} at {new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`font-bold text-base ${
                                                                s.overallScore >= 75 ? 'text-emerald-600' : s.overallScore >= 50 ? 'text-amber-600' : 'text-rose-600'
                                                            }`}>
                                                                {Math.round(s.overallScore)}%
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase ${
                                                                s.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                s.status === 'TERMINATED' ? 'bg-red-50 text-red-700 border border-red-100' :
                                                                'bg-amber-50 text-amber-700 border border-amber-100'
                                                            }`}>
                                                                {s.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <button 
                                                                onClick={() => setSelectedSession(s)} 
                                                                className="px-4 py-2 border border-slate-200 hover:border-indigo-500 hover:text-indigo-600 bg-white rounded-lg text-xs font-bold transition-all shadow-sm"
                                                            >
                                                                View Report
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'candidates' && selectedSession && (
                        <div className="space-y-6 animate-in fade-in duration-300 pb-10">
                            {selectedSession.evaluationReport?.evaluation_logic ? (
                                <SessionReportView
                                    candidate={{
                                        name: selectedSession.candidate.name,
                                        email: selectedSession.candidate.email,
                                        role: selectedSession.candidate.role
                                    }}
                                    evalReport={selectedSession.evaluationReport.evaluation_logic}
                                    sessionId={selectedSession.id}
                                    mode="admin"
                                />
                            ) : (
                                <div className="bg-white p-12 border border-slate-200 rounded-3xl text-center shadow-sm max-w-lg mx-auto mt-10">
                                    <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                    <h3 className="font-bold text-slate-800 text-lg">No AI Report Found</h3>
                                    <p className="text-slate-400 text-sm mt-2">The evaluation report is either missing or failed generation for this session.</p>
                                    <button 
                                        onClick={() => setSelectedSession(null)} 
                                        className="mt-6 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all"
                                    >
                                        Return to Sessions
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 2: INTERVIEW FLOW & QUESTION EDITOR */}
                    {activeTab === 'questions' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
                            {/* Toggle between CSE and ECE */}
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg">Question Bank Selection</h3>
                                    <p className="text-xs text-slate-400">Choose the technical domain questions to edit.</p>
                                </div>
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                                    <button
                                        onClick={() => { setSelectedRole('CSE'); setQuestionsFilter('all'); }}
                                        className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                                            selectedRole === 'CSE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Computer Science (CSE)
                                    </button>
                                    <button
                                        onClick={() => { setSelectedRole('ECE'); setQuestionsFilter('all'); }}
                                        className={`px-6 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase transition-all ${
                                            selectedRole === 'ECE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                    >
                                        Electronics (ECE)
                                    </button>
                                </div>
                            </div>

                            {/* SUCCESS MESSAGE BANNER */}
                            {successMessage && (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top-2 duration-300">
                                    <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                                    {successMessage}
                                </div>
                            )}

                            {/* DYNAMIC INTERVIEW FLOW CHART */}
                            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                        <Sliders size={20} className="text-indigo-500" /> Active Adaptive Interview Flow
                                    </h3>
                                    <p className="text-xs text-slate-400">Click on any stage in the path below to filter and edit its questions.</p>
                                </div>

                                <div className="flex flex-col xl:flex-row items-stretch gap-3 pt-4">
                                    {/* Stage 1 */}
                                    <div 
                                        onClick={() => setQuestionsFilter('Fundamentals')}
                                        className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                            questionsFilter === 'Fundamentals' 
                                                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                        }`}
                                    >
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 1</span>
                                            <h4 className="font-bold text-sm text-slate-800 mt-1">Fundamentals</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Basic concepts & entry-level questions.</p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Q1 of 5</span>
                                            <span className="text-xs font-black text-slate-500">{getStageCount('Fundamentals')} Qs</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden xl:flex items-center text-slate-300">→</div>

                                    {/* Stage 2 */}
                                    <div 
                                        onClick={() => setQuestionsFilter('Core')}
                                        className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                            questionsFilter === 'Core' 
                                                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                        }`}
                                    >
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 2</span>
                                            <h4 className="font-bold text-sm text-slate-800 mt-1">Core Tech (Adaptive)</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Core details; splits dynamically by difficulty.</p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Q2 of 5</span>
                                            <span className="text-xs font-black text-slate-500">{getStageCount('Core')} Qs</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden xl:flex items-center text-slate-300">→</div>

                                    {/* Stage 3 */}
                                    <div 
                                        onClick={() => setQuestionsFilter('Scenario')}
                                        className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                            questionsFilter === 'Scenario' 
                                                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                        }`}
                                    >
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 3</span>
                                            <h4 className="font-bold text-sm text-slate-800 mt-1">Scenario/Case Study</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Practical problem solving scenario.</p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">Q3 of 5</span>
                                            <span className="text-xs font-black text-slate-500">{getStageCount('Scenario')} Qs</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden xl:flex items-center text-slate-300">→</div>

                                    {/* Stage 4 */}
                                    <div 
                                        onClick={() => setQuestionsFilter('Behavioral Experience')}
                                        className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                            questionsFilter === 'Behavioral Experience' 
                                                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                        }`}
                                    >
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 4</span>
                                            <h4 className="font-bold text-sm text-slate-800 mt-1">Behavioral Exp</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Evaluates past candidate experience.</p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Q4 of 5</span>
                                            <span className="text-xs font-black text-slate-500">{getStageCount('Behavioral Experience')} Qs</span>
                                        </div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="hidden xl:flex items-center text-slate-300">→</div>

                                    {/* Stage 5 */}
                                    <div 
                                        onClick={() => setQuestionsFilter('Behavioral Situation')}
                                        className={`flex-1 p-5 rounded-2xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                                            questionsFilter === 'Behavioral Situation' 
                                                ? 'bg-indigo-50/70 border-indigo-500 shadow-md ring-2 ring-indigo-500/5' 
                                                : 'bg-slate-50/50 hover:bg-slate-50 border-slate-200/80'
                                        }`}
                                    >
                                        <div>
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Stage 5</span>
                                            <h4 className="font-bold text-sm text-slate-800 mt-1">Behavioral Situation</h4>
                                            <p className="text-[11px] text-slate-400 mt-1">Evaluates scenario-based behavior.</p>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">Q5 of 5</span>
                                            <span className="text-xs font-black text-slate-500">{getStageCount('Behavioral Situation')} Qs</span>
                                        </div>
                                    </div>
                                </div>

                                {questionsFilter !== 'all' && (
                                    <div className="flex justify-end pt-2">
                                        <button 
                                            onClick={() => setQuestionsFilter('all')}
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 hover:underline"
                                        >
                                            View All Questions in Bank ({questionsList.length}) →
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* QUESTION EDITOR LIST */}
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-extrabold text-slate-800 text-lg">
                                            {questionsFilter === 'all' ? 'All Questions' : `${questionsFilter} Questions`} ({filteredQuestions.length})
                                        </h3>
                                        <p className="text-xs text-slate-400">Add, edit, or delete questions for the candidates below.</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={handleResetQuestions}
                                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-black flex items-center gap-2 border border-slate-300 transition-all active:scale-[0.98]"
                                            title="Restore default question set"
                                        >
                                            <RefreshCw size={14} /> Restore Defaults
                                        </button>
                                        <button
                                            onClick={handleSaveQuestions}
                                            disabled={isSaving}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                                        >
                                            <Save size={14} /> {isSaving ? "Saving..." : "Save Changes"}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {filteredQuestions.length === 0 ? (
                                        <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300 text-slate-400 font-semibold shadow-sm">
                                            No questions found for this stage. Click "Add New Question" below to create one.
                                        </div>
                                    ) : (
                                        filteredQuestions.map((q, idx) => (
                                            <div key={q.id} className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm relative group hover:border-slate-300 transition-all">
                                                <button 
                                                    onClick={() => handleDeleteQuestion(q.id)} 
                                                    className="absolute top-5 right-5 text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-slate-50"
                                                    title="Delete Question"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                
                                                <div className="flex items-center gap-2 mb-4">
                                                    <span className="bg-slate-100 text-slate-500 font-bold w-6 h-6 rounded flex items-center justify-center text-[10px]">#{idx + 1}</span>
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Question Details</span>
                                                </div>

                                                <div className="space-y-4">
                                                    {/* Question Input */}
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Question Text</label>
                                                        <textarea 
                                                            className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-sm outline-none transition-all resize-y h-20 text-slate-800" 
                                                            value={q.question} 
                                                            onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)} 
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        {/* Difficulty */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Difficulty Level</label>
                                                            <select 
                                                                value={q.difficulty}
                                                                onChange={(e) => handleUpdateQuestion(q.id, 'difficulty', e.target.value)}
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-medium"
                                                            >
                                                                <option value="easy">Easy</option>
                                                                <option value="medium">Medium</option>
                                                                <option value="hard">Hard (High Level)</option>
                                                            </select>
                                                        </div>

                                                        {/* Stage / Type */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Flow Stage (Type)</label>
                                                            <select 
                                                                value={q.type}
                                                                onChange={(e) => handleUpdateQuestion(q.id, 'type', e.target.value)}
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all bg-white text-slate-800 font-medium"
                                                            >
                                                                <option value="Fundamentals">Stage 1: Fundamentals</option>
                                                                <option value="Core">Stage 2: Core Technical</option>
                                                                <option value="Scenario">Stage 3: Scenario Case Study</option>
                                                                <option value="Behavioral Experience">Stage 4: Behavioral Experience</option>
                                                                <option value="Behavioral Situation">Stage 5: Behavioral Situation</option>
                                                            </select>
                                                        </div>

                                                        {/* Topic */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Topic / Sub-area</label>
                                                            <input 
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-2.5 text-xs outline-none transition-all text-slate-800" 
                                                                value={q.topic || ''} 
                                                                onChange={(e) => handleUpdateQuestion(q.id, 'topic', e.target.value)} 
                                                                placeholder="e.g. Data Structures"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        {/* Ideal Reference Answer */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Reference Ideal Answer (AI Evaluation Criteria)</label>
                                                            <textarea 
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none transition-all resize-y h-28 text-slate-800" 
                                                                value={q.ideal_answer || ''} 
                                                                onChange={(e) => handleUpdateQuestion(q.id, 'ideal_answer', e.target.value)} 
                                                                placeholder="What the AI evaluation engine will look for..." 
                                                            />
                                                        </div>

                                                        {/* Key Checklist / Points */}
                                                        <div>
                                                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Key Checklist Points (Comma-Separated)</label>
                                                            <textarea 
                                                                className="w-full border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl p-3 text-xs outline-none transition-all resize-y h-28 text-slate-800" 
                                                                value={(q.keyPoints || []).join(', ')} 
                                                                onChange={(e) => handleUpdateQuestion(q.id, 'keyPoints', e.target.value.split(',').map(s => s.trim()).filter(s => s))} 
                                                                placeholder="e.g. Memory address, Index mapping, Contiguous block"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    <button 
                                        onClick={handleAddQuestion} 
                                        className="w-full py-4 border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-slate-50 hover:text-indigo-600 rounded-2xl text-slate-400 font-bold transition-all flex items-center justify-center gap-2 text-sm shadow-sm"
                                    >
                                        <Plus size={18} /> Add New Question Template
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: SYSTEM HEALTH */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg">System Verification Panel</h3>
                                    <p className="text-xs text-slate-400">Live operational status of services.</p>
                                </div>
                                {health && (
                                    <div className="text-xs text-slate-500 flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg font-mono">
                                        <Activity size={14} className="text-indigo-500" /> Last Checked: {new Date(health.lastChecked).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Services check */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                                        <Server className="text-indigo-500 shrink-0" size={18} /> Infrastructure Connectivity
                                    </h3>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <div className="flex items-center gap-3">
                                                <Database size={18} className="text-slate-400 shrink-0" />
                                                <span className="font-semibold text-xs text-slate-700">Supabase SQL Database</span>
                                            </div>
                                            {health?.database ? (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">ONLINE</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">OFFLINE</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <div className="flex items-center gap-3">
                                                <Server size={18} className="text-slate-400 shrink-0" />
                                                <span className="font-semibold text-xs text-slate-700">Storage Buckets (Media)</span>
                                            </div>
                                            {health?.storage ? (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">CONNECTED</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">DISCONNECTED</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <div className="flex items-center gap-3">
                                                <Terminal size={18} className="text-slate-400 shrink-0" />
                                                <span className="font-semibold text-xs text-slate-700">Authentication Service</span>
                                            </div>
                                            {health?.auth ? (
                                                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">OPERATIONAL</span>
                                            ) : (
                                                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200/50 px-2.5 py-1 rounded-full uppercase tracking-wider">OFFLINE</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Environment Data Count */}
                                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-6">
                                    <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 pb-3 border-b border-slate-100">
                                        <Database className="text-indigo-500 shrink-0" size={18} /> Database Records Count
                                    </h3>
                                    
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <span className="font-semibold text-xs text-slate-700">Active Technical Question Banks</span>
                                            <span className="text-slate-800 font-bold text-sm">2 Roles (CSE & ECE)</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <span className="font-semibold text-xs text-slate-700">Interview Session Records</span>
                                            <span className="text-slate-800 font-bold text-sm">{sessions.length} sessions</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/40">
                                            <span className="font-semibold text-xs text-slate-700">Unique Evaluated Candidates</span>
                                            <span className="text-slate-800 font-bold text-sm">
                                                {new Set(sessions.map(s => s.candidate.email)).size} candidates
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 4: SYSTEM ERROR LOGS */}
                    {activeTab === 'errors' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-slate-800 text-lg">System Errors Monitor</h3>
                                    <p className="text-xs text-slate-400">View real-time and historical runtime exceptions during interviews and evaluation.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <select
                                        value={errorsFilter}
                                        onChange={(e) => setErrorsFilter(e.target.value)}
                                        className="border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl px-4 py-2.5 text-xs outline-none bg-white text-slate-700 font-bold shadow-sm"
                                    >
                                        <option value="all">All Error Categories</option>
                                        <option value="database">Database Errors</option>
                                        <option value="api">API / LLM Errors</option>
                                        <option value="proctoring">Proctoring Errors</option>
                                        <option value="interview">Interview Flow Errors</option>
                                        <option value="evaluation">Grading Errors</option>
                                        <option value="system">Core System Errors</option>
                                    </select>
                                    <button
                                        onClick={handleClearErrorLogs}
                                        disabled={errorLogs.length === 0}
                                        className="px-5 py-2.5 border border-red-200 hover:bg-red-50 text-red-600 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 rounded-xl text-xs font-black transition-all active:scale-[0.98] shadow-sm flex items-center gap-2"
                                    >
                                        <Trash2 size={14} /> Clear Error Logs
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-100">
                                            <tr>
                                                <th className="px-6 py-4 w-10"></th>
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Category</th>
                                                <th className="px-6 py-4">Error Message</th>
                                                <th className="px-6 py-4">Candidate / Session</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredErrors.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium bg-slate-50/20">
                                                        No captured errors matching filter criteria.
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredErrors.map((err) => {
                                                    const isExpanded = expandedErrorId === err.id;
                                                    return (
                                                        <React.Fragment key={err.id}>
                                                            <tr 
                                                                onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                                                                className="hover:bg-slate-50/40 cursor-pointer transition-colors"
                                                            >
                                                                <td className="px-6 py-4 text-slate-400">
                                                                    {isExpanded ? '▼' : '▶'}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                                                                    {new Date(err.timestamp).toLocaleDateString()} {new Date(err.timestamp).toLocaleTimeString()}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                                                                        err.category === 'database' ? 'bg-red-100 text-red-800' :
                                                                        err.category === 'api' ? 'bg-purple-100 text-purple-800' :
                                                                        err.category === 'proctoring' ? 'bg-amber-100 text-amber-800' :
                                                                        err.category === 'interview' ? 'bg-blue-100 text-blue-800' :
                                                                        err.category === 'evaluation' ? 'bg-indigo-100 text-indigo-800' :
                                                                        'bg-slate-100 text-slate-800'
                                                                    }`}>
                                                                        {err.category}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-800 font-medium max-w-sm overflow-hidden text-ellipsis">
                                                                    {err.message}
                                                                </td>
                                                                <td className="px-6 py-4 text-slate-500 text-xs">
                                                                    {err.candidateName ? (
                                                                        <div>
                                                                            <span className="font-semibold">{err.candidateName}</span>
                                                                            {err.sessionId && <span className="text-[10px] text-slate-400 block font-mono">Session: {err.sessionId.substring(0, 8)}...</span>}
                                                                        </div>
                                                                    ) : err.sessionId ? (
                                                                        <span className="font-mono">ID: {err.sessionId.substring(0, 8)}...</span>
                                                                    ) : (
                                                                        <span className="text-slate-300">N/A</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {isExpanded && (
                                                                <tr>
                                                                    <td colSpan={5} className="px-8 py-4 bg-slate-900 text-red-400 font-mono text-xs border-l-4 border-l-red-500">
                                                                        <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-800 text-slate-500">
                                                                            <span>Exception Context Details</span>
                                                                            <button 
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    navigator.clipboard.writeText(err.details || '');
                                                                                }}
                                                                                className="hover:text-white px-2 py-0.5 bg-slate-800 rounded hover:bg-slate-700 transition-all"
                                                                            >
                                                                                Copy Details
                                                                            </button>
                                                                        </div>
                                                                        <pre className="whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">{err.details || "No technical details captured for this error."}</pre>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};
