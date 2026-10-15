import React from 'react';
import { PoseAnalysisResult, TakrawSkill } from '../types/takraw';
import { soundCoach } from '../utils/audio';
import { Volume2, VolumeX, Mic, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

interface HudOverlayProps {
  analysis: PoseAnalysisResult;
  currentSkill: TakrawSkill;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  onToggleSound: () => void;
  onToggleVoice: () => void;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  analysis,
  currentSkill,
  soundEnabled,
  voiceEnabled,
  onToggleSound,
  onToggleVoice
}) => {
  const getGradeBadge = (score: 4 | 3 | 2 | 1) => {
    switch (score) {
      case 4:
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          text: 'ระดับ 4 · ดีมาก (Exemplary)',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        };
      case 3:
        return {
          bg: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300',
          dot: 'bg-cyan-400',
          text: 'ระดับ 3 · ดี (Proficient)',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
        };
      case 2:
        return {
          bg: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          text: 'ระดับ 2 · พอใช้ (Developing)',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        };
      case 1:
      default:
        return {
          bg: 'bg-rose-500/15 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400',
          text: 'ระดับ 1 · ควรปรับปรุง (Beginning)',
          icon: <XCircle className="w-3.5 h-3.5 text-rose-400" />
        };
    }
  };

  const gradeInfo = getGradeBadge(analysis.score);

  const handleSpeakCurrentAdvice = () => {
    const textToSpeak = `${analysis.statusTextTh} ${analysis.feedbackSuggestions[0] || ''}`;
    soundCoach.speakAdvice(textToSpeak, true);
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col gap-3">
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
            สถานะวิเคราะห์ชีวกลศาสตร์ (AR HUD)
          </div>
        </div>

        {/* Audio / Voice controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? 'ปิดเสียงเอฟเฟกต์' : 'เปิดเสียงเอฟเฟกต์'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggleVoice}
            className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
              voiceEnabled
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={voiceEnabled ? 'ปิดเสียงโค้ชภาษาไทย' : 'เปิดเสียงโค้ชภาษาไทย'}
          >
            <Mic className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Posture Status Display */}
      <div className="flex flex-col gap-1.5">
        <div className="text-sm font-bold text-white flex items-center justify-between">
          <span className="text-slate-100">{analysis.statusTextTh || 'กำลังตรวจจับท่าทาง...'}</span>
          <span className="font-mono text-xs text-cyan-400 tabular-nums">
            {analysis.scorePercent}%
          </span>
        </div>

        {/* Score Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              analysis.score === 4
                ? 'bg-emerald-400'
                : analysis.score === 3
                ? 'bg-cyan-400'
                : analysis.score === 2
                ? 'bg-amber-400'
                : 'bg-rose-400'
            }`}
            style={{ width: `${Math.max(8, analysis.scorePercent)}%` }}
          />
        </div>

        {/* 4-Tier Rubric Level Badge */}
        <div className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${gradeInfo.bg}`}>
          {gradeInfo.icon}
          <span>{gradeInfo.text}</span>
        </div>
      </div>

      {/* Joint Angle Telemetry Strip */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-[11px]">
        <div className="flex flex-col">
          <span className="text-slate-400">มุมงอเข่า (Knee)</span>
          <span className="font-mono font-semibold text-slate-200 tabular-nums">
            {analysis.angles.rightKnee ?? '--'}°
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400">การย่อขาหลัก</span>
          <span className="font-mono font-semibold text-slate-200 tabular-nums">
            {analysis.angles.leftKnee ?? '--'}°
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-slate-400">มุมเอนลำตัว</span>
          <span className="font-mono font-semibold text-slate-200 tabular-nums">
            {analysis.angles.torsoAngle ?? '--'}°
          </span>
        </div>
      </div>

      {/* Coaching Tips & Recommendations */}
      <div className="flex flex-col gap-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-300 font-semibold">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            ข้อเสนอแนะเพื่อพัฒนาทักษะ:
          </span>
          <button
            onClick={handleSpeakCurrentAdvice}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer font-normal"
          >
            <Volume2 className="w-3 h-3" />
            ฟังเสียงโค้ช
          </button>
        </div>

        <ul className="space-y-1 text-slate-300 text-[11px] pl-3 list-disc">
          {analysis.feedbackSuggestions.length > 0 ? (
            analysis.feedbackSuggestions.map((tip, idx) => (
              <li key={idx} className="leading-relaxed">
                {tip}
              </li>
            ))
          ) : (
            <li className="text-slate-400">ยกเท้าหรือเริ่มฝึกตามท่าบนไพ่ด้านข้าง</li>
          )}
        </ul>
      </div>

      {/* Target Contact Point Reminder */}
      <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-200 flex items-center gap-2">
        <span className="font-bold text-cyan-400 shrink-0">จุดสัมผัส:</span>
        <span className="truncate">{currentSkill.contactPointTh}</span>
      </div>
    </div>
  );
};
