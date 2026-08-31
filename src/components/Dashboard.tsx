import React, { useState } from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { TabType } from './Navbar';
import { calculateSummary, getBmiCategory, getBodyFatCategory, getVisceralFatCategory, calculateWeightLossQuality, calculateWeightVelocity } from '../services/analytics';
import { Scale, Flame, Activity, Heart, Calendar, Award, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle, ShieldCheck, Dumbbell, AlertOctagon, Gauge, Share2 } from 'lucide-react';

interface DashboardProps {
  records: BodyRecord[];
  onNavigateTab: (tab: TabType) => void;
  onOpenAddModal: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ records, onNavigateTab, onOpenAddModal }) => {
  const [lossPeriod, setLossPeriod] = useState<'total' | '30d' | '7d'>('total');

  if (!records || records.length === 0) return null;

  const sorted = [...records].sort((a, b) => a.timestamp - b.timestamp);
  const latest = sorted[sorted.length - 1];

  const lossQuality = calculateWeightLossQuality(sorted, lossPeriod);
  const velocity = calculateWeightVelocity(sorted);

  const weightSummary = calculateSummary(sorted, 'weight');
  const fatSummary = calculateSummary(sorted, 'bodyFat');
  const muscleSummary = calculateSummary(sorted, 'skeletalMuscle');
  const bmiSummary = calculateSummary(sorted, 'bmi');
  const bodyAgeSummary = calculateSummary(sorted, 'bodyAge');

  const bmiCat = getBmiCategory(latest.bmi);
  const fatCat = getBodyFatCategory(latest.bodyFat);
  const visceralCat = getVisceralFatCategory(latest.visceralFat);

  const renderTrendBadge = (change?: number, unit: string = 'kg', invertGood: boolean = false) => {
    if (change === undefined || isNaN(change)) return <span className="text-gray-400 text-xs">無比較數值</span>;
    if (change === 0) {
      return (
        <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-100 dark:bg-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
          <Minus className="w-3 h-3 mr-0.5" /> 0 {unit}
        </span>
      );
    }

    const isPositive = change > 0;
    // For weight / fat, decrease is usually good (green), increase is red (unless invertGood)
    const isGood = invertGood ? isPositive : !isPositive;

    const bgClass = isGood ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-md ${bgClass}`}>
        <Icon className="w-3.5 h-3.5 mr-0.5" />
        {isPositive ? '+' : ''}{change} {unit}
      </span>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner & Quick Info */}
      <div className="bg-gradient-to-r from-brand-600 to-cyan-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 -mr-12 -mt-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-brand-100 text-xs font-medium mb-1">
              <Calendar className="w-4 h-4" />
              <span>最新測量日期：{latest.date} ({latest.timezone || 'Asia/Taipei'})</span>
              {latest.deviceModel && (
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] text-white">
                  {latest.deviceModel}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {latest.weight.toFixed(1)} <span className="text-lg font-medium opacity-90">kg</span>
            </h2>
            <p className="text-sm text-brand-100 mt-1">
              體脂肪率 {latest.bodyFat}% ｜ 骨骼肌率 {latest.skeletalMuscle}% ｜ BMI {latest.bmi}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddModal}
              className="px-3.5 py-2 bg-white text-brand-700 hover:bg-brand-50 font-semibold text-xs sm:text-sm rounded-xl shadow transition-colors"
            >
              + 新增量測
            </button>
            <button
              onClick={() => onNavigateTab('share')}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-xl backdrop-blur-sm transition-colors border border-white/20"
            >
              <Share2 className="w-4 h-4" />
              <span>成果分享</span>
            </button>
            <button
              onClick={() => onNavigateTab('charts')}
              className="px-3.5 py-2 bg-black/20 hover:bg-black/30 text-white font-medium text-xs sm:text-sm rounded-xl backdrop-blur-sm transition-colors"
            >
              趨勢圖表 →
            </button>
          </div>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Weight Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">體重</span>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Scale className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {latest.weight.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">kg</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">7日變化:</span>
            {renderTrendBadge(weightSummary?.change7d, 'kg', false)}
          </div>
        </div>

        {/* Body Fat Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">體脂肪率</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {latest.bodyFat.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">%</span>
            <span className="text-xs font-semibold ml-2 px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {fatCat.category}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">脂肪量:</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              {latest.fatMass ? `${latest.fatMass.toFixed(1)} kg` : '-'}
            </span>
          </div>
        </div>

        {/* Skeletal Muscle Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">骨骼肌率</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {latest.skeletalMuscle.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">%</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">肌肉量:</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              {latest.skeletalMuscleMass ? `${latest.skeletalMuscleMass.toFixed(1)} kg` : '-'}
            </span>
          </div>
        </div>

        {/* BMI & Health Status */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-gray-500 dark:text-slate-400">BMI 體質指數</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {latest.bmi.toFixed(1)}
            </span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${bmiCat.badgeClass}`}>
              {bmiCat.category}
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">身體年齡:</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
              {latest.bodyAge} 歲
            </span>
          </div>
        </div>

      </div>

      {/* 每週體重變化速度分析 Card */}
      {velocity && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
            <div className="flex items-center space-x-2">
              <Gauge className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-gray-900 dark:text-white text-base">
                每週體重變化速度分析
              </h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold text-center self-start sm:self-auto ${velocity.statusBadgeClass}`}>
              {velocity.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Speed Number Display */}
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/40 flex flex-col justify-center items-center text-center">
              <span className="text-xs text-gray-500 dark:text-slate-400 block mb-1 font-medium">
                近週體重變化速率 (週平均)
              </span>
              <span className={`text-3xl font-extrabold ${
                velocity.weeklyRateKg < 0 ? 'text-emerald-600 dark:text-emerald-400' :
                velocity.weeklyRateKg > 0.2 ? 'text-amber-600 dark:text-amber-400' :
                'text-sky-600 dark:text-sky-400'
              }`}>
                {velocity.ratePerWeekText}
              </span>
              <span className="text-xs text-gray-400 dark:text-slate-400 mt-1.5">
                (相當於每月變化約 {velocity.monthlyRateKg > 0 ? '+' : ''}{velocity.monthlyRateKg} kg)
              </span>
            </div>

            {/* Velocity Spectrum Bar */}
            <div className="lg:col-span-2 space-y-3 flex flex-col justify-center">
              <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 font-semibold">
                <span>速度速率分佈基準</span>
                <span>單位: kg / 週</span>
              </div>

              {/* Spectrum Range Bar */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-[11px] text-center font-medium">
                <div className={`p-2 rounded-lg border transition-all ${velocity.statusRating === 'too_fast_loss' ? 'bg-rose-500 text-white font-bold ring-2 ring-rose-500/50' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'}`}>
                  <span className="block font-bold">瘦太快</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">&lt; -1.0kg</span>
                </div>
                <div className={`p-2 rounded-lg border transition-all ${velocity.statusRating === 'healthy_loss' ? 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-500/50' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'}`}>
                  <span className="block font-bold">黃金減速</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">-0.5 ~ -1.0</span>
                </div>
                <div className={`p-2 rounded-lg border transition-all ${velocity.statusRating === 'mild_loss' ? 'bg-teal-500 text-white font-bold ring-2 ring-teal-500/50' : 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900/60'}`}>
                  <span className="block font-bold">溫和減速</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">-0.2 ~ -0.5</span>
                </div>
                <div className={`p-2 rounded-lg border transition-all ${velocity.statusRating === 'maintain' ? 'bg-sky-500 text-white font-bold ring-2 ring-sky-500/50' : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/60'}`}>
                  <span className="block font-bold">平穩維持</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">±0.2kg</span>
                </div>
                <div className={`p-2 rounded-lg border transition-all ${velocity.statusRating === 'healthy_gain' ? 'bg-indigo-500 text-white font-bold ring-2 ring-indigo-500/50' : 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'}`}>
                  <span className="block font-bold">健康增肌</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">+0.2 ~ +0.5</span>
                </div>
                <div className={`p-2 rounded-lg border transition-all ${velocity.statusRating === 'too_fast_gain' ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-500/50' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'}`}>
                  <span className="block font-bold">胖太快</span>
                  <span className="block text-[9px] opacity-80 mt-0.5">&gt; +0.5kg</span>
                </div>
              </div>

              {/* Health Advice Text */}
              <p className="text-xs text-gray-600 dark:text-slate-300 pt-1 leading-relaxed">
                💡 {velocity.advice}
              </p>

            </div>

          </div>
        </div>
      )}

      {/* 減重品質與肌肉過度流失分析 Card */}
      {lossQuality && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <Dumbbell className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-900 dark:text-white text-base">
                  減重品質與肌肉過度流失分析
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                基於「週平均聚合法」追蹤減掉公斤數中脂肪與肌肉之比例
              </p>
            </div>

            {/* Range selector pills */}
            <div className="flex items-center space-x-1 bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
              {(['total', '30d', '7d'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setLossPeriod(p)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    lossPeriod === p
                      ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {p === 'total' ? '全期間週平均' : p === '30d' ? '近 4 週 (月比)' : '近 1 週 (週比)'}
                </button>
              ))}
            </div>
          </div>

          {/* Loss Quality Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: Summary Metrics */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-700/40">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                  {lossQuality.periodLabel} 體重變化:
                </span>
                <span className={`text-base font-bold ${lossQuality.weightChangeKg <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
                  {lossQuality.weightChangeKg > 0 ? '+' : ''}{lossQuality.weightChangeKg} kg
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-900/20">
                <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  淨脂肪量變化:
                </span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  {lossQuality.fatMassChangeKg > 0 ? '+' : ''}{lossQuality.fatMassChangeKg} kg
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-900/20">
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                  淨骨骼肌量變化:
                </span>
                <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
                  {lossQuality.muscleMassChangeKg > 0 ? '+' : ''}{lossQuality.muscleMassChangeKg} kg
                </span>
              </div>
            </div>

            {/* Middle & Right: Ratio Visual Progress Bars & Advice */}
            <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
              
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-700 dark:text-slate-200 flex items-center">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 mr-1" />
                    減脂佔比
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    {lossQuality.isWeightDecreased ? `${lossQuality.fatLossPercentage}%` : '-'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${lossQuality.fatLossPercentage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span className="text-gray-700 dark:text-slate-200 flex items-center">
                    <AlertOctagon className={`w-4 h-4 mr-1 ${lossQuality.muscleLossPercentage > 50 ? 'text-rose-500 animate-pulse' : 'text-amber-500'}`} />
                    減肌佔比
                  </span>
                  <span className={`font-bold ${lossQuality.muscleLossPercentage > 50 ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-amber-600 dark:text-amber-400'}`}>
                    {lossQuality.isWeightDecreased ? `${lossQuality.muscleLossPercentage}%` : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-slate-700 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${lossQuality.muscleLossPercentage > 50 ? 'bg-rose-500' : 'bg-amber-500'}`}
                    style={{ width: `${lossQuality.muscleLossPercentage}%` }}
                  ></div>
                </div>
              </div>

              {/* Quality Spectrum Benchmark Bar */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  <span>減重品質分佈基準</span>
                  <span>依週平均減脂/減肌比例</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] text-center font-medium">
                  <div className={`p-2 rounded-lg border transition-all ${lossQuality.qualityRating === 'excellent' && lossQuality.isWeightDecreased ? 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-500/50' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'}`}>
                    <span className="block font-bold">優質健康減脂</span>
                    <span className="block text-[9px] opacity-80 mt-0.5">減脂 &ge; 70% (肌流失 &le; 20%)</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${lossQuality.qualityRating === 'moderate' && lossQuality.isWeightDecreased ? 'bg-amber-500 text-white font-bold ring-2 ring-amber-500/50' : 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'}`}>
                    <span className="block font-bold">平穩普通減重</span>
                    <span className="block text-[9px] opacity-80 mt-0.5">減脂 50% ~ 70%</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${lossQuality.qualityRating === 'warning' && lossQuality.isWeightDecreased ? 'bg-rose-500 text-white font-bold ring-2 ring-rose-500/50' : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'}`}>
                    <span className="block font-bold">肌少 / 肌肉流失</span>
                    <span className="block text-[9px] opacity-80 mt-0.5">減肌流失 &gt; 50%</span>
                  </div>

                  <div className={`p-2 rounded-lg border transition-all ${!lossQuality.isWeightDecreased ? 'bg-sky-500 text-white font-bold ring-2 ring-sky-500/50' : 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/60'}`}>
                    <span className="block font-bold">體重增加 / 維持</span>
                    <span className="block text-[9px] opacity-80 mt-0.5">體重未下降</span>
                  </div>
                </div>
              </div>

              {/* Status Badge & Advice */}
              <div className={`p-3.5 rounded-xl border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-2.5 ${
                lossQuality.qualityRating === 'excellent' ? 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-800 dark:text-emerald-200' :
                lossQuality.qualityRating === 'warning' ? 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-200' :
                lossQuality.qualityRating === 'moderate' ? 'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-200' :
                'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-200'
              }`}>
                <span className={`px-2 py-0.5 rounded font-bold text-[11px] flex-shrink-0 inline-block self-start ${lossQuality.statusBadgeClass}`}>
                  {lossQuality.statusLabel}
                </span>
                <span className="font-medium leading-relaxed">{lossQuality.advice}</span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* Health Overview & Period Analysis Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Period Changes Table Card */}
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
              <Award className="w-5 h-5 text-brand-500" />
              <span>各期間進度與累積變化</span>
            </h3>
            <span className="text-xs text-gray-400">共 {sorted.length} 筆歷史紀錄</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 text-gray-400 text-xs font-medium">
                  <th className="pb-3">指標</th>
                  <th className="pb-3">目前最新</th>
                  <th className="pb-3">近 7 日</th>
                  <th className="pb-3">近 30 日</th>
                  <th className="pb-3">全期間累積</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50 text-gray-700 dark:text-slate-200">
                <tr>
                  <td className="py-3 font-medium">體重 (kg)</td>
                  <td className="py-3 font-bold">{weightSummary?.current}</td>
                  <td className="py-3">{renderTrendBadge(weightSummary?.change7d, 'kg', false)}</td>
                  <td className="py-3">{renderTrendBadge(weightSummary?.change30d, 'kg', false)}</td>
                  <td className="py-3">{renderTrendBadge(weightSummary?.changeTotal, 'kg', false)}</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">體脂肪率 (%)</td>
                  <td className="py-3 font-bold">{fatSummary?.current}%</td>
                  <td className="py-3">{renderTrendBadge(fatSummary?.change7d, '%', false)}</td>
                  <td className="py-3">{renderTrendBadge(fatSummary?.change30d, '%', false)}</td>
                  <td className="py-3">{renderTrendBadge(fatSummary?.changeTotal, '%', false)}</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">骨骼肌率 (%)</td>
                  <td className="py-3 font-bold">{muscleSummary?.current}%</td>
                  <td className="py-3">{renderTrendBadge(muscleSummary?.change7d, '%', true)}</td>
                  <td className="py-3">{renderTrendBadge(muscleSummary?.change30d, '%', true)}</td>
                  <td className="py-3">{renderTrendBadge(muscleSummary?.changeTotal, '%', true)}</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">BMI</td>
                  <td className="py-3 font-bold">{bmiSummary?.current}</td>
                  <td className="py-3">{renderTrendBadge(bmiSummary?.change7d, '', false)}</td>
                  <td className="py-3">{renderTrendBadge(bmiSummary?.change30d, '', false)}</td>
                  <td className="py-3">{renderTrendBadge(bmiSummary?.changeTotal, '', false)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Visceral Fat & Secondary Indicators Card */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>健康風險與代謝指標</span>
            </h3>

            <div className="space-y-4">
              {/* Visceral Fat Box */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 block">內臟脂肪程度</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{latest.visceralFat}</span>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                  {visceralCat.category}
                </span>
              </div>

              {/* BMR Box */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 block">基礎代謝率 (BMR)</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{latest.bmr} <span className="text-xs font-normal">kcal</span></span>
                </div>
                <span className="text-xs text-gray-400">每日維持熱量</span>
              </div>

              {/* Body Age Difference */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-500 dark:text-slate-400 block">身體年齡</span>
                  <span className="text-xl font-bold text-gray-900 dark:text-white">{latest.bodyAge} 歲</span>
                </div>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {bodyAgeSummary?.changeTotal && bodyAgeSummary.changeTotal < 0 
                    ? `已下降 ${Math.abs(bodyAgeSummary.changeTotal)} 歲` 
                    : '狀態良好'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('segmental')}
            className="w-full py-2.5 rounded-xl border border-brand-500 text-brand-600 dark:text-brand-400 font-semibold text-xs hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors text-center"
          >
            查看手臂、軀幹、腳部肌肉細分 →
          </button>
        </div>

      </div>

    </div>
  );
};
