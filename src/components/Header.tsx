import React from 'react';
import { Trophy, HelpCircle } from 'lucide-react';

interface HeaderProps {
  onOpenRubricGuide: () => void;
  onOpenStats: () => void;
  repsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenRubricGuide,
  onOpenStats,
  repsCount
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      {/* Zone 1: Single text wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 flex items-center justify-center font-black text-slate-950 text-base shadow-sm">
          ⚽
        </div>
        <a href="/" className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors">
          TAKRAW AR MOTION
        </a>
      </div>

      {/* Zone 2: 4-5 single-line clean navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
        <a href="#camera-section" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
          กล้อง AR โมชั่น
        </a>
        <a href="#flashcard-section" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
          ไพ่แบบฝึกทักษะ
        </a>
        <button
          onClick={onOpenRubricGuide}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          เกณฑ์ประเมิน 4 ระดับ
        </button>
        <button
          onClick={onOpenStats}
          className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          สถิติการฝึก ({repsCount} ครั้ง)
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenStats}
          className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-sm hover:shadow transition-all whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>ใบรายงานผลคะแนน</span>
        </button>
      </div>
    </header>
  );
};
