import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Layers,
  Sun,
  Moon,
  LogOut,
  Shield,
  User as UserIcon,
  Calendar,
  BookOpen,
  RotateCcw,
  Menu,
  X,
  Sparkles,
  Database as DatabaseIcon,
} from 'lucide-react';
import { formatWeekRange, getReportingWeek } from '../utils/dateUtils';
import { api } from '../services/api';
import { DatabaseStatusModal } from './DatabaseStatusModal';

interface HeaderProps {
  currentTab: 'dashboard' | 'history' | 'docs';
  onSelectTab: (tab: 'dashboard' | 'history' | 'docs') => void;
  onRefreshData?: () => void;
}

export function Header({ currentTab, onSelectTab, onRefreshData }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbModalOpen, setDbModalOpen] = useState(false);
  const { weekStart, weekEnd } = getReportingWeek();

  const handleResetDemo = async () => {
    if (window.confirm('Reset all demo data (users, questions, reports) to default seed state?')) {
      try {
        setIsResetting(true);
        await api.resetDemo();
        alert('Demo database successfully reset to clean seed state.');
        if (onRefreshData) onRefreshData();
      } catch (err: any) {
        alert(`Failed to reset demo database: ${err.message}`);
      } finally {
        setIsResetting(false);
      }
    }
  };

  if (!user) return null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Left: Brand Logo & Title with Geometric Balance Icon */}
          <div className="flex items-center gap-6">
            <div
              id="brand-logo"
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => onSelectTab('dashboard')}
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950/40 transition-transform group-hover:scale-105">
                <div className="w-4 h-4 border-2 border-white rotate-45 transform transition-transform duration-300 group-hover:rotate-90"></div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                    WorkPulse
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                    AI MVP
                  </span>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-400 hidden sm:block font-medium">
                  Reporting & AI Synthesis
                </span>
              </div>
            </div>

            {/* Reporting Week Geometric Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Week: {formatWeekRange(weekStart, weekEnd)}</span>
            </div>
          </div>

          {/* Center: Navigation tabs with Geometric Pill Shape */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <button
              id="nav-tab-dashboard"
              onClick={() => onSelectTab('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {user.role === 'MANAGER' ? 'Team Dashboard' : 'Weekly Report'}
            </button>

            <button
              id="nav-tab-history"
              onClick={() => onSelectTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentTab === 'history'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {user.role === 'MANAGER' ? 'Team History' : 'Report History'}
            </button>

            <button
              id="nav-tab-docs"
              onClick={() => onSelectTab('docs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                currentTab === 'docs'
                  ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>API & Docs</span>
            </button>
          </nav>

          {/* Right Actions: Geometric Pill Theme Toggle, User info, Reset & Logout */}
          <div className="hidden md:flex items-center gap-4">
            {/* Geometric Pill Theme Toggle */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
              <button
                id="btn-theme-light"
                onClick={() => theme !== 'light' && toggleTheme()}
                title="Light Mode"
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  theme === 'light'
                    ? 'bg-white shadow-sm text-amber-500 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Light theme"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-theme-dark"
                onClick={() => theme !== 'dark' && toggleTheme()}
                title="Dark Mode"
                className={`w-7 h-7 flex items-center justify-center rounded-full transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 shadow-sm text-indigo-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
                aria-label="Dark theme"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Database Engine Status Button */}
            <button
              id="btn-db-status"
              onClick={() => setDbModalOpen(true)}
              title="Inspect Database & Collections Status"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors text-xs font-semibold"
            >
              <DatabaseIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>DB Engine</span>
            </button>

            {/* Reset Seed Data */}
            <button
              id="btn-reset-demo"
              onClick={handleResetDemo}
              disabled={isResetting}
              title="Reset Demo Data"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs"
            >
              <RotateCcw className={`w-4 h-4 ${isResetting ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* User Profile Pill */}
            <div
              id="user-profile-badge"
              className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white dark:border-slate-800 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                    {user.name}
                  </span>
                  <span
                    id="user-role-tag"
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      user.role === 'MANAGER'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                        : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                  {user.title}
                </p>
              </div>
            </div>

            {/* Logout */}
            <button
              id="btn-logout"
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>
            <button
              id="btn-mobile-menu"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-4 pt-2 pb-4 space-y-2 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{user.email} • {user.role}</p>
            </div>
          </div>

          <button
            onClick={() => {
              onSelectTab('dashboard');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'dashboard'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {user.role === 'MANAGER' ? 'Manager Dashboard' : 'Weekly Report'}
          </button>

          <button
            onClick={() => {
              onSelectTab('history');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium ${
              currentTab === 'history'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            {user.role === 'MANAGER' ? 'Team History' : 'Report History'}
          </button>

          <button
            onClick={() => {
              onSelectTab('docs');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
              currentTab === 'docs'
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>API & Ops Docs</span>
          </button>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <button
              onClick={handleResetDemo}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo DB</span>
            </button>

            <button
              onClick={logout}
              className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Database Diagnostics Modal */}
      <DatabaseStatusModal
        isOpen={dbModalOpen}
        onClose={() => setDbModalOpen(false)}
      />
    </header>
  );
}
