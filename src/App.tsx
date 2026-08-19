import { useState, useEffect, useCallback } from 'react';
import { BodyRecord } from './types/bodyComposition';
import { getAllRecords } from './services/db';
import { Navbar, TabType } from './components/Navbar';
import { EmptyState } from './components/EmptyState';
import { Dashboard } from './components/Dashboard';
import { ChartsView } from './components/ChartsView';
import { SegmentalView } from './components/SegmentalView';
import { HistoryView } from './components/HistoryView';
import { DataManagementView } from './components/DataManagementView';
import { RecordModal } from './components/RecordModal';
import { DetailModal } from './components/DetailModal';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [records, setRecords] = useState<BodyRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<BodyRecord | null>(null);
  const [detailRecord, setDetailRecord] = useState<BodyRecord | null>(null);

  // Sync dark mode class with <html> element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load records from IndexedDB
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllRecords();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load IndexedDB records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenAddModal={handleOpenAddModal}
        recordCount={records.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-12">
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

            {activeTab === 'data' && (
              <DataManagementView
                records={records}
                onRefresh={fetchRecords}
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
