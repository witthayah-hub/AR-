import React, { useState, useEffect, useCallback } from 'react';
import { TAKRAW_SKILLS } from './data/takrawSkills';
import { TakrawSkill, PoseAnalysisResult, SessionStats } from './types/takraw';
import { Header } from './components/Header';
import { ArCameraView } from './components/ArCameraView';
import { SimulatorView } from './components/SimulatorView';
import { HudOverlay } from './components/HudOverlay';
import { FlashcardDeck } from './components/FlashcardDeck';
import { TrainingStatsModal } from './components/TrainingStatsModal';
import { RubricGuideModal } from './components/RubricGuideModal';
import { soundCoach } from './utils/audio';
import {
  Camera,
  Cpu,
  Trophy,
  Flame,
  Volume2,
  VolumeX,
  Target,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';

export default function App() {
  const [currentSkill, setCurrentSkill] = useState<TakrawSkill>(TAKRAW_SKILLS[0]);
  const [viewMode, setViewMode] = useState<'camera' | 'simulator'>('camera');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isRubricOpen, setIsRubricOpen] = useState<boolean>(false);

  // Analysis result from active view (camera or simulator)
  const [analysisResult, setAnalysisResult] = useState<PoseAnalysisResult>({
    detected: false,
    score: 1,
    scorePercent: 0,
    statusTextTh: 'รอการตรวจจับท่าทาง...',
    statusTextEn: 'Waiting for pose detection...',
    statusType: 'idle',
    angles: {},
    feedbackSuggestions: ['เปิดกล้องและยืนให้เห็นลำตัวเพื่อเริ่มวิเคราะห์'],
    strikeZoneActive: false,
    contactPointMet: false
  });

  // Training Session Statistics
  const [stats, setStats] = useState<SessionStats>({
    repsCompleted: 0,
    repsBySkill: {
      inside_foot: 0,
      instep: 0,
      knee: 0,
      head: 0
    },
    bestStreak: 0,
    currentStreak: 0,
    gradeCounts: {
      grade4: 0,
      grade3: 0,
      grade2: 0,
      grade1: 0
    },
    startTime: Date.now()
  });

  const handleAnalysisUpdate = useCallback((result: PoseAnalysisResult) => {
    setAnalysisResult(result);
  }, []);

  const handleRepCounted = useCallback((score: 4 | 3 | 2 | 1) => {
    setStats((prev) => {
      const nextReps = prev.repsCompleted + 1;
      const nextStreak = prev.currentStreak + 1;
      const nextBest = Math.max(prev.bestStreak, nextStreak);

      const skillKey = currentSkill.id;
      const skillReps = (prev.repsBySkill[skillKey] || 0) + 1;

      const gradeKey = `grade${score}` as keyof typeof prev.gradeCounts;
      const gradeCounts = {
        ...prev.gradeCounts,
        [gradeKey]: prev.gradeCounts[gradeKey] + 1
      };

      return {
        ...prev,
        repsCompleted: nextReps,
        currentStreak: nextStreak,
        bestStreak: nextBest,
        repsBySkill: {
          ...prev.repsBySkill,
          [skillKey]: skillReps
        },
        gradeCounts
      };
    });
  }, [currentSkill.id]);

  const handleResetStats = () => {
    setStats({
      repsCompleted: 0,
      repsBySkill: {
        inside_foot: 0,
        instep: 0,
        knee: 0,
        head: 0
      },
      bestStreak: 0,
      currentStreak: 0,
      gradeCounts: {
        grade4: 0,
        grade3: 0,
        grade2: 0,
        grade1: 0
      },
      startTime: Date.now()
    });
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundCoach.setSoundEnabled(next);
  };

  const handleToggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    soundCoach.setVoiceEnabled(next);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Prompt',sans-serif]">
      {/* Top Bar Contract Navigation */}
      <Header
        onOpenRubricGuide={() => setIsRubricOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        repsCount={stats.repsCompleted}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        {/* Workspace Toolbar: Mode Switcher & Live Session Ticker */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
          {/* Segmented Mode Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-lg border border-slate-800/80">
            <button
              onClick={() => setViewMode('camera')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'camera'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>กล้อง AR โมชั่นแคปเจอร์</span>
            </button>

            <button
              onClick={() => setViewMode('simulator')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                viewMode === 'simulator'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>โหมดจำลองชีวกลศาสตร์</span>
            </button>
          </div>

          {/* Session Telemetry Strip */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">เดาะสำเร็จ:</span>
              <span className="font-mono font-bold text-cyan-400 text-sm tabular-nums">
                {stats.repsCompleted}
              </span>
              <span className="text-slate-500">ครั้ง</span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">สตรีค:</span>
              <span className="font-mono font-bold text-amber-400 text-sm tabular-nums">
                {stats.currentStreak}
              </span>
            </div>

            <button
              onClick={() => setIsStatsOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>รายงานคะแนน</span>
            </button>
          </div>
        </div>

        {/* 2-Zone Interactive Stage Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left / Primary Zone: AR Camera / Simulator + Realtime HUD (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4" id="camera-section">
            {viewMode === 'camera' ? (
              <ArCameraView
                currentSkill={currentSkill}
                onAnalysisUpdate={handleAnalysisUpdate}
                onRepCounted={handleRepCounted}
                onSwitchToSimulator={() => setViewMode('simulator')}
              />
            ) : (
              <SimulatorView
                currentSkill={currentSkill}
                onAnalysisUpdate={handleAnalysisUpdate}
                onRepCounted={handleRepCounted}
              />
            )}

            {/* Dynamic HUD Overlay */}
            <HudOverlay
              analysis={analysisResult}
              currentSkill={currentSkill}
              soundEnabled={soundEnabled}
              voiceEnabled={voiceEnabled}
              onToggleSound={handleToggleSound}
              onToggleVoice={handleToggleVoice}
            />
          </div>

          {/* Right Zone: Flashcard System & Rubric Cards (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4" id="flashcard-section">
            <FlashcardDeck
              currentSkill={currentSkill}
              onSelectSkill={(skill) => setCurrentSkill(skill)}
              repsCount={stats.repsBySkill[currentSkill.id] || 0}
            />

            {/* Quick Skill Comparison Mini-Cards */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span>สารบัญท่าเดาะตะกร้อ 4 ทักษะหลัก</span>
                <button
                  onClick={() => setIsRubricOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-normal cursor-pointer flex items-center gap-1"
                >
                  <span>คู่มือเกณฑ์ทั้งหมด</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-1.5">
                {TAKRAW_SKILLS.map((skill) => {
                  const isCurrent = skill.id === currentSkill.id;
                  const reps = stats.repsBySkill[skill.id] || 0;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => {
                        setCurrentSkill(skill);
                        soundCoach.playTakrawHit();
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-cyan-950/60 border border-cyan-500/40 text-cyan-200'
                          : 'bg-slate-950/40 hover:bg-slate-800/40 border border-transparent text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {skill.id === 'inside_foot' ? '🦶' : skill.id === 'knee' ? '🦵' : skill.id === 'head' ? '👤' : '👟'}
                        </span>
                        <div>
                          <div className="font-semibold">{skill.titleTh}</div>
                          <div className="text-[10px] text-slate-400">{skill.contactPointTh}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono text-cyan-400 font-bold tabular-nums">
                          {reps} ครั้ง
                        </span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Visual Proof & Takraw Knowledge Section with High-Fidelity Assets */}
        <section className="mt-4 pt-6 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white">
                ศาสตร์และศิลป์แห่งการเดาะลูกตะกร้อ (Sports Science & Mastery)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                มาตรฐานการฝึกทักษะการเล่นตะกร้อพื้นฐานตามหลักสูตรแกนกลางกลุ่มสาระการเรียนรู้สุขศึกษาและพลศึกษา
              </p>
            </div>
            <button
              onClick={() => setIsRubricOpen(true)}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>อ่านเกณฑ์ประเมินระดับคะแนน</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Asset 1: Authentic Rattan Takraw Ball */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="h-44 w-full overflow-hidden relative">
                <img
                  src="/src/assets/images/sepak_takraw_rattan_ball_1791952502812.jpg"
                  alt="Traditional Woven Rattan Sepak Takraw Ball"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs font-semibold text-white drop-shadow">
                  ลูกตะกร้อหวายแท้
                </span>
              </div>
              <div className="p-3.5 flex flex-col gap-1.5 text-xs text-slate-300">
                <div className="font-semibold text-slate-100">โครงสร้างทรงกลมโปร่งสานตาเหลี่ยม</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  ลูกตะกร้อมีรูปร่างโปร่ง มีรู 12 รู และเส้นตัดไขว้ 9-11 เส้น สัมผัสให้ความยืดหยุ่นสูง การเดาะที่ถูกต้องขึ้นอยู่กับจุดปะทะที่เรียบและขนานพื้น
                </p>
              </div>
            </div>

            {/* Asset 2: High Athletic Technique */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden flex flex-col">
              <div className="h-44 w-full overflow-hidden relative">
                <img
                  src="/src/assets/images/takraw_player_technique_1791952504283.jpg"
                  alt="Sepak Takraw Athlete Posture and Kicking Form"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-3 text-xs font-semibold text-white drop-shadow">
                  ชีวกลศาสตร์ท่าลูกแประดับทีมชาติ
                </span>
              </div>
              <div className="p-3.5 flex flex-col gap-1.5 text-xs text-slate-300">
                <div className="font-semibold text-slate-100">การเปิดสะโพกและบิดเข่าออกข้าง</div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  นักกีฬาตะกร้อระดับโลกสามารถเปิดข้อสะโพกได้กว้าง บิดเข่าออกด้านข้าง 120-140 องศา ทำให้จุดสัมผัสใต้ตาตุ่มด้านในกลายเป็นแป้นสะท้อนลูกที่แม่นยำ
                </p>
              </div>
            </div>

            {/* Interactive Drill Routine Card */}
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-2">
                  <Award className="w-4 h-4" />
                  <span>โปรแกรมฝึก 4 สัปดาห์สู่ความเชี่ยวชาญ</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      1
                    </span>
                    <div>
                      <span className="font-medium text-slate-200">สัปดาห์ที่ 1: ลูกแปเดี่ยว</span>
                      <p className="text-[11px] text-slate-400">ฝึกทรงตัวขาเดียว บิดเข่าให้ข้างเท้าขนานพื้น</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      2
                    </span>
                    <div>
                      <span className="font-medium text-slate-200">สัปดาห์ที่ 2: ลูกเข่าสลับแป</span>
                      <p className="text-[11px] text-slate-400">ยกต้นขาขนานพื้น 90 องศาเพื่อควบคุมความเร็วลูก</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-bold flex items-center justify-center shrink-0 text-[10px]">
                      3
                    </span>
                    <div>
                      <span className="font-medium text-slate-200">สัปดาห์ที่ 3: ลูกหลังเท้าและลูกโหม่ง</span>
                      <p className="text-[11px] text-slate-400">เงยหน้า 45 องศาและส่งแรงสปริงจากปลายเท้า</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>เกณฑ์ผ่าน: 3 คะแนนขึ้นไป</span>
                <button
                  onClick={() => setIsStatsOpen(true)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                >
                  ตรวจสอบสถิติ →
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Quiet Footer */}
      <footer className="mt-12 py-5 px-6 border-t border-slate-900 bg-slate-950 text-slate-500 text-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          Takraw AR Motion Capture · ระบบช่วยสอนและประเมินผลทักษะการเดาะลูกตะกร้อ
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsRubricOpen(true)}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            เกณฑ์การประเมิน 4 ระดับ
          </button>
          <span>·</span>
          <button
            onClick={() => setIsStatsOpen(true)}
            className="hover:text-slate-300 transition-colors cursor-pointer"
          >
            สรุปผลการทดสอบ
          </button>
        </div>
      </footer>

      {/* Modals */}
      <TrainingStatsModal
        stats={stats}
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        onResetStats={handleResetStats}
      />

      <RubricGuideModal
        isOpen={isRubricOpen}
        onClose={() => setIsRubricOpen(false)}
      />
    </div>
  );
}
