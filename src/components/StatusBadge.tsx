import React from 'react';
import { ReportStatus, AIStatus } from '../types';
import { CheckCircle2, Clock, Sparkles, AlertCircle, FileText } from 'lucide-react';

interface StatusBadgeProps {
  status?: ReportStatus | 'NOT_STARTED';
  aiStatus?: AIStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, aiStatus, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  if (status === 'SUBMITTED') {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          id="badge-status-submitted"
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 ${sizeClasses}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Submitted</span>
        </span>

        {aiStatus === 'COMPLETED' && (
          <span
            id="badge-ai-completed"
            className={`inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 ${sizeClasses}`}
          >
            <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
            <span>AI Summarized</span>
          </span>
        )}

        {aiStatus === 'PROCESSING' && (
          <span
            id="badge-ai-processing"
            className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${sizeClasses}`}
          >
            <Clock className="w-3 h-3 animate-spin" />
            <span>AI Generating...</span>
          </span>
        )}

        {aiStatus === 'FAILED' && (
          <span
            id="badge-ai-failed"
            className={`inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 ${sizeClasses}`}
          >
            <AlertCircle className="w-3 h-3" />
            <span>AI Unavailable</span>
          </span>
        )}
      </div>
    );
  }

  if (status === 'DRAFT') {
    return (
      <span
        id="badge-status-draft"
        className={`inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800 ${sizeClasses}`}
      >
        <FileText className="w-3.5 h-3.5" />
        <span>Draft In Progress</span>
      </span>
    );
  }

  return (
    <span
      id="badge-status-not-started"
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 ${sizeClasses}`}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>Not Started</span>
    </span>
  );
}
