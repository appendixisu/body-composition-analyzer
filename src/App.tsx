import { useState, useEffect, useCallback } from 'react';
import { BodyRecord } from './types/bodyComposition';
import { getAllRecords } from './services/db';
import { Navbar, TabType, ThemeMode } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { Dashboard } from './components/Dashboard';
import { ChartsView } from './components/ChartsView';
import { SegmentalView } from './components/SegmentalView';
import { HistoryView } from './components/HistoryView';
import { ShareReportView } from './components/ShareReportView';
import { DataManagementView } from './components/DataManagementView';
import { RecordModal } from './components/RecordModal';
import { DetailModal } from './components/DetailModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface ToastNotification {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  formatName?: string;
  added?: number;
  updated?: number;
  total?: number;
}

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastNotification | null>(null);

  // Auto-dismiss toast notification after 7 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('app_theme_mode') as ThemeMode;
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
    return 'system';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_theme_mode') as ThemeMode;
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<BodyRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<BodyRecord | null>(null);

  // Listen to OS system color scheme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [themeMode]);

  // Update darkMode when themeMode changes
  useEffect(() => {
    if (themeMode === 'system') {
      setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else if (themeMode === 'dark') {
      setDarkMode(true);
    } else if (themeMode === 'light') {
      setDarkMode(false);
    }
    localStorage.setItem('app_theme_mode', themeMode);
  }, [themeMode]);

  // Sync dark mode class with <html> element and update <meta name="theme-color">
  useEffect(() => {
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }

    if (darkMode) {
      document.documentElement.classList.add('dark');
      themeMeta.setAttribute('content', '#0f172a'); // Slate 900 for dark mode
    } else {
      document.documentElement.classList.remove('dark');
      themeMeta.setAttribute('content', '#ffffff'); // Clean white for light mode
    }
  }, [darkMode]);

  // Load records from IndexedDB (only show full page loader on initial mount)
  const fetchRecords = useCallback(async (isInitial: boolean = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const data = await getAllRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load IndexedDB records:', err);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchRecords(true);
  }, [fetchRecords]);

  const handleOpenAddModal = () => {
    setRecordToEdit(null);
    setIsRecordModalOpen(true);
  };

  const handleOpenEditModal = (rec: BodyRecord) => {
    setRecordToEdit(rec);
    setIsRecordModalOpen(true);
  };

  const handleOpenDetailModal = (rec: BodyRecord) => {
    setDetailRecord(rec);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200 relative">
      
      {/* Global Floating Toast Notification (Always Visible on Screen) */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-start justify-between space-x-3 transition-all duration-300 transform animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'success'
              ? 'bg-emerald-600/95 text-white border-emerald-400 shadow-emerald-950/30'
              : toast.type === 'error'
              ? 'bg-rose-600/95 text-white border-rose-400 shadow-rose-950/30'
              : 'bg-brand-600/95 text-white border-brand-400 shadow-brand-950/30'
          }`}
        >
          <div className="flex items-start space-x-3">
            <div className="p-1.5 bg-white/20 rounded-xl flex-shrink-0 mt-0.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-white" />
              ) : (
                <AlertCircle className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h4 className="font-bold text-sm leading-tight">{toast.title}</h4>
              <p className="text-xs mt-1 text-white/95 leading-relaxed">{toast.message}</p>
              {toast.formatName && toast.type === 'success' && (
                <span className="inline-block mt-2 text-[11px] font-semibold bg-white/20 px-2.5 py-0.5 rounded-md">
                  格式：{toast.formatName}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors flex-shrink-0"
            title="關閉提示"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        onOpenAddModal={handleOpenAddModal}
        recordCount={records.length}
      />

      {/* Main Content Area */}
      <main
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:pb-12"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)' }}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24 text-brand-600 dark:text-brand-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-current mr-3"></div>
            <span className="text-sm font-medium">讀取本地端體組成資料中...</span>
          </div>
        ) : records.length === 0 ? (
          /* Empty State when no data in IndexedDB */
          <EmptyState
            onDataLoaded={fetchRecords}
            onOpenAddModal={handleOpenAddModal}
            onNotify={setToast}
          />
        ) : (
          /* Tab Views */
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                records={records}
                onNavigateTab={setActiveTab}
                onOpenAddModal={handleOpenAddModal}
              />
            )}

            {activeTab === 'charts' && (
              <ChartsView records={records} />
            )}

            {activeTab === 'segmental' && (
              <SegmentalView records={records} />
            )}

            {activeTab === 'history' && (
              <HistoryView
                records={records}
                onRefresh={fetchRecords}
                onOpenAddModal={handleOpenAddModal}
                onOpenEditModal={handleOpenEditModal}
                onOpenDetailModal={handleOpenDetailModal}
              />
            )}

            {activeTab === 'share' && (
              <ShareReportView
                records={records}
                onNotify={setToast}
              />
            )}

            {activeTab === 'data' && (
              <DataManagementView
                records={records}
                onRefresh={fetchRecords}
                themeMode={themeMode}
                setThemeMode={setThemeMode}
                onNotify={setToast}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <RecordModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        recordToEdit={recordToEdit}
        onSaved={fetchRecords}
      />

      <DetailModal
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        record={detailRecord}
      />

    </div>
  );
}

export default App;
