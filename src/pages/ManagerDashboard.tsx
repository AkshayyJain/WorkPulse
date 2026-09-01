import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ManagerEmployeeSummary, WeeklyReport, WorkUpdate } from '../types';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { AISummaryCard } from '../components/AISummaryCard';
import { QuestionManagerModal } from '../components/QuestionManagerModal';
import { formatDisplayDate, formatWeekRange, formatDateTime } from '../utils/dateUtils';
import { exportWeeklyReportPDF } from '../utils/pdfExport';
import {
  Users,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Eye,
  FileDown,
  Settings,
  RefreshCw,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export function ManagerDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<ManagerEmployeeSummary[]>([]);
  const [reportingWeek, setReportingWeek] = useState<{ weekStart: string; weekEnd: string }>({
    weekStart: '',
    weekEnd: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUBMITTED' | 'DRAFT' | 'NOT_STARTED'>('ALL');

  // Selected Report Modal Inspection
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [reportDetail, setReportDetail] = useState<WeeklyReport | null>(null);
  const [workUpdatesDetail, setWorkUpdatesDetail] = useState<WorkUpdate[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Question manager modal
  const [questionModalOpen, setQuestionModalOpen] = useState(false);

  const fetchManagerData = async () => {
    try {
      setIsLoading(true);
      const res = await api.getManagerEmployees();
      setEmployees(res.employees);
      setReportingWeek(res.reportingWeek);
    } catch (err: any) {
      alert(`Failed to load manager dashboard: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleOpenReportDetail = async (reportId?: string, employeeId?: string) => {
    if (!reportId) {
      alert('This employee has not yet created or submitted a report for this week.');
      return;
    }

    try {
      setSelectedReportId(reportId);
      setIsLoadingDetail(true);
      setDetailError(null);
      const res = await api.getManagerReportById(reportId);
      setReportDetail(res.report);
      setWorkUpdatesDetail(res.workUpdates || []);
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load submitted report.');
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseReportDetail = () => {
    setSelectedReportId(null);
    setReportDetail(null);
    setWorkUpdatesDetail([]);
    setDetailError(null);
  };

  const handleRetryAIForReport = async () => {
    if (!reportDetail) return;
    try {
      const res = await api.retryAISummary(reportDetail.id);
      setReportDetail(res.report);
      setWorkUpdatesDetail(res.workUpdates || []);
      // also refresh overview
      await fetchManagerData();
    } catch (err: any) {
      alert(`Failed to regenerate AI summary: ${err.message}`);
    }
  };

  // Metrics calculations
  const totalAssigned = employees.length;
  const submittedCount = employees.filter(e => e.currentWeek.status === 'SUBMITTED').length;
  const draftCount = employees.filter(e => e.currentWeek.status === 'DRAFT').length;
  const notStartedCount = employees.filter(e => e.currentWeek.status === 'NOT_STARTED').length;
  const totalTeamHours = employees.reduce((sum, e) => sum + e.currentWeek.totalHoursLogged, 0);

  // Filtered employees
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    return emp.currentWeek.status === statusFilter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs text-slate-500">Loading your team dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div
        id="manager-dashboard-header"
        className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manager Executive Dashboard
            </h1>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800">
              {user?.title || 'Manager'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Assigned Team Reports • Active Cycle:{' '}
            <strong className="text-slate-700 dark:text-slate-300">
              {formatWeekRange(reportingWeek.weekStart, reportingWeek.weekEnd)}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="btn-open-question-config"
            onClick={() => setQuestionModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Settings className="w-4 h-4 text-indigo-500" />
            <span>Manage Questions</span>
          </button>

          <button
            onClick={fetchManagerData}
            title="Refresh Team Status"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metrics Bar - Geometric Balance Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/80">
              Team Roster
            </span>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Assigned Reports
          </h3>
          <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">
            {totalAssigned}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80">
              {totalAssigned > 0 ? `${Math.round((submittedCount / totalAssigned) * 100)}%` : '0%'}
            </span>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Submitted Reports
          </h3>
          <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">
            {submittedCount} <span className="text-sm font-semibold text-slate-400">/ {totalAssigned}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80">
              In Flight
            </span>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Drafts In Progress
          </h3>
          <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white">
            {draftCount}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/80">
              Total Logged
            </span>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            Team Hours
          </h3>
          <p className="text-3xl font-bold mt-1 text-slate-900 dark:text-white font-mono">
            {totalTeamHours.toFixed(1)} <span className="text-sm font-normal text-slate-400 font-sans">hrs</span>
          </p>
        </div>
      </div>

      {/* Team Roster & Submissions Section */}
      <div
        id="section-assigned-team-roster"
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
      >
        {/* Controls header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Assigned Direct Reports
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Strict RBAC: Only reports belonging to employees assigned to your management line are visible.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Pill Input */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search employee..."
                className="bg-transparent outline-none text-xs w-full text-slate-900 dark:text-white"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({totalAssigned})
              </button>
              <button
                onClick={() => setStatusFilter('SUBMITTED')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  statusFilter === 'SUBMITTED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Submitted ({submittedCount})
              </button>
              <button
                onClick={() => setStatusFilter('DRAFT')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  statusFilter === 'DRAFT'
                    ? 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Draft ({draftCount})
              </button>
            </div>
          </div>
        </div>

        {/* Employee List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-4 py-4">Weekly Status</th>
                <th className="px-4 py-4">Daily Logs</th>
                <th className="px-4 py-4">Total Effort</th>
                <th className="px-4 py-4">Submission Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500">
                    No assigned reports found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr
                    key={emp.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-white dark:border-slate-800 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{emp.name}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{emp.title} • {emp.department}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        status={emp.currentWeek.status}
                        aiStatus={emp.currentWeek.aiStatus}
                        size="sm"
                      />
                    </td>

                    <td className="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium text-xs">
                      {emp.currentWeek.workUpdateCount} entries
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-slate-900 dark:text-white text-xs">
                      {emp.currentWeek.totalHoursLogged.toFixed(1)} hrs
                    </td>

                    <td className="px-4 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {emp.currentWeek.submittedAt
                        ? formatDisplayDate(emp.currentWeek.submittedAt)
                        : emp.currentWeek.status === 'DRAFT'
                        ? 'Draft in progress'
                        : 'Not submitted'}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {emp.currentWeek.reportId ? (
                        <button
                          id={`btn-view-report-${emp.id}`}
                          onClick={() => handleOpenReportDetail(emp.currentWeek.reportId, emp.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-bold transition-all cursor-pointer border border-indigo-200/60 dark:border-indigo-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Report</span>
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No report yet</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Report Inspection Modal */}
      {selectedReportId && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="modal-manager-report-detail"
            className="w-full max-w-4xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900 flex items-center justify-center font-bold">
                  {reportDetail?.employeeName.charAt(0) || 'E'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{reportDetail?.employeeName}</span>
                    <StatusBadge
                      status={reportDetail?.status}
                      aiStatus={reportDetail?.aiStatus}
                      size="sm"
                    />
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cycle: {formatWeekRange(reportDetail?.weekStart, reportDetail?.weekEnd)} • Submitted on{' '}
                    {reportDetail?.submittedAt ? formatDateTime(reportDetail.submittedAt) : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {reportDetail && (
                  <button
                    onClick={() => exportWeeklyReportPDF(reportDetail, workUpdatesDetail)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                  >
                    <FileDown className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Download PDF</span>
                  </button>
                )}
                <button
                  onClick={handleCloseReportDetail}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {isLoadingDetail ? (
                <div className="py-16 text-center text-xs text-slate-500">Loading full report...</div>
              ) : detailError ? (
                <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 text-xs">
                  {detailError}
                </div>
              ) : reportDetail ? (
                <>
                  {/* AI Summary Banner */}
                  <AISummaryCard
                    aiSummary={reportDetail.aiSummary}
                    aiStatus={reportDetail.aiStatus}
                    onRetryAI={handleRetryAIForReport}
                    employeeName={reportDetail.employeeName}
                    isManagerView
                  />

                  {/* Daily Work Updates List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>Logged Daily Activities ({workUpdatesDetail.length})</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 normal-case">
                        Total Effort: {workUpdatesDetail.reduce((s, u) => s + u.hoursSpent, 0)} hrs
                      </span>
                    </h4>

                    {workUpdatesDetail.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No daily updates recorded.</p>
                    ) : (
                      <div className="space-y-2">
                        {workUpdatesDetail.map(u => (
                          <div
                            key={u.id}
                            className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                {formatDisplayDate(u.workDate)}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium">
                                  {u.projectTag}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {u.hoursSpent}h
                                </span>
                              </div>
                            </div>
                            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {u.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 4 Weekly Question Responses */}
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Weekly Evaluation Responses
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Q1 */}
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          1. Main Accomplishments
                        </h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {reportDetail.answers.accomplishments || 'No response provided.'}
                        </p>
                      </div>

                      {/* Q2 */}
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          2. Work in Progress
                        </h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {reportDetail.answers.inProgress || 'No response provided.'}
                        </p>
                      </div>

                      {/* Q3 */}
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          3. Blockers & Challenges
                        </h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {reportDetail.answers.blockers || 'None reported.'}
                        </p>
                      </div>

                      {/* Q4 */}
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          4. Next Week Priorities
                        </h5>
                        <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {reportDetail.answers.nextWeekPriorities || 'No response provided.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end shrink-0">
              <button
                onClick={handleCloseReportDetail}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Question Manager Modal (Bonus 4) */}
      <QuestionManagerModal
        isOpen={questionModalOpen}
        onClose={() => setQuestionModalOpen(false)}
      />
    </div>
  );
}
