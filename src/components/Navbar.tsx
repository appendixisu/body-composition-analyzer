import React from 'react';
import { Activity, BarChart3, Calendar, Database, Layers, Moon, Sun, PlusCircle } from 'lucide-react';

export type TabType = 'dashboard' | 'charts' | 'segmental' | 'history' | 'data';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenAddModal: () => void;
  recordCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenAddModal,
  recordCount,
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: '儀表總覽', icon: <Activity className="w-5 h-5" /> },
    { id: 'charts', label: '趨勢分析', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'segmental', label: '部位細分', icon: <Layers className="w-5 h-5" /> },
    { id: 'history', label: '歷史紀錄', icon: <Calendar className="w-5 h-5" /> },
    { id: 'data', label: '檔案管理', icon: <Database className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo */}
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
              <img
                src="/logo.svg"
                alt="Body Composition Analyzer Logo"
                className="w-10 h-10 rounded-xl shadow-md shadow-brand-500/20 hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                  體組成數據分析
                </h1>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Body Composition & Health Analytics
                </p>
              </div>
            </div>

            {/* Desktop Nav Pills */}
            <nav className="hidden md:flex space-x-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-all duration-150 ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.id === 'history' && recordCount > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300'}`}>
                        {recordCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Right Action Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onOpenAddModal}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-sm transition-colors"
                title="手動新增紀錄"
              >
                <PlusCircle className="w-4 h-4" />
                <span>新增紀錄</span>
              </button>

              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-slate-800 px-2 py-1 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-2 px-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400 font-semibold'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'
                }`}
              >
                <div className={`p-1 rounded-lg ${isActive ? 'bg-brand-50 dark:bg-brand-900/40' : ''}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] mt-0.5 leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
