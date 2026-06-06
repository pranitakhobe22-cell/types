import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { User, Mail, Briefcase, ArrowRight, ChevronDown } from 'lucide-react';

interface LandingScreenProps {
  onStart: (data: { name: string; email: string; role: string }) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CSE'
  });
  const [error, setError] = useState('');

  // Preload MediaPipe ML models so camera starts instantly on the next screen
  useEffect(() => {
    import('../services/mediaPipeService').then(({ mediaPipeService }) => {
      const preload = () => {
        console.log("[LandingScreen] Preloading MediaPipe models...");
        mediaPipeService.preload().catch(err => console.error("MediaPipe preload failed:", err));
      };

      if ('requestIdleCallback' in window) {
        requestIdleCallback(preload);
      } else {
        setTimeout(preload, 2000);
      }
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.role) {
      setError('Please fill in all fields to proceed.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid professional email.');
      return;
    }
    setError('');
    onStart(formData);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:20px_20px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40"></div>
      
      <div className="w-full max-w-xl z-10">
        <div className="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200/50 border border-slate-100 mb-6">
            <Logo className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight text-center">
            Elevate Your <span className="text-indigo-600">Career Potential</span>
          </h1>
          <p className="text-slate-500 mt-4 text-center text-lg max-w-md">
            Enter your details to begin your AI-powered technical assessment today.
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-10 rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.04)] animate-in fade-in zoom-in duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-6 py-4.5 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  placeholder="alex@company.com"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-6 py-4.5 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">Academic Path</label>
              <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors z-10">
                  <Briefcase size={20} />
                </div>
                <select
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-14 pr-12 py-4.5 rounded-2xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all appearance-none cursor-pointer"
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="" disabled>Select your role</option>
                  <option value="CSE">Computer Science (CSE)</option>
                  <option value="ECE">Electronics (ECE)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-500 px-5 py-4 rounded-2xl text-sm font-semibold animate-shake flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-slate-200 transition-all flex items-center justify-center gap-3 group active:scale-[0.99]"
            >
              Start Your Interview
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>
        
        <p className="text-slate-400 text-xs text-center mt-10 font-medium tracking-wide">
          OFFICIAL TECHNICAL ASSESSMENT PORTAL v2.0
        </p>
      </div>
    </div>
  );
};
