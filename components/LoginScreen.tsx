
import React, { useState, useEffect } from 'react';
import { Candidate, JobPost } from '../types';
import { StorageService } from '../services/storageService';
import { Logo } from './Logo';
import { User, ArrowRight, ShieldCheck, PlayCircle, Shield, Briefcase } from 'lucide-react';

interface LoginScreenProps {
  onStart: (candidate: Candidate) => void;
  onAdminLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onStart, onAdminLogin }) => {
  const [name, setName] = useState('');
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // New State for Mini Demo
  const [isDemo, setIsDemo] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    const loadJobs = async () => {
      const availableJobs = await StorageService.getJobs();
      setJobs(availableJobs);
      if (availableJobs.length > 0) {
        setSelectedJobId(availableJobs[0].id);
      }
    };
    loadJobs();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemo) {
      onStart({
        name: name.trim() || 'Demo User',
        position: customTopic,
        company: 'Mini Demo',
        customTopic: customTopic,
        isDemo: true
      });
    } else {
      const selectedJob = jobs.find(j => j.id === selectedJobId);
      onStart({
        name: name.trim() || 'Candidate',
        position: selectedJob?.title || 'General Applicant',
        company: 'N/A',
        jobPostId: selectedJobId
      });
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 overflow-y-auto bg-slate-50 relative">
      <button
        onClick={onAdminLogin}
        className="absolute bottom-6 right-6 text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-xs font-bold transition-colors z-50"
      >
        <Shield size={14} /> Admin Demo
      </button>

      <div className="w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 text-center bg-gradient-to-r from-indigo-900 to-slate-900 text-white flex flex-col items-center">
            <Logo variant="white" className="w-16 h-16 mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold mb-1">Reincrew AI</h2>
            <p className="text-indigo-200 text-xs md:text-sm">Verified Intelligence Engine</p>
          </div>

          <div className="flex border-b border-slate-100">
            <button
              onClick={() => { setIsDemo(false); setSelectedJobId(jobs[0]?.id || ''); }}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${!isDemo ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Role Play
            </button>
            <button
              onClick={() => setIsDemo(true)}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${isDemo ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Mini Demo
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
            <div className="text-center space-y-2 mb-6">
              <h3 className="text-lg md:text-xl font-bold text-slate-800">
                {isDemo ? "Instant Mock Interview" : "Role Selection"}
              </h3>
              <p className="text-slate-500 text-xs md:text-sm">
                {isDemo ? "Type a topic to generate a quick 3-question interview." : "Please select a role to begin your AI interview."}
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Name (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 text-slate-400" size={18} />
                  <input
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 text-sm md:text-base"
                    placeholder="Enter your name"
                  />
                </div>
              </div>

              {isDemo ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Topic of Interest</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 text-sm md:text-base"
                      placeholder="e.g. React, Sales, History, Biology"
                      required={isDemo}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Interview Position</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-slate-400" size={18} />
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 bg-white text-sm md:text-base"
                    >
                      {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-3 md:p-4 rounded-lg space-y-3">
              <div className="flex gap-3">
                <ShieldCheck className="text-indigo-700 flex-shrink-0" size={20} />
                <div className="text-xs text-indigo-900">
                  <p className="font-bold mb-1 uppercase">How it works</p>
                  <ul className="list-disc pl-3 space-y-1 leading-relaxed">
                    {isDemo ? (
                      <>
                        <li><strong>Instant Generation:</strong> AI creates unique questions for <em>{customTopic || 'your topic'}</em>.</li>
                        <li><strong>Short & Sweet:</strong> Just 3 questions to test the platform.</li>
                        <li><strong>Fast Feedback:</strong> Immediate scoring.</li>
                      </>
                    ) : (
                      <>
                        <li><strong>Role Specific:</strong> Questions are tailored to the selected position.</li>
                        <li><strong>Voice Interaction:</strong> Speak your answers clearly.</li>
                        <li><strong>Real-time AI:</strong> Scored against HR reference criteria.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isDemo && !customTopic.trim()}
              className={`w-full mt-2 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold py-3.5 md:py-4 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 ${isDemo && !customTopic.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span>{isDemo ? 'Try Mini Demo' : 'Start Interview'}</span>
              <PlayCircle size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
