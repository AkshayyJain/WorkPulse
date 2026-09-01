import React, { useState } from 'react';
import { BookOpen, Shield, Sparkles, Terminal, Database, Key, CheckCircle2, Code } from 'lucide-react';

export function DocsViewer() {
  const [activeSection, setActiveSection] = useState<'overview' | 'api' | 'security' | 'ai'>('overview');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <span>Platform Operations & API Documentation</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Architecture overview, REST endpoints, RBAC matrix, and Gemini AI integration specs.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-xs font-bold">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'overview'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Architecture
          </button>
          <button
            onClick={() => setActiveSection('api')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'api'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            REST Endpoints
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'security'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Security & RBAC
          </button>
          <button
            onClick={() => setActiveSection('ai')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
              activeSection === 'ai'
                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Gemini AI Specs
          </button>
        </div>
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Daily Work Logging
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Employees record daily tasks, hours spent, and project categories throughout the reporting period. All entries are validated and aggregated in real-time.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                4-Question Weekly Reflection
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Employees reflect on Accomplishments, In Progress tasks, Blockers, and Next Week Priorities. Auto-saving and draft state persistence prevent data loss.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Executive AI Synthesis
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Upon submission, the server executes a structured prompt with the Google GenAI SDK (`gemini-3.7-flash`), synthesizing a high-impact executive brief for managers.
              </p>
            </div>
          </div>

          {/* Seed Data Accounts Box */}
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Key className="w-5 h-5 text-amber-500" />
              <span>Pre-Configured Seed Users</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-3.5">Role</th>
                    <th className="py-3 px-3.5">Name</th>
                    <th className="py-3 px-3.5">Email</th>
                    <th className="py-3 px-3.5">Password</th>
                    <th className="py-3 px-3.5">Assignment Context</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="py-3 px-3.5 font-bold text-purple-600">MANAGER</td>
                    <td className="py-3 px-3.5 text-slate-900 dark:text-white font-semibold">Sarah Connor</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">manager1@example.com</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">Manager@123</td>
                    <td className="py-3 px-3.5 text-slate-500">Manages Alex, Maya, Liam</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3.5 font-bold text-purple-600">MANAGER</td>
                    <td className="py-3 px-3.5 text-slate-900 dark:text-white font-semibold">David Miller</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">manager2@example.com</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">Manager@123</td>
                    <td className="py-3 px-3.5 text-slate-500">Manages Jordan, Chloe</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3.5 font-bold text-blue-600">EMPLOYEE</td>
                    <td className="py-3 px-3.5 text-slate-900 dark:text-white font-semibold">Alex Rivera</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">employee1@example.com</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">Employee@123</td>
                    <td className="py-3 px-3.5 text-slate-500">Reports to Sarah Connor</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3.5 font-bold text-blue-600">EMPLOYEE</td>
                    <td className="py-3 px-3.5 text-slate-900 dark:text-white font-semibold">Maya Chen</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">employee2@example.com</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">Employee@123</td>
                    <td className="py-3 px-3.5 text-slate-500">Reports to Sarah Connor (Submitted)</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3.5 font-bold text-blue-600">EMPLOYEE</td>
                    <td className="py-3 px-3.5 text-slate-900 dark:text-white font-semibold">Jordan Taylor</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">employee4@example.com</td>
                    <td className="py-3 px-3.5 font-mono text-slate-700 dark:text-slate-300">Employee@123</td>
                    <td className="py-3 px-3.5 text-slate-500">Reports to David Miller</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REST Endpoints Section */}
      {activeSection === 'api' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-indigo-500" />
              <span>Full-Stack REST API Inventory</span>
            </h3>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-600 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 mr-2.5">POST</span>
                  <span className="text-slate-900 dark:text-white">/api/auth/login</span>
                </div>
                <span className="text-slate-500 font-sans">Authenticate & obtain JWT bearer token</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 mr-2.5">GET</span>
                  <span className="text-slate-900 dark:text-white">/api/work-updates</span>
                </div>
                <span className="text-slate-500 font-sans">Fetch employee daily logs for cycle</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-blue-600 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950 mr-2.5">POST</span>
                  <span className="text-slate-900 dark:text-white">/api/work-updates</span>
                </div>
                <span className="text-slate-500 font-sans">Create daily log (date, hours, tag, description)</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 mr-2.5">GET</span>
                  <span className="text-slate-900 dark:text-white">/api/reports/current</span>
                </div>
                <span className="text-slate-500 font-sans">Fetch or initialize active weekly report draft</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-amber-600 px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 mr-2.5">PUT</span>
                  <span className="text-slate-900 dark:text-white">/api/reports/draft</span>
                </div>
                <span className="text-slate-500 font-sans">Save incremental weekly draft answers</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-purple-600 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950 mr-2.5">POST</span>
                  <span className="text-slate-900 dark:text-white">/api/reports/:id/submit</span>
                </div>
                <span className="text-slate-500 font-sans">Submit report, lock changes, trigger Gemini AI</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 mr-2.5">GET</span>
                  <span className="text-slate-900 dark:text-white">/api/manager/employees</span>
                </div>
                <span className="text-slate-500 font-sans">Manager-only: List assigned direct reports & statuses</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-600 px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 mr-2.5">GET</span>
                  <span className="text-slate-900 dark:text-white">/api/manager/reports/:id</span>
                </div>
                <span className="text-slate-500 font-sans">Manager-only: Inspect direct report detail & AI summary</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security & RBAC */}
      {activeSection === 'security' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-150">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span>Role-Based Access Control (RBAC) Architecture</span>
          </h3>

          <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">1. Server-Side JWT Verification</h4>
              <p className="leading-relaxed">All sensitive `/api/*` endpoints (except login and public questions) mandate standard `Authorization: Bearer &lt;JWT&gt;` verification headers.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">2. Direct Management Hierarchy Enforcement</h4>
              <p className="leading-relaxed">Managers can <strong>only</strong> view reports from employees whose `managerId` matches their user ID. Attempting to view unassigned employees returns HTTP 403 Forbidden.</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">3. Submission Immutability</h4>
              <p className="leading-relaxed">Once a weekly report transitions into `SUBMITTED` status, further modifications or daily log deletions are rejected server-side to preserve audit trail integrity.</p>
            </div>
          </div>
        </div>
      )}

      {/* AI Specs */}
      {activeSection === 'ai' && (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5 animate-in fade-in duration-150">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <span>Server-Side Gemini AI Synthesis</span>
          </h3>

          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              The system uses the modern <code className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md font-semibold text-slate-900 dark:text-slate-100">@google/genai</code> TypeScript SDK with the model <code className="font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-md font-semibold">gemini-3.7-flash</code>.
            </p>
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 uppercase tracking-wider text-[11px]">Structured JSON Output Schema:</h4>
              <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 overflow-x-auto leading-relaxed">
{`{
  "executiveSummary": "Concise 2-3 sentence overview...",
  "keyAccomplishments": ["Accomplishment 1", "Accomplishment 2"],
  "currentWork": ["Work item 1", "Work item 2"],
  "blockers": ["Blocker item or None"],
  "nextWeekPriorities": ["Priority item 1", "Priority item 2"]
}`}
              </pre>
            </div>
            <p className="leading-relaxed">
              All API keys remain strictly server-side in `server/ai.ts`. If the API key is not configured or an outage occurs, a deterministic fallback synthesis engine produces an executive summary so the application is always 100% operational.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
