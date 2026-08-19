import React from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { Layers, Activity, Flame, Calendar } from 'lucide-react';

interface SegmentalViewProps {
  records: BodyRecord[];
}

export const SegmentalView: React.FC<SegmentalViewProps> = ({ records }) => {
  if (!records || records.length === 0) return null;

  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1];

  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

  const renderDelta = (current: number, previous?: number, unit: string = '%') => {
    if (previous === undefined || previous === 0) return null;
    const diff = parseFloat((current - previous).toFixed(1));
    if (diff === 0) return <span className="text-gray-400 text-xs font-normal">(-0.0)</span>;
    const isPos = diff > 0;
    return (
      <span className={`text-xs font-semibold ml-1.5 ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        ({isPos ? '+' : ''}{diff}{unit})
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-brand-600 dark:text-brand-400 text-xs font-semibold mb-1">
            <Layers className="w-4 h-4" />
            <span>歐姆龍部位量測分析 (Segmental Body Analysis)</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            部位骨骼肌率與皮下脂肪率圖解
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            細分雙臂、軀幹、雙腳三區域之肌肉與皮下脂肪分佈
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500 bg-gray-50 dark:bg-slate-900 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span>最新數據日期：{latest.date}</span>
        </div>
      </div>

      {/* Main 3 Body Zone Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Arm Zone */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">雙臂 (Arms)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300">
              上肢肌肉力量
            </span>
          </div>

          <div className="space-y-5">
            {/* Skeletal Muscle Arm */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400 flex items-center">
                  <Activity className="w-4 h-4 text-emerald-500 mr-1" />
                  骨骼肌率 (雙臂)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {latest.skeletalMuscleArm}%
                  {renderDelta(latest.skeletalMuscleArm, prev?.skeletalMuscleArm)}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (latest.skeletalMuscleArm / 50) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Subcutaneous Fat Arm */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400 flex items-center">
                  <Flame className="w-4 h-4 text-amber-500 mr-1" />
                  皮下脂肪率 (雙臂)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {latest.subcutaneousFatArm}%
                  {renderDelta(latest.subcutaneousFatArm, prev?.subcutaneousFatArm)}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (latest.subcutaneousFatArm / 50) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Trunk Zone */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">身軀 (Trunk)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
              核心與腹部
            </span>
          </div>

          <div className="space-y-5">
            {/* Skeletal Muscle Trunk */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400 flex items-center">
                  <Activity className="w-4 h-4 text-emerald-500 mr-1" />
                  骨骼肌率 (身軀)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {latest.skeletalMuscleTrunk}%
                  {renderDelta(latest.skeletalMuscleTrunk, prev?.skeletalMuscleTrunk)}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (latest.skeletalMuscleTrunk / 35) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Subcutaneous Fat Trunk */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400 flex items-center">
                  <Flame className="w-4 h-4 text-rose-500 mr-1" />
                  皮下脂肪率 (身軀)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {latest.subcutaneousFatTrunk}%
                  {renderDelta(latest.subcutaneousFatTrunk, prev?.subcutaneousFatTrunk)}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (latest.subcutaneousFatTrunk / 40) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Leg Zone */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">雙腳 (Legs)</h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
              下肢基底力量
            </span>
          </div>

          <div className="space-y-5">
            {/* Skeletal Muscle Leg */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400 flex items-center">
                  <Activity className="w-4 h-4 text-emerald-500 mr-1" />
                  骨骼肌率 (雙腳)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {latest.skeletalMuscleLeg}%
                  {renderDelta(latest.skeletalMuscleLeg, prev?.skeletalMuscleLeg)}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (latest.skeletalMuscleLeg / 60) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Subcutaneous Fat Leg */}
            <div>
              <div className="flex justify-between items-center text-sm mb-1.5">
                <span className="text-gray-500 dark:text-slate-400 flex items-center">
                  <Flame className="w-4 h-4 text-amber-500 mr-1" />
                  皮下脂肪率 (雙腳)
                </span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {latest.subcutaneousFatLeg}%
                  {renderDelta(latest.subcutaneousFatLeg, prev?.subcutaneousFatLeg)}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (latest.subcutaneousFatLeg / 50) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Summary Box */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-3">
          全身總皮下脂肪率與骨骼肌對比 (Whole-body Overview)
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
            <span className="text-xs text-gray-400 block">總皮下脂肪率</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{latest.subcutaneousFat}%</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
            <span className="text-xs text-gray-400 block">總骨骼肌率</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{latest.skeletalMuscle}%</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
            <span className="text-xs text-gray-400 block">骨骼肌重量</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{latest.skeletalMuscleMass} kg</span>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-700/50">
            <span className="text-xs text-gray-400 block">體脂肪重量</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">{latest.fatMass} kg</span>
          </div>
        </div>
      </div>

    </div>
  );
};
