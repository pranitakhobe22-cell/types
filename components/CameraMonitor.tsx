
import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { AlertTriangle, UserCheck, Eye, Camera, Lock, ScanFace } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { VisualMetrics, AdminConfig } from '../types';

import { mediaPipeService } from '../services/mediaPipeService';

interface CameraMonitorProps {
  onWarning: (count: number, type?: any, msg?: string) => void;
  onMetricsUpdate: (metrics: VisualMetrics) => void;
  isLocked: boolean;
  interviewStatus?: string; // Add this
  onStreamReady?: (stream: MediaStream) => void;
  sensitivity?: 'Low' | 'Medium' | 'High';
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({ 
  onWarning, 
  onMetricsUpdate, 
  isLocked, 
  interviewStatus,
  onStreamReady, 
  sensitivity = 'High' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [status, setStatus] = useState<"OK" | "WARNING" | "NO_FACE">("OK");
  const [feedbackMsg, setFeedbackMsg] = useState("Initializing integrity system...");

  // Logic Refs
  const lastFrameTimeRef = useRef<number>(-1);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const warningCounterRef = useRef<number>(0);

  const missingFaceFramesRef = useRef<number>(0);
  const lookingAwayFramesRef = useRef<number>(0);
  const mouthActivityFramesRef = useRef<number>(0); // Track mouth activity frames
  const lastWarningTimeRef = useRef<number>(0);
  const confidenceAccumulatorRef = useRef<number[]>([]);
  const lastNosePosRef = useRef<{ x: number, y: number } | null>(null);

  // Throttling Refs
  const lastProcessTimeRef = useRef<number>(0);
  const lastMetricsUpdateRef = useRef<number>(0);
  const METRICS_UPDATE_INTERVAL = 200; 
  const FRAME_PROCESS_INTERVAL = 32; 

  const configRef = useRef<AdminConfig | null>(null);

  const getThresholds = () => {
    switch (sensitivity) {
      case 'High': return { missing: 2, away: 1, mouth: 15 }; 
      case 'Low': return { missing: 30, away: 20, mouth: 60 };
      case 'Medium':
      default: return { missing: 15, away: 5, mouth: 30 };
    }
  };

  useEffect(() => {
    let isActive = true;
    let animationFrameId: number;

    const initMediaPipe = async () => {
      // 12-second safety timeout for MediaPipe
      const timeoutId = setTimeout(() => {
        if (!isInitialized && isActive) {
          console.warn("[CameraMonitor] MediaPipe initialization timed out. Falling back to Camera-only mode.");
          setFeedbackMsg("Vision Engine unavailable. Starting camera-only interview...");
          setIsInitialized(true);
          startCamera();
        }
      }, 12000);

      try {
        console.log("[CameraMonitor] Starting Vision Engine initialization...");
        setFeedbackMsg("Connecting to AI vision engine...");
        const storedConfig = await StorageService.getConfig();
        configRef.current = storedConfig;
        
        console.log("[CameraMonitor] Fetching FaceLandmarker...");
        const landmarker = await mediaPipeService.getLandmarker();
        console.log("[CameraMonitor] FaceLandmarker ready.");

        if (isActive && !isInitialized) {
          clearTimeout(timeoutId);
          faceLandmarkerRef.current = landmarker;
          setIsInitialized(true);
          console.log("[CameraMonitor] Initializing camera...");
          startCamera();
        }
      } catch (error) {
        console.error("[CameraMonitor] Failed to init MediaPipe:", error);
        if (isActive && !isInitialized) {
          clearTimeout(timeoutId);
          setFeedbackMsg("Vision Engine Error. Starting camera-only...");
          setIsInitialized(true);
          startCamera();
        }
      }
    };

    initMediaPipe();

    return () => {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("[CameraMonitor] getUserMedia not supported");
      return;
    }
    try {
      console.log("[CameraMonitor] Requesting camera/mic access...");
      // Try video only first if both fail, but let's stick to requested config
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, frameRate: { ideal: 30 } },
        audio: true
      });
      
      console.log("[CameraMonitor] Stream acquired.");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("[CameraMonitor] Waiting for video metadata/loaded data...");
        videoRef.current.onloadeddata = () => {
          console.log("[CameraMonitor] Video data loaded. onStreamReady firing.");
          if (onStreamReady) onStreamReady(stream);
          predictWebcam();
        };
      }
    } catch (err) {
      console.error("[CameraMonitor] Camera access error:", err);
      setFeedbackMsg("Camera/Mic access denied. Please allow permissions.");
    }
  };

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;
    if (!video || !landmarker || isLocked) return;

    const now = performance.now();
    if (now - lastProcessTimeRef.current >= FRAME_PROCESS_INTERVAL) {
      if (lastFrameTimeRef.current !== video.currentTime) {
        lastFrameTimeRef.current = video.currentTime;
        lastProcessTimeRef.current = now;
        let startTimeMs = performance.now();
        const result = landmarker.detectForVideo(video, startTimeMs);
        processResult(result);
      }
    }
    requestAnimationFrame(predictWebcam);
  };

  const processResult = (result: any) => {
    if (!configRef.current) return;
    const config = configRef.current;
    const hasFace = result.faceLandmarks && result.faceLandmarks.length > 0;
    const { missing: missingThresh, away: awayThresh, mouth: mouthThresh } = getThresholds();

    if (result.faceLandmarks.length > 1) {
      setStatus("WARNING");
      attemptTriggerWarning("Multiple faces!", "MULTIPLE_FACES");
      onMetricsUpdate({ isPresent: true, isLookingAtCamera: false, currentExpression: 'Multi-Face Violation', confidenceLevel: 0 });
      return;
    }

    if (!hasFace) {
      if (config.enableFaceDetection) {
        missingFaceFramesRef.current += 1;
        if (missingFaceFramesRef.current > missingThresh) {
          setStatus("NO_FACE");
          attemptTriggerWarning("Face not detected!", "FACE_MISSING");
          onMetricsUpdate({ isPresent: false, isLookingAtCamera: false, currentExpression: 'Unknown', confidenceLevel: 0 });
        }
      }
      return;
    } else {
      missingFaceFramesRef.current = 0;
    }

    const blendshapes = result.faceBlendshapes[0].categories;
    
    // 1. IMPROVED EYE TRACKING
    const gazeScore = blendshapes.filter((b: any) => 
      ['eyeLookInLeft', 'eyeLookOutLeft', 'eyeLookInRight', 'eyeLookOutRight', 
       'eyeLookUpLeft', 'eyeLookUpRight', 'eyeLookDownLeft', 'eyeLookDownRight'].includes(b.categoryName)
    ).reduce((max: number, b: any) => Math.max(max, b.score), 0);

    const landmarks = result.faceLandmarks[0];
    const noseRelX = (landmarks[1].x - landmarks[234].x) / Math.abs(landmarks[454].x - landmarks[234].x);
    const isHeadTurned = noseRelX < 0.38 || noseRelX > 0.62;
    const isLookingAway = gazeScore > (sensitivity === 'High' ? 0.35 : 0.45) || isHeadTurned;

    if (isLookingAway && config.enableEyeTracking) {
      lookingAwayFramesRef.current += 1;
      if (lookingAwayFramesRef.current > awayThresh) {
        setStatus("WARNING");
        attemptTriggerWarning("Eyes/Head off-screen!", "GAZE");
        onMetricsUpdate({ isPresent: true, isLookingAtCamera: false, currentExpression: 'Looking Away', confidenceLevel: 10 });
        return;
      }
    } else {
      lookingAwayFramesRef.current = 0;
    }

    // 2. LIP SYNC / SPEECH DETECTION
    const mouthActivity = blendshapes.filter((b: any) => 
      ['mouthPucker', 'mouthFunnel', 'mouthLowerDownLeft', 'mouthLowerDownRight', 
       'mouthUpperUpLeft', 'mouthUpperUpRight', 'jawOpen'].includes(b.categoryName)
    ).reduce((sum: number, b: any) => sum + b.score, 0);

    const isMouthMoving = mouthActivity > 0.45;
    
    // Suspicious Mouth Movement: If candidate is speaking while the AI is speaking (ASKING)
    if (isMouthMoving && interviewStatus === 'ASKING') {
      mouthActivityFramesRef.current += 1;
      if (mouthActivityFramesRef.current > mouthThresh) {
         setStatus("WARNING");
         attemptTriggerWarning("Suspicious mouth activity detected!", "GAZE"); // Reuse GAZE or specific type
         onMetricsUpdate({ isPresent: true, isLookingAtCamera: !isLookingAway, currentExpression: 'Speaking (Suspicious)', confidenceLevel: 20 });
         return;
      }
    } else {
      mouthActivityFramesRef.current = 0;
    }

    // 3. Expressions
    const smile = blendshapes.find((b: any) => b.categoryName === 'mouthSmileLeft')?.score || 0;
    let expression = isMouthMoving ? 'Speaking' : (smile > 0.4 ? 'Smiling' : 'Neutral');

    if (status === "OK") setFeedbackMsg("Monitoring Active");

    const now = performance.now();
    if (now - lastMetricsUpdateRef.current > METRICS_UPDATE_INTERVAL) {
      onMetricsUpdate({
        isPresent: true,
        isLookingAtCamera: !isLookingAway,
        currentExpression: expression,
        confidenceLevel: isLookingAway ? 20 : 90
      });
      lastMetricsUpdateRef.current = now;
      if (status !== 'NO_FACE') setStatus("OK");
    }
  };

  const attemptTriggerWarning = (msg: string, type: string = "GAZE") => {
    const now = Date.now();
    if (now - lastWarningTimeRef.current > 3000) {
      triggerWarning(msg, type);
      lastWarningTimeRef.current = now;
    } else {
      setFeedbackMsg(msg);
    }
  };

  const triggerWarning = (msg: string, type: string) => {
    if (isLocked) return;
    warningCounterRef.current += 1;
    setWarnings(warningCounterRef.current);
    setFeedbackMsg(`STRIKE ${warningCounterRef.current}: ${msg}`);
    onWarning(warningCounterRef.current, type, msg);
  };

  return (
    <div className={`rounded-xl overflow-hidden border-4 relative shadow-2xl transition-colors duration-100 ${status === 'OK' ? 'border-slate-700' : 'border-red-600'
      }`}>

      {/* Warning Flash (Full Red Screen) */}
      {status !== 'OK' && (
        <div className="absolute inset-0 z-20 pointer-events-none bg-red-600/80 flex flex-col items-center justify-center animate-pulse">
          <AlertTriangle className="text-white w-16 h-16 mb-2 drop-shadow-md" />
          <p className="text-white font-black text-xl uppercase tracking-widest drop-shadow-md">VIOLATION</p>
        </div>
      )}

      {/* Status Badge */}
      <div className="absolute top-3 left-3 z-30 flex flex-col gap-2">
        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg ${status === 'OK' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white animate-bounce'
          }`}>
          {status === 'OK' ? <ScanFace size={14} /> : <AlertTriangle size={14} />}
          {status === 'OK' ? 'TRACKING ACTIVE' : 'VIOLATION DETECTED'}
        </div>
      </div>

      {/* Video Feed */}
      <div className="relative aspect-[4/3] w-full bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isLocked ? 'opacity-20 grayscale' : 'opacity-100'}`}
        />

        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-40 p-4 text-center">
            <Lock className="text-red-500 w-16 h-16 mb-4" />
            <h3 className="text-red-500 text-xl font-bold uppercase">Session Terminated</h3>
          </div>
        )}

        <div className={`absolute bottom-0 left-0 right-0 p-3 transition-colors duration-200 ${status === 'OK' ? 'bg-slate-900/80' : 'bg-red-600'
          }`}>
          <p className="text-white text-xs font-bold uppercase text-center tracking-widest">
            {feedbackMsg}
          </p>
        </div>
      </div>

      {!isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
          <div className="flex flex-col items-center text-slate-500 gap-3">
            <Camera className="animate-ping" size={32} />
            <span className="text-xs font-mono">INITIALIZING OPTICS...</span>
          </div>
        </div>
      )}
    </div>
  );
};
