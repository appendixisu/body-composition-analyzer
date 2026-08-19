import React, { useState } from 'react';
import { BodyRecord } from '../types/bodyComposition';
import { deleteRecord } from '../services/db';
import { Search, Edit2, Trash2, Eye, PlusCircle, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface HistoryViewProps {
  records: BodyRecord[];
  onRefresh: () => void;
  onOpenAddModal: () => void;
  onOpenEditModal: (record: BodyRecord) => void;
  onOpenDetailModal: (record: BodyRecord) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  onRefresh,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortAsc, setSortAsc] = useState(false); // Default: newest first
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Filter
  const filtered = records.filter(r => 
    r.date.includes(searchTerm) || 
    (r.deviceModel && r.deviceModel.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    return sortAsc ? a.timestamp - b.timestamp : b.timestamp - a.timestamp;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id?: number, date?: string) => {
    if (!id) return;
    if (window.confirm(`確定要刪除 ${date || ''} 的量測紀錄嗎？`)) {
      await deleteRecord(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Action Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜尋日期 (例如: 2026/07 或 2026-08)..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-gray-800 dark:text-slate-100"
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAsc ? '最舊在前' : '最新在前'}</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-medium text-xs sm:text-sm shadow transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>新增紀錄</span>
          </button>
        </div>

      </div>

      {/* Data Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-700 text-gray-500 dark:text-slate-400 text-xs font-semibold">
                <th className="py-3.5 px-4">測量日期時間</th>
                <th className="py-3.5 px-3">體重 (kg)</th>
                <th className="py-3.5 px-3">體脂率 (%)</th>
                <th className="py-3.5 px-3">骨骼肌率 (%)</th>
                <th className="py-3.5 px-3">BMI</th>
                <th className="py-3.5 px-3 hidden md:table-cell">內臟脂肪</th>
                <th className="py-3.5 px-3 hidden md:table-cell">身體年齡</th>
                <th className="py-3.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50 text-gray-700 dark:text-slate-200">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-slate-500 text-sm">
                    查無符合條件的體重紀錄
                  </td>
                </tr>
              ) : (
                paginated.map((r) => (
                  <tr key={r.id || r.date} className="hover:bg-gray-50/80 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium whitespace-nowrap">
                      <div>{r.date}</div>
                      {r.deviceModel && (
                        <div className="text-[10px] text-gray-400 font-normal">{r.deviceModel}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {r.weight.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {r.bodyFat > 0 ? `${r.bodyFat.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {r.skeletalMuscle > 0 ? `${r.skeletalMuscle.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-3.5 px-3 font-medium whitespace-nowrap">
                      {r.bmi > 0 ? r.bmi.toFixed(1) : '-'}
                    </td>
                    <td className="py-3.5 px-3 hidden md:table-cell whitespace-nowrap">
                      {r.visceralFat > 0 ? r.visceralFat : '-'}
                    </td>
                    <td className="py-3.5 px-3 hidden md:table-cell whitespace-nowrap">
                      {r.bodyAge > 0 ? `${r.bodyAge} 歲` : '-'}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onOpenDetailModal(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-slate-700 transition-colors"
                          title="檢視部位細節"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenEditModal(r)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                          title="編輯"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.date)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-xs text-gray-500 dark:text-slate-400">
            <span>
              顯示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sorted.length)} 筆 (共 {sorted.length} 筆)
            </span>
            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>{currentPage} / {totalPages} 頁</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
