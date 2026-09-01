import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { EmployeeDashboard } from './pages/EmployeeDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { ReportHistoryPage } from './pages/ReportHistoryPage';
import { DocsViewer } from './pages/DocsViewer';

function MainApp() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'history' | 'docs'>('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Initializing WorkPulse...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onRefreshData={() => setRefreshKey(k => k + 1)}
      />

      <main key={refreshKey} className="flex-1 pb-16">
        {currentTab === 'dashboard' && (
          user.role === 'MANAGER' ? <ManagerDashboard /> : <EmployeeDashboard />
        )}

        {currentTab === 'history' && <ReportHistoryPage />}

        {currentTab === 'docs' && <DocsViewer />}
      </main>

      <footer className="py-4 border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-center text-xs text-slate-500 dark:text-slate-400">
        WorkPulse • Employee Work & Weekly Reporting System with Gemini AI Synthesis
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
