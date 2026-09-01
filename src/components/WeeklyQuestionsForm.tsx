import React, { useState, useEffect } from 'react';
import { WeeklyReportAnswers, Question } from '../types';
import { Save, Send, AlertTriangle, CheckCircle2, Lock, HelpCircle } from 'lucide-react';

interface WeeklyQuestionsFormProps {
  answers: WeeklyReportAnswers;
  onChangeAnswers: (answers: WeeklyReportAnswers) => void;
  onSaveDraft: () => Promise<void>;
  onSubmitReport: () => Promise<void>;
  isReadOnly: boolean;
  isSaving: boolean;
  isSubmitting: boolean;
  customQuestions?: Question[];
}

export function WeeklyQuestionsForm({
  answers,
  onChangeAnswers,
  onSaveDraft,
  onSubmitReport,
  isReadOnly,
  isSaving,
  isSubmitting,
}: WeeklyQuestionsFormProps) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [draftSavedToast, setDraftSavedToast] = useState(false);

  const handleFieldChange = (field: keyof WeeklyReportAnswers, value: string) => {
    if (isReadOnly) return;
    onChangeAnswers({
      ...answers,
      [field]: value,
    });
    setValidationErrors([]);
  };

  const handleSaveDraftClick = async () => {
    await onSaveDraft();
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 3000);
  };

  const validateBeforeSubmit = (): boolean => {
    const errors: string[] = [];
    if (!answers.accomplishments || answers.accomplishments.trim().length === 0) {
      errors.push('Question 1 (Accomplishments) is required.');
    }
    if (!answers.inProgress || answers.inProgress.trim().length === 0) {
      errors.push('Question 2 (In Progress) is required.');
    }
    if (!answers.blockers || answers.blockers.trim().length === 0) {
      errors.push('Question 3 (Blockers & Challenges) is required.');
    }
    if (!answers.nextWeekPriorities || answers.nextWeekPriorities.trim().length === 0) {
      errors.push('Question 4 (Next Week Priorities) is required.');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleOpenSubmitConfirm = () => {
    if (validateBeforeSubmit()) {
      setShowConfirmModal(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    await onSubmitReport();
  };

  return (
    <div
      id="section-weekly-questions-form"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
    >
      {/* Card Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>Weekly Evaluation Responses</span>
            {isReadOnly && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                Read-Only
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Answer the four core weekly questions to provide clear, actionable context for your team.
          </p>
        </div>

        {/* Draft save toast */}
        {draftSavedToast && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 animate-pulse">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Draft saved!</span>
          </span>
        )}
      </div>

      {/* Validation alert if missing fields */}
      {validationErrors.length > 0 && (
        <div className="mx-6 mt-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 text-xs">
          <div className="font-bold flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Please complete all required questions before final submission:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Questions Textareas */}
      <div className="p-6 space-y-6">
        {/* Question 1 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              1. What were your main accomplishments this week? <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {answers.accomplishments?.length || 0} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Detail features shipped, bugs fixed, PRs merged, documentation created, or goals met.
          </p>
          <textarea
            id="question-accomplishments"
            rows={3}
            disabled={isReadOnly}
            value={answers.accomplishments || ''}
            onChange={e => handleFieldChange('accomplishments', e.target.value)}
            placeholder="e.g. Delivered user authentication flow, optimized database queries by 40%, completed sprint retro..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </div>

        {/* Question 2 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              2. What work is currently in progress? <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {answers.inProgress?.length || 0} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            List ongoing tasks, open branches, design reviews, or integrations in flight.
          </p>
          <textarea
            id="question-in-progress"
            rows={3}
            disabled={isReadOnly}
            value={answers.inProgress || ''}
            onChange={e => handleFieldChange('inProgress', e.target.value)}
            placeholder="e.g. Migrating to new state manager, researching vector search, testing mobile responsiveness..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </div>

        {/* Question 3 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              3. What blockers or challenges did you face? <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {answers.blockers?.length || 0} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Mention technical roadblocks, missing access/APIs, dependencies on other teams, or write "None".
          </p>
          <textarea
            id="question-blockers"
            rows={3}
            disabled={isReadOnly}
            value={answers.blockers || ''}
            onChange={e => handleFieldChange('blockers', e.target.value)}
            placeholder="e.g. Staging server downtime on Tuesday, waiting on security review for S3 bucket policy..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </div>

        {/* Question 4 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              4. What are your priorities for next week? <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] font-medium text-slate-400">
              {answers.nextWeekPriorities?.length || 0} chars
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Identify top focus areas, milestone deadlines, or upcoming deliverables.
          </p>
          <textarea
            id="question-next-priorities"
            rows={3}
            disabled={isReadOnly}
            value={answers.nextWeekPriorities || ''}
            onChange={e => handleFieldChange('nextWeekPriorities', e.target.value)}
            placeholder="e.g. Complete load testing with QA team, deploy v1.2 release to production, finalize API docs..."
            className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden disabled:bg-slate-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed resize-none transition-colors"
          />
        </div>
      </div>

      {/* Action Footer for DRAFT mode */}
      {!isReadOnly ? (
        <div className="px-6 py-5 bg-slate-50/80 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Drafts can be saved at any time. Once submitted, your report locks and generates an AI summary.
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Save Draft */}
            <button
              type="button"
              id="btn-save-draft"
              disabled={isSaving || isSubmitting}
              onClick={handleSaveDraftClick}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
            </button>

            {/* Submit Report */}
            <button
              type="button"
              id="btn-submit-report"
              disabled={isSaving || isSubmitting}
              onClick={handleOpenSubmitConfirm}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Report'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-5 bg-emerald-50/60 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-900/60 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            This weekly report has been submitted and is locked for editing. Your assigned manager can now review all responses and the AI synthesis.
          </span>
        </div>
      )}

      {/* Confirmation Modal Before Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="modal-submit-confirmation"
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-sm">
              <div className="w-5 h-5 border-2 border-indigo-600 dark:border-indigo-400 rotate-45"></div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Submit Weekly Report?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Are you ready to submit your weekly report? Upon submission, the report and all daily logs will become <strong className="text-slate-800 dark:text-slate-200">read-only</strong>, and Gemini AI will generate an executive summary for your manager.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>All 4 weekly evaluation responses ready</span>
              </div>
              <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Notification dispatched to assigned manager</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Back to Review
              </button>
              <button
                type="button"
                id="btn-confirm-final-submit"
                onClick={handleConfirmSubmit}
                className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
