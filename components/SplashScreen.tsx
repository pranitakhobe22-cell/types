import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

export const SplashScreen: React.FC = () => {
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Start exit animation after 1.8s
        const exitTimer = setTimeout(() => setIsExiting(true), 1800);
        // Remove from DOM after 2.5s
        const removeTimer = setTimeout(() => setIsVisible(false), 2500);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 transition-all duration-700 ease-in-out ${isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100'}`}>
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse delay-700" />
            </div>

            <div className="relative flex flex-col items-center">
                <div className="flex flex-col items-center gap-6 relative z-10">
                    {/* Brand Logo */}
                    <div className={`transition-all duration-1000 ease-out delay-100 transform ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/10 rounded-2xl blur-xl" />
                            <Logo variant="white" className="w-24 h-24 md:w-32 md:h-32" />
                        </div>
                    </div>

                    {/* Animated Logo/Text */}
                    <div className="overflow-hidden">
                        <h1 className={`text-5xl md:text-7xl font-black tracking-tighter transition-all duration-1000 ease-out transform ${isExiting ? 'translate-y-[-20px] opacity-0' : 'translate-y-0 opacity-100'}`}>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-indigo-400 inline-block animate-text-shimmer">
                                reincrew
                            </span>
                            <span className="text-indigo-500">.</span>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-white inline-block">
                                ai
                            </span>
                        </h1>
                    </div>

                    {/* Minimal Progress Bar */}
                    <div className="w-48 h-[2px] bg-slate-800 rounded-full overflow-hidden relative">
                        <div 
                            className={`absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 transition-transform duration-[2000ms] ease-in-out origin-left ${isExiting ? 'translate-x-full' : '-translate-x-full scale-x-[2]'}`}
                        />
                    </div>

                    {/* Tagline */}
                    <p className={`text-slate-500 text-[10px] uppercase tracking-[0.4em] font-bold transition-all duration-700 delay-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
                        Verified Intelligence
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes text-shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .animate-text-shimmer {
                    background-size: 200% auto;
                    animation: text-shimmer 4s linear infinite;
                }
            `}</style>
        </div>
    );
};
