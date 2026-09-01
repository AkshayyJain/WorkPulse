import React, { useState } from 'react';
import { Clock, Bell, X, CheckCircle2 } from 'lucide-react';
import { formatDisplayDate, getReportingWeek } from '../utils/dateUtils';

interface SubmissionReminderBannerProps {
  status: 'DRAFT' | 'SUBMITTED' | 'NOT_STARTED';
  employeeName: string;
}

export function SubmissionReminderBanner({ status, employeeName }: SubmissionReminderBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const { weekEnd } = getReportingWeek();

  if (dismissed) return null;

  if (status === 'SUBMITTED') {
    return (
      <div
        id="banner-submission-status"
        className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between gap-3 text-xs text-emerald-800 dark:text-emerald-200 shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-xs">Weekly Report Submitted & Locked</span>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">
              Your weekly report has been submitted to your manager with automated AI executive synthesis.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="banner-weekly-reminder"
      className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50/90 to-blue-50/90 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between gap-4 text-xs text-indigo-900 dark:text-indigo-200 shadow-sm"
    >
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs shadow-indigo-500/20">
          <Bell className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-xs">Weekly Report Submission Cycle</span>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
            Reporting cycle closes on <strong>{formatDisplayDate(weekEnd)}</strong>. Please review your daily logs and submit the 4 weekly responses.
          </p>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 p-1.5 rounded-lg transition-colors cursor-pointer"
        title="Dismiss reminder"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
