
import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storageService';
import { InterviewSession, JobPost, Question, RoleSettings } from '../types';
import {
    Users, Settings, LogOut, Search, Shield, Briefcase, Lock, Edit, Plus, Save, X, Trash2,
    Sliders, Activity, Power, ToggleLeft, ToggleRight, Eye, LayoutDashboard, Download, PieChart, TrendingUp, ChevronRight, Link, Copy, CheckCircle, Server, Database, AlertTriangle
} from 'lucide-react';

import { SystemHealth } from '../services/healthService';

interface AdminDashboardProps {
    onLogout: () => void;
    onCreateJob?: () => void;
    health?: SystemHealth | null;
}

const DEFAULT_SETTINGS: RoleSettings = {
    difficulty: 'Medium',
    preset: 'Normal',
    weights: { concept: 50, grammar: 20, fluency: 20, camera: 10 },
    proctoring: { maxWarnings: 3, sensitivity: 'Medium', includeInScore: true }
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onCreateJob, health }) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'jobs' | 'settings' | 'system'>('overview');
    const [sessions, setSessions] = useState<InterviewSession[]>([]);
    const [jobs, setJobs] = useState<JobPost[]>([]);
    const [config, setConfig] = useState(DEFAULT_SETTINGS as any);

    const [selectedSession, setSelectedSession] = useState<InterviewSession | null>(null);
    const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
    const [editingJob, setEditingJob] = useState<JobPost | null>(null);
    const [jobEditTab, setJobEditTab] = useState<'questions' | 'settings'>('questions');

    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    const handleCopyLink = (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const link = `${window.location.origin}?jobId=${jobId}`;
        navigator.clipboard.writeText(link);
        setCopySuccess(jobId);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const { SupabaseService } = await import('../services/supabaseService');
                
                // Load config (StorageService is fine for local admin UI settings if they aren't synced yet)
                setConfig(await StorageService.getConfig());
                
                // Load Jobs
                const rawJobs = await SupabaseService.getAllJobs();
                if (rawJobs) {
                    setJobs(rawJobs.map(j => ({
                        id: j.id,
                        title: j.title,
                        description: j.description || '',
                        company: j.company || 'Unknown',
                        accessKey: j.access_key,
                        mode: j.mode,
                        status: j.status,
                        settings: j.role_settings?.[0] || DEFAULT_SETTINGS,
                        questions: j.questions || []
                    })));
                }

                // Load Sessions
                const rawSessions = await SupabaseService.getAllSessions();
                if (rawSessions) {
                    const mappedSessions: InterviewSession[] = rawSessions.map(rs => {
                        return {
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
                            // Map proctoring data if it exists
                            proctoringReport: {
                                violations: rs.all_proctoring_events ? rs.all_proctoring_events.map((v: any) => ({
                                    type: v.event_type,
                                    severity: v.severity === 'High' ? 10 : (v.severity === 'Medium' ? 5 : 1),
                                    message: v.message,
                                    timestamp: new Date(v.occurred_at).getTime(),
                                    snapshot_url: v.snapshot_url
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
                        } as unknown as InterviewSession; // Cast to legacy format for UI compatibility
                    });
                    setSessions(mappedSessions);
                }
            } catch (err) {
                console.error("Failed to load dashboard data from Supabase:", err);
            }
        };
        load();
    }, []);

    const handleSaveJob = async () => {
        if (editingJob) {
            const updatedJobs = jobs.map(j => j.id === editingJob.id ? editingJob : j);
            setJobs(updatedJobs);
            await StorageService.saveJobs(updatedJobs);
            setSelectedJob(editingJob);
            setEditingJob(null);
        }
    };

    const handleCreateJob = async () => {
        if (onCreateJob) {
            onCreateJob();
            return;
        }

        const newJob: JobPost = {
            id: `job-${Date.now()}`,
            title: 'New Role Title',
            description: 'Role description...',
            company: 'Your Company',
            accessKey: '0000',
            mode: 'AI',
            status: 'ACTIVE',
            settings: { ...DEFAULT_SETTINGS },
            questions: []
        };
        const updatedJobs = [...jobs, newJob];
        setJobs(updatedJobs);
        await StorageService.saveJobs(updatedJobs);
        setEditingJob(newJob);
        setJobEditTab('settings');
    };

    const handleToggleStatus = async (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const job = jobs.find(j => j.id === jobId);
        if (job) {
            const newStatus = job.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            const updatedJobs = jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j);
            setJobs(updatedJobs);
            await StorageService.saveJobs(updatedJobs);
            if (selectedJob?.id === jobId) setSelectedJob({ ...selectedJob, status: newStatus });
        }
    };

    const applyPreset = (preset: 'Relaxed' | 'Normal' | 'Strict' | 'Custom') => {
        if (!editingJob) return;

        let newSettings = { ...editingJob.settings, preset };

        if (preset === 'Relaxed') {
            newSettings.weights = { concept: 40, grammar: 10, fluency: 40, camera: 10 };
            newSettings.proctoring = { maxWarnings: 5, sensitivity: 'Low', includeInScore: false };
            newSettings.difficulty = 'Easy';
        } else if (preset === 'Normal') {
            newSettings.weights = { concept: 50, grammar: 20, fluency: 20, camera: 10 };
            newSettings.proctoring = { maxWarnings: 3, sensitivity: 'Medium', includeInScore: true };
            newSettings.difficulty = 'Medium';
        } else if (preset === 'Strict') {
            newSettings.weights = { concept: 60, grammar: 25, fluency: 10, camera: 5 };
            newSettings.proctoring = { maxWarnings: 2, sensitivity: 'High', includeInScore: true };
            newSettings.difficulty = 'Hard';
        }

        setEditingJob({ ...editingJob, settings: newSettings });
    };

    const handleUpdateQuestion = (qId: number, field: keyof Question, value: any) => {
        if (editingJob) {
            const updatedQuestions = editingJob.questions.map(q =>
                q.id === qId ? { ...q, [field]: value } : q
            );
            setEditingJob({ ...editingJob, questions: updatedQuestions });
        }
    };

    const handleAddQuestion = () => {
        if (editingJob) {
            const newQuestion: Question = {
                id: Date.now(),
                question: "New Question...",
                difficulty: 'Medium',
                ideal_answer: "Add reference answer here...",
                keyPoints: [],
                maxScore: 10
            };
            setEditingJob({
                ...editingJob,
                questions: [...editingJob.questions, newQuestion]
            });
        }
    };

    const handleDeleteQuestion = (qId: number) => {
        if (editingJob && confirm('Delete this question?')) {
            setEditingJob({
                ...editingJob,
                questions: editingJob.questions.filter(q => q.id !== qId)
            });
        }
    };

    const filteredSessions = sessions.filter(s =>
        s.candidate.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this job role? This cannot be undone.')) {
            await StorageService.deleteJob(jobId);
            const updatedJobs = jobs.filter(j => j.id !== jobId);
            setJobs(updatedJobs);
            if (selectedJob?.id === jobId) setSelectedJob(null);
            if (editingJob?.id === jobId) setEditingJob(null);
        }
    };

    const handleDownloadCSV = () => {
        if (sessions.length === 0) return;
        
        const headers = ['Candidate Name', 'Access ID', 'Date', 'Status', 'Overall Score', 'Warnings'];
        const rows = sessions.map(s => [
            s.candidate.name,
            s.candidate.accessId,
            new Date(s.date).toLocaleDateString(),
            s.status,
            `${s.overallScore}%`,
            s.warnings.length
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

    const getStats = () => {
        const totalCandidates = sessions.length;
        const avgScore = totalCandidates > 0 
            ? Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / totalCandidates) 
            : 0;
        const activeJobs = jobs.filter(j => j.status === 'ACTIVE').length;
        const totalWarnings = sessions.reduce((acc, s) => acc + s.warnings.length, 0);

        return { totalCandidates, avgScore, activeJobs, totalWarnings };
    };

    const stats = getStats();

    return (
        <div className="h-screen w-screen flex bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
                <div className="p-6 flex items-center gap-3 text-white border-b border-slate-800">
                    <Shield className="text-indigo-500" size={28} />
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Reicrew AI</h1>
                        <p className="text-xs text-slate-500">Admin Portal</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                        { id: 'jobs', icon: Briefcase, label: 'Job Roles' },
                        { id: 'candidates', icon: Users, label: 'Candidates' },
                        { id: 'system', icon: Activity, label: 'System Health' },
                        { id: 'settings', icon: Settings, label: 'Settings' }
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id as any); setSelectedSession(null); setSelectedJob(null); setEditingJob(null); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800'}`}>
                            <item.icon size={20} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">
                        <LogOut size={20} /> Exit Portal
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">
                        {activeTab === 'overview' && 'Dashboard Overview'}
                        {activeTab === 'candidates' && (selectedSession ? `Candidate: ${selectedSession.candidate.name}` : 'Session History')}
                        {activeTab === 'jobs' && (editingJob ? `Editing: ${editingJob.title}` : 'Role Management')}
                        {activeTab === 'system' && 'System Health'}
                        {activeTab === 'settings' && 'Global Configuration'}
                    </h2>

                    {/* Back Buttons */}
                    {selectedSession && activeTab === 'candidates' && (
                        <button onClick={() => setSelectedSession(null)} className="text-sm text-indigo-600 font-bold hover:underline">← Back to List</button>
                    )}
                    {selectedJob && !editingJob && activeTab === 'jobs' && (
                        <button onClick={() => setSelectedJob(null)} className="text-sm text-indigo-600 font-bold hover:underline">← Back to Roles</button>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8">

                    {/* TAB: SYSTEM HEALTH */}
                    {activeTab === 'system' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">System Health</h2>
                                    <p className="text-slate-500">Live configuration and connectivity status</p>
                                </div>
                                {health && (
                                    <div className="text-sm text-slate-500 flex items-center gap-2">
                                        <Activity size={16} /> Last Synced: {new Date(health.lastChecked).toLocaleTimeString()}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Core Services */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Server className="text-indigo-500" /> Infrastructure
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Database size={18} className="text-slate-500" />
                                                <span className="font-medium text-slate-700">Database (14 Tables)</span>
                                            </div>
                                            {health?.database ? <CheckCircle size={18} className="text-emerald-500" /> : <X size={18} className="text-red-500" />}
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Server size={18} className="text-slate-500" />
                                                <span className="font-medium text-slate-700">Storage (3 Buckets)</span>
                                            </div>
                                            {health?.storage ? <CheckCircle size={18} className="text-emerald-500" /> : <X size={18} className="text-red-500" />}
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <Lock size={18} className="text-slate-500" />
                                                <span className="font-medium text-slate-700">Authentication</span>
                                            </div>
                                            {health?.auth ? <CheckCircle size={18} className="text-emerald-500" /> : <X size={18} className="text-red-500" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Data Counts */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                        <Database className="text-indigo-500" /> Environment Data
                                    </h3>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">Job Posts</span>
                                            <span className="text-slate-900 font-bold">{jobs.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">Interview Sessions</span>
                                            <span className="text-slate-900 font-bold">{sessions.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                            <span className="font-medium text-slate-700">Candidates</span>
                                            <span className="text-slate-900 font-bold">{new Set(sessions.map(s => s.candidate.email)).size}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {health?.errors && health.errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                                    <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2">
                                        <AlertTriangle className="text-red-500" /> System Errors
                                    </h3>
                                    <ul className="list-disc list-inside space-y-2 text-sm text-red-700 font-mono">
                                        {health.errors.map((e, i) => <li key={i}>{e}</li>)}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB: OVERVIEW --- */}
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Metric Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <Users size={24} />
                                        </div>
                                        <TrendingUp size={16} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">{stats.totalCandidates}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total Candidates</p>
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                            <PieChart size={24} />
                                        </div>
                                        <TrendingUp size={16} className="text-emerald-500" />
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">{stats.avgScore}%</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Average Score</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                                            <Briefcase size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">{stats.activeJobs}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active Roles</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                                            <Shield size={24} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-3xl font-black text-slate-800">{stats.totalWarnings}</p>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Integrity Flags</p>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Activity & Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                            <Activity size={20} className="text-indigo-500" /> Recent Sessions
                                        </h3>
                                        <button onClick={() => setActiveTab('candidates')} className="text-xs font-bold text-indigo-600 hover:underline">View All</button>
                                    </div>
                                    <div className="divide-y divide-slate-50">
                                        {sessions.slice(0, 5).map(s => (
                                            <div key={s.id} className="p-4 hover:bg-slate-50 flex items-center justify-between group cursor-pointer" onClick={() => { setSelectedSession(s); setActiveTab('candidates'); }}>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                                                        {s.candidate.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{s.candidate.name}</p>
                                                        <p className="text-[10px] text-slate-400">{new Date(s.date).toLocaleDateString()} • {s.status}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xs font-black ${s.overallScore > 70 ? 'text-emerald-500' : 'text-slate-500'}`}>{s.overallScore}%</span>
                                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black mb-2">Create New Role</h3>
                                            <p className="text-indigo-100 text-sm mb-6 max-w-[200px]">Define a new interview path with custom AI parameters.</p>
                                            <button onClick={handleCreateJob} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-sm hover:bg-indigo-50 transition-all flex items-center gap-2">
                                                <Plus size={18} /> START CONFIG
                                            </button>
                                        </div>
                                        <Briefcase size={120} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform duration-700" />
                                    </div>

                                    <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-200 relative overflow-hidden group">
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black mb-2">Export Data</h3>
                                            <p className="text-slate-400 text-sm mb-6 max-w-[200px]">Download all session records as a CSV file for processing.</p>
                                            <button onClick={handleDownloadCSV} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700">
                                                <Download size={18} /> GENERATE REPORT
                                            </button>
                                        </div>
                                        <Download size={120} className="absolute -bottom-4 -right-4 text-white/5 group-hover:scale-110 transition-transform duration-700" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: CANDIDATES --- */}
                    {activeTab === 'candidates' && !selectedSession && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <Search size={18} className="text-slate-400" />
                                    <input
                                        placeholder="Search candidate names..."
                                        className="flex-1 outline-none text-sm"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleDownloadCSV}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                                >
                                    <Download size={14} /> EXPORT CSV
                                </button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                                    <tr>
                                        <th className="px-6 py-4">Candidate</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Score</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredSessions.map((s) => (
                                        <tr key={s.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium">{s.candidate.name}</td>
                                            <td className="px-6 py-4 text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-bold text-slate-700">{Math.round(s.overallScore)}%</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setSelectedSession(s)} className="text-indigo-600 font-medium">View Report</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'candidates' && selectedSession && (
                        <div className="space-y-6 animate-fade-in pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {Math.round(selectedSession.overallScore)}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Overall Score</p>
                                        <p className="text-sm font-bold text-slate-700">Performance Index</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${(selectedSession.proctoringReport?.violations?.length || 0) === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                        {selectedSession.proctoringReport?.violations?.length || 0}
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Integrity Issues</p>
                                        <p className="text-sm font-bold text-slate-700">Total Violations</p>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                                        {Math.round(selectedSession.results?.reduce((acc, r) => acc + (r.confidenceScore || 0), 0) / (selectedSession.results?.length || 1)) || 0}%
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Eye Contact</p>
                                        <p className="text-sm font-bold text-slate-700">Consistency Avg</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700 flex items-center gap-2">
                                    <Activity size={18} className="text-indigo-500" />
                                    Proctoring Log
                                </div>
                                <div className="p-4">
                                    {(selectedSession.proctoringReport?.violations?.length || 0) > 0 ? (
                                        <div className="space-y-4">
                                            {selectedSession.proctoringReport?.violations?.map((w: any, idx: number) => (
                                                <div key={idx} className="flex flex-col gap-3 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                                                    <div className="flex items-center gap-3 text-xs">
                                                        <Shield size={16} className="text-amber-600" />
                                                        <span className="font-mono text-slate-500">{new Date(w.timestamp).toLocaleTimeString()}</span>
                                                        <span className="font-bold text-amber-800 uppercase tracking-wide">{w.type.replace(/_/g, ' ')}</span>
                                                        <span className="text-amber-700 ml-2">- {w.message}</span>
                                                    </div>
                                                    
                                                    {/* Media Display */}
                                                    {(w.snapshot_url || w.clip_url) && (
                                                        <div className="flex gap-4 mt-2">
                                                            {w.snapshot_url && (
                                                                <div className="flex-1 max-w-xs">
                                                                    <p className="text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest">Violation Snapshot</p>
                                                                    <img src={w.snapshot_url} alt="Violation Snapshot" className="w-full h-auto rounded border border-amber-200 shadow-sm" />
                                                                </div>
                                                            )}
                                                            {w.clip_url && (
                                                                <div className="flex-1 max-w-xs">
                                                                    <p className="text-[10px] font-bold text-amber-600 mb-1 uppercase tracking-widest">Surrounding 10s Clip</p>
                                                                    <video src={w.clip_url} controls className="w-full h-auto rounded border border-amber-200 shadow-sm bg-black" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-6 text-slate-400 text-sm italic">
                                            No integrity violations detected for this session.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">Question-by-Question Breakdown</div>
                                <div className="divide-y divide-slate-100">
                                    {selectedSession.results.map((r, i) => (
                                        <div key={i} className="p-6">
                                            <div className="flex justify-between mb-2">
                                                <h4 className="font-bold text-slate-800">Q{i + 1}: {r.questionText}</h4>
                                                <span className={`text-xs font-bold px-2 py-1 rounded border ${r.verdict === 'Pass' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{r.verdict}</span>
                                            </div>
                                            <p className="text-slate-600 italic mb-4 bg-slate-50 p-3 rounded text-sm">"{r.userAnswer}"</p>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mb-4">
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <span className="block text-slate-400 font-bold uppercase tracking-tighter mb-1">Concept</span>
                                                    <div className="flex items-end gap-1">
                                                        <span className="text-indigo-600 font-bold text-lg leading-none">{r.contentScore}</span>
                                                        <span className="text-slate-300 mb-0.5">/10</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <span className="block text-slate-400 font-bold uppercase tracking-tighter mb-1">Grammar</span>
                                                    <div className="flex items-end gap-1">
                                                        <span className="text-indigo-600 font-bold text-lg leading-none">{r.grammarScore}</span>
                                                        <span className="text-slate-300 mb-0.5">/10</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <span className="block text-slate-400 font-bold uppercase tracking-tighter mb-1">Fluency</span>
                                                    <div className="flex items-end gap-1">
                                                        <span className="text-indigo-600 font-bold text-lg leading-none">{r.fluencyScore}</span>
                                                        <span className="text-slate-300 mb-0.5">/10</span>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-2 rounded">
                                                    <span className="block text-slate-400 font-bold uppercase tracking-tighter mb-1">Visual</span>
                                                    <div className="flex items-end gap-1">
                                                        <span className="text-indigo-600 font-bold text-lg leading-none">{r.confidenceScore}</span>
                                                        <span className="text-slate-300 mb-0.5">%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <p className="text-sm text-slate-700"><span className="font-bold">Evaluation:</span> {r.feedback}</p>
                                                <p className="text-[10px] text-slate-400 font-mono tracking-tight bg-slate-50 px-2 py-1 rounded inline-block w-fit">Vision Analysis: {r.expressionAnalysis}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: JOBS LIST --- */}
                    {activeTab === 'jobs' && !selectedJob && !editingJob && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <p className="text-slate-500 text-sm">Manage interview roles and configuration settings.</p>
                                <button onClick={handleCreateJob} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700">
                                    <Plus size={18} /> New Role
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {jobs.map(job => (
                                    <div key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-full ${job.status === 'INACTIVE' ? 'border-slate-100 opacity-70' : 'border-slate-200'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{job.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => handleToggleStatus(job.id, e)}
                                                    className={`p-1 rounded-full transition-colors ${job.status === 'ACTIVE' ? 'text-emerald-500 hover:text-emerald-600' : 'text-slate-300 hover:text-slate-500'}`}
                                                    title={job.status === 'ACTIVE' ? 'Deactivate Role' : 'Activate Role'}
                                                >
                                                    {job.status === 'ACTIVE' ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteJob(job.id, e)}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                                    title="Delete Role"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleCopyLink(job.id, e)}
                                                    className={`p-1.5 transition-colors ${copySuccess === job.id ? 'text-emerald-500' : 'text-slate-300 hover:text-indigo-500'}`}
                                                    title="Copy Interview Link"
                                                >
                                                    {copySuccess === job.id ? <CheckCircle size={20} /> : <Link size={20} />}
                                                </button>
                                                <Edit size={16} className="text-slate-300 group-hover:text-indigo-600" />
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm flex-1">{job.description}</p>

                                        <div className="mt-4 flex flex-wrap gap-2 text-xs pt-4 border-t border-slate-100">
                                            <span className={`px-2 py-1 rounded font-bold ${job.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {job.status}
                                            </span>
                                            <span className="bg-slate-100 px-2 py-1 rounded font-bold text-slate-600">{job.questions.length} Qs</span>
                                            <span className="bg-indigo-50 px-2 py-1 rounded font-bold text-indigo-600">{job.settings?.preset || 'Normal'} Preset</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- JOB DETAILS (READ ONLY) --- */}
                    {activeTab === 'jobs' && selectedJob && !editingJob && (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedJob.title}</h2>
                                    <p className="text-slate-500">{selectedJob.description}</p>
                                </div>
                                <button
                                    onClick={() => { setEditingJob(selectedJob); setJobEditTab('questions'); }}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center gap-2"
                                >
                                    <Edit size={16} /> Edit Role
                                </button>
                            </div>
                            {/* Preview of Questions only */}
                            <div className="p-6 space-y-4">
                                {selectedJob.questions.map((q, idx) => (
                                    <div key={q.id} className="p-4 border border-slate-100 rounded-lg bg-white shadow-sm opacity-80">
                                        <div className="flex justify-between">
                                            <p className="font-bold text-slate-700">Q{idx + 1}: {q.question}</p>
                                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">{q.difficulty}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- EDIT MODE --- */}
                    {activeTab === 'jobs' && editingJob && (
                        <div className="space-y-6 flex flex-col h-full">
                            <div className="flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold text-slate-800">Editing Role</h2>
                                <div className="flex gap-2">
                                    <button onClick={() => setEditingJob(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-bold">Cancel</button>
                                    <button onClick={handleSaveJob} className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-bold flex items-center gap-2">
                                        <Save size={16} /> Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <input
                                    className="w-full text-lg font-bold border-b border-slate-200 pb-2 focus:border-indigo-600 outline-none"
                                    value={editingJob.title}
                                    onChange={e => setEditingJob({ ...editingJob, title: e.target.value })}
                                    placeholder="Role Title"
                                />
                                <input
                                    className="w-full text-sm text-slate-500 focus:text-slate-800 outline-none"
                                    value={editingJob.description}
                                    onChange={e => setEditingJob({ ...editingJob, description: e.target.value })}
                                    placeholder="Role Description"
                                />
                            </div>

                            {/* Sub-Tabs */}
                            <div className="flex gap-1 bg-slate-200 p-1 rounded-lg w-fit shrink-0">
                                <button
                                    onClick={() => setJobEditTab('questions')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${jobEditTab === 'questions' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Questions
                                </button>
                                <button
                                    onClick={() => setJobEditTab('settings')}
                                    className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${jobEditTab === 'settings' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Settings & Weights
                                </button>
                            </div>

                            {/* --- SETTINGS EDITOR --- */}
                            {jobEditTab === 'settings' && (
                                <div className="space-y-6 overflow-y-auto pb-10">
                                    {/* Presets */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Sliders size={20} className="text-indigo-500" /> Scoring Configuration
                                        </h3>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                            {['Relaxed', 'Normal', 'Strict', 'Custom'].map((p) => (
                                                <button
                                                    key={p}
                                                    onClick={() => applyPreset(p as any)}
                                                    className={`py-3 px-4 rounded-lg font-bold text-sm border-2 transition-all ${editingJob.settings.preset === p
                                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                                                        : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-300'
                                                        }`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>

                                        <div className="mb-6">
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Overall Difficulty</label>
                                            <select
                                                value={editingJob.settings.difficulty}
                                                onChange={(e) => setEditingJob({ ...editingJob, settings: { ...editingJob.settings, difficulty: e.target.value as any } })}
                                                className="w-full md:w-1/2 p-2 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-indigo-500"
                                            >
                                                <option value="Very Easy">Very Easy</option>
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                                <option value="Very Hard">Very Hard</option>
                                            </select>
                                        </div>

                                        <h4 className="font-bold text-slate-700 text-sm mb-3 border-t border-slate-100 pt-4">Scoring Weights (0-100)</h4>
                                        <div className="space-y-4">
                                            {[
                                                { key: 'concept', label: 'Conceptual Accuracy' },
                                                { key: 'grammar', label: 'Grammar & Vocabulary' },
                                                { key: 'fluency', label: 'Speech Fluency' },
                                                { key: 'camera', label: 'Visual Confidence' }
                                            ].map((w) => (
                                                <div key={w.key} className="flex items-center gap-4">
                                                    <label className="w-40 text-sm font-medium text-slate-600">{w.label}</label>
                                                    <input
                                                        type="range" min="0" max="100"
                                                        value={editingJob.settings.weights[w.key as keyof typeof editingJob.settings.weights]}
                                                        onChange={(e) => {
                                                            const newWeights = { ...editingJob.settings.weights, [w.key]: parseInt(e.target.value) };
                                                            setEditingJob({ ...editingJob, settings: { ...editingJob.settings, weights: newWeights, preset: 'Custom' } });
                                                        }}
                                                        className="flex-1 accent-indigo-600"
                                                    />
                                                    <span className="w-12 text-right font-mono text-sm font-bold text-indigo-600">
                                                        {editingJob.settings.weights[w.key as keyof typeof editingJob.settings.weights]}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Proctoring */}
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                            <Activity size={20} className="text-red-500" /> Proctoring Rules
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Max Warnings (Before Termination)</label>
                                                <input
                                                    type="number" min="1" max="5"
                                                    value={editingJob.settings.proctoring.maxWarnings}
                                                    onChange={(e) => {
                                                        const val = Math.max(1, Math.min(5, parseInt(e.target.value) || 1));
                                                        setEditingJob({ ...editingJob, settings: { ...editingJob.settings, proctoring: { ...editingJob.settings.proctoring, maxWarnings: val }, preset: 'Custom' } });
                                                    }}
                                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Sensitivity</label>
                                                <select
                                                    value={editingJob.settings.proctoring.sensitivity}
                                                    onChange={(e) => {
                                                        setEditingJob({ ...editingJob, settings: { ...editingJob.settings, proctoring: { ...editingJob.settings.proctoring, sensitivity: e.target.value as any }, preset: 'Custom' } });
                                                    }}
                                                    className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-indigo-500"
                                                >
                                                    <option value="Low">Low</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="High">High</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-4 flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={editingJob.settings.proctoring.includeInScore}
                                                onChange={(e) => {
                                                    setEditingJob({ ...editingJob, settings: { ...editingJob.settings, proctoring: { ...editingJob.settings.proctoring, includeInScore: e.target.checked }, preset: 'Custom' } });
                                                }}
                                                className="w-5 h-5 accent-indigo-600 rounded"
                                            />
                                            <span className="text-sm font-medium text-slate-700">Include Warnings in Final Score Calculation</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- QUESTIONS EDITOR (Existing) --- */}
                            {jobEditTab === 'questions' && (
                                <div className="space-y-4 overflow-y-auto pb-10">
                                    {editingJob.questions.map((q, idx) => (
                                        <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative group">
                                            <button onClick={() => handleDeleteQuestion(q.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="bg-slate-100 text-slate-500 font-bold w-6 h-6 rounded flex items-center justify-center text-xs">#{idx + 1}</span>
                                                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Question Editor</span>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Question Text</label>
                                                        <input className="w-full border border-slate-200 rounded p-2 text-sm focus:border-indigo-500 outline-none" value={q.question} onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)} />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Score</label>
                                                        <input type="number" min="1" max="100" className="w-full border border-slate-200 rounded p-2 text-sm focus:border-indigo-500 outline-none" value={q.maxScore} onChange={(e) => handleUpdateQuestion(q.id, 'maxScore', parseInt(e.target.value) || 10)} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Reference Answer</label>
                                                    <textarea className="w-full border border-slate-200 rounded p-2 text-sm h-20 focus:border-indigo-500 outline-none" value={q.ideal_answer} onChange={(e) => handleUpdateQuestion(q.id, 'ideal_answer', e.target.value)} placeholder="What AI looks for..." />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic</label>
                                                    <input className="w-full border border-slate-200 rounded p-2 text-sm focus:border-indigo-500 outline-none" value={q.topic} onChange={(e) => handleUpdateQuestion(q.id, 'topic', e.target.value)} />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Checklist / Key Points (Comma Separated)</label>
                                                    <input
                                                        className="w-full border border-slate-200 rounded p-2 text-sm focus:border-indigo-500 outline-none"
                                                        value={(q.keyPoints || []).join(', ')}
                                                        onChange={(e) => handleUpdateQuestion(q.id, 'keyPoints', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
                                                        placeholder="e.g. Speed, Reliability, Cost"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <button onClick={handleAddQuestion} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-slate-50 hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                                        <Plus size={20} /> Add New Question
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- TAB: GLOBAL SETTINGS --- */}
                    {activeTab === 'settings' && (
                        <div className="max-w-4xl space-y-8 pb-20">
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm animate-fade-in">
                                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-3">
                                    <Sliders className="text-indigo-600" size={24} />
                                    System-Wide Configuration
                                </h3>

                                <div className="space-y-8">
                                    {/* Global Difficulty */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                        <div className="col-span-1">
                                            <label className="font-bold text-slate-700 block mb-1">Interview Difficulty</label>
                                            <p className="text-xs text-slate-500 leading-relaxed">Adjusts the complexity of AI-generated questions and grading strictness.</p>
                                        </div>
                                        <div className="md:col-span-2 flex gap-2 p-1 bg-slate-100 rounded-xl">
                                            {['Easy', 'Medium', 'Hard'].map((d) => (
                                                <button
                                                    key={d}
                                                    onClick={() => {
                                                        const newConfig = { ...config, defaultDifficulty: d as any };
                                                        setConfig(newConfig);
                                                        StorageService.saveConfig(newConfig);
                                                    }}
                                                    className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${config.defaultDifficulty === d
                                                        ? 'bg-white shadow text-indigo-600'
                                                        : 'text-slate-500 hover:text-slate-800'
                                                        }`}
                                                >
                                                    {d}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Proctoring Toggles */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                        <div className="col-span-1">
                                            <label className="font-bold text-slate-700 block mb-1">Proctoring Engine</label>
                                            <p className="text-xs text-slate-500 leading-relaxed">Enable or disable specific AI monitoring features for all new sessions.</p>
                                        </div>
                                        <div className="md:col-span-2 space-y-4">
                                            <div onClick={() => {
                                                const nc = { ...config, enableEyeTracking: !config.enableEyeTracking };
                                                setConfig(nc); StorageService.saveConfig(nc);
                                            }} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${config.enableEyeTracking ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Eye size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">Eye Contact Tracking</p>
                                                        <p className="text-[10px] text-slate-500">Detects when candidates look away from the screen.</p>
                                                    </div>
                                                </div>
                                                {config.enableEyeTracking ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                                            </div>

                                            <div onClick={() => {
                                                const nc = { ...config, enableFaceDetection: !config.enableFaceDetection };
                                                setConfig(nc); StorageService.saveConfig(nc);
                                            }} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors border border-slate-200/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${config.enableFaceDetection ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                                        <Users size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">Presence Monitoring</p>
                                                        <p className="text-[10px] text-slate-500">Ensures candidate remains in frame and detects multiple faces.</p>
                                                    </div>
                                                </div>
                                                {config.enableFaceDetection ? <ToggleRight size={32} className="text-indigo-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                                            </div>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100" />

                                    {/* Analysis Sensitivity */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                                        <div className="col-span-1">
                                            <label className="font-bold text-slate-700 block mb-1">Detection Sensitivity</label>
                                            <p className="text-xs text-slate-500 leading-relaxed">Control how strictly the AI flags minor movements as violations.</p>
                                        </div>
                                        <div className="md:col-span-2 space-y-6">
                                            <div>
                                                <div className="flex justify-between text-xs font-bold text-slate-500 mb-2 uppercase tracking-tighter">
                                                    <span>Strictness: {config.aiStrictness}/10</span>
                                                </div>
                                                <input
                                                    type="range" min="1" max="10"
                                                    value={config.aiStrictness}
                                                    onChange={(e) => {
                                                        const nc = { ...config, aiStrictness: parseInt(e.target.value) };
                                                        setConfig(nc); StorageService.saveConfig(nc);
                                                    }}
                                                    className="w-full accent-indigo-600"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Eye Away (Frames)</label>
                                                    <input
                                                        type="number"
                                                        value={config.eyeAwayThreshold}
                                                        onChange={(e) => {
                                                            const nc = { ...config, eyeAwayThreshold: parseInt(e.target.value) };
                                                            setConfig(nc); StorageService.saveConfig(nc);
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Face Missing (Frames)</label>
                                                    <input
                                                        type="number"
                                                        value={config.faceMissingThreshold}
                                                        onChange={(e) => {
                                                            const nc = { ...config, faceMissingThreshold: parseInt(e.target.value) };
                                                            setConfig(nc); StorageService.saveConfig(nc);
                                                        }}
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-1">
                                                    <span>Head Movement Threshold</span>
                                                    <span>{config.headMovementThreshold}</span>
                                                </div>
                                                <input
                                                    type="range" min="0.05" max="0.5" step="0.05"
                                                    value={config.headMovementThreshold}
                                                    onChange={(e) => {
                                                        const nc = { ...config, headMovementThreshold: parseFloat(e.target.value) };
                                                        setConfig(nc); StorageService.saveConfig(nc);
                                                    }}
                                                    className="w-full accent-indigo-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-900 p-6 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-indigo-200">
                                <div className="flex items-center gap-4">
                                    <div className="bg-indigo-500/30 p-3 rounded-full">
                                        <Activity size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg">System Health</h4>
                                        <p className="text-indigo-300 text-sm">Vision Engine and TTS services are operational.</p>
                                    </div>
                                </div>
                                <button className="bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-bold backdrop-blur-sm transition-colors border border-white/10">
                                    View Logs
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main >
        </div >
    );
};
