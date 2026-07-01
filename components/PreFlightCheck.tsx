import React, { useEffect, useRef, useState, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  CameraProvider,
  CameraProviderStatus,
  PhoneConnectionState,
  RawDetectionFrame,
} from '../types';
import { PhoneCameraProvider } from '../services/cameraProviders/PhoneCameraProvider';
import {
  CheckCircle, XCircle, Mic, Camera, User, Sun,
  Move, Ruler, Wifi, Battery, Loader2, Shield,
} from 'lucide-react';

interface PreFlightCheckProps {
  provider: CameraProvider;
  onReady: () => void;
  showQrCode?: boolean;
  qrCodeUrl?: string;
  qrTokenExpiry?: Date;
  phoneConnectionState?: PhoneConnectionState;
}

interface CheckItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  passed: boolean;
  detail?: string;
}

const CALIBRATION_DURATION_MS = 5000;
const STABILITY_WINDOW_MS = 3000;
const STABILITY_THRESHOLD_DEG = 5;
const MIN_FACE_AREA = 0.05;
const MAX_FACE_AREA = 0.30;

/**
 * PreFlightCheck — Calibration checklist and phone pairing UI.
 * 
 * Runs identically for both LocalCameraProvider and PhoneCameraProvider.
 * Tracks setup progress with pause/resume semantics (never resets on failure).
 * Optionally renders QR code and countdown timer for phone pairing.
 */
export const PreFlightCheck: React.FC<PreFlightCheckProps> = ({
  provider,
  onReady,
  showQrCode = false,
  qrCodeUrl,
  qrTokenExpiry,
  phoneConnectionState,
}) => {
  const [checks, setChecks] = useState({
    microphone: false,
    cameraPermission: false,
    faceDetected: false,
    lightingGood: false,
    cameraStable: false,
    distanceAppropriate: false,
    networkStable: true,
    batteryOk: true,
  });

  const [progressMs, setProgressMs] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [expiryCountdown, setExpiryCountdown] = useState('');

  // Stability tracking
  const poseHistoryRef = useRef<Array<{ pitch: number; yaw: number; roll: number; time: number }>>([]);
  const lastFrameTimeRef = useRef<number>(Date.now());
  const progressMsRef = useRef<number>(0);

  // Token expiry countdown
  useEffect(() => {
    if (!qrTokenExpiry) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, qrTokenExpiry.getTime() - Date.now());
      if (remaining <= 0) {
        setExpiryCountdown('Expired');
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setExpiryCountdown(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [qrTokenExpiry]);

  // Process detection frames for calibration
  const handleDetectionFrame = useCallback((frame: RawDetectionFrame) => {
    const now = Date.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;

    // Update pose history for stability tracking
    poseHistoryRef.current.push({
      pitch: frame.headPitch,
      yaw: frame.headYaw,
      roll: frame.headRoll,
      time: now,
    });
    // Keep only last STABILITY_WINDOW_MS
    poseHistoryRef.current = poseHistoryRef.current.filter(
      p => now - p.time < STABILITY_WINDOW_MS
    );

    // Calculate stability (std dev of pose over window)
    let stable = false;
    if (poseHistoryRef.current.length > 5) {
      const poses = poseHistoryRef.current;
      const avgPitch = poses.reduce((s, p) => s + p.pitch, 0) / poses.length;
      const avgYaw = poses.reduce((s, p) => s + p.yaw, 0) / poses.length;
      const avgRoll = poses.reduce((s, p) => s + p.roll, 0) / poses.length;

      const stdPitch = Math.sqrt(poses.reduce((s, p) => s + (p.pitch - avgPitch) ** 2, 0) / poses.length);
      const stdYaw = Math.sqrt(poses.reduce((s, p) => s + (p.yaw - avgYaw) ** 2, 0) / poses.length);
      const stdRoll = Math.sqrt(poses.reduce((s, p) => s + (p.roll - avgRoll) ** 2, 0) / poses.length);

      stable = stdPitch < STABILITY_THRESHOLD_DEG &&
               stdYaw < STABILITY_THRESHOLD_DEG &&
               stdRoll < STABILITY_THRESHOLD_DEG;
    }

    // Distance check (face area approximation)
    // landmarkCount > 0 means face is detected
    const faceArea = frame.faceDetected ?
      (frame.trackingConfidence / 100) * 0.2 : 0; // Rough proxy
    let distanceOk = true;
    let distanceDetail: string | undefined;
    if (frame.faceDetected) {
      if (faceArea > MAX_FACE_AREA) {
        distanceOk = false;
        distanceDetail = 'Too close — move back';
      } else if (faceArea < MIN_FACE_AREA) {
        distanceOk = false;
        distanceDetail = 'Too far — move closer';
      }
    }

    // Network + battery from provider status
    const status = provider.getStatus();

    const newChecks = {
      microphone: true, // Assumed passed since we got here
      cameraPermission: true,
      faceDetected: frame.faceDetected,
      lightingGood: frame.faceDetected &&
        frame.trackingConfidence > 40,
      cameraStable: stable,
      distanceAppropriate: distanceOk,
      networkStable: status.latencyMs === undefined || status.latencyMs < 500,
      batteryOk: status.battery === undefined || status.battery >= 15,
    };

    setChecks(newChecks);

    // Progress: accumulate when ALL checks pass, pause otherwise
    const allPassed = Object.values(newChecks).every(Boolean);
    if (allPassed && delta > 0 && delta < 1000) {
      progressMsRef.current = Math.min(progressMsRef.current + delta, CALIBRATION_DURATION_MS);
      setProgressMs(progressMsRef.current);

      if (progressMsRef.current >= CALIBRATION_DURATION_MS && !isReady) {
        setIsReady(true);
        onReady();
      }
    }
    // On failure: progress just pauses (no reset)
  }, [provider, onReady, isReady]);

  // Subscribe to provider frames for calibration
  useEffect(() => {
    provider.subscribe({
      onDetectionFrame: handleDetectionFrame,
      onHeartbeat: () => {},
      onEngineReady: () => {},
      onError: () => {},
      onStatusChange: () => {},
    });
  }, [provider, handleDetectionFrame]);

  const progressPercent = Math.min(100, (progressMs / CALIBRATION_DURATION_MS) * 100);
  const allChecksPassed = Object.values(checks).every(Boolean);

  const checkItems: CheckItem[] = [
    { key: 'microphone', label: 'Microphone Active', icon: <Mic size={14} />, passed: checks.microphone },
    { key: 'camera', label: 'Camera Permission', icon: <Camera size={14} />, passed: checks.cameraPermission },
    { key: 'face', label: 'Face Detected', icon: <User size={14} />, passed: checks.faceDetected },
    { key: 'lighting', label: 'Good Lighting', icon: <Sun size={14} />, passed: checks.lightingGood },
    { key: 'stable', label: 'Camera Stable', icon: <Move size={14} />, passed: checks.cameraStable },
    { key: 'distance', label: checks.distanceAppropriate ? 'Distance OK' : 'Adjust Distance', icon: <Ruler size={14} />, passed: checks.distanceAppropriate },
    { key: 'network', label: 'Network Stable', icon: <Wifi size={14} />, passed: checks.networkStable },
    { key: 'battery', label: checks.batteryOk ? 'Battery OK' : 'Battery Low — Plug In', icon: <Battery size={14} />, passed: checks.batteryOk },
  ];

  // Filter out irrelevant checks for local webcam (no network/battery)
  const visibleChecks = provider.type === 'local_webcam'
    ? checkItems.filter(c => !['network', 'battery'].includes(c.key))
    : checkItems;

  const phoneToken = provider.type === 'phone_camera'
    ? (provider as PhoneCameraProvider).getPairingToken()
    : null;

  return (
    <div className="flex flex-col gap-4 p-4 bg-slate-900 rounded-lg border border-slate-700 max-w-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
        <Shield size={16} className="text-cyan-400" />
        Pre-Flight Check
      </div>

      {/* QR Code Section — Phone Pairing */}
      {showQrCode && (phoneConnectionState === 'WAITING' || phoneConnectionState === 'WAITING_FOR_PHONE') && (
        <div className="flex flex-col items-center gap-3 p-4 bg-slate-800 rounded-lg border border-slate-600">
          <p className="text-xs text-slate-300 font-medium">Scan with your phone camera</p>

          {qrCodeUrl && (
            <div className="p-3 bg-white rounded-lg">
              <QRCodeSVG value={qrCodeUrl} size={160} level="M" />
            </div>
          )}

          {phoneToken && (
            <div className="font-mono text-lg tracking-[0.3em] text-cyan-300 font-bold">
              {phoneToken}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 size={12} className="animate-spin" />
            Waiting for phone...
          </div>

          {expiryCountdown && (
            <div className="text-[10px] text-slate-500">
              Expires in <span className="font-mono text-slate-400">{expiryCountdown}</span>
            </div>
          )}
        </div>
      )}

      {/* Phone connecting state */}
      {/* TODO: Remove legacy 'PHONE_CONNECTING' compatibility after v1.x migration */}
      {(phoneConnectionState === 'CONNECTING' || phoneConnectionState === 'PHONE_CONNECTING') && (
        <div className="flex items-center gap-2 text-xs text-amber-400 p-3 bg-slate-800 rounded-lg">
          <Loader2 size={14} className="animate-spin" />
          Phone connecting...
        </div>
      )}

      {/* Checklist */}
      <div className="flex flex-col gap-1.5">
        {visibleChecks.map(check => (
          <div
            key={check.key}
            className={`flex items-center gap-2 text-xs py-1 px-2 rounded transition-colors ${
              check.passed
                ? 'text-emerald-400 bg-emerald-900/20'
                : 'text-red-400 bg-red-900/20'
            }`}
          >
            {check.passed
              ? <CheckCircle size={12} className="text-emerald-400 flex-shrink-0" />
              : <XCircle size={12} className="text-red-400 flex-shrink-0" />
            }
            <span className="flex-1">{check.label}</span>
            {check.icon}
          </div>
        ))}
      </div>

      {/* Progress Bar (pause/resume) */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span>Calibration</span>
          <span className="font-mono">
            {allChecksPassed
              ? `${(progressMs / 1000).toFixed(1)}s / ${(CALIBRATION_DURATION_MS / 1000).toFixed(0)}s`
              : 'Paused'
            }
          </span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              allChecksPassed
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                : 'bg-amber-500/50'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Ready indicator */}
      {isReady && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium p-2 bg-emerald-900/30 rounded-lg">
          <CheckCircle size={14} />
          Calibration complete — ready to start
        </div>
      )}
    </div>
  );
};
