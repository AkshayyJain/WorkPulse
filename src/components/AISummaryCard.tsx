import React, { useState } from 'react';
import { AISummaryData, AIStatus } from '../types';
import { formatDateTime } from '../utils/dateUtils';
import {
  Sparkles,
  CheckCircle,
  Clock,
  AlertTriangle,
  RotateCw,
  Target,
  FileCheck,
  BrainCircuit,
  Layers,
} from 'lucide-react';

interface AISummaryCardProps {
  aiSummary?: AISummaryData;
  aiStatus: AIStatus;
  onRetryAI?: () => Promise<void>;
  employeeName?: string;
  isManagerView?: boolean;
}

export function AISummaryCard({
  aiSummary,
  aiStatus,
  onRetryAI,
  employeeName,
  isManagerView = false,
}: AISummaryCardProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetryAI) return;
    try {
      setIsRetrying(true);
      await onRetryAI();
    } finally {
      setIsRetrying(false);
    }
  };

  if (aiStatus === 'NOT_STARTED' && !aiSummary) {
    return null;
  }

  if (aiStatus === 'PROCESSING') {
    return (
      <div
        id="card-ai-processing"
        className="p-6 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 shadow-xs flex items-center justify-center gap-4 text-center"
      >
        <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center animate-spin">
          <BrainCircuit className="w-5 h-5" />
        </div>
        <div className="text-left">
          <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-200">
            Gemini AI is analyzing weekly report...
          </h4>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            Extracting core achievements, deliverables, and roadblocks for executive synthesis.
          </p>
        </div>
      </div>
    );
  }

  if (aiStatus === 'FAILED' && !aiSummary) {
    return (
      <div
        id="card-ai-failed"
        className="p-6 rounded-2xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              AI Summary Temporarily Unavailable
            </h4>
            <p className="text-xs text-rose-600 dark:text-rose-400">
              The report was submitted successfully, but the automated AI synthesis encountered a timeout or configuration issue.
            </p>
          </div>
        </div>

        {onRetryAI && (
          <button
            id="btn-retry-ai-summary"
            onClick={handleRetry}
            disabled={isRetrying}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Regenerating...' : 'Retry Summary'}</span>
          </button>
        )}
      </div>
    );
  }

  if (!aiSummary) return null;

  return (
    <div
      id="card-ai-summary-complete"
      className="rounded-3xl border border-indigo-200 dark:border-indigo-900/70 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 shadow-sm overflow-hidden transition-colors"
    >
      {/* Header Banner */}
      <div className="px-6 py-5 border-b border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-indigo-50/60 dark:bg-indigo-950/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-950/50">
            <div className="w-3.5 h-3.5 border-2 border-white rotate-45"></div>
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Executive AI Summary</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                {aiSummary.model || 'gemini-3.7-flash'}
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synthesized by Gemini AI from daily work entries & weekly evaluation responses.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-[11px] font-medium">Generated: {formatDateTime(aiSummary.generatedAt)}</span>
          {onRetryAI && (
            <button
              id="btn-re-generate-ai"
              onClick={handleRetry}
              disabled={isRetrying}
              title="Regenerate AI Summary"
              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin text-indigo-600' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-6 space-y-5">
        {/* Executive Overview */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" />
            <span>Executive Synthesis Brief</span>
          </h4>
          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
            {aiSummary.executiveSummary}
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Accomplishments */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h5 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
              <div className="p-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-md">
                <CheckCircle className="w-3.5 h-3.5" />
              </div>
              <span>Key Accomplishments</span>
            </h5>
            <ul className="space-y-2">
              {aiSummary.keyAccomplishments.map((item, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Current In Progress */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h5 className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
              <div className="p-1 bg-indigo-50 dark:bg-indigo-950/60 rounded-md">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span>Current Work in Progress</span>
            </h5>
            <ul className="space-y-2">
              {aiSummary.currentWork.map((item, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-indigo-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Blockers & Challenges */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h5 className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
              <div className="p-1 bg-amber-50 dark:bg-amber-950/60 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span>Blockers & Challenges</span>
            </h5>
            <ul className="space-y-2">
              {aiSummary.blockers.map((item, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-amber-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Next Week Priorities */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h5 className="text-xs font-bold text-purple-700 dark:text-purple-400 mb-3 flex items-center gap-2">
              <div className="p-1 bg-purple-50 dark:bg-purple-950/60 rounded-md">
                <Target className="w-3.5 h-3.5" />
              </div>
              <span>Next Week Priorities</span>
            </h5>
            <ul className="space-y-2">
              {aiSummary.nextWeekPriorities.map((item, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2">
                  <span className="text-purple-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
