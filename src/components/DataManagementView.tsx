import React, { useState } from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { parseCsvFile, getRegisteredParsers } from '../services/parsers/parserFactory';
import { bulkAddRecords, clearAllRecords } from '../services/db';
import { Upload, Download, Trash2, Database, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import Papa from 'papaparse';

interface DataManagementViewProps {
  records: BodyRecord[];
  onRefresh: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ records, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const registeredParsers = getRegisteredParsers();

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setMsg(null);

    try {
      const parseResult = await parseCsvFile(file);
      if (!parseResult.success || parseResult.records.length === 0) {
        setMsg({ type: 'error', text: parseResult.errors[0] || '無法解析該 CSV 檔案' });
        setLoading(false);
        return;
      }

      const { added, updated } = await bulkAddRecords(parseResult.records);
      setMsg({ type: 'success', text: `成功處理 ${added + updated} 筆紀錄 (新增 ${added} 筆, 更新 ${updated} 筆) - ${parseResult.formatName}` });
      onRefresh();
    } catch (err: any) {
      setMsg({ type: 'error', text: `匯入發生錯誤: ${err?.message || '未知錯誤'}` });
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
      setMsg({ type: 'success', text: '已成功清空本地端所有數據！' });
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      
      {/* Privacy Guarantee Card */}
      <div className="bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-900 rounded-2xl p-5 flex items-start space-x-3 text-brand-900 dark:text-brand-200">
        <ShieldCheck className="w-6 h-6 text-brand-600 dark:text-brand-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-sm">100% 本地隱私保障 (Local-First Storage)</h3>
          <p className="text-xs text-brand-700 dark:text-brand-300 mt-0.5 leading-relaxed">
            所有資料均純粹儲存在您的瀏覽器 IndexedDB 中，本網站不會上傳任何個人生理數據至遠端伺服器。您可以隨時匯出備份或清空資料。
          </p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm flex items-center space-x-2 ${
          msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{msg.text}</span>
        </div>
      )}

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

        <div className="space-y-3">
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.json"
            onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
            id="management-csv-input"
            className="hidden"
            disabled={loading}
          />
          <label
            htmlFor="management-csv-input"
            className="flex items-center justify-center space-x-2 w-full py-4 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl hover:border-brand-500 cursor-pointer transition-colors bg-gray-50/50 dark:bg-slate-900/50"
          >
            <Upload className="w-5 h-5 text-brand-500" />
            <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
              {loading ? '正在解析中...' : '選擇 CSV, Excel (.xlsx/.xls) 或 JSON 檔案進行匯入'}
            </span>
          </label>

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
