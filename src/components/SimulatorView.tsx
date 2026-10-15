import React, { useState, useEffect, useRef } from 'react';
import { TakrawSkill, PoseAnalysisResult } from '../types/takraw';
import { evaluatePose, LandmarkPoint } from '../utils/poseMath';
import { soundCoach } from '../utils/audio';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

interface SimulatorViewProps {
  currentSkill: TakrawSkill;
  onAnalysisUpdate: (result: PoseAnalysisResult) => void;
  onRepCounted: (score: 4 | 3 | 2 | 1) => void;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({
  currentSkill,
  onAnalysisUpdate,
  onRepCounted
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Controllable joint values
  const [kneeAngle, setKneeAngle] = useState<number>(115);
  const [ankleHeight, setAnkleHeight] = useState<number>(45); // percentage
  const [supportKneeAngle, setSupportKneeAngle] = useState<number>(150);
  const [torsoLean, setTorsoLean] = useState<number>(10);
  const [headTilt, setHeadTilt] = useState<number>(45);
  const [isDemoPlaying, setIsDemoPlaying] = useState<boolean>(true);
  const animFrameRef = useRef<number | null>(null);
  const animTimeRef = useRef<number>(0);

  // Set default slider values based on current skill
  useEffect(() => {
    if (currentSkill.id === 'inside_foot') {
      setKneeAngle(115);
      setAnkleHeight(42);
      setSupportKneeAngle(150);
      setTorsoLean(8);
      setHeadTilt(25);
    } else if (currentSkill.id === 'knee') {
      setKneeAngle(90);
      setAnkleHeight(48);
      setSupportKneeAngle(155);
      setTorsoLean(5);
      setHeadTilt(20);
    } else if (currentSkill.id === 'instep') {
      setKneeAngle(140);
      setAnkleHeight(35);
      setSupportKneeAngle(148);
      setTorsoLean(12);
      setHeadTilt(30);
    } else if (currentSkill.id === 'head') {
      setKneeAngle(150);
      setAnkleHeight(15);
      setSupportKneeAngle(145);
      setTorsoLean(18);
      setHeadTilt(48);
    } else {
      setKneeAngle(120);
      setAnkleHeight(40);
      setSupportKneeAngle(140);
      setTorsoLean(12);
      setHeadTilt(25);
    }
  }, [currentSkill.id]);

  // Demo auto-juggling bounce animation
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      if (isDemoPlaying) {
        animTimeRef.current += dt * 2.5;
        const wave = Math.sin(animTimeRef.current);
        const cycleProgress = (wave + 1) / 2; // 0 to 1

        if (currentSkill.id === 'inside_foot') {
          setAnkleHeight(30 + cycleProgress * 18);
          setKneeAngle(130 - cycleProgress * 25);
          setSupportKneeAngle(165 - cycleProgress * 18);
        } else if (currentSkill.id === 'knee') {
          setAnkleHeight(25 + cycleProgress * 28);
          setKneeAngle(110 - cycleProgress * 25);
          setSupportKneeAngle(165 - cycleProgress * 15);
        } else if (currentSkill.id === 'instep') {
          setAnkleHeight(20 + cycleProgress * 20);
          setKneeAngle(155 - cycleProgress * 20);
          setSupportKneeAngle(165 - cycleProgress * 18);
        } else if (currentSkill.id === 'head') {
          setTorsoLean(8 + cycleProgress * 14);
          setHeadTilt(30 + cycleProgress * 22);
          setSupportKneeAngle(165 - cycleProgress * 25);
        }
      }

      renderCanvas();
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isDemoPlaying, currentSkill.id, kneeAngle, ankleHeight, supportKneeAngle, torsoLean, headTilt]);

  const generateSyntheticLandmarks = (): LandmarkPoint[] => {
    const landmarks: LandmarkPoint[] = Array(33).fill(null).map(() => ({ x: 0.5, y: 0.5 }));

    // Baseline proportions
    const midX = 0.5;
    const groundY = 0.88;

    // Head
    const noseY = 0.22 - (headTilt - 30) * 0.001;
    const noseX = midX + Math.sin((torsoLean * Math.PI) / 180) * 0.08;
    landmarks[0] = { x: noseX, y: noseY };

    // Shoulders
    const shoulderY = 0.34;
    const shoulderOffsetX = 0.11;
    landmarks[11] = { x: midX - shoulderOffsetX, y: shoulderY }; // Left shoulder
    landmarks[12] = { x: midX + shoulderOffsetX, y: shoulderY }; // Right shoulder

    // Hips
    const hipY = 0.54;
    const hipOffsetX = 0.07;
    landmarks[23] = { x: midX - hipOffsetX, y: hipY }; // Left hip
    landmarks[24] = { x: midX + hipOffsetX, y: hipY }; // Right hip

    // Left leg (Support leg)
    const leftHip = landmarks[23];
    const supportBendRad = ((180 - supportKneeAngle) * Math.PI) / 180;
    const leftKneeY = hipY + 0.17 + Math.sin(supportBendRad) * 0.03;
    const leftKneeX = leftHip.x - Math.sin(supportBendRad) * 0.04;
    landmarks[25] = { x: leftKneeX, y: leftKneeY };
    landmarks[27] = { x: leftKneeX, y: groundY }; // Left ankle on ground
    landmarks[31] = { x: leftKneeX - 0.04, y: groundY + 0.02 }; // Left foot

    // Right leg (Kicking leg)
    const rightHip = landmarks[24];
    // Dynamic active leg positions based on sliders
    let rightKneeX = rightHip.x + 0.06;
    let rightKneeY = hipY + 0.16;
    let rightAnkleX = rightHip.x + 0.08;
    let rightAnkleY = groundY - (ankleHeight / 100) * 0.42;

    if (currentSkill.id === 'inside_foot') {
      // Knee flared outward, ankle held inward/under knee
      rightKneeX = rightHip.x + 0.12;
      rightKneeY = hipY + 0.12;
      rightAnkleX = rightHip.x + 0.04; // Foot pulled inward for side kick
    } else if (currentSkill.id === 'knee') {
      // Thigh horizontal
      rightKneeX = rightHip.x + 0.15;
      rightKneeY = hipY + 0.02; // horizontal thigh!
      rightAnkleX = rightKneeX;
      rightAnkleY = rightKneeY + 0.18; // dangling lower leg
    } else if (currentSkill.id === 'instep') {
      rightKneeX = rightHip.x + 0.08;
      rightKneeY = hipY + 0.14;
      rightAnkleX = rightHip.x + 0.15;
    }

    landmarks[26] = { x: rightKneeX, y: rightKneeY };
    landmarks[28] = { x: rightAnkleX, y: rightAnkleY };
    landmarks[32] = { x: rightAnkleX + 0.04, y: rightAnkleY + 0.02 };

    return landmarks;
  };

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear background: Athletic Sports Studio styling
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Draw court floor grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let y = h * 0.85; y <= h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Court baseline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.88);
    ctx.lineTo(w, h * 0.88);
    ctx.stroke();

    const landmarks = generateSyntheticLandmarks();

    // Biomechanical analysis
    const result = evaluatePose(currentSkill.id, landmarks);
    onAnalysisUpdate(result);

    // Draw skeleton connectors
    const connections: [number, number][] = [
      [11, 12], // shoulders
      [11, 23], [12, 24], // torso
      [23, 24], // hips
      [23, 25], [25, 27], [27, 31], // left leg
      [24, 26], [26, 28], [28, 32], // right leg
    ];

    // Glow effect for skeleton
    ctx.shadowBlur = 12;
    ctx.shadowColor = result.score >= 3 ? '#22d3ee' : '#f59e0b';

    ctx.strokeStyle = result.score === 4 ? '#38bdf8' : result.score === 3 ? '#22d3ee' : '#f59e0b';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    connections.forEach(([i, j]) => {
      const p1 = landmarks[i];
      const p2 = landmarks[j];
      ctx.beginPath();
      ctx.moveTo(p1.x * w, p1.y * h);
      ctx.lineTo(p2.x * w, p2.y * h);
      ctx.stroke();
    });

    // Draw Head
    const nose = landmarks[0];
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.arc(nose.x * w, (nose.y + 0.04) * h, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw joints
    landmarks.forEach((p, idx) => {
      if ([0, 11, 12, 23, 24, 25, 26, 27, 28, 31, 32].includes(idx)) {
        ctx.fillStyle = idx === 28 || idx === 26 ? '#38bdf8' : '#e2e8f0';
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, idx === 28 ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw Takraw ball bouncing in sync with the athlete
    const cycleProgress = (Math.sin(animTimeRef.current) + 1) / 2;
    let ballX = landmarks[28].x * w;
    let ballY = (landmarks[28].y - 0.05) * h - (1 - cycleProgress) * 90;

    if (currentSkill.id === 'knee') {
      ballX = landmarks[26].x * w + 10;
      ballY = (landmarks[26].y - 0.05) * h - (1 - cycleProgress) * 80;
    } else if (currentSkill.id === 'head') {
      ballX = landmarks[0].x * w;
      ballY = (landmarks[0].y - 0.06) * h - (1 - cycleProgress) * 110;
    }

    // Draw realistic rattan woven ball on canvas
    drawRattanBall(ctx, ballX, ballY, 22);

    // Target Strike Zone Ring
    ctx.strokeStyle = result.score === 4 ? 'rgba(74, 222, 128, 0.8)' : 'rgba(56, 189, 248, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    if (currentSkill.id === 'inside_foot') {
      ctx.arc(landmarks[28].x * w, landmarks[28].y * h, 30, 0, Math.PI * 2);
    } else if (currentSkill.id === 'knee') {
      ctx.arc(landmarks[26].x * w, landmarks[26].y * h, 32, 0, Math.PI * 2);
    } else if (currentSkill.id === 'head') {
      ctx.arc(landmarks[0].x * w, (landmarks[0].y - 0.02) * h, 32, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const drawRattanBall = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    // Ball base sphere
    const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    grad.addColorStop(0, '#fde68a'); // rattan light wood
    grad.addColorStop(0.6, '#d97706'); // warm golden rattan
    grad.addColorStop(1, '#78350f'); // shadow
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();

    // Woven rattan strip weave patterns
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    // Weave curve 1
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.8, r * 0.3, Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    // Weave curve 2
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.8, r * 0.3, -Math.PI / 4, 0, Math.PI * 2);
    ctx.stroke();
    // Ball holes (pentagonal/hexagonal openings characteristic of Takraw balls)
    ctx.fillStyle = '#1c1917';
    [-r * 0.3, r * 0.3].forEach((dx) => {
      ctx.beginPath();
      ctx.arc(x + dx, y - r * 0.2, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.beginPath();
    ctx.arc(x, y + r * 0.3, 3.5, 0, Math.PI * 2);
    ctx.fill();
  };

  const handleApplyPreset = (grade: 4 | 2 | 1) => {
    setIsDemoPlaying(false);
    if (grade === 4) {
      if (currentSkill.id === 'inside_foot') {
        setAnkleHeight(42);
        setKneeAngle(115);
        setSupportKneeAngle(150);
      } else if (currentSkill.id === 'knee') {
        setAnkleHeight(48);
        setKneeAngle(90);
        setSupportKneeAngle(155);
      } else if (currentSkill.id === 'head') {
        setTorsoLean(14);
        setHeadTilt(46);
        setSupportKneeAngle(145);
      }
      soundCoach.playPerfectFanfare();
      onRepCounted(4);
    } else if (grade === 2) {
      // Foot too high or knee too low
      setAnkleHeight(78);
      setKneeAngle(85);
      soundCoach.playTakrawHit();
    } else {
      // Grade 1: no knee turnout, stiff legs
      setAnkleHeight(15);
      setKneeAngle(175);
      setSupportKneeAngle(180);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 2D Canvas Simulator Screen */}
      <div className="relative w-full aspect-[4/3] max-h-[460px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl">
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Simulator Badge & Animation Controller */}
        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="font-semibold text-slate-200">จำลองชีวกลศาสตร์ (Simulator)</span>
          <span className="text-slate-500">·</span>
          <button
            onClick={() => setIsDemoPlaying(!isDemoPlaying)}
            className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium ml-1 cursor-pointer"
          >
            {isDemoPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>หยุดชั่วคราว</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>เล่นการเดาะต่อเนื่อง</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Rubric Tester Presets */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1 rounded-lg border border-slate-700 text-xs">
          <button
            onClick={() => handleApplyPreset(4)}
            className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-medium transition-colors cursor-pointer"
            title="ทดสอบท่าที่ได้คะแนนระดับ 4 (ดีมาก)"
          >
            ดีมาก (4)
          </button>
          <button
            onClick={() => handleApplyPreset(2)}
            className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-medium transition-colors cursor-pointer"
            title="ทดสอบข้อผิดพลาดที่ได้คะแนนระดับ 2 (พอใช้)"
          >
            พอใช้ (2)
          </button>
          <button
            onClick={() => handleApplyPreset(1)}
            className="px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 font-medium transition-colors cursor-pointer"
            title="ทดสอบข้อผิดพลาดที่ได้คะแนนระดับ 1 (ควรปรับปรุง)"
          >
            ปรับปรุง (1)
          </button>
        </div>

        {/* Visual Cue Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>ลากสไลเดอร์ด้านล่างเพื่อทดสอบการตรวจจับมุมของระบบ AI</span>
        </div>
      </div>

      {/* Manual Joint & Angle Sliders */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span>ปรับแต่งมุมข้อต่อ (Biomechanical Angles)</span>
          <button
            onClick={() => {
              setIsDemoPlaying(false);
              handleApplyPreset(4);
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            รีเซ็ตเป็นท่าสมบูรณ์แบบ
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Slider 1: Elevation / Height */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>ความสูงเท้า/เข่า:</span>
              <span className="font-mono text-cyan-400">{ankleHeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              value={ankleHeight}
              onChange={(e) => {
                setIsDemoPlaying(false);
                setAnkleHeight(Number(e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider 2: Knee Angle / Turnout */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>มุมงอเข่า (Knee):</span>
              <span className="font-mono text-cyan-400">{kneeAngle}°</span>
            </div>
            <input
              type="range"
              min="70"
              max="175"
              value={kneeAngle}
              onChange={(e) => {
                setIsDemoPlaying(false);
                setKneeAngle(Number(e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Slider 3: Support Knee */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between text-slate-400">
              <span>การย่อขาหลัก:</span>
              <span className="font-mono text-cyan-400">{supportKneeAngle}°</span>
            </div>
            <input
              type="range"
              min="120"
              max="180"
              value={supportKneeAngle}
              onChange={(e) => {
                setIsDemoPlaying(false);
                setSupportKneeAngle(Number(e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
