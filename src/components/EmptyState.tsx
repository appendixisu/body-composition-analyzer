import React, { useState } from 'react';
import { Upload, FileText, PlusCircle, AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { parseCsvFile, getRegisteredParsers } from '../services/parsers/parserFactory';
import { bulkAddRecords } from '../services/db';
import { ToastNotification } from '../App';

interface EmptyStateProps {
  onDataLoaded: () => void;
  onOpenAddModal: () => void;
  onNotify?: (toast: ToastNotification) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onDataLoaded, onOpenAddModal, onNotify }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; title: string; message: string; formatName?: string; count?: number } | null>(null);
  const registeredParsers = getRegisteredParsers();

  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setFeedback(null);

    try {
      const parseResult = await parseCsvFile(file);
      if (!parseResult.success || parseResult.records.length === 0) {
        const errorText = parseResult.errors[0] || '無法解析該檔案，請確認檔案格式是否正確。';
        setFeedback({
          type: 'error',
          title: '檔案解析失敗',
          message: errorText,
        });
        if (onNotify) {
          onNotify({
            type: 'error',
            title: '檔案解析失敗',
            message: errorText,
          });
        }
        setLoading(false);
        return;
      }

      const { added, updated } = await bulkAddRecords(parseResult.records);
      const total = added + updated;
      const successTitle = '🎉 檔案匯入成功！';
      const successMessage = `成功處理 ${total} 筆體組成量測紀錄 (新增 ${added} 筆, 更新 ${updated} 筆)。`;

      setFeedback({
        type: 'success',
        title: successTitle,
        message: successMessage,
        formatName: parseResult.formatName,
        count: total,
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

      // Allow user to see the success state before loading dashboard
      setTimeout(() => {
        onDataLoaded();
      }, 1000);
    } catch (err: any) {
      const errMsg = err?.message || '未知錯誤，請檢查檔案內容格式。';
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
    <div className="max-w-3xl mx-auto pt-0 pb-8 sm:pb-12 px-4 text-center space-y-6">
      
      {/* Privacy Guarantee Card (Top Banner) */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 dark:from-slate-900 dark:via-indigo-950/80 dark:to-slate-900 border border-blue-200/80 dark:border-indigo-500/40 rounded-2xl p-4 sm:p-5 flex items-start space-x-3.5 shadow-sm text-left">
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

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 sm:p-12 border border-gray-100 dark:border-slate-700">

        {/* Header Icon */}
        <div className="w-16 h-16 bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Upload className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          開始分析您的體組成數據
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
          目前本地端尚無體重紀錄。請手動建立第一筆資料，或上傳體組成數據檔案進行匯入。
        </p>

        {/* Primary Action: Manual Entry Button */}
        <div className="mb-6 flex justify-center">
          <button
            onClick={onOpenAddModal}
            className="flex items-center justify-center space-x-2 px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm transition-all shadow-md shadow-brand-500/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlusCircle className="w-5 h-5" />
            <span>手動建立第一筆紀錄</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-slate-700"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white dark:bg-slate-800 px-3 text-gray-400 dark:text-slate-500 font-medium">
              或上傳數據檔案進行匯入
            </span>
          </div>
        </div>

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
            accept=".csv,.xlsx,.xls,.json"
            onChange={(e) => {
              onFileInputChange(e);
              e.target.value = '';
            }}
            className="hidden"
            id="csv-file-input"
            disabled={loading}
          />
          <label htmlFor="csv-file-input" className="cursor-pointer block py-2">
            {loading ? (
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent mx-auto mb-3"></div>
            ) : (
              <FileText className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-3" />
            )}
            <span className="font-semibold text-gray-700 dark:text-slate-200 block text-base">
              {loading ? '正在解析並儲存至本地資料庫中...' : '點擊選擇 CSV / Excel / JSON 檔案 或 拖曳檔案至此'}
            </span>
          </label>
        </div>

        {/* Loading Progress Notification */}
        {loading && (
          <div className="mt-4 p-4 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 flex items-center justify-center space-x-3 animate-pulse">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-600 dark:border-brand-400 border-t-transparent"></div>
            <span className="font-semibold text-xs sm:text-sm">正在解析檔案格式並寫入本地資料庫，請稍候...</span>
          </div>
        )}

        {/* Prominent Feedback Card */}
        {feedback && !loading && (
          <div
            className={`mt-4 p-4 sm:p-5 rounded-xl border text-left shadow-sm transition-all animate-in fade-in duration-200 ${
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

                  {feedback.formatName && feedback.type === 'success' && (
                    <div className="flex flex-wrap gap-1.5 pt-1.5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                        📁 格式：{feedback.formatName}
                      </span>
                      {feedback.count !== undefined && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
                          ✨ 共匯入 {feedback.count} 筆紀錄
                        </span>
                      )}
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

        {/* Supported Data Formats Grid below Dashed Dropzone Box */}
        <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700/60 text-left">
          <span className="text-xs font-semibold text-gray-500 dark:text-slate-400 block mb-3 text-center sm:text-left">
            已支援的數據解析器格式：
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {registeredParsers.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-xl bg-gray-50/80 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-800 flex items-start space-x-2.5 transition-all hover:border-gray-200 dark:hover:border-slate-700"
              >
                <div className="p-1.5 bg-brand-100/70 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg flex-shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold text-xs text-gray-800 dark:text-slate-200 block">
                    {p.name}
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400 leading-snug block mt-0.5">
                    {p.description}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>



      </div>
    </div>
  );
};
