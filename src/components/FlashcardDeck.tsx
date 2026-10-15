import React, { useState } from 'react';
import { TakrawSkill } from '../types/takraw';
import { TAKRAW_SKILLS } from '../data/takrawSkills';
import { soundCoach } from '../utils/audio';
import { Dices, RotateCw, BookOpen, Check, Target, ChevronRight } from 'lucide-react';

interface FlashcardDeckProps {
  currentSkill: TakrawSkill;
  onSelectSkill: (skill: TakrawSkill) => void;
  repsCount: number;
}

export const FlashcardDeck: React.FC<FlashcardDeckProps> = ({
  currentSkill,
  onSelectSkill,
  repsCount
}) => {
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'technique' | 'rubric' | 'culture'>('technique');

  const handleDrawCard = () => {
    // Pick random skill different from current if possible
    const available = TAKRAW_SKILLS.filter((s) => s.id !== currentSkill.id);
    const randomSkill = available[Math.floor(Math.random() * available.length)] || TAKRAW_SKILLS[0];
    onSelectSkill(randomSkill);

    // Audio cue
    soundCoach.playTakrawHit();

    // Flip to front first then back for a nice reveal
    setIsFlipped(false);
    setTimeout(() => {
      setIsFlipped(true);
    }, 280);
  };

  const handleFlip = () => {
    soundCoach.playTakrawHit();
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top Deck Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={handleDrawCard}
          className="flex-1 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Dices className="w-4 h-4 text-cyan-200" />
          <span>สุ่มเปิดไพ่แบบฝึก (Draw Card)</span>
        </button>

        <button
          onClick={handleFlip}
          className="py-2.5 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
          title="พลิกไพ่หน้า-หลัง"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>พลิกไพ่</span>
        </button>
      </div>

      {/* Skill Quick Selector Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        {TAKRAW_SKILLS.map((skill) => {
          const isSelected = skill.id === currentSkill.id;
          return (
            <button
              key={skill.id}
              onClick={() => {
                onSelectSkill(skill);
                soundCoach.playTakrawHit();
              }}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
              }`}
            >
              {skill.titleTh.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* 3D Flip Card Container */}
      <div className="w-full h-[380px] perspective-1000">
        <div
          onClick={handleFlip}
          className={`relative w-full h-full transform-style-3d transition-transform duration-700 cursor-pointer select-none rounded-2xl ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* Card Front Face */}
          <div className="absolute inset-0 backface-hidden w-full h-full rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 border-2 border-cyan-500/40 p-5 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Background Texture & Graphic Accent */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-cyan-500/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />

            {/* Front Header */}
            <div className="flex items-start justify-between relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎴</span>
                <div>
                  <div className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">
                    แบบฝึกทักษะตะกร้อ
                  </div>
                  <div className="text-xs text-slate-400">{currentSkill.difficulty}</div>
                </div>
              </div>

              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                แตะเพื่อพลิกอ่านเกณฑ์
              </span>
            </div>

            {/* Front Center Title & Anatomy */}
            <div className="my-auto flex flex-col items-center text-center relative z-10 py-3">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-3xl mb-3 shadow-inner">
                {currentSkill.id === 'inside_foot' ? '🦶' : currentSkill.id === 'knee' ? '🦵' : currentSkill.id === 'head' ? '👤' : '👟'}
              </div>

              <h2 className="text-xl font-bold text-white tracking-wide">
                {currentSkill.titleTh}
              </h2>
              <div className="text-xs text-cyan-300 font-medium mt-0.5">
                {currentSkill.titleEn}
              </div>
              <p className="text-xs text-slate-400 max-w-xs mt-2 leading-relaxed">
                {currentSkill.subtitle}
              </p>

              <div className="mt-4 flex items-center gap-1.5 text-xs text-amber-300 bg-amber-950/40 border border-amber-500/30 px-3 py-1.5 rounded-lg">
                <Target className="w-3.5 h-3.5" />
                <span>{currentSkill.contactPointTh}</span>
              </div>
            </div>

            {/* Front Footer */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-700/60 relative z-10">
              <span>เดาะไปแล้ว: {repsCount} ครั้ง</span>
              <span className="text-cyan-400 flex items-center gap-1 font-medium">
                ดูเกณฑ์คะแนน <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

          {/* Card Back Face (Detailed Sports Criteria & Rubric) */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-2xl bg-slate-900 border-2 border-cyan-400/50 p-4 shadow-2xl flex flex-col justify-between overflow-hidden"
          >
            {/* Back Header with Navigation Tabs */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('technique')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'technique'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  เทคนิคหลัก
                </button>
                <button
                  onClick={() => setActiveTab('rubric')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'rubric'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  เกณฑ์คะแนน (Rubric)
                </button>
                <button
                  onClick={() => setActiveTab('culture')}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                    activeTab === 'culture'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  เกร็ดความรู้
                </button>
              </div>

              <button
                onClick={handleFlip}
                className="text-xs text-slate-400 hover:text-white p-1 cursor-pointer"
                title="พลิกกลับหน้าไพ่"
              >
                ✕ พลิกกลับ
              </button>
            </div>

            {/* Back Content Body */}
            <div className="flex-1 overflow-y-auto py-2 text-xs pr-1">
              {activeTab === 'technique' && (
                <div className="flex flex-col gap-2.5">
                  <div className="font-semibold text-slate-200">
                    หัวใจสำคัญของการฝึก {currentSkill.titleTh}
                  </div>
                  <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                    {currentSkill.keyTechniques.map((item, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-200">
                    <span className="font-bold text-rose-400">ข้อผิดพลาดที่พบบ่อย:</span>
                    <ul className="mt-1 space-y-1 pl-4 list-disc text-slate-300">
                      {currentSkill.commonMistakes.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'rubric' && (
                <div className="flex flex-col gap-2">
                  <div className="font-semibold text-slate-200 text-xs">
                    เกณฑ์การประเมินผลทักษะ 4 ระดับ (มาตรฐานวิชาพลศึกษา)
                  </div>

                  <div className="space-y-1.5 text-[11px]">
                    <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
                      <div className="font-bold text-emerald-400">ระดับ 4 · ดีมาก (4 คะแนน)</div>
                      <div className="text-slate-300 mt-0.5">{currentSkill.rubric.grade4}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-cyan-950/30 border border-cyan-800/40 text-cyan-200">
                      <div className="font-bold text-cyan-400">ระดับ 3 · ดี (3 คะแนน)</div>
                      <div className="text-slate-300 mt-0.5">{currentSkill.rubric.grade3}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200">
                      <div className="font-bold text-amber-400">ระดับ 2 · พอใช้ (2 คะแนน)</div>
                      <div className="text-slate-300 mt-0.5">{currentSkill.rubric.grade2}</div>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-200">
                      <div className="font-bold text-rose-400">ระดับ 1 · ควรปรับปรุง (1 คะแนน)</div>
                      <div className="text-slate-300 mt-0.5">{currentSkill.rubric.grade1}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'culture' && (
                <div className="flex flex-col gap-2.5">
                  <div className="font-semibold text-amber-300">
                    เกร็ดความรู้และประวัติตะกร้อไทย
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {currentSkill.cultureTip}
                  </p>
                  <div className="p-2.5 bg-slate-800/60 rounded-lg border border-slate-700/80 text-[11px] text-slate-300 leading-relaxed">
                    <strong>ลูกตะกร้อหวายแท้ vs ลูกตะกร้อพลาสติกสังเคราะห์:</strong> ในอดีตทำจากหวายธรรมชาติถัก 9-11 เส้น ปัจจุบันใช้ใยสังเคราะห์เหนียวพิเศษที่ให้แรงสะท้อนคงที่และน้ำหนักมาตรฐาน (410-430 กรัมสำหรับผู้ชาย, 360-380 กรัมสำหรับผู้หญิง)
                  </div>
                </div>
              )}
            </div>

            {/* Back Footer */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>มุมเป้าหมาย: {currentSkill.targetAngles[0]?.targetRange}</span>
              <button
                onClick={handleFlip}
                className="text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
              >
                พลิกไปฝึกต่อ →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
