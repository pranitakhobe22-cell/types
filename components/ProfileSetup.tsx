
import React, { useState } from 'react';
import { Candidate } from '../types';
import { User, Mail, Phone, CreditCard, Camera, ShieldCheck, ArrowRight } from 'lucide-react';

interface ProfileSetupProps {
  initialData: Candidate;
  onComplete: (updatedCandidate: Candidate) => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ initialData, onComplete }) => {
  const [formData, setFormData] = useState<Candidate>({
    ...initialData,
    email: initialData.email || '',
    phone: initialData.phone || '',
    idNumber: initialData.idNumber || ''
  });
  
  const [pfpPreview, setPfpPreview] = useState<string | null>(initialData.profilePhoto || null);
  const [idPreview, setIdPreview] = useState<string | null>(initialData.idCardImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to compress images for localStorage
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 500; // Limit resolution
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
             ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
             resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
             reject(new Error("Canvas context failed"));
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'PFP' | 'ID') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const compressed = await compressImage(e.target.files[0]);
        if (type === 'PFP') {
          setPfpPreview(compressed);
          setFormData(prev => ({ ...prev, profilePhoto: compressed }));
        } else {
          setIdPreview(compressed);
          setFormData(prev => ({ ...prev, idCardImage: compressed }));
        }
      } catch (err) {
        console.error("Image processing failed", err);
        alert("Could not process image. Please try a simpler file (JPG/PNG).");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pfpPreview || !idPreview) {
        alert("Please upload both a Profile Photo and a Government ID to proceed.");
        return;
    }
    setIsSubmitting(true);
    
    // Simulate network delay
    setTimeout(() => {
        onComplete({ 
            ...formData, 
            isVerified: true 
        });
        setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-4 bg-slate-50 overflow-hidden">
      <div className="w-full max-w-5xl h-full max-h-[85vh] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Info & Privacy */}
        <div className="hidden md:flex w-1/3 bg-slate-900 text-slate-300 p-8 flex-col justify-between overflow-y-auto">
           <div>
             <h2 className="text-2xl font-bold text-white mb-2">Identity Verification</h2>
             <p className="text-sm text-slate-400 mb-6">
               To maintain interview integrity and prevent impersonation, please complete your profile.
             </p>
             
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="text-emerald-500 shrink-0" size={20} />
                    <div className="text-xs">
                        <strong className="text-white block mb-1">Secure Storage</strong>
                        Your data is encrypted and used solely for verification.
                    </div>
                </div>
                <div className="flex items-start gap-3">
                    <Camera className="text-indigo-400 shrink-0" size={20} />
                    <div className="text-xs">
                        <strong className="text-white block mb-1">Face Match</strong>
                        Your profile photo will be matched against the live camera feed.
                    </div>
                </div>
             </div>
           </div>
           <div className="mt-8 pt-8 border-t border-slate-800 text-xs text-slate-500">
              <p>&copy; Reicrew AI Security</p>
           </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
           {/* Header */}
           <div className="p-6 border-b border-slate-100 shrink-0">
             <h3 className="text-xl font-bold text-slate-800">Candidate Profile</h3>
             <p className="text-xs text-slate-500 md:hidden">Please verify your identity to proceed.</p>
           </div>
           
           {/* Scrollable Form Body */}
           <div className="flex-1 overflow-y-auto p-6">
             <form id="profile-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  
                  {/* Column 1: Personal Info */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Personal Details</h4>
                     
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-medium"
                                value={formData.name}
                                readOnly
                            />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Access ID</label>
                         <input 
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-500"
                            value={formData.accessId || 'GUEST-USER'}
                            readOnly
                        />
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Email Address <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="email"
                                required
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="tel"
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none"
                                placeholder="+1 234 567 890"
                                value={formData.phone}
                                onChange={e => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                     </div>
                  </div>

                  {/* Column 2: Documents */}
                  <div className="space-y-4">
                     <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Identity Documents</h4>
                     
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Government ID <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                required
                                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none font-mono"
                                placeholder="ID Number"
                                value={formData.idNumber}
                                onChange={e => setFormData({...formData, idNumber: e.target.value})}
                            />
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        {/* Profile Photo Upload */}
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase">Selfie</label>
                           <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 text-center hover:bg-slate-50 transition-colors relative group h-32 flex flex-col justify-center items-center">
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  onChange={(e) => handleFileChange(e, 'PFP')}
                              />
                              {pfpPreview ? (
                                  <div className="relative w-full h-full rounded overflow-hidden">
                                      <img src={pfpPreview} alt="Profile" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                                          Update
                                      </div>
                                  </div>
                              ) : (
                                  <>
                                      <User size={24} className="text-indigo-400 mb-1" />
                                      <p className="text-xs font-bold text-indigo-600">Upload</p>
                                  </>
                              )}
                           </div>
                        </div>

                        {/* ID Card Upload */}
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-400 uppercase">ID Card</label>
                           <div className="border-2 border-dashed border-slate-300 rounded-xl p-2 text-center hover:bg-slate-50 transition-colors relative group h-32 flex flex-col justify-center items-center">
                              <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  onChange={(e) => handleFileChange(e, 'ID')}
                              />
                              {idPreview ? (
                                  <div className="relative w-full h-full rounded overflow-hidden">
                                      <img src={idPreview} alt="ID" className="w-full h-full object-contain bg-slate-100" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">
                                          Update
                                      </div>
                                  </div>
                              ) : (
                                  <>
                                      <CreditCard size={24} className="text-emerald-400 mb-1" />
                                      <p className="text-xs font-bold text-emerald-600">Upload</p>
                                  </>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                </div>
             </form>
           </div>

           {/* Fixed Footer */}
           <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button 
                type="submit"
                form="profile-form"
                disabled={isSubmitting}
                className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg 
                    ${isSubmitting 
                        ? 'bg-slate-400 cursor-wait' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
              >
                {isSubmitting ? 'Verifying Profile...' : 'Continue to System Check'} 
                {!isSubmitting && <ArrowRight size={18} />}
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};
