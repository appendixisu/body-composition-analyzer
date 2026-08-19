import React from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { getBmiCategory, getBodyFatCategory, getVisceralFatCategory } from '../services/analytics';
import { X, Calendar, Activity, Flame, Shield, User } from 'lucide-react';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: BodyRecord | null;
}

export const DetailModal: React.FC<DetailModalProps> = ({ isOpen, onClose, record }) => {
  if (!isOpen || !record) return null;

  const bmiCat = getBmiCategory(record.bmi);
  const fatCat = getBodyFatCategory(record.bodyFat);
  const visceralCat = getVisceralFatCategory(record.visceralFat);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700 my-8 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4">
          <div>
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{record.date}</span>
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
              量測紀錄詳細數據
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Primary Stats Grid */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl border border-blue-100 dark:border-blue-800/50">
            <span className="text-xs text-blue-600 dark:text-blue-300 font-medium block">體重</span>
            <span className="text-2xl font-extrabold text-blue-900 dark:text-blue-100">{record.weight.toFixed(1)} <span className="text-xs font-normal">kg</span></span>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl border border-amber-100 dark:border-amber-800/50">
            <span className="text-xs text-amber-600 dark:text-amber-300 font-medium block">體脂肪率 ({fatCat.category})</span>
            <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-100">{record.bodyFat}% <span className="text-xs font-normal">({record.fatMass} kg)</span></span>
          </div>

          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
            <span className="text-xs text-emerald-600 dark:text-emerald-300 font-medium block">骨骼肌率</span>
            <span className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100">{record.skeletalMuscle}% <span className="text-xs font-normal">({record.skeletalMuscleMass} kg)</span></span>
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl border border-purple-100 dark:border-purple-800/50">
            <span className="text-xs text-purple-600 dark:text-purple-300 font-medium block">BMI ({bmiCat.category})</span>
            <span className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">{record.bmi}</span>
          </div>
        </div>

        {/* Secondary Indicators */}
        <div className="space-y-2 text-xs divide-y divide-gray-100 dark:divide-slate-700/60 pt-2">
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-slate-400 flex items-center"><Shield className="w-3.5 h-3.5 mr-1 text-amber-500" /> 內臟脂肪程度</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">{record.visceralFat} ({visceralCat.category})</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-slate-400 flex items-center"><Flame className="w-3.5 h-3.5 mr-1 text-red-500" /> 基礎代謝 (BMR)</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">{record.bmr} kcal</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-slate-400 flex items-center"><User className="w-3.5 h-3.5 mr-1 text-sky-500" /> 身體年齡</span>
            <span className="font-bold text-gray-800 dark:text-slate-200">{record.bodyAge} 歲</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-gray-500 dark:text-slate-400 flex items-center"><Activity className="w-3.5 h-3.5 mr-1 text-purple-500" /> 量測裝置型號</span>
            <span className="font-semibold text-gray-700 dark:text-slate-300">{record.deviceModel || '未指定'}</span>
          </div>
        </div>

        {/* Segmental Breakdown */}
        <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
          <h4 className="text-xs font-bold text-gray-800 dark:text-slate-200 mb-2">部位肌肉與皮下脂肪率</h4>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-lg">
              <span className="text-gray-400 block text-[10px]">雙臂</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{record.skeletalMuscleArm}% 肌</span>
              <span className="text-gray-400 block text-[10px]">{record.subcutaneousFatArm}% 脂</span>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-lg">
              <span className="text-gray-400 block text-[10px]">身軀</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{record.skeletalMuscleTrunk}% 肌</span>
              <span className="text-gray-400 block text-[10px]">{record.subcutaneousFatTrunk}% 脂</span>
            </div>
            <div className="p-2 bg-gray-50 dark:bg-slate-900 rounded-lg">
              <span className="text-gray-400 block text-[10px]">雙腳</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{record.skeletalMuscleLeg}% 肌</span>
              <span className="text-gray-400 block text-[10px]">{record.subcutaneousFatLeg}% 脂</span>
            </div>
          </div>
        </div>

        {/* Close button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-100 text-sm font-semibold transition-colors"
          >
            關閉
          </button>
        </div>

      </div>
    </div>
  );
};
