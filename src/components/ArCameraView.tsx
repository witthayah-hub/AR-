import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TakrawSkill, PoseAnalysisResult } from '../types/takraw';
import { evaluatePose, LandmarkPoint } from '../utils/poseMath';
import { soundCoach } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Camera as CameraIcon,
  RefreshCw,
  VideoOff,
  FlipHorizontal,
  CircleDot
} from 'lucide-react';

interface ArCameraViewProps {
  currentSkill: TakrawSkill;
  onAnalysisUpdate: (result: PoseAnalysisResult) => void;
  onRepCounted: (score: 4 | 3 | 2 | 1) => void;
  onSwitchToSimulator: () => void;
}

// Global MediaPipe types
declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

export const ArCameraView: React.FC<ArCameraViewProps> = ({
  currentSkill,
  onAnalysisUpdate,
  onRepCounted,
  onSwitchToSimulator
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [enableVirtualBall, setEnableVirtualBall] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  // Virtual Takraw ball physics state
  const ballRef = useRef<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    isActive: boolean;
    lastHitTime: number;
  }>({
    x: 0.5,
    y: 0.2,
    vx: 0.001,
    vy: 0.002,
    radius: 22,
    isActive: true,
    lastHitTime: 0
  });

  // Hold-pose rep detector
  const holdTimerRef = useRef<{
    startTime: number;
    counting: boolean;
    lastCountTime: number;
  }>({
    startTime: 0,
    counting: false,
    lastCountTime: 0
  });

  // Keep reference to latest skill to avoid stale closure in onResults callback
  const skillRef = useRef<TakrawSkill>(currentSkill);
  useEffect(() => {
    skillRef.current = currentSkill;
  }, [currentSkill]);

  const drawRattanBall = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, '#fde68a'); // rattan light
    grad.addColorStop(0.6, '#d97706'); // warm rattan
    grad.addColorStop(1, '#78350f'); // shadow
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Rattan strip patterns
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.8, r * 0.3, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.8, r * 0.3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();

    // Weave holes
    ctx.fillStyle = '#1c1917';
    [-r * 0.3, r * 0.3].forEach((dx) => {
      ctx.beginPath();
      ctx.arc(x + dx, y - r * 0.2, 3, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(x, y + r * 0.3, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const handlePoseResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.save();
    ctx.clearRect(0, 0, w, h);

    // Draw camera frame
    if (results.image) {
      ctx.drawImage(results.image, 0, 0, w, h);
    }

    if (results.poseLandmarks) {
      const landmarks: LandmarkPoint[] = results.poseLandmarks.map((lm: any) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility
      }));

      // Evaluate posture biomechanics
      const analysis = evaluatePose(skillRef.current.id, landmarks);
      onAnalysisUpdate(analysis);

      // Draw skeleton connectors & landmarks if toggled
      if (showSkeleton && window.drawConnectors && window.drawLandmarks) {
        window.drawConnectors(ctx, results.poseLandmarks, window.POSE_CONNECTIONS, {
          color: analysis.score === 4 ? '#4ade80' : analysis.score === 3 ? '#38bdf8' : '#f59e0b',
          lineWidth: 3
        });
        window.drawLandmarks(ctx, results.poseLandmarks, {
          color: '#f43f5e',
          lineWidth: 2,
          radius: 4
        });
      }

      // Check for posture repetition hold (holding Grade 4 or 3 for 1.2s counts as a rep)
      const now = Date.now();
      if (analysis.score >= 3 && analysis.detected) {
        if (!holdTimerRef.current.counting) {
          holdTimerRef.current.startTime = now;
          holdTimerRef.current.counting = true;
        } else if (now - holdTimerRef.current.startTime > 1200 && now - holdTimerRef.current.lastCountTime > 2000) {
          holdTimerRef.current.lastCountTime = now;
          holdTimerRef.current.counting = false;
          onRepCounted(analysis.score);
          soundCoach.playSuccessChime();
          if (analysis.score === 4) {
            soundCoach.playPerfectFanfare();
            confetti({
              particleCount: 30,
              spread: 60,
              origin: { y: 0.6 }
            });
          }
        }
      } else {
        holdTimerRef.current.counting = false;
      }

      // Virtual Takraw Ball Physics & Contact Collision
      if (enableVirtualBall) {
        const ball = ballRef.current;
        // Gravity & movement
        ball.vy += 0.0006; // gravity
        ball.y += ball.vy;
        ball.x += ball.vx;

        // Bounce off screen side walls
        if (ball.x < 0.1 || ball.x > 0.9) {
          ball.vx = -ball.vx * 0.8;
          ball.x = Math.max(0.1, Math.min(0.9, ball.x));
        }

        // Determine striking contact landmark based on active skill
        let strikeTarget: LandmarkPoint = landmarks[28]; // default right foot
        if (skillRef.current.id === 'inside_foot') {
          // Choose foot that is elevated
          strikeTarget = landmarks[28].y < landmarks[27].y ? landmarks[28] : landmarks[27];
        } else if (skillRef.current.id === 'knee') {
          strikeTarget = landmarks[26].y < landmarks[25].y ? landmarks[26] : landmarks[25];
        } else if (skillRef.current.id === 'head') {
          strikeTarget = landmarks[0]; // nose/forehead
        } else if (skillRef.current.id === 'instep') {
          strikeTarget = landmarks[32] || landmarks[28];
        }

        const ballPxX = ball.x * w;
        const ballPxY = ball.y * h;
        const targetPxX = strikeTarget.x * w;
        const targetPxY = strikeTarget.y * h;

        const dist = Math.hypot(ballPxX - targetPxX, ballPxY - targetPxY);
        const contactRadius = 55;

        // Visual target ring around athlete's contact zone
        ctx.strokeStyle = analysis.score >= 3 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(56, 189, 248, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(targetPxX, targetPxY, contactRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Collision Check: Ball hits foot/knee/head!
        if (dist < contactRadius && ball.vy > 0 && now - ball.lastHitTime > 600) {
          ball.lastHitTime = now;
          // Rebound ball upwards with velocity
          ball.vy = -(0.016 + Math.random() * 0.005);
          ball.vx = (ball.x - strikeTarget.x) * 0.05 + (Math.random() - 0.5) * 0.003;

          soundCoach.playTakrawHit();
          onRepCounted(analysis.score);

          if (analysis.score === 4) {
            soundCoach.playPerfectFanfare();
            confetti({
              particleCount: 45,
              spread: 70,
              origin: { x: ball.x, y: ball.y }
            });
          }
        }

        // Reset ball if falls below bottom of frame
        if (ball.y > 0.95) {
          ball.y = 0.15;
          ball.x = strikeTarget.x + (Math.random() - 0.5) * 0.1;
          ball.vy = 0.001;
          ball.vx = (Math.random() - 0.5) * 0.002;
        }

        // Draw virtual rattan takraw ball
        drawRattanBall(ctx, ball.x * w, ball.y * h, ball.radius);
      }
    } else {
      // No landmarks detected
      onAnalysisUpdate({
        detected: false,
        score: 1,
        scorePercent: 0,
        statusTextTh: 'ยังไม่พบนักกีฬาในกล้อง...',
        statusTextEn: 'No athlete detected in frame...',
        statusType: 'idle',
        angles: {},
        feedbackSuggestions: ['กรุณายืนถอยหลังให้เห็นทั้งตัวตั้งแต่ศีรษะถึงปลายเท้า'],
        strikeZoneActive: false,
        contactPointMet: false
      });
    }

    ctx.restore();
  }, [onAnalysisUpdate, onRepCounted, showSkeleton, enableVirtualBall]);

  // Initialize MediaPipe Pose and Camera
  useEffect(() => {
    let cameraInstance: any = null;
    let poseInstance: any = null;
    let isCancelled = false;

    const startMediaPipe = async () => {
      try {
        if (!window.Pose || !window.Camera) {
          // Wait briefly for CDN scripts to load if needed
          await new Promise((resolve) => setTimeout(resolve, 600));
        }

        if (!window.Pose || !window.Camera) {
          throw new Error('MediaPipe scripts not ready');
        }

        poseInstance = new window.Pose({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });

        poseInstance.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        poseInstance.onResults(handlePoseResults);

        if (videoRef.current && !isCancelled) {
          cameraInstance = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && poseInstance) {
                await poseInstance.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480
          });

          await cameraInstance.start();
          if (!isCancelled) {
            setCameraActive(true);
            setCameraError(null);
          }
        }
      } catch (err: any) {
        console.warn('Camera/MediaPipe init error:', err);
        if (!isCancelled) {
          setCameraActive(false);
          setCameraError(err?.message || 'ไม่สามารถเปิดกล้องได้');
        }
      }
    };

    startMediaPipe();

    return () => {
      isCancelled = true;
      if (cameraInstance && cameraInstance.stop) {
        cameraInstance.stop();
      }
      if (poseInstance && poseInstance.close) {
        poseInstance.close();
      }
    };
  }, [handlePoseResults]);

  return (
    <div className="flex flex-col gap-3">
      {/* AR Viewport Container */}
      <div className="relative w-full aspect-[4/3] max-h-[480px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
        {/* Hidden video stream for MediaPipe processing */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="hidden"
        />

        {/* Live Canvas Feed with Motion Capture */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className={`w-full h-full object-cover ${isMirrored ? 'scale-x-[-1]' : ''}`}
        />

        {/* Camera Loading or Error State */}
        {!cameraActive && !cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
            <div className="text-sm font-semibold text-slate-200">
              กำลังเชื่อมต่อกล้องและระบบวิเคราะห์ MediaPipe...
            </div>
            <div className="text-xs text-slate-400 max-w-sm">
              กรุณาอนุญาตการเข้าถึงกล้องเว็บแคม (Camera Permission) ในบราวเซอร์ของคุณ
            </div>
          </div>
        )}

        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/95 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <VideoOff className="w-6 h-6" />
            </div>
            <div className="text-base font-bold text-slate-100">
              ไม่พบการเชื่อมต่อกล้องเว็บแคม
            </div>
            <div className="text-xs text-slate-400 max-w-md">
              ไม่พบสัญญาณกล้อง หรือคุณอาจยังไม่ได้อนุญาตการใช้กล้อง คุณสามารถใช้งาน
              <span className="text-cyan-400 font-semibold"> โหมดจำลองชีวกลศาสตร์ (Simulator) </span>
              เพื่อทดลองการเคลื่อนไหวและเกณฑ์ประเมินได้ทันที
            </div>
            <button
              onClick={onSwitchToSimulator}
              className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all cursor-pointer"
            >
              สลับไปยังโหมดจำลอง (Simulator Mode)
            </button>
          </div>
        )}

        {/* Top Control Bar inside Video Viewport */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 text-xs pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-slate-200">กล้องสด AR</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">{currentSkill.titleTh}</span>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={() => setIsMirrored(!isMirrored)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 backdrop-blur-md transition-colors cursor-pointer ${
                isMirrored
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="สลับโหมดกระจกเงา (Mirror View)"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 backdrop-blur-md transition-colors cursor-pointer ${
                showSkeleton
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="เปิด/ปิดเส้นโครงกระดูก (Pose Skeleton)"
            >
              <CircleDot className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setEnableVirtualBall(!enableVirtualBall)}
              className={`px-2.5 py-1.5 rounded-lg border text-xs flex items-center gap-1.5 backdrop-blur-md transition-colors cursor-pointer ${
                enableVirtualBall
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-900/80 border-slate-700 text-slate-400'
              }`}
              title="เปิด/ปิดลูกตะกร้อเสมือนจริง AR"
            >
              <span>⚽</span>
              <span className="hidden sm:inline font-medium">ลูกตะกร้อ AR</span>
            </button>
          </div>
        </div>

        {/* Athlete Alignment Silhouette Prompt */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <CameraIcon className="w-3 h-3 text-cyan-400" />
            <span>คำแนะนำ: ยืนห่างจากกล้องประมาณ 1.8 - 2.5 เมตร ให้เห็นลำตัวและเท้าชัดเจน</span>
          </div>
          <button
            onClick={onSwitchToSimulator}
            className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
          >
            เปลี่ยนเป็นโหมดจำลอง
          </button>
        </div>
      </div>
    </div>
  );
};
