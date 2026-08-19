import React, { useState } from 'react';
import { Upload, FileText, PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { parseCsvFile } from '../services/parsers/parserFactory';
import { bulkAddRecords } from '../services/db';

interface EmptyStateProps {
  onDataLoaded: () => void;
  onOpenAddModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onDataLoaded, onOpenAddModal }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const parseResult = await parseCsvFile(file);
      if (!parseResult.success || parseResult.records.length === 0) {
        setErrorMsg(parseResult.errors[0] || '無法解析該 CSV 檔案，請確認檔案格式是否正確。');
        setLoading(false);
        return;
      }

      const { added, updated } = await bulkAddRecords(parseResult.records);
      setSuccessMsg(`成功匯入 ${added + updated} 筆體組成紀錄！(${parseResult.formatName})`);
      setTimeout(() => {
        onDataLoaded();
      }, 800);
    } catch (err: any) {
      setErrorMsg(`匯入發生錯誤: ${err?.message || '未知錯誤'}`);
    } finally {
      setLoading(false);
    }
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHovered(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 text-center">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100 dark:border-slate-700">
        
        {/* Header Icon */}
        <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Upload className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          開始分析您的體組成數據
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-8">
          目前本地端尚無體重紀錄。請上傳從歐姆龍 App 或健康裝置匯出的 CSV 資料檔，或手動新增第一筆資料。
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsHovered(true); }}
          onDragLeave={() => setIsHovered(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer ${
            isHovered
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/20 scale-[1.01]'
              : 'border-gray-300 dark:border-slate-600 hover:border-brand-400 dark:hover:border-brand-500 bg-gray-50/50 dark:bg-slate-900/50'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={onFileInputChange}
            className="hidden"
            id="csv-file-input"
            disabled={loading}
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block">
            <FileText className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
            <span className="font-semibold text-gray-700 dark:text-slate-200 block text-base mb-1">
              點擊選擇 CSV 檔案 或 拖曳檔案至此
            </span>
            <span className="text-xs text-gray-400 dark:text-slate-500">
              支援歐姆龍 (BodyComposition_*.csv) 及通用 CSV 格式
            </span>
          </label>
        </div>

        {/* Feedback Messages */}
        {loading && (
          <div className="mt-4 flex items-center justify-center text-brand-600 dark:text-brand-400 text-sm font-medium">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
            正在解析並儲存資料至本地端...
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Alternative Action */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium text-sm transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>手動建立第一筆紀錄</span>
          </button>
        </div>

      </div>
    </div>
  );
};
