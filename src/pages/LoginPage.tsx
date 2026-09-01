import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Layers,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
  Moon,
  Sun,
  Key,
} from 'lucide-react';

export function LoginPage() {
  const { login, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('employee1@example.com');
  const [password, setPassword] = useState('Employee@123');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    try {
      setError(null);
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const setDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between transition-colors">
      {/* Top Navbar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center text-white shadow-xs shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 dark:text-white">
              WorkPulse
            </span>
            <span className="ml-2 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Reporting MVP
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-slate-700" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>
      </header>

      {/* Main Login Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Card */}
          <div
            id="card-login"
            className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="text-center space-y-1.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Sign In to WorkPulse
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Employee Work & Weekly Reporting with Gemini AI Summaries
              </p>
            </div>

            {error && (
              <div
                id="login-error-alert"
                className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 dark:bg-rose-950/60 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2"
              >
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="input-login-email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    id="input-login-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white text-sm font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick-Fill Demo Personas */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Key className="w-3 h-3 text-indigo-500" />
                  <span>One-Click Demo Credentials:</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left">
                {/* Manager 1 */}
                <button
                  type="button"
                  id="btn-demo-manager1"
                  onClick={() => setDemoAccount('manager1@example.com', 'Manager@123')}
                  className="p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors text-left"
                >
                  <p className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                    Sarah (Manager 1)
                  </p>
                  <p className="text-[10px] text-purple-700 dark:text-purple-400">
                    Eng Director (3 reports)
                  </p>
                </button>

                {/* Manager 2 */}
                <button
                  type="button"
                  id="btn-demo-manager2"
                  onClick={() => setDemoAccount('manager2@example.com', 'Manager@123')}
                  className="p-2 rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors text-left"
                >
                  <p className="text-[11px] font-bold text-purple-900 dark:text-purple-200">
                    David (Manager 2)
                  </p>
                  <p className="text-[10px] text-purple-700 dark:text-purple-400">
                    Product VP (2 reports)
                  </p>
                </button>

                {/* Employee 1 */}
                <button
                  type="button"
                  id="btn-demo-emp1"
                  onClick={() => setDemoAccount('employee1@example.com', 'Employee@123')}
                  className="p-2 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors text-left"
                >
                  <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                    Alex (Employee 1)
                  </p>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400">
                    Frontend Eng (Mgr: Sarah)
                  </p>
                </button>

                {/* Employee 2 */}
                <button
                  type="button"
                  id="btn-demo-emp2"
                  onClick={() => setDemoAccount('employee2@example.com', 'Employee@123')}
                  className="p-2 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors text-left"
                >
                  <p className="text-[11px] font-bold text-blue-900 dark:text-blue-200">
                    Maya (Employee 2)
                  </p>
                  <p className="text-[10px] text-blue-700 dark:text-blue-400">
                    Backend Eng (Submitted)
                  </p>
                </button>
              </div>
            </div>
          </div>

          {/* Feature Badges */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <span>JWT & RBAC</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <Sparkles className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <span>Gemini AI Briefs</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4 text-blue-500 mx-auto mb-1" />
              <span>Manager Views</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
         © 2026 WorkPulse Weekly Reporting System
      </footer>
    </div>
  );
}
