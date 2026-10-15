import React from 'react';
import { SessionStats } from '../types/takraw';
import { TAKRAW_SKILLS } from '../data/takrawSkills';
import { X, Award, RotateCcw, CheckCircle, Flame, BarChart2 } from 'lucide-react';

interface TrainingStatsModalProps {
  stats: SessionStats;
  isOpen: boolean;
  onClose: () => void;
  onResetStats: () => void;
}

export const TrainingStatsModal: React.FC<TrainingStatsModalProps> = ({
  stats,
  isOpen,
  onClose,
  onResetStats
}) => {
  if (!isOpen) return null;

  const totalEvaluations =
    stats.gradeCounts.grade4 +
    stats.gradeCounts.grade3 +
    stats.gradeCounts.grade2 +
    stats.gradeCounts.grade1;

  const grade4Rate = totalEvaluations > 0 ? Math.round((stats.gradeCounts.grade4 / totalEvaluations) * 100) : 0;
  const grade3Rate = totalEvaluations > 0 ? Math.round((stats.gradeCounts.grade3 / totalEvaluations) * 100) : 0;
  const grade2Rate = totalEvaluations > 0 ? Math.round((stats.gradeCounts.grade2 / totalEvaluations) * 100) : 0;
  const grade1Rate = totalEvaluations > 0 ? Math.round((stats.gradeCounts.grade1 / totalEvaluations) * 100) : 0;

  // Average Score (out of 4.0)
  const totalWeighted =
    stats.gradeCounts.grade4 * 4 +
    stats.gradeCounts.grade3 * 3 +
    stats.gradeCounts.grade2 * 2 +
    stats.gradeCounts.grade1 * 1;
  const gpa = totalEvaluations > 0 ? (totalWeighted / totalEvaluations).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              ใบสรุปผลการประเมินทักษะการเดาะลูกตะกร้อ
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">เดาะสำเร็จสะสม</div>
              <div className="text-2xl font-bold font-mono text-cyan-400 mt-1 tabular-nums">
                {stats.repsCompleted}
              </div>
              <div className="text-[10px] text-slate-500">ครั้ง (Reps)</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">เกรดเฉลี่ยทักษะ</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
                {gpa}
              </div>
              <div className="text-[10px] text-slate-500">เต็ม 4.00</div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-center">
              <div className="text-xs text-slate-400">สตรีคต่อเนื่องสูงสุด</div>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1 tabular-nums flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 text-amber-500" />
                <span>{stats.bestStreak}</span>
              </div>
              <div className="text-[10px] text-slate-500">คอมโบ</div>
            </div>
          </div>

          {/* Grade Distribution Chart */}
          <div className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span className="flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                การกระจายระดับคะแนนประเมิน (Rubric Distribution)
              </span>
              <span className="text-slate-400 font-mono tabular-nums">
                รวม {totalEvaluations} ครั้ง
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* Grade 4 */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-emerald-400 font-medium">ระดับ 4 ดีมาก</span>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-500 rounded-full"
                    style={{ width: `${grade4Rate}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-300 tabular-nums">
                  {stats.gradeCounts.grade4} ({grade4Rate}%)
                </span>
              </div>

              {/* Grade 3 */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-cyan-400 font-medium">ระดับ 3 ดี</span>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 transition-all duration-500 rounded-full"
                    style={{ width: `${grade3Rate}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-300 tabular-nums">
                  {stats.gradeCounts.grade3} ({grade3Rate}%)
                </span>
              </div>

              {/* Grade 2 */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-amber-400 font-medium">ระดับ 2 พอใช้</span>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                    style={{ width: `${grade2Rate}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-300 tabular-nums">
                  {stats.gradeCounts.grade2} ({grade2Rate}%)
                </span>
              </div>

              {/* Grade 1 */}
              <div className="flex items-center gap-2">
                <span className="w-20 text-rose-400 font-medium">ระดับ 1 ปรับปรุง</span>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-400 transition-all duration-500 rounded-full"
                    style={{ width: `${grade1Rate}%` }}
                  />
                </div>
                <span className="w-12 text-right font-mono text-slate-300 tabular-nums">
                  {stats.gradeCounts.grade1} ({grade1Rate}%)
                </span>
              </div>
            </div>
          </div>

          {/* Reps by Skill Table */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-200">
              จำนวนครั้งจำแนกตามทักษะ (Skill Breakdown)
            </div>
            <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden text-xs">
              {TAKRAW_SKILLS.map((skill) => {
                const count = stats.repsBySkill[skill.id] || 0;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between px-3.5 py-2.5 bg-slate-950/40 hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-slate-200">{skill.titleTh}</div>
                      <div className="text-[11px] text-slate-400">{skill.titleEn}</div>
                    </div>
                    <div className="font-mono font-bold text-cyan-400 tabular-nums text-sm">
                      {count} ครั้ง
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <button
            onClick={onResetStats}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            ล้างสถิติรอบนี้
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
