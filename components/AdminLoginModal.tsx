import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Eye, EyeOff, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

// Session key — keeps admin logged in for this browser tab session only
const SESSION_KEY = 'reicrew_admin_session';

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ onSuccess, onClose }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-focus password input on open
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Lockout countdown
  useEffect(() => {
    if (isLocked && lockTimer > 0) {
      timerRef.current = setTimeout(() => setLockTimer(t => t - 1), 1000);
    } else if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
      setAttempts(0);
      setError('');
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [isLocked, lockTimer]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Reincrew2026';

    if (password === adminPassword) {
      // Store session token (tab-scoped only via sessionStorage)
      sessionStorage.setItem(SESSION_KEY, 'true');
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPassword('');
      triggerShake();

      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockTimer(30);
        setError('Too many failed attempts. Try again in 30 seconds.');
      } else if (newAttempts >= 3) {
        setError(`Incorrect password. ${5 - newAttempts} attempt${5 - newAttempts === 1 ? '' : 's'} remaining.`);
      } else {
        setError('Incorrect password. Please try again.');
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        {/* Modal */}
        <div
          className={`bg-white w-full max-w-md rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200 overflow-hidden transition-transform ${isShaking ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          style={isShaking ? { animation: 'shake 0.5s ease-in-out' } : {}}
        >
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white relative overflow-hidden">
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-indigo-600/20 rounded-full" />
            <div className="absolute -bottom-12 -left-8 w-48 h-48 bg-indigo-600/10 rounded-full" />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
                <Shield size={28} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Admin Access</h2>
                <p className="text-slate-400 text-sm mt-0.5">Reicrew AI — Restricted Portal</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-8">
            <p className="text-slate-500 text-sm mb-6">
              Enter the administrator password to access the interview reports dashboard.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">
                  Admin Password
                </label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    ref={inputRef}
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    disabled={isLocked}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(''); }}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-11 pr-12 py-3.5 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Error / Lockout Message */}
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}{isLocked && lockTimer > 0 ? ` (${lockTimer}s)` : ''}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLocked || !password.trim()}
                className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-900/10 transition-all active:scale-[0.99] flex items-center justify-center gap-2 mt-2"
              >
                <Shield size={16} />
                {isLocked ? `Locked (${lockTimer}s)` : 'Access Dashboard'}
              </button>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Session ends when you close this browser tab
            </p>
          </div>
        </div>
      </div>

      {/* Shake keyframe style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
      `}</style>
    </>
  );
};

// Helper to check if admin session is active (tab-scoped)
export const isAdminSessionActive = (): boolean => {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
};

// Clear admin session (logout)
export const clearAdminSession = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
};
