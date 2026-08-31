import React, { useState, useRef } from 'react';
import { BodyRecord, DateRangeOption } from '../types/bodyComposition';
import {
  filterRecordsByDateRange,
  calculateWeightLossQuality,
  calculateWeightVelocity,
  prepareChartData,
} from '../services/analytics';
import {
  Share2,
  Copy,
  Check,
  Download,
  Flame,
  Activity,
  Award,
  Sparkles,
  Scale,
  Calendar,
  Layers,
  FileText,
  Eye,
  EyeOff,
  Palette,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { toBlob, toPng } from 'html-to-image';
import { ToastNotification } from '../App';

interface ShareReportViewProps {
  records: BodyRecord[];
  onNotify?: (toast: ToastNotification) => void;
}

type CardTheme = 'light' | 'dark' | 'emerald' | 'indigo';

export const ShareReportView: React.FC<ShareReportViewProps> = ({ records, onNotify }) => {
  const [rangeOption, setRangeOption] = useState<DateRangeOption>('all');
  const [cardTheme, setCardTheme] = useState<CardTheme>('light');
  const [showAbsoluteWeight, setShowAbsoluteWeight] = useState<boolean>(true);
  const [showChart, setShowChart] = useState<boolean>(true);
  const [showSegmental, setShowSegmental] = useState<boolean>(true);
  const [copyingImage, setCopyingImage] = useState<boolean>(false);
  const [copyImageSuccess, setCopyImageSuccess] = useState<boolean>(false);
  const [copyTextSuccess, setCopyTextSuccess] = useState<boolean>(false);

  const reportCardRef = useRef<HTMLDivElement>(null);

  const filtered = filterRecordsByDateRange(records, { range: rangeOption });
  const sorted = [...filtered].sort((a, b) => a.timestamp - b.timestamp);

  const initialRecord = sorted.length > 0 ? sorted[0] : null;
  const latestRecord = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  const weightDiff = initialRecord && latestRecord ? parseFloat((latestRecord.weight - initialRecord.weight).toFixed(1)) : 0;
  const fatDiff = initialRecord && latestRecord ? parseFloat((latestRecord.bodyFat - initialRecord.bodyFat).toFixed(1)) : 0;
  const muscleDiff = initialRecord && latestRecord ? parseFloat((latestRecord.skeletalMuscle - initialRecord.skeletalMuscle).toFixed(1)) : 0;
  const fatMassDiff = initialRecord && latestRecord ? parseFloat((latestRecord.fatMass - initialRecord.fatMass).toFixed(1)) : 0;
  const muscleMassDiff = initialRecord && latestRecord ? parseFloat((latestRecord.skeletalMuscleMass - initialRecord.skeletalMuscleMass).toFixed(1)) : 0;

  const quality = calculateWeightLossQuality(filtered, rangeOption === '7d' ? '7d' : rangeOption === '30d' ? '30d' : 'total');
  const velocity = calculateWeightVelocity(filtered);
  const chartData = prepareChartData(filtered);

  // Time calculations
  const totalDays = initialRecord && latestRecord
    ? Math.max(1, Math.round((latestRecord.timestamp - initialRecord.timestamp) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  // Range button options
  const rangeButtons: { id: DateRangeOption; label: string }[] = [
    { id: '7d', label: '近7天' },
    { id: '30d', label: '近30天' },
    { id: '90d', label: '近3個月' },
    { id: '180d', label: '近半年' },
    { id: '1y', label: '近1年' },
    { id: 'all', label: '全期間' },
  ];

  // Theme styles for the report card
  const themeStyles = {
    light: {
      cardBg: 'bg-white text-gray-900 border-gray-200',
      headerBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
      sectionBg: 'bg-gray-50/80 border-gray-100 text-gray-900',
      statCardBg: 'bg-white border-gray-100 shadow-sm',
      accentText: 'text-brand-600',
      subText: 'text-gray-500',
      chartGrid: '#e2e8f0',
      chartStroke: '#94a3b8',
      footerBorder: 'border-gray-200 text-gray-400',
    },
    dark: {
      cardBg: 'bg-slate-900 text-white border-slate-700',
      headerBg: 'bg-gradient-to-r from-slate-800 via-indigo-950 to-slate-800 text-white border-b border-indigo-500/30',
      sectionBg: 'bg-slate-800/80 border-slate-700 text-white',
      statCardBg: 'bg-slate-800 border-slate-700/80 shadow-md shadow-black/20',
      accentText: 'text-indigo-400',
      subText: 'text-slate-400',
      chartGrid: '#334155',
      chartStroke: '#64748b',
      footerBorder: 'border-slate-800 text-slate-500',
    },
    emerald: {
      cardBg: 'bg-emerald-950 text-white border-emerald-800',
      headerBg: 'bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-800 text-white border-b border-emerald-500/30',
      sectionBg: 'bg-emerald-900/50 border-emerald-800/80 text-white',
      statCardBg: 'bg-emerald-900/80 border-emerald-700/60 shadow-md shadow-emerald-950/40',
      accentText: 'text-emerald-300',
      subText: 'text-emerald-200/70',
      chartGrid: '#064e3b',
      chartStroke: '#34d399',
      footerBorder: 'border-emerald-800 text-emerald-300/60',
    },
    indigo: {
      cardBg: 'bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950 text-white border-indigo-800',
      headerBg: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white',
      sectionBg: 'bg-indigo-900/40 border-indigo-800/70 text-white',
      statCardBg: 'bg-slate-900/90 border-indigo-700/50 shadow-md shadow-indigo-950/50',
      accentText: 'text-indigo-300',
      subText: 'text-indigo-200/70',
      chartGrid: '#312e81',
      chartStroke: '#818cf8',
      footerBorder: 'border-indigo-800 text-indigo-300/60',
    },
  };

  const currentTheme = themeStyles[cardTheme];

  // Copy Image to Clipboard Handler
  const handleCopyImage = async () => {
    if (!reportCardRef.current || copyingImage) return;
    setCopyingImage(true);

    try {
      // Allow DOM settling
      await new Promise((r) => setTimeout(r, 80));

      const blob = await toBlob(reportCardRef.current, {
        pixelRatio: 2, // 2x Crisp Retina image
        cacheBust: true,
        backgroundColor: cardTheme === 'light' ? '#ffffff' : '#0f172a',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) {
            return false;
          }
          return true;
        },
      });

      if (blob) {
        if (navigator.clipboard && typeof navigator.clipboard.write === 'function' && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopyImageSuccess(true);
          if (onNotify) {
            onNotify({
              type: 'success',
              title: '📸 報告圖片已複製至剪貼簿！',
              message: '您可以在 LINE、Discord、備忘錄或社群直接貼上 (Ctrl+V / Cmd+V) 分享。',
            });
          }
          setTimeout(() => setCopyImageSuccess(false), 3000);
        } else {
          // Fallback download
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `體組成成果報告_${new Date().toISOString().slice(0, 10)}.png`;
          a.click();
          URL.revokeObjectURL(url);
          setCopyImageSuccess(true);
          if (onNotify) {
            onNotify({
              type: 'success',
              title: '💾 報告圖片已下載儲存！',
              message: '已為您自動儲存高畫質成果圖片。',
            });
          }
          setTimeout(() => setCopyImageSuccess(false), 3000);
        }
      }
    } catch (err: any) {
      console.error('Failed to copy report image:', err);
      // Fallback: try download via toPng
      try {
        const dataUrl = await toPng(reportCardRef.current, {
          pixelRatio: 2,
          backgroundColor: cardTheme === 'light' ? '#ffffff' : '#0f172a',
          filter: (node) => {
            if (node instanceof HTMLElement && node.classList.contains('no-export')) {
              return false;
            }
            return true;
          },
        });
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `體組成成果報告_${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        setCopyImageSuccess(true);
        setTimeout(() => setCopyImageSuccess(false), 3000);
      } catch (e2) {
        alert('複製圖片失敗，請直接使用螢幕截圖。');
      }
    } finally {
      setCopyingImage(false);
    }
  };

  // Download PNG Image Handler
  const handleDownloadImage = async () => {
    if (!reportCardRef.current) return;
    try {
      const dataUrl = await toPng(reportCardRef.current, {
        pixelRatio: 2,
        backgroundColor: cardTheme === 'light' ? '#ffffff' : '#0f172a',
        filter: (node) => {
          if (node instanceof HTMLElement && node.classList.contains('no-export')) {
            return false;
          }
          return true;
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `體組成成果報告_${new Date().toISOString().slice(0, 10)}.png`;
      a.click();
      if (onNotify) {
        onNotify({
          type: 'success',
          title: '💾 報告圖片已成功下載！',
          message: '已保存至您的下載資料夾。',
        });
      }
    } catch (err) {
      console.error('Download image error:', err);
    }
  };

  // Copy Plain Text Summary Handler
  const handleCopyTextSummary = () => {
    if (!initialRecord || !latestRecord) return;

    const text = `📊【我的體組成進步成果報告】
📅 紀錄期間：${initialRecord.date} ~ ${latestRecord.date} (共 ${totalDays} 天 • ${filtered.length} 筆量測)
━━━━━━━━━━━━━━━━━
${showAbsoluteWeight ? `⚖️ 體重：${initialRecord.weight}kg ➔ ${latestRecord.weight}kg (${weightDiff > 0 ? '+' : ''}${weightDiff}kg)` : `⚖️ 體重變化：${weightDiff > 0 ? '+' : ''}${weightDiff}kg`}
🔥 體脂肪率：${initialRecord.bodyFat}% ➔ ${latestRecord.bodyFat}% (${fatDiff > 0 ? '+' : ''}${fatDiff}%p)
💪 骨骼肌率：${initialRecord.skeletalMuscle}% ➔ ${latestRecord.skeletalMuscle}% (${muscleDiff > 0 ? '+' : ''}${muscleDiff}%p)
🥩 脂肪淨重：${fatMassDiff > 0 ? '+' : ''}${fatMassDiff}kg
🦾 骨骼肌淨重：${muscleMassDiff > 0 ? '+' : ''}${muscleMassDiff}kg
${quality ? `✨ 減重品質判定：${quality.statusLabel}` : ''}
${velocity ? `⚡ 每週速度：${velocity.weeklyRateKg > 0 ? '+' : ''}${velocity.weeklyRateKg} kg/週 (${velocity.statusLabel})` : ''}
━━━━━━━━━━━━━━━━━
🛡️ 數據儲存於 100% 本地體組成分析器`;

    navigator.clipboard.writeText(text).then(() => {
      setCopyTextSuccess(true);
      if (onNotify) {
        onNotify({
          type: 'success',
          title: '📋 純文字成就已複製！',
          message: '您可以直接貼上至社群或傳送訊息給朋友/教練。',
        });
      }
      setTimeout(() => setCopyTextSuccess(false), 2500);
    });
  };

  const formatDateTick = (dateStr: string) => {
    if (!dateStr) return '';
    const datePart = dateStr.split(' ')[0];
    const parts = datePart.split('-');
    return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : dateStr;
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-slate-400">
        尚無數據可產生成效報告，請先匯入或新增量測紀錄。
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">

      {/* Control Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-xl">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900 dark:text-white">報告分享與成效海報製作</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">統整體組成進步曲線，一鍵複製高畫質圖片分享成果</p>
            </div>
          </div>

          {/* Quick Action Share Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyImage}
              disabled={copyingImage}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md active:scale-95 ${
                copyImageSuccess
                  ? 'bg-emerald-600 shadow-emerald-500/20 ring-2 ring-emerald-400'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
              }`}
            >
              {copyingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>生成圖片中...</span>
                </>
              ) : copyImageSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>已複製分享圖片！</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>複製分享圖片</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadImage}
              className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors"
              title="下載 PNG 圖片"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyTextSummary}
              className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 transition-colors"
              title="複製純文字摘要"
            >
              {copyTextSuccess ? <Check className="w-4 h-4 text-emerald-500" /> : <FileText className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          
          {/* Range Options */}
          <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
            {rangeButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => setRangeOption(btn.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  rangeOption === btn.id
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Theme & Display Options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme Selector */}
            <div className="flex items-center space-x-1 bg-gray-50 dark:bg-slate-900 p-1 rounded-xl border border-gray-100 dark:border-slate-800">
              <Palette className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-0.5" />
              {[
                { id: 'light', label: '簡潔白' },
                { id: 'dark', label: '深邃黑' },
                { id: 'emerald', label: '翡翠綠' },
                { id: 'indigo', label: '科技藍' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setCardTheme(t.id as CardTheme)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    cardTheme === t.id
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Absolute Weight Visibility Toggle */}
            <button
              onClick={() => setShowAbsoluteWeight(!showAbsoluteWeight)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                showAbsoluteWeight
                  ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 border-gray-200 dark:border-slate-600'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
              }`}
              title="切換是否顯示體重實際公斤數字（適合只想分享變化量與體脂%的朋友）"
            >
              {showAbsoluteWeight ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showAbsoluteWeight ? '顯示體重數值' : '已隱藏體重數值'}</span>
            </button>

            {/* Toggle Chart */}
            <button
              onClick={() => setShowChart(!showChart)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                showChart
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
                  : 'bg-gray-50 dark:bg-slate-900 text-gray-400 border-gray-200 dark:border-slate-800'
              }`}
            >
              <span>迷你趨勢圖 ({showChart ? '開' : '關'})</span>
            </button>

            {/* Toggle Segmental */}
            <button
              onClick={() => setShowSegmental(!showSegmental)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                showSegmental
                  ? 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800'
                  : 'bg-gray-50 dark:bg-slate-900 text-gray-400 border-gray-200 dark:border-slate-800'
              }`}
            >
              <span>部位數據 ({showSegmental ? '開' : '關'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* CAPTURED REPORT CARD (This entire element gets copied as PNG) */}
      {/* ========================================================= */}
      <div
        ref={reportCardRef}
        className={`rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${currentTheme.cardBg}`}
      >
        {/* Top Gradient Banner */}
        <div className={`p-6 sm:p-8 ${currentTheme.headerBg}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-white/20 rounded-lg text-white">
                  <Award className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/90">
                  Body Composition Progress Report
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                體組成進步成果報告
              </h1>
              <p className="text-xs sm:text-sm text-white/80 flex items-center space-x-2 pt-1">
                <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                <span>
                  {initialRecord?.date} ~ {latestRecord?.date} • 歷時 {totalDays} 天 • 共 {filtered.length} 筆量測
                </span>
              </p>
            </div>

            {/* Highlight Badges */}
            <div className="flex flex-wrap sm:flex-col sm:items-end gap-2">
              {quality && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white text-xs font-bold shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>{quality.statusLabel.replace('週平均：', '')}</span>
                </span>
              )}
              {velocity && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-black/20 text-white text-[11px] font-semibold">
                  <Activity className="w-3 h-3" />
                  <span>速度：{velocity.weeklyRateKg > 0 ? '+' : ''}{velocity.weeklyRateKg} kg/週</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 sm:p-8 space-y-6">

          {/* Milestone Metrics Comparison Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-70 flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>核心指標變化 (Milestones & Net Changes)</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Metric 1: Weight */}
              <div className={`p-4 rounded-2xl border ${currentTheme.statCardBg}`}>
                <span className="text-xs opacity-70 block mb-1">體重變化 (Weight)</span>
                <div className="flex items-baseline space-x-1">
                  <span className="text-xl sm:text-2xl font-black">
                    {weightDiff > 0 ? `+${weightDiff}` : weightDiff}
                  </span>
                  <span className="text-xs font-bold opacity-80">kg</span>
                </div>
                {showAbsoluteWeight && initialRecord && latestRecord ? (
                  <div className="mt-2 text-[11px] opacity-60 flex items-center justify-between border-t border-current/10 pt-1.5">
                    <span>起點 {initialRecord.weight}</span>
                    <span>➔</span>
                    <span className="font-bold">現況 {latestRecord.weight}kg</span>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] opacity-60 border-t border-current/10 pt-1.5">
                    {weightDiff < 0 ? '穩定減重成效' : '維持/增重中'}
                  </div>
                )}
              </div>

              {/* Metric 2: Body Fat % */}
              <div className={`p-4 rounded-2xl border ${currentTheme.statCardBg}`}>
                <span className="text-xs opacity-70 block mb-1">體脂肪率 (Body Fat)</span>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-xl sm:text-2xl font-black ${
                    fatDiff < 0 ? 'text-emerald-500' : ''
                  }`}>
                    {fatDiff > 0 ? `+${fatDiff}` : fatDiff}
                  </span>
                  <span className="text-xs font-bold opacity-80">%p</span>
                </div>
                {initialRecord && latestRecord && (
                  <div className="mt-2 text-[11px] opacity-60 flex items-center justify-between border-t border-current/10 pt-1.5">
                    <span>起點 {initialRecord.bodyFat}%</span>
                    <span>➔</span>
                    <span className="font-bold">現況 {latestRecord.bodyFat}%</span>
                  </div>
                )}
              </div>

              {/* Metric 3: Skeletal Muscle % */}
              <div className={`p-4 rounded-2xl border ${currentTheme.statCardBg}`}>
                <span className="text-xs opacity-70 block mb-1">骨骼肌率 (Muscle %)</span>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-xl sm:text-2xl font-black ${
                    muscleDiff > 0 ? 'text-emerald-500' : ''
                  }`}>
                    {muscleDiff > 0 ? `+${muscleDiff}` : muscleDiff}
                  </span>
                  <span className="text-xs font-bold opacity-80">%p</span>
                </div>
                {initialRecord && latestRecord && (
                  <div className="mt-2 text-[11px] opacity-60 flex items-center justify-between border-t border-current/10 pt-1.5">
                    <span>起點 {initialRecord.skeletalMuscle}%</span>
                    <span>➔</span>
                    <span className="font-bold">現況 {latestRecord.skeletalMuscle}%</span>
                  </div>
                )}
              </div>

              {/* Metric 4: Fat Mass kg */}
              <div className={`p-4 rounded-2xl border ${currentTheme.statCardBg}`}>
                <span className="text-xs opacity-70 block mb-1">脂肪淨重量 (Fat Mass)</span>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-xl sm:text-2xl font-black ${
                    fatMassDiff < 0 ? 'text-emerald-500' : ''
                  }`}>
                    {fatMassDiff > 0 ? `+${fatMassDiff}` : fatMassDiff}
                  </span>
                  <span className="text-xs font-bold opacity-80">kg</span>
                </div>
                {initialRecord && latestRecord && (
                  <div className="mt-2 text-[11px] opacity-60 flex items-center justify-between border-t border-current/10 pt-1.5">
                    <span>起點 {initialRecord.fatMass}</span>
                    <span>➔</span>
                    <span className="font-bold">現況 {latestRecord.fatMass}kg</span>
                  </div>
                )}
              </div>

              {/* Metric 5: Skeletal Muscle Mass kg */}
              <div className={`p-4 rounded-2xl border ${currentTheme.statCardBg}`}>
                <span className="text-xs opacity-70 block mb-1">骨骼肌淨重量 (Muscle Mass)</span>
                <div className="flex items-baseline space-x-1">
                  <span className={`text-xl sm:text-2xl font-black ${
                    muscleMassDiff >= 0 ? 'text-emerald-500' : ''
                  }`}>
                    {muscleMassDiff > 0 ? `+${muscleMassDiff}` : muscleMassDiff}
                  </span>
                  <span className="text-xs font-bold opacity-80">kg</span>
                </div>
                {initialRecord && latestRecord && (
                  <div className="mt-2 text-[11px] opacity-60 flex items-center justify-between border-t border-current/10 pt-1.5">
                    <span>起點 {initialRecord.skeletalMuscleMass}</span>
                    <span>➔</span>
                    <span className="font-bold">現況 {latestRecord.skeletalMuscleMass}kg</span>
                  </div>
                )}
              </div>

              {/* Metric 6: Visceral Fat / BMI */}
              <div className={`p-4 rounded-2xl border ${currentTheme.statCardBg}`}>
                <span className="text-xs opacity-70 block mb-1">內臟脂肪 & BMI</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-xl sm:text-2xl font-black">
                    {latestRecord ? `Lv.${latestRecord.visceralFat}` : '--'}
                  </span>
                  <span className="text-xs opacity-70">
                    BMI {latestRecord ? latestRecord.bmi : '--'}
                  </span>
                </div>
                {initialRecord && latestRecord && (
                  <div className="mt-2 text-[11px] opacity-60 flex items-center justify-between border-t border-current/10 pt-1.5">
                    <span>起點 Lv.{initialRecord.visceralFat}</span>
                    <span>➔</span>
                    <span className="font-bold">年齡 {latestRecord.bodyAge}歲</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quality Analysis & Advice Banner */}
          {quality && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${currentTheme.sectionBg} space-y-2`}>
              <div className="flex items-center space-x-2">
                <Flame className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <h4 className="font-bold text-sm">減重與減脂品質診斷</h4>
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                {quality.advice}
              </p>
              {quality.fatLossPercentage > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-semibold">
                    🔥 減脂貢獻率：{quality.fatLossPercentage}%
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-400 font-semibold">
                    💪 肌肉保留率：{100 - quality.muscleLossPercentage}%
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mini Trend Line Chart */}
          {showChart && chartData.length > 1 && (
            <div className={`p-4 sm:p-5 rounded-2xl border ${currentTheme.sectionBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold opacity-80 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>體重與體脂率趨勢曲線</span>
                </span>
                <span className="text-[11px] opacity-60">
                  藍線: 體重 (kg) • 橘線: 體脂 (%)
                </span>
              </div>

              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.chartGrid} />
                    <XAxis dataKey="date" tickFormatter={formatDateTick} stroke={currentTheme.chartStroke} tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" domain={['dataMin - 1', 'dataMax + 1']} stroke="#0284c7" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="right" orientation="right" domain={['dataMin - 1', 'dataMax + 1']} stroke="#f59e0b" tick={{ fontSize: 10 }} />
                    <Tooltip content={<div />} />
                    <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#0284c7" strokeWidth={2.5} dot={false} />
                    <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Segmental Body Breakdown */}
          {showSegmental && initialRecord && latestRecord && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2.5 flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>部位骨骼肌率分佈 (雙臂 / 軀幹 / 雙腳)</span>
              </h4>
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className={`p-3 rounded-xl border ${currentTheme.statCardBg}`}>
                  <span className="text-[11px] opacity-70 block">雙臂骨骼肌</span>
                  <span className="text-sm sm:text-base font-bold block mt-0.5">{latestRecord.skeletalMuscleArm}%</span>
                  <span className="text-[10px] opacity-60">
                    起點 {initialRecord.skeletalMuscleArm}%
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${currentTheme.statCardBg}`}>
                  <span className="text-[11px] opacity-70 block">身軀骨骼肌</span>
                  <span className="text-sm sm:text-base font-bold block mt-0.5">{latestRecord.skeletalMuscleTrunk}%</span>
                  <span className="text-[10px] opacity-60">
                    起點 {initialRecord.skeletalMuscleTrunk}%
                  </span>
                </div>
                <div className={`p-3 rounded-xl border ${currentTheme.statCardBg}`}>
                  <span className="text-[11px] opacity-70 block">雙腳骨骼肌</span>
                  <span className="text-sm sm:text-base font-bold block mt-0.5">{latestRecord.skeletalMuscleLeg}%</span>
                  <span className="text-[10px] opacity-60">
                    起點 {initialRecord.skeletalMuscleLeg}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Watermark */}
          <div className={`pt-4 border-t ${currentTheme.footerBorder} flex flex-col sm:flex-row items-center justify-between text-[11px] gap-2`}>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>100% 本地存儲隱私保障 (Local-First IndexedDB)</span>
            </div>
            <span>體組成數據分析器 • 生成時間 {new Date().toLocaleDateString('zh-TW')}</span>
          </div>

        </div>
      </div>

    </div>
  );
};
