import React, { useState, useEffect } from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { addRecord, updateRecord } from '../services/db';
import { X, Save } from 'lucide-react';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: BodyRecord | null;
  onSaved: () => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  onSaved,
}) => {
  const [formData, setFormData] = useState<Partial<BodyRecord>>({
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
    weight: 100.0,
    bodyFat: 30.0,
    skeletalMuscle: 28.0,
    visceralFat: 15.0,
    bmr: 2000,
    bmi: 30.0,
    bodyAge: 50,
    skeletalMuscleArm: 30.0,
    skeletalMuscleTrunk: 18.0,
    skeletalMuscleLeg: 45.0,
    subcutaneousFat: 20.0,
    subcutaneousFatArm: 30.0,
    subcutaneousFatTrunk: 22.0,
    subcutaneousFatLeg: 32.0,
    deviceModel: '',
  });

  useEffect(() => {
    if (recordToEdit) {
      setFormData(recordToEdit);
    } else {
      setFormData({
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        weight: 100.0,
        bodyFat: 30.0,
        skeletalMuscle: 28.0,
        visceralFat: 15.0,
        bmr: 2000,
        bmi: 30.0,
        bodyAge: 50,
        skeletalMuscleArm: 30.0,
        skeletalMuscleTrunk: 18.0,
        skeletalMuscleLeg: 45.0,
        subcutaneousFat: 20.0,
        subcutaneousFatArm: 30.0,
        subcutaneousFatTrunk: 22.0,
        subcutaneousFatLeg: 32.0,
        deviceModel: '',
      });
    }
  }, [recordToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const weight = Number(formData.weight) || 0;
    const bodyFat = Number(formData.bodyFat) || 0;
    const skeletalMuscle = Number(formData.skeletalMuscle) || 0;

    const fatMass = parseFloat(((weight * bodyFat) / 100).toFixed(1));
    const skeletalMuscleMass = parseFloat(((weight * skeletalMuscle) / 100).toFixed(1));
    const timestamp = new Date(formData.date || Date.now()).getTime();

    const recordPayload: Omit<BodyRecord, 'id'> = {
      date: formData.date || '',
      timestamp,
      timezone: formData.timezone || 'Asia/Taipei',
      weight,
      bodyFat,
      fatMass,
      visceralFat: Number(formData.visceralFat) || 0,
      bmr: Number(formData.bmr) || 0,
      skeletalMuscle,
      skeletalMuscleMass,
      skeletalMuscleArm: Number(formData.skeletalMuscleArm) || 0,
      skeletalMuscleTrunk: Number(formData.skeletalMuscleTrunk) || 0,
      skeletalMuscleLeg: Number(formData.skeletalMuscleLeg) || 0,
      subcutaneousFat: Number(formData.subcutaneousFat) || 0,
      subcutaneousFatArm: Number(formData.subcutaneousFatArm) || 0,
      subcutaneousFatTrunk: Number(formData.subcutaneousFatTrunk) || 0,
      subcutaneousFatLeg: Number(formData.subcutaneousFatLeg) || 0,
      bmi: Number(formData.bmi) || 0,
      bodyAge: Number(formData.bodyAge) || 0,
      deviceModel: formData.deviceModel || '',
      sourceFormat: recordToEdit?.sourceFormat || 'manual',
    };

    if (recordToEdit && recordToEdit.id) {
      await updateRecord(recordToEdit.id, recordPayload);
    } else {
      await addRecord(recordPayload);
    }

    onSaved();
    onClose();
  };

  const updateField = (field: keyof BodyRecord, val: any) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-700 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4 mb-5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {recordToEdit ? '編輯體組成紀錄' : '手動新增體組成紀錄'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Main info row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
                測量日期時間 (Date)
              </label>
              <input
                type="text"
                value={formData.date || ''}
                onChange={(e) => updateField('date', e.target.value)}
                placeholder="2026-08-19 07:30"
                required
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
                裝置型號 (Device Model)
              </label>
              <input
                type="text"
                value={formData.deviceModel || ''}
                onChange={(e) => updateField('deviceModel', e.target.value)}
                placeholder="HBF-702T"
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Primary metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">體重 (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.weight || ''}
                onChange={(e) => updateField('weight', e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">體脂肪率 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.bodyFat || ''}
                onChange={(e) => updateField('bodyFat', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm font-bold text-amber-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">骨骼肌率 (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.skeletalMuscle || ''}
                onChange={(e) => updateField('skeletalMuscle', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm font-bold text-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">BMI</label>
              <input
                type="number"
                step="0.1"
                value={formData.bmi || ''}
                onChange={(e) => updateField('bmi', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm font-bold"
              />
            </div>
          </div>

          {/* Secondary health metrics */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">內臟脂肪程度</label>
              <input
                type="number"
                step="0.5"
                value={formData.visceralFat || ''}
                onChange={(e) => updateField('visceralFat', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">基礎代謝 (kcal)</label>
              <input
                type="number"
                value={formData.bmr || ''}
                onChange={(e) => updateField('bmr', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">身體年齡 (歲)</label>
              <input
                type="number"
                value={formData.bodyAge || ''}
                onChange={(e) => updateField('bodyAge', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm"
              />
            </div>
          </div>

          {/* Segmental Muscle Section */}
          <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs font-bold text-gray-700 dark:text-slate-200 block mb-2">部位骨骼肌率 (%)</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400">雙臂 (Arm %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.skeletalMuscleArm || ''}
                  onChange={(e) => updateField('skeletalMuscleArm', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400">身軀 (Trunk %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.skeletalMuscleTrunk || ''}
                  onChange={(e) => updateField('skeletalMuscleTrunk', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400">雙腳 (Leg %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.skeletalMuscleLeg || ''}
                  onChange={(e) => updateField('skeletalMuscleLeg', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Segmental Fat Section */}
          <div className="pt-2">
            <span className="text-xs font-bold text-gray-700 dark:text-slate-200 block mb-2">部位皮下脂肪率 (%)</span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400">雙臂 (Arm %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.subcutaneousFatArm || ''}
                  onChange={(e) => updateField('subcutaneousFatArm', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400">身軀 (Trunk %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.subcutaneousFatTrunk || ''}
                  onChange={(e) => updateField('subcutaneousFatTrunk', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400">雙腳 (Leg %)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.subcutaneousFatLeg || ''}
                  onChange={(e) => updateField('subcutaneousFatLeg', e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm shadow transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>儲存紀錄</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
