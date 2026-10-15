import React from 'react';
import { TAKRAW_SKILLS } from '../data/takrawSkills';
import { X, BookOpen, CheckCircle, Info } from 'lucide-react';

interface RubricGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RubricGuideModal: React.FC<RubricGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">
              เกณฑ์การประเมินผลทักษะการเดาะตะกร้อ 4 ระดับ (Rubric Criteria)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          <div className="bg-cyan-950/30 border border-cyan-800/40 p-3.5 rounded-xl text-cyan-200 leading-relaxed flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              ระบบวิเคราะห์ท่าทางด้วย AI ใช้หลักการตรวจจับชีวกลศาสตร์ (Biomechanical Angle Tracking) ร่วมกับเกณฑ์มาตรฐานวิชาพลศึกษา โดยตรวจวัดองศาข้อเข่า, ความสูงของจุดสัมผัส, การย่อขาหลัก และการทรงตัวของลำตัว
            </div>
          </div>

          <div className="space-y-4">
            {TAKRAW_SKILLS.map((skill) => (
              <div
                key={skill.id}
                className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="font-bold text-sm text-white">{skill.titleTh}</h4>
                    <span className="text-[11px] text-cyan-400">{skill.titleEn}</span>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    จุดสัมผัส: {skill.contactPointTh}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded bg-emerald-950/30 border border-emerald-900/40 text-emerald-300">
                    <strong className="block text-emerald-400 mb-0.5">ระดับ 4 · ดีมาก (4 คะแนน)</strong>
                    <p className="text-slate-300">{skill.rubric.grade4}</p>
                  </div>
                  <div className="p-2 rounded bg-cyan-950/30 border border-cyan-900/40 text-cyan-300">
                    <strong className="block text-cyan-400 mb-0.5">ระดับ 3 · ดี (3 คะแนน)</strong>
                    <p className="text-slate-300">{skill.rubric.grade3}</p>
                  </div>
                  <div className="p-2 rounded bg-amber-950/30 border border-amber-900/40 text-amber-300">
                    <strong className="block text-amber-400 mb-0.5">ระดับ 2 · พอใช้ (2 คะแนน)</strong>
                    <p className="text-slate-300">{skill.rubric.grade2}</p>
                  </div>
                  <div className="p-2 rounded bg-rose-950/30 border border-rose-900/40 text-rose-300">
                    <strong className="block text-rose-400 mb-0.5">ระดับ 1 · ควรปรับปรุง (1 คะแนน)</strong>
                    <p className="text-slate-300">{skill.rubric.grade1}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
};
