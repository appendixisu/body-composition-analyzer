import React, { useState, useEffect } from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { ThemeMode } from './Navbar';
import { parseCsvFile, getRegisteredParsers } from '../services/parsers/parserFactory';
import { bulkAddRecords, clearAllRecords } from '../services/db';
import { Upload, Download, Trash2, Database, AlertCircle, CheckCircle2, ShieldCheck, Monitor, Sun, Moon, X } from 'lucide-react';
import Papa from 'papaparse';
import { ToastNotification } from '../App';

interface DataManagementViewProps {
  records: BodyRecord[];
  onRefresh: () => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  onNotify?: (toast: ToastNotification) => void;
}

interface FeedbackState {
  type: 'success' | 'error';
  title: string;
  message: string;
  formatName?: string;
  added?: number;
  updated?: number;
  total?: number;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  records,
  onRefresh,
  themeMode,
  setThemeMode,
  onNotify,
}) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const registeredParsers = getRegisteredParsers();

  // Auto-dismiss floating notification after 7 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => {
        setFeedback(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setFeedback(null);

    try {
      const parseResult = await parseCsvFile(file);
      if (!parseResult.success || parseResult.records.length === 0) {
        const errText = parseResult.errors[0] || '無法解析該檔案，請確認檔案格式是否正確。';
        setFeedback({
          type: 'error',
          title: '檔案解析失敗',
          message: errText,
        });
        if (onNotify) {
          onNotify({
            type: 'error',
            title: '檔案解析失敗',
            message: errText,
          });
        }
        setLoading(false);
        return;
      }

      const { added, updated } = await bulkAddRecords(parseResult.records);
      const total = added + updated;
      const successTitle = '🎉 檔案匯入成功！';
      const successMessage = `成功處理 ${total} 筆紀錄 (新增 ${added} 筆, 更新 ${updated} 筆)。`;
      
      setFeedback({
        type: 'success',
        title: successTitle,
        message: successMessage,
        formatName: parseResult.formatName,
        added,
        updated,
        total,
      });

      if (onNotify) {
        onNotify({
          type: 'success',
          title: successTitle,
          message: successMessage,
          formatName: parseResult.formatName,
          added,
          updated,
          total,
        });
      }
      onRefresh();
    } catch (err: any) {
      const errMsg = err?.message || '檔案解析過程中發生未知錯誤，請檢查檔案內容。';
      setFeedback({
        type: 'error',
        title: '匯入發生錯誤',
        message: errMsg,
      });
      if (onNotify) {
        onNotify({
          type: 'error',
          title: '匯入發生錯誤',
          message: errMsg,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!records || records.length === 0) return;
    
    // Format Omron compatible header CSV
    const exportData = records.map(r => ({
      '測量日期': r.date,
      '時區': r.timezone || 'Asia/Taipei',
      '體重(kg)': r.weight,
      '體脂肪(%)': r.bodyFat,
      '體脂肪量(kg)': r.fatMass,
      '內臟脂肪程度': r.visceralFat,
      '基礎代謝(kcal)': r.bmr,
      '骨骼肌(%)': r.skeletalMuscle,
      '骨骼肌重量(kg)': r.skeletalMuscleMass,
      '骨骼肌率（雙臂）(%)': r.skeletalMuscleArm,
      '骨骼肌率（身軀）(%)': r.skeletalMuscleTrunk,
      '骨骼肌率（雙腳）(%)': r.skeletalMuscleLeg,
      '皮下脂肪率(%)': r.subcutaneousFat,
      '皮下脂肪率（雙臂）(%)': r.subcutaneousFatArm,
      '皮下脂肪率（身軀）(%)': r.subcutaneousFatTrunk,
      '皮下脂肪率（雙腳）(%)': r.subcutaneousFatLeg,
      'BMI': r.bmi,
      '身體年齡(歲)': r.bodyAge,
      '型號': r.deviceModel || 'HBF-702T',
    }));

    const csvStr = Papa.unparse(exportData);
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BodyComposition_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    if (!records || records.length === 0) return;
    const jsonStr = JSON.stringify(records, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BodyComposition_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearAll = async () => {
    if (window.confirm('確定要清空所有本地端的體重紀錄嗎？此動作無法復原。')) {
      await clearAllRecords();
      setFeedback({
        type: 'success',
        title: '已清空資料庫',
        message: '已成功清空本地端所有數據紀錄！',
      });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto relative">
      
      {/* Floating Toast Notification (Always Visible on Screen) */}
      {feedback && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-start justify-between space-x-3 transition-all duration-300 transform animate-in fade-in slide-in-from-top-4 ${
            feedback.type === 'success'
              ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-emerald-950/30'
              : 'bg-rose-600/95 text-white border-rose-400 shadow-rose-950/30'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-white/20 rounded-xl flex-shrink-0 mt-0.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">{feedback.title}</h4>
              <p className="text-xs mt-1 text-white/95 leading-relaxed">{feedback.message}</p>
              {feedback.formatName && feedback.type === 'success' && (
                <span className="inline-block mt-2 text-[11px] font-semibold bg-white/20 px-2.5 py-0.5 rounded-md">
                  格式：{feedback.formatName}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0"
            title="關閉提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Privacy Guarantee Card */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 border border-blue-200/80 dark:border-indigo-500/40 rounded-2xl p-5 flex items-start space-x-3.5 shadow-sm dark:shadow-indigo-950/50">
        <div className="p-2.5 bg-blue-600 dark:bg-indigo-600 text-white rounded-xl flex-shrink-0 mt-0.5 shadow-md shadow-blue-500/20 dark:shadow-indigo-500/30">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-blue-950 dark:text-indigo-100">
            100% 本地隱私保障
            <span className="block text-xs font-medium text-blue-700/80 dark:text-indigo-300/80 mt-0.5">(Local-First Storage)</span>
          </h3>
          <p className="text-xs text-blue-800/90 dark:text-indigo-200/90 mt-1 leading-relaxed">
            所有資料均純粹儲存在您的瀏覽器 IndexedDB 中，本網站不會上傳任何個人生理數據至遠端伺服器。您可以隨時匯出備份或清空資料。
          </p>
        </div>
      </div>

      {/* CSV Import Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="p-2.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">匯入體組成檔案</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">上傳體組成數據檔 (.csv / .xlsx / .xls) 或健康裝置紀錄</p>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
              e.target.value = '';
            }}
            id="management-csv-input"
            className="hidden"
            disabled={loading}
          />
          <label
            htmlFor="management-csv-input"
            className={`flex flex-col sm:flex-row items-center justify-center space-y-1.5 sm:space-y-0 sm:space-x-2 w-full py-6 sm:py-4 px-4 sm:px-6 border-2 border-dashed rounded-xl cursor-pointer transition-all text-center ${
              loading
                ? 'border-brand-400 bg-brand-50/40 dark:bg-brand-950/20 opacity-70 cursor-wait'
                : 'border-gray-300 dark:border-slate-600 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-slate-900/80 bg-gray-50/50 dark:bg-slate-900/50'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-500 border-t-transparent flex-shrink-0"></div>
            ) : (
              <Upload className="w-5 h-5 text-brand-500 flex-shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-slate-200 leading-snug">
              {loading ? '正在解析並寫入資料庫中...' : '選擇 CSV, Excel (.xlsx/.xls) 或 JSON 檔案進行匯入'}
            </span>
          </label>

          {/* Loading Progress State */}
          {loading && (
            <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 flex items-center justify-center space-x-3 animate-pulse">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-600 dark:border-brand-400 border-t-transparent"></div>
              <span className="font-semibold text-xs sm:text-sm">正在解析檔案格式並儲存至本地資料庫，請稍候...</span>
            </div>
          )}

          {/* In-Card Prominent Result Status */}
          {feedback && !loading && (
            <div
              className={`p-4 sm:p-5 rounded-xl border shadow-sm transition-all animate-in fade-in duration-200 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start space-x-3">
                  <div
                    className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${
                      feedback.type === 'success'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                        : 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                    }`}
                  >
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertCircle className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="font-bold text-base leading-tight">{feedback.title}</h4>
                    <p className="text-xs sm:text-sm opacity-90 leading-relaxed">{feedback.message}</p>

                    {feedback.type === 'success' && (
                      <div className="flex flex-wrap gap-1.5 pt-1.5">
                        {feedback.formatName && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                            📁 格式：{feedback.formatName}
                          </span>
                        )}
                        {feedback.added !== undefined && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                            ➕ 新增 {feedback.added} 筆
                          </span>
                        )}
                        {feedback.updated !== undefined && feedback.updated > 0 && (
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                            🔄 更新覆蓋 {feedback.updated} 筆
                          </span>
                        )}
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100">
                          📊 本地資料庫現存 {records.length} 筆
                        </span>
                      </div>
                    )}

                    {feedback.type === 'error' && (
                      <div className="text-xs text-rose-700 dark:text-rose-300 pt-1 leading-relaxed bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800/50">
                        💡 提示：請確認上傳檔案是否為支援之格式（Omron Connect CSV、OKOK 國際版 Excel 或 JSON 備份檔），且資料行中含有有效之「測量日期」與「體重」數值。
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setFeedback(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-slate-700/50 transition-colors flex-shrink-0"
                  title="關閉提示"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Registered Parsers Info */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
            <span className="text-xs font-semibold text-gray-400 block mb-2">已支援的解析器格式 (Parser Strategies):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {registeredParsers.map(p => (
                <div key={p.id} className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-900/60 text-xs border border-gray-100 dark:border-slate-800">
                  <span className="font-bold text-gray-800 dark:text-slate-200 block">{p.name}</span>
                  <span className="text-gray-400 text-[11px]">{p.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Export Data Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">匯出與備份資料</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">目前本地端共包含 {records.length} 筆量測紀錄</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleExportCsv}
            disabled={records.length === 0}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>匯出標準體組成 CSV 檔</span>
          </button>

          <button
            onClick={handleExportJson}
            disabled={records.length === 0}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 disabled:opacity-50 text-sm font-semibold transition-colors"
          >
            <Database className="w-4 h-4" />
            <span>匯出 JSON 備份檔</span>
          </button>
        </div>
      </div>

      {/* Theme Preference Settings Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-gray-100 dark:border-slate-700 pb-4">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">主題色彩外觀設定</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">自訂顯示模式，或隨時切換重置為跟隨 iOS / 系統自動深淺色</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'system', label: '跟隨系統 (System)', desc: '自動匹配 iOS / OS 深淺色', icon: <Monitor className="w-5 h-5 text-brand-500" /> },
            { id: 'light', label: '淺色模式 (Light)', desc: '固定使用明亮介面', icon: <Sun className="w-5 h-5 text-amber-500" /> },
            { id: 'dark', label: '深色模式 (Dark)', desc: '固定使用深色護眼介面', icon: <Moon className="w-5 h-5 text-indigo-400" /> },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setThemeMode(mode.id as ThemeMode)}
              className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                themeMode === mode.id
                  ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/20'
                  : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 bg-gray-50/50 dark:bg-slate-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {mode.icon}
                {themeMode === mode.id && (
                  <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded-full font-semibold">
                    使用中
                  </span>
                )}
              </div>
              <div>
                <span className="font-bold text-sm text-gray-900 dark:text-white block">{mode.label}</span>
                <span className="text-[11px] text-gray-500 dark:text-slate-400 block mt-0.5">{mode.desc}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Clear Data Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-rose-100 dark:border-rose-950 shadow-sm space-y-4">
        <div className="flex items-center space-x-3 border-b border-rose-100 dark:border-rose-950 pb-4">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-rose-700 dark:text-rose-400">清空本地資料庫</h3>
            <p className="text-xs text-rose-500/80">移除所有已儲存的體組成紀錄</p>
          </div>
        </div>

        <button
          onClick={handleClearAll}
          disabled={records.length === 0}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>清空所有紀錄</span>
        </button>
      </div>

    </div>
  );
};
