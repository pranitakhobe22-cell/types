import React, { useState } from 'react';
import { Logo } from './Logo';
import { User, Shield, Briefcase, Key, ArrowRight, Settings, PlusCircle, Layout } from 'lucide-react';
import { Candidate } from '../types';
import { AccessService } from '../services/accessService';

interface WelcomeScreenProps {
    onJoin: (candidate: Candidate) => void;
    onConduct: () => void;
    initialCandidate?: Candidate | null;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onJoin, onConduct, initialCandidate }) => {
    const [mode, setMode] = useState<'selection' | 'join'>(initialCandidate ? 'join' : 'selection');
    const [formData, setFormData] = useState({
        name: initialCandidate?.name || '',
        interviewId: initialCandidate?.jobPostId || '',
        role: initialCandidate?.position || '',
        accessKey: ''
    });
    const [error, setError] = useState('');

    const handleJoinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.interviewId || !formData.accessKey) {
            setError('Please enter both Interview ID and Access Key.');
            return;
        }

        const result = AccessService.validate(formData.interviewId, formData.accessKey);

        if (result.success) {
            onJoin({
                name: formData.name,
                accessId: formData.interviewId, // Using interview ID as access ID for session tracking
                position: formData.role,
                jobPostId: formData.interviewId
            } as Candidate);
        } else {
            setError((result as any).message); // Cast to access message from the error union
        }
    };

    if (mode === 'join') {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                    <div className="bg-indigo-600 p-8 text-white text-center">
                        <Logo variant="white" className="w-16 h-16 mx-auto mb-4" />
                        <h2 className="text-2xl font-black uppercase tracking-tight">Join Interview</h2>
                        <p className="text-indigo-100 text-sm mt-1">Enter your credentials to begin</p>
                    </div>

                    <form onSubmit={handleJoinSubmit} className="p-8 space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="e.g. John Doe"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Interview ID</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="e.g. a3f8b21c"
                                    value={formData.interviewId}
                                    onChange={e => setFormData({ ...formData, interviewId: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role / Position</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="e.g. Software Engineer"
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                    placeholder="8-character code"
                                    value={formData.accessKey}
                                    onChange={e => setFormData({ ...formData, accessKey: e.target.value })}
                                />
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-xs font-bold animate-shake">{error}</p>}

                        <div className="pt-2 space-y-3">
                            <button
                                type="submit"
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2"
                            >
                                START SESSION <ArrowRight size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('selection')}
                                className="w-full py-2 text-slate-400 hover:text-slate-600 text-sm font-bold transition-colors"
                            >
                                Go Back
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-900 to-slate-900" />
            
            <div className="max-w-4xl w-full grid md:grid-cols-2 gap-8 relative z-10">
                {/* Branding / Intro */}
                <div className="flex flex-col justify-center text-white space-y-6">
                    <div className="bg-white/10 w-20 h-20 rounded-3xl flex items-center justify-center backdrop-blur-xl border border-white/20">
                        <Logo variant="white" className="w-12 h-12" />
                    </div>
                    <div>
                        <h1 className="text-5xl font-black tracking-tight leading-tight">
                            Welcome to <span className="text-indigo-400">Reincrew AI</span>
                        </h1>
                        <p className="text-slate-400 mt-4 text-lg max-w-sm">
                            Next-generation AI proctoring and interview intelligence engine.
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Shield size={14} /> SECURE</span>
                        <span className="flex items-center gap-1"><Layout size={14} /> INTELLIGENT</span>
                        <span className="flex items-center gap-1"><User size={14} /> VERIFIED</span>
                    </div>
                </div>

                {/* Options Card */}
                <div className="space-y-4">
                    <button 
                        onClick={() => setMode('join')}
                        className="w-full bg-white hover:bg-indigo-50 p-8 rounded-3xl shadow-2xl transition-all group border-2 border-transparent hover:border-indigo-200 text-left"
                    >
                        <div className="bg-indigo-100 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <User size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 mb-2">Join Interview</h3>
                        <p className="text-slate-500 text-sm">Enter your credentials to begin your secure scheduled assessment.</p>
                        <div className="mt-8 flex items-center text-indigo-600 font-bold gap-2">
                            <span>GET STARTED</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>

                    <button 
                        onClick={onConduct}
                        className="w-full bg-slate-800/50 hover:bg-slate-800 p-8 rounded-3xl shadow-xl transition-all group border-2 border-slate-700/50 hover:border-indigo-500/50 text-left backdrop-blur-xl"
                    >
                        <div className="bg-slate-700 text-indigo-400 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">Conduct Interview</h3>
                        <p className="text-slate-400 text-sm">Access the administrative dashboard to manage roles and evaluate results.</p>
                        <div className="mt-8 flex items-center text-indigo-400 font-bold gap-2">
                            <span>ADMIN PORTAL</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};
