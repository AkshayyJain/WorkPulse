import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WeeklyReport, WorkUpdate } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { AISummaryCard } from '../components/AISummaryCard';
import { formatDisplayDate, formatWeekRange, formatDateTime } from '../utils/dateUtils';
import { exportWeeklyReportPDF } from '../utils/pdfExport';
import {
  FileText,
  Calendar,
  Eye,
  FileDown,
  X,
  Clock,
  CheckCircle2,
  ChevronRight,
  Layers,
} from 'lucide-react';

export function ReportHistoryPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      if (user?.role === 'MANAGER') {
        const res = await api.getManagerReports();
        setReports(res.reports || []);
      } else {
        const res = await api.getReportHistory();
        setReports(res.reports || []);
      }
    } catch (err: any) {
      alert(`Failed to load report history: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSelectReport = async (report: WeeklyReport) => {
    try {
      setSelectedReport(report);
      setIsLoadingDetails(true);
      if (user?.role === 'MANAGER') {
        const res = await api.getManagerReportById(report.id);
        setWorkUpdates(res.workUpdates || []);
      } else {
        const res = await api.getCurrentReport();
        setWorkUpdates(res.workUpdates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-500">Loading historical reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {user?.role === 'MANAGER' ? 'Team Report History' : 'My Weekly Report History'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Archive of all weekly reports submitted and drafts created.
          </p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No reports on record</h3>
          <p className="text-xs text-slate-500 mt-1">
            Weekly submissions will appear here once finalized.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Reports list */}
          <div className="md:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
              Available Records ({reports.length})
            </h3>
            <div className="space-y-2.5">
              {reports.map(r => {
                const isSelected = selectedReport?.id === r.id;
                return (
                  <div
                    key={r.id}
                    id={`report-item-${r.id}`}
                    onClick={() => handleSelectReport(r)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 dark:border-indigo-500 shadow-sm ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {r.employeeName}
                      </span>
                      <StatusBadge status={r.status} aiStatus={r.aiStatus} size="sm" />
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{formatWeekRange(r.weekStart, r.weekEnd)}</span>
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {r.submittedAt ? `Submitted ${formatDisplayDate(r.submittedAt)}` : 'Draft in progress'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Report Inspection Preview */}
          <div className="md:col-span-2">
            {selectedReport ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                      <span>{selectedReport.employeeName}</span>
                      <StatusBadge status={selectedReport.status} aiStatus={selectedReport.aiStatus} size="sm" />
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cycle: {formatWeekRange(selectedReport.weekStart, selectedReport.weekEnd)}
                    </p>
                  </div>

                  <button
                    onClick={() => exportWeeklyReportPDF(selectedReport, workUpdates)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <FileDown className="w-4 h-4 text-indigo-500" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {/* AI Summary */}
                {selectedReport.aiSummary && (
                  <AISummaryCard
                    aiSummary={selectedReport.aiSummary}
                    aiStatus={selectedReport.aiStatus}
                  />
                )}

                {/* Four questions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Evaluation Responses
                  </h4>

                  <div className="space-y-3">
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wider">
                        1. Main Accomplishments
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedReport.answers.accomplishments || 'No response'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wider">
                        2. Work in Progress
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedReport.answers.inProgress || 'No response'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wider">
                        3. Blockers & Challenges
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedReport.answers.blockers || 'None'}
                      </p>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-900 dark:text-white mb-1.5 uppercase tracking-wider">
                        4. Next Week Priorities
                      </p>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {selectedReport.answers.nextWeekPriorities || 'No response'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <p className="text-xs text-slate-500">
                  Select a report from the list on the left to inspect its details and AI synthesis.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
