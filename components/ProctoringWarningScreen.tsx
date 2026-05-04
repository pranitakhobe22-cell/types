
import React, { useState } from 'react';
import { ShieldAlert, Eye, Users, MonitorX, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProctoringWarningScreenProps {
    onAccept: () => void;
}

export const ProctoringWarningScreen: React.FC<ProctoringWarningScreenProps> = ({ onAccept }) => {
    const [hasRead, setHasRead] = useState(false);
    const [countdown, setCountdown] = useState(5);

    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-red-900/20 via-slate-900 to-slate-900 pointer-events-none" />

            <div className="max-w-3xl w-full max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-500 flex flex-col">
                <div className="bg-red-600 p-6 text-white text-center flex flex-col items-center shrink-0">
                    <img src="/logo-white.png" alt="Reincrew" className="w-12 h-12 object-contain mb-2 opacity-80" />
                    <ShieldAlert size={48} className="mx-auto mb-4 animate-pulse fill-white/10" />
                    <h1 className="text-3xl font-black uppercase tracking-widest">Strict Proctoring Active</h1>
                    <p className="opacity-90 mt-2 font-medium">Reincrew Integrity Policy</p>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-slate-800 border-b pb-2">Automatic Termination Rulings</h2>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900">Gaze Tracking</h3>
                                    <p className="text-xs text-red-700 mt-1">
                                        Looking away from the screen for more than 2 seconds will trigger an immediate <strong>Red Screen Warning</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900">Multi-Face Detection</h3>
                                    <p className="text-xs text-red-700 mt-1">
                                        If another person is detected in the frame, the interview will be <strong>flagged immediately</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3">
                                <div className="bg-red-100 p-2 rounded-lg text-red-600">
                                    <MonitorX size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-red-900">Full-Screen Enforcement</h3>
                                    <p className="text-xs text-red-700 mt-1">
                                        Exiting full-screen or switching tabs is strictly prohibited and recorded as a violation.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl flex items-start gap-3 shadow-lg transform scale-105">
                                <div className="bg-red-600 p-2 rounded-lg text-white animate-pulse">
                                    <AlertTriangle size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white uppercase">Termination Rule</h3>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                        Accumulating <strong className="text-red-400">4 Violations within 40 Seconds</strong> will result in
                                        <span className="text-red-400 font-bold underline ml-1">INSTANT TERMINATION</span> of your candidacy.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-xl">
                        <p className="text-sm text-yellow-800 font-medium flex gap-2">
                            <AlertTriangle size={18} />
                            <span>Ensure you are in a quiet, well-lit room alone. Close all other tabs and applications.</span>
                        </p>
                    </div>

                    <div className="pt-4 border-t flex flex-col items-center gap-4">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${hasRead ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-slate-50 group-hover:border-indigo-400'}`}>
                                {hasRead && <CheckCircle2 size={16} className="text-white" />}
                            </div>
                            <input type="checkbox" className="hidden" checked={hasRead} onChange={(e) => setHasRead(e.target.checked)} />
                            <span className={`text-sm font-bold ${hasRead ? 'text-slate-900' : 'text-slate-500'}`}>
                                I understand that my session is monitored and recorded.
                            </span>
                        </label>

                        <button
                            onClick={onAccept}
                            disabled={!hasRead || countdown > 0}
                            className={`w-full py-4 rounded-xl font-black text-lg tracking-wide transition-all flex items-center justify-center gap-2 ${!hasRead || countdown > 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200 transform hover:scale-[1.01] active:scale-[0.99]'
                                }`}
                        >
                            {countdown > 0 ? `Please Read (${countdown}s)` : (
                                <>
                                    I ACCEPT & PROCEED <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
