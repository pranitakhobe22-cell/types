import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker } from '@mediapipe/tasks-vision';
import { Camera } from 'lucide-react';
import { mediaPipeService } from '../services/mediaPipeService';
import { RawDetectionFrame, HeartbeatMetrics } from '../types';

interface CameraMonitorProps {
  mediaStream?: MediaStream; // Optional, if provided, use it instead of requesting
  onDetectionFrame?: (frame: RawDetectionFrame) => void;
  onEngineReady?: () => void;
  onHeartbeat?: (metrics: HeartbeatMetrics) => void;
  devOverlay?: boolean;
  
  // Legacy compat props for InterviewScreen.tsx
  onWarning?: (count: number, type?: any, msg?: string) => void;
  isLocked?: boolean;
}

export const CameraMonitor: React.FC<CameraMonitorProps> = ({ 
  mediaStream,
  onDetectionFrame,
  onEngineReady,
  onHeartbeat,
  devOverlay = import.meta.env.DEV, // Default to true in dev
  
  onWarning,
  isLocked = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("Initializing optics...");

  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const lastProcessTimeRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(-1);
  const lastHeartbeatTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);

  const lastConfidenceRef = useRef<number>(1.0);
  const lastGazeDirectionRef = useRef<string>('center');
  const lastDetectionHealthRef = useRef<'GOOD' | 'LOW_LIGHT' | 'PARTIAL_FACE' | 'UNSTABLE'>('GOOD');

  const FRAME_PROCESS_INTERVAL = 32; // ~30fps
  const HEARTBEAT_INTERVAL = 500;

  useEffect(() => {
    let isActive = true;
    let animationFrameId: number;

    const initMediaPipe = async () => {
      try {
        setFeedbackMsg("Connecting to AI vision engine...");
        const landmarker = await mediaPipeService.getLandmarker();
        
        if (isActive) {
          faceLandmarkerRef.current = landmarker;
          setIsInitialized(true);
          onEngineReady?.();
          setupCamera();
        }
      } catch (error) {
        console.error("[CameraMonitor] Failed to init MediaPipe:", error);
        if (isActive) {
          setFeedbackMsg("Vision Engine Error.");
        }
      }
    };

    const setupCamera = async () => {
      if (!videoRef.current) return;

      if (mediaStream) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadeddata = () => predictWebcam();
      } else {
        try {
          // If we already requested it, use the active stream
          if (videoRef.current.srcObject) {
             videoRef.current.onloadeddata = () => predictWebcam();
             return;
          }
          
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, frameRate: { ideal: 30 } }
          });
          
          if (!isActive) {
            // Wait! In React Strict Mode, we might unmount/remount instantly.
            // Stopping the tracks here permanently breaks the camera!
            // Let's NOT stop the tracks immediately if we're in dev mode or fast re-mount
            setTimeout(() => {
                // If it's still not active after 1000ms, then stop it
                if (!videoRef.current?.srcObject) {
                    stream.getTracks().forEach(track => track.stop());
                }
            }, 1000);
            return;
          }

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.onloadeddata = () => predictWebcam();
          }
        } catch (err) {
          console.error("[CameraMonitor] Camera access error:", err);
          setFeedbackMsg("Camera access denied.");
        }
      }
    };

    initMediaPipe();

    return () => {
      isActive = false;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [mediaStream]);

  const predictWebcam = () => {
    const video = videoRef.current;
    const landmarker = faceLandmarkerRef.current;
    if (!video || !landmarker || isLocked) return;

    try {
      const now = performance.now();
      if (now - lastProcessTimeRef.current >= FRAME_PROCESS_INTERVAL) {
        lastProcessTimeRef.current = now;
        frameCountRef.current++;
        
        let startTimeMs = performance.now();
        // Ensure strictly increasing timestamp for MediaPipe
        if (startTimeMs <= (landmarker as any).lastStartTimeMs) {
          startTimeMs = (landmarker as any).lastStartTimeMs + 1;
        }
        (landmarker as any).lastStartTimeMs = startTimeMs;

        const result = landmarker.detectForVideo(video, startTimeMs);
        processResult(result);
        
        if (devOverlay) {
          drawDevOverlay(result, video);
        }
      }

      // Heartbeat logic
      if (now - lastHeartbeatTimeRef.current >= HEARTBEAT_INTERVAL) {
        const fps = Math.round((frameCountRef.current * 1000) / (now - lastHeartbeatTimeRef.current));
        frameCountRef.current = 0;
        
        onHeartbeat?.({
          fps,
          lastDetectionAgoMs: now - lastProcessTimeRef.current,
          faceConfidence: lastConfidenceRef.current,
          gazeDirection: lastGazeDirectionRef.current,
          detectionHealth: lastDetectionHealthRef.current,
          engineState: 'READY'
        });
        lastHeartbeatTimeRef.current = now;
      }
    } catch (err) {
      console.error("[CameraMonitor] Error in predictWebcam loop:", err);
    } finally {
      // ALWAYS queue the next frame, even if this one errored, to prevent freezing!
      requestAnimationFrame(predictWebcam);
    }
  };

  const processResult = (result: any) => {
    // Filter out microscopic "hallucinated" faces and faces with zero expression activity
    const validIndices: number[] = [];
    if (result.faceLandmarks) {
      result.faceLandmarks.forEach((landmarks: any, i: number) => {
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
        const faceHeight = Math.abs(landmarks[152].y - landmarks[10].y);
        
        let maxBlend = 0;
        if (result.faceBlendshapes && result.faceBlendshapes[i] && result.faceBlendshapes[i].categories) {
          maxBlend = result.faceBlendshapes[i].categories.reduce((m: number, c: any) => Math.max(m, c.score), 0);
        }

        // A real face takes up > 5% of screen. We rely on MediaPipe's confidence score rather than manual blendshape heuristics.
        if (faceWidth > 0.05 && faceHeight > 0.05) {
          validIndices.push(i);
        }
      });
    }

    const faceCount = validIndices.length;
    const hasFace = faceCount > 0;
    
    let confidence = 0;
    let gazeDirection: RawDetectionFrame['gazeDirection'] = 'center';
    let isHeadTurned = false;
    let isMouthMoving = false;
    let expression = 'Neutral';

    let headPitch = 0;
    let headYaw = 0;
    let headRoll = 0;
    let facePosition: 'CENTERED' | 'PARTIAL_OUT' = 'CENTERED';
    let detectionHealth: 'GOOD' | 'LOW_LIGHT' | 'PARTIAL_FACE' | 'UNSTABLE' = 'GOOD';

    if (hasFace) {
      const bestIdx = validIndices[0];
      const blendshapes = result.faceBlendshapes ? result.faceBlendshapes[bestIdx] : null;
      const landmarks = result.faceLandmarks[bestIdx];

      // Calculate Bounding Box and Face Position
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      landmarks.forEach((pt: any) => {
        minX = Math.min(minX, pt.x);
        minY = Math.min(minY, pt.y);
        maxX = Math.max(maxX, pt.x);
        maxY = Math.max(maxY, pt.y);
      });

      if (minX < 0.02 || minY < 0.02 || maxX > 0.98 || maxY > 0.98) {
        facePosition = 'PARTIAL_OUT';
      }

      // Calculate Head Angles
      headPitch = Math.round((landmarks[1].y - landmarks[10].y) * 100);
      headYaw = Math.round((landmarks[1].x - landmarks[234].x) * 100);
      
      const dx = landmarks[263].x - landmarks[33].x;
      const dy = landmarks[263].y - landmarks[33].y;
      headRoll = Math.round((Math.atan2(dy, dx) * 180) / Math.PI);
      
      if (blendshapes && blendshapes.categories && blendshapes.categories.length > 0) {
        // Graduated confidence calculation
        confidence = Math.min(1.0, blendshapes.categories[0].score + 0.5);
        
        // Expression heuristic
        const smileScore = blendshapes.categories.find((c: any) => c.categoryName === 'mouthSmileLeft')?.score || 0;
        if (smileScore > 0.4) expression = 'Smiling';

        const maxBlendScore = blendshapes.categories.reduce((max: number, b: any) => Math.max(max, b.score), 0);

        // Head pose analysis (simple heuristic using nose ratio)
        const landmarks = result.faceLandmarks[bestIdx];
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
        
        // Prevent division by zero or extreme angles if face is too small
        if (faceWidth > 0.05) {
          const noseRelX = (landmarks[1].x - landmarks[234].x) / faceWidth;
          // Loosened the threshold to prevent false positives when nose is just slightly off center
          isHeadTurned = noseRelX < 0.25 || noseRelX > 0.75; 
        }

        // Loosened gaze score threshold to prevent constant "away" status
        const gazeScore = blendshapes.categories.find((c: any) => c.categoryName === 'eyeLookOutLeft')?.score || 0;
        if (gazeScore > 0.6 || isHeadTurned) {
           gazeDirection = 'away';
        } else {
           gazeDirection = 'center'; 
        }

        // Mouth activity
        const mouthActivity = blendshapes.filter((b: any) => 
          ['mouthPucker', 'mouthFunnel', 'mouthLowerDownLeft', 'mouthLowerDownRight', 
           'mouthUpperUpLeft', 'mouthUpperUpRight', 'jawOpen'].includes(b.categoryName)
        ).reduce((sum: number, b: any) => sum + b.score, 0);

        isMouthMoving = mouthActivity > 0.45;
        
        // Basic expression
        const smile = blendshapes.find((b: any) => b.categoryName === 'mouthSmileLeft')?.score || 0;
        expression = isMouthMoving ? 'Speaking' : (smile > 0.4 ? 'Smiling' : 'Neutral');
        
      } else {
        // Binary fallback if blendshapes are missing
        confidence = 1.0;
      }

      if (facePosition === 'PARTIAL_OUT') {
        detectionHealth = 'PARTIAL_FACE';
      } else if (confidence < 0.6) {
        detectionHealth = 'UNSTABLE';
      } else {
        detectionHealth = 'GOOD';
      }
    }

    // Update refs for heartbeat
    lastConfidenceRef.current = confidence;
    lastGazeDirectionRef.current = gazeDirection;
    lastDetectionHealthRef.current = detectionHealth;

    const frameData: RawDetectionFrame = {
      faceCount,
      faceDetected: hasFace,
      landmarkCount: hasFace ? result.faceLandmarks[validIndices[0]].length : 0,
      confidence,
      gazeDirection,
      isHeadTurned,
      isMouthMoving,
      expression,
      timestamp: Date.now(),
      headPitch,
      headYaw,
      headRoll,
      facePosition
    };

    onDetectionFrame?.(frameData);
  };

  const drawDevOverlay = (result: any, video: HTMLVideoElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas dimensions to video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (result.faceLandmarks) {
      const validIndices: number[] = [];
      result.faceLandmarks.forEach((landmarks: any, i: number) => {
        const fw = Math.abs(landmarks[454].x - landmarks[234].x);
        const fh = Math.abs(landmarks[152].y - landmarks[10].y);
        
        let maxBlend = 0;
        if (result.faceBlendshapes && result.faceBlendshapes[i] && result.faceBlendshapes[i].categories) {
          maxBlend = result.faceBlendshapes[i].categories.reduce((m: number, c: any) => Math.max(m, c.score), 0);
        }
        
        if (fw > 0.05 && fh > 0.05 && maxBlend > 0.15) {
          validIndices.push(i);
        }
      });

      validIndices.forEach((faceIdx: number, index: number) => {
        const landmarks = result.faceLandmarks[faceIdx];
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        
        for (let i = 0; i < landmarks.length; i++) {
           const x = landmarks[i].x * canvas.width;
           const y = landmarks[i].y * canvas.height;
           minX = Math.min(minX, x);
           minY = Math.min(minY, y);
           maxX = Math.max(maxX, x);
           maxY = Math.max(maxY, y);
        }

        // Add padding
        minX -= 15; minY -= 15; maxX += 15; maxY += 15;
        const width = maxX - minX;

        // Draw Corner Brackets
        ctx.strokeStyle = '#00FFCC';
        ctx.lineWidth = 3;
        const l = 25; // Corner line length
        
        ctx.beginPath();
        // Top Left
        ctx.moveTo(minX, minY + l); ctx.lineTo(minX, minY); ctx.lineTo(minX + l, minY);
        // Top Right
        ctx.moveTo(maxX - l, minY); ctx.lineTo(maxX, minY); ctx.lineTo(maxX, minY + l);
        // Bottom Right
        ctx.moveTo(maxX, maxY - l); ctx.lineTo(maxX, maxY); ctx.lineTo(maxX - l, maxY);
        // Bottom Left
        ctx.moveTo(minX + l, maxY); ctx.lineTo(minX, maxY); ctx.lineTo(minX, maxY - l);
        ctx.stroke();

        // Draw Eye Crosshairs (Pupils)
        const drawPupil = (idx: number) => {
          if (landmarks[idx]) {
            const px = landmarks[idx].x * canvas.width;
            const py = landmarks[idx].y * canvas.height;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#00FFCC';
            ctx.fill();
            
            ctx.strokeStyle = 'rgba(0, 255, 204, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 10, py); ctx.lineTo(px + 10, py);
            ctx.moveTo(px, py - 10); ctx.lineTo(px, py + 10);
            ctx.stroke();
          }
        };
        drawPupil(468); // Left Pupil
        drawPupil(473); // Right Pupil

        // Draw HUD Text Box
        // We must UN-MIRROR the text because the canvas is scale-x-[-1]
        ctx.save();
        ctx.scale(-1, 1);
        
        // In mirrored space, the box starts at -maxX
        const textX = -maxX;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(textX, minY - 40, Math.max(160, width), 35);
        
        // HUD Status Text
        ctx.fillStyle = '#00FFCC';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`CANDIDATE_${index + 1} [LOCKED]`, textX + 6, minY - 24);
        
        // Pitch/Yaw estimation text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '10px monospace';
        const pitch = Math.round((landmarks[1].y - landmarks[10].y) * 100);
        const yaw = Math.round((landmarks[1].x - landmarks[234].x) * 100);
        
        const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x);
        let gazeStateText = 'CENTER';
        if (faceWidth > 0.05) {
           const noseRelX = (landmarks[1].x - landmarks[234].x) / faceWidth;
           gazeStateText = (noseRelX < 0.25 || noseRelX > 0.75) ? 'AWAY' : 'CENTER';
        }
        
        ctx.fillText(`PITCH:${pitch} YAW:${yaw} GAZE:${gazeStateText}`, textX + 6, minY - 10);
        
        ctx.restore();
      });
    }
  };

  // If we are given a media stream, we might want to render just the canvas overlay 
  // over the parent's video element instead of our own. But for simplicity and backward compat,
  // we render our own video element and position it absolutely or relatively based on context.
  // In the dynamic interview screen, this component might be made hidden while still processing.
  
  return (
    <div className="relative w-full h-full bg-black">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-contain transform scale-x-[-1]"
      />

      {devOverlay && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none transform scale-x-[-1] z-50"
        />
      )}

      {!mediaStream && !isInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-20">
          <div className="flex flex-col items-center text-slate-500 gap-3">
            <Camera className="animate-ping" size={32} />
            <span className="text-xs font-mono">{feedbackMsg}</span>
          </div>
        </div>
      )}
    </div>
  );
};

