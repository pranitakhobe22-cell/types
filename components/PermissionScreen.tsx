import React, { useState, useEffect } from 'react';
import { Camera, Mic, Shield, Lock, CheckCircle, ArrowRight, ShieldCheck, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';

interface PermissionScreenProps {
    onComplete: () => void;
}

export const PermissionScreen: React.FC<PermissionScreenProps> = ({ onComplete }) => {
    const [cameraStatus, setCameraStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [micStatus, setMicStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(false);

    const checkPermissions = async () => {
        setIsChecking(true);
        setErrorMsg(null);
        setCameraStatus('pending');
        setMicStatus('pending');

        try {
            // 1. Specifically check camera
            try {
                const camStream = await navigator.mediaDevices.getUserMedia({ video: true });
                setCameraStatus('granted');
                camStream.getTracks().forEach(t => t.stop());
            } catch (e) {
                setCameraStatus('denied');
                console.warn("Camera failed", e);
            }

            // 2. Specifically check mic
            try {
                const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setMicStatus('granted');
                micStream.getTracks().forEach(t => t.stop());
            } catch (e) {
                setMicStatus('denied');
                console.warn("Mic failed", e);
            }

            // 3. Request combined to verify full session capability
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            // If we got here, permissions are granted
            setCameraStatus('granted');
            setMicStatus('granted');

            // Stop tracks to release device
            stream.getTracks().forEach(track => track.stop());

            // Proceed after a short delay for visual confirmation
            setTimeout(onComplete, 1000);
        } catch (err: any) {
            console.error("Permission Error:", err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setErrorMsg("Access denied. Please enable permissions in your browser settings (click the lock icon in the address bar).");
            } else if (err.name === 'NotFoundError') {
                setErrorMsg("Hardware not found. Please ensure your camera and microphone are connected.");
            } else {
                setErrorMsg(`Hardware access error: ${err.message || 'Unknown error'}`);
            }
        } finally {
            setIsChecking(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in">
                <div className="p-8 text-center border-b border-slate-100 flex flex-col items-center">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4 overflow-hidden p-2">
                        <Logo className="w-full h-full" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Reincrew AI</h2>
                    <p className="text-slate-500 text-sm">We need access to your camera and microphone to securely run your AI interview.</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Status Indicators */}
                    <div className="space-y-4">
                        <div className={`flex items-center justify-between p-4 rounded-xl border ${cameraStatus === 'granted' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${cameraStatus === 'granted' ? 'bg-white text-emerald-600' : 'bg-white text-slate-400'}`}>
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${cameraStatus === 'granted' ? 'text-emerald-800' : 'text-slate-700'}`}>Camera Access</p>
                                    <p className="text-xs text-slate-400">{cameraStatus === 'granted' ? 'Connected' : 'Required'}</p>
                                </div>
                            </div>
                            {cameraStatus === 'granted' && <CheckCircle size={20} className="text-emerald-500" />}
                            {cameraStatus === 'denied' && <XCircle size={20} className="text-red-500" />}
                            {cameraStatus === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                        </div>

                        <div className={`flex items-center justify-between p-4 rounded-xl border ${micStatus === 'granted' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${micStatus === 'granted' ? 'bg-white text-emerald-600' : 'bg-white text-slate-400'}`}>
                                    <Mic size={20} />
                                </div>
                                <div>
                                    <p className={`font-bold text-sm ${micStatus === 'granted' ? 'text-emerald-800' : 'text-slate-700'}`}>Microphone Access</p>
                                    <p className="text-xs text-slate-400">{micStatus === 'granted' ? 'Connected' : 'Required'}</p>
                                </div>
                            </div>
                            {micStatus === 'granted' && <CheckCircle size={20} className="text-emerald-500" />}
                            {micStatus === 'denied' && <XCircle size={20} className="text-red-500" />}
                            {micStatus === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-300" />}
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm flex items-start gap-3">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <p>{errorMsg}</p>
                        </div>
                    )}

                    <button
                        onClick={checkPermissions}
                        disabled={isChecking || (cameraStatus === 'granted' && micStatus === 'granted')}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-indigo-200 ${cameraStatus === 'granted' && micStatus === 'granted'
                                ? 'bg-emerald-500 text-white cursor-default'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-indigo-300'
                            }`}
                    >
                        {isChecking ? 'Checking...' : (cameraStatus === 'granted' && micStatus === 'granted') ? 'Access Granted' : 'Allow Access'}
                    </button>
                </div>
            </div>
        </div>
    );
};
