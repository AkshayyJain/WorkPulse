import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { WeeklyReport, WorkUpdate, WeeklyReportAnswers } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { WorkUpdatesList } from '../components/WorkUpdatesList';
import { WorkUpdateModal } from '../components/WorkUpdateModal';
import { WeeklyQuestionsForm } from '../components/WeeklyQuestionsForm';
import { AISummaryCard } from '../components/AISummaryCard';
import { SubmissionReminderBanner } from '../components/SubmissionReminderBanner';
import { formatWeekRange, formatDisplayDate } from '../utils/dateUtils';
import { exportWeeklyReportPDF } from '../utils/pdfExport';
import {
  FileDown,
  Mail,
  CheckCircle2,
  Calendar,
  Lock,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [workUpdates, setWorkUpdates] = useState<WorkUpdate[]>([]);
  const [answers, setAnswers] = useState<WeeklyReportAnswers>({
    accomplishments: '',
    inProgress: '',
    blockers: '',
    nextWeekPriorities: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<WorkUpdate | null>(null);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchCurrentReport = async () => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      const res = await api.getCurrentReport();
      setReport(res.report);
      setWorkUpdates(res.workUpdates || []);
      setAnswers(
        res.report.answers || {
          accomplishments: '',
          inProgress: '',
          blockers: '',
          nextWeekPriorities: '',
        }
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load weekly report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentReport();
  }, []);

  const handleSaveDraft = async () => {
    if (!report) return;
    try {
      setIsSaving(true);
      const res = await api.saveDraft({
        reportId: report.id,
        weekStart: report.weekStart,
        weekEnd: report.weekEnd,
        answers,
      });
      setReport(res.report);
    } catch (err: any) {
      alert(`Error saving draft: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!report) return;
    try {
      setIsSubmitting(true);
      const res = await api.submitReport(report.id, answers);
      setReport(res.report);
      setWorkUpdates(res.workUpdates);

      // Trigger Manager notification toast (Bonus 3)
      setNotificationToast(`Weekly report submitted! Notification will be sent to your assigned manager ${user?.managerName || 'Sarah Connor'}.`);
      setTimeout(() => setNotificationToast(null), 6000);
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryAI = async () => {
    if (!report) return;
    try {
      const res = await api.retryAISummary(report.id);
      setReport(res.report);
      setWorkUpdates(res.workUpdates);
    } catch (err: any) {
      alert(`AI Retry failed: ${err.message}`);
    }
  };

  const handleSaveWorkUpdate = async (data: {
    workDate: string;
    description: string;
    hoursSpent: number;
    projectTag: string;
  }) => {
    if (selectedUpdate) {
      await api.updateWorkUpdate(selectedUpdate.id, data);
    } else {
      await api.createWorkUpdate(data);
    }
    // Refresh updates
    const res = await api.getCurrentReport();
    setWorkUpdates(res.workUpdates || []);
  };

  const handleDeleteWorkUpdate = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this daily work log?')) {
      try {
        await api.deleteWorkUpdate(id);
        const res = await api.getCurrentReport();
        setWorkUpdates(res.workUpdates || []);
      } catch (err: any) {
        alert(err.message || 'Failed to delete work update.');
      }
    }
  };

  const isReadOnly = report?.status === 'SUBMITTED';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Loading your weekly workspace...</p>
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between">
          <span>{errorMsg}</span>
          <button
            onClick={fetchCurrentReport}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Notification Toast for Manager alert */}
      {notificationToast && (
        <div
          id="toast-manager-notification"
          className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
            <Mail className="w-4 h-4 text-indigo-200 shrink-0" />
            <span>{notificationToast}</span>
          </div>
          <button
            onClick={() => setNotificationToast(null)}
            className="text-xs text-indigo-200 hover:text-white underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Dashboard Top Header Banner */}
      <div
        id="dashboard-header-card"
        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Weekly Work Report
            </h1>
            <StatusBadge status={report?.status} aiStatus={report?.aiStatus} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
            <span>Reporting Cycle: <strong>{formatWeekRange(report?.weekStart, report?.weekEnd)}</strong></span>
            <span>•</span>
            <span>Assigned Manager: <strong>{user?.managerName || 'Sarah Connor'}</strong></span>
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2.5">
          {report?.status === 'SUBMITTED' && (
            <button
              id="btn-download-pdf"
              onClick={() => report && exportWeeklyReportPDF(report, workUpdates)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-indigo-500" />
              <span>Download PDF</span>
            </button>
          )}

          <button
            onClick={fetchCurrentReport}
            title="Refresh Report"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Reminder Banner (Bonus feature 5) */}
      <SubmissionReminderBanner
        status={report?.status || 'NOT_STARTED'}
        employeeName={user?.name || 'Employee'}
      />

      {/* AI Summary Card (If submitted and completed or failed) */}
      {report?.status === 'SUBMITTED' && (
        <AISummaryCard
          aiSummary={report.aiSummary}
          aiStatus={report.aiStatus}
          onRetryAI={handleRetryAI}
          employeeName={user?.name}
        />
      )}

      {/* Daily Work Updates Section */}
      <WorkUpdatesList
        workUpdates={workUpdates}
        isReadOnly={isReadOnly}
        onAddUpdate={() => {
          setSelectedUpdate(null);
          setModalOpen(true);
        }}
        onEditUpdate={u => {
          setSelectedUpdate(u);
          setModalOpen(true);
        }}
        onDeleteUpdate={handleDeleteWorkUpdate}
      />

      {/* Four Weekly Questions Form */}
      <WeeklyQuestionsForm
        answers={answers}
        onChangeAnswers={setAnswers}
        onSaveDraft={handleSaveDraft}
        onSubmitReport={handleSubmitReport}
        isReadOnly={isReadOnly}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
      />

      {/* Add / Edit Daily Update Modal */}
      <WorkUpdateModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUpdate(null);
        }}
        onSave={handleSaveWorkUpdate}
        initialData={selectedUpdate}
      />
    </div>
  );
}
