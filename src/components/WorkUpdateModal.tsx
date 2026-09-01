import React, { useState, useEffect } from 'react';
import { WorkUpdate } from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { X, Clock, Calendar, Tag, FileText, Check } from 'lucide-react';

interface WorkUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    workDate: string;
    description: string;
    hoursSpent: number;
    projectTag: string;
  }) => Promise<void>;
  initialData?: WorkUpdate | null;
}

const COMMON_TAGS = [
  'Feature Development',
  'Bug Fixing',
  'Code Review',
  'Architecture & Design',
  'Testing & QA',
  'DevOps & Deploy',
  'Team Collaboration',
  'Documentation',
];

export function WorkUpdateModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: WorkUpdateModalProps) {
  const [workDate, setWorkDate] = useState(getTodayDateString());
  const [hoursSpent, setHoursSpent] = useState<number>(4);
  const [projectTag, setProjectTag] = useState<string>('Feature Development');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setWorkDate(initialData.workDate);
      setHoursSpent(initialData.hoursSpent || 4);
      setProjectTag(initialData.projectTag || 'Feature Development');
      setDescription(initialData.description || '');
    } else {
      setWorkDate(getTodayDateString());
      setHoursSpent(4);
      setProjectTag('Feature Development');
      setDescription('');
    }
    setError(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description of the work accomplished.');
      return;
    }
    if (hoursSpent <= 0 || hoursSpent > 24) {
      setError('Hours spent must be between 0.5 and 24 hours.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        workDate,
        hoursSpent: Number(hoursSpent),
        projectTag,
        description: description.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save daily work update.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div
        id="modal-work-update"
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/20">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {initialData ? 'Edit Daily Work Update' : 'Log Daily Work Update'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record your daily activity, effort hours, and deliverables.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 dark:bg-rose-950/50 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Work Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Work Date <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="input-work-date"
                  value={workDate}
                  onChange={e => setWorkDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Effort Hours */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between uppercase tracking-wider">
                <span>Effort (Hours)</span>
                <span className="text-[11px] text-slate-400 font-normal lowercase">{hoursSpent} hrs</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="input-hours-spent"
                  value={hoursSpent}
                  onChange={e => setHoursSpent(parseFloat(e.target.value) || 0)}
                  min="0.5"
                  max="24"
                  step="0.5"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Project Tag */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Category / Project Tag
            </label>
            <input
              type="text"
              id="input-project-tag"
              value={projectTag}
              onChange={e => setProjectTag(e.target.value)}
              placeholder="e.g. Feature Development, Bugfix..."
              list="common-tags"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
            <datalist id="common-tags">
              {COMMON_TAGS.map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          {/* Work Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Work Summary & Details <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {description.length} characters
              </span>
            </div>
            <textarea
              id="input-work-description"
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              placeholder="Describe the tasks, features, PRs, or outcomes completed on this day..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-save-work-update"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Add Update'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
