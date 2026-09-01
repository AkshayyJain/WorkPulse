import React from 'react';
import { WorkUpdate } from '../types';
import { formatDisplayDate } from '../utils/dateUtils';
import { Plus, Edit2, Trash2, Clock, Calendar, Lock } from 'lucide-react';

interface WorkUpdatesListProps {
  workUpdates: WorkUpdate[];
  isReadOnly: boolean;
  onAddUpdate: () => void;
  onEditUpdate: (update: WorkUpdate) => void;
  onDeleteUpdate: (id: string) => void;
}

export function WorkUpdatesList({
  workUpdates,
  isReadOnly,
  onAddUpdate,
  onEditUpdate,
  onDeleteUpdate,
}: WorkUpdatesListProps) {
  const totalHours = workUpdates.reduce((sum, u) => sum + (u.hoursSpent || 0), 0);

  return (
    <div
      id="section-daily-work-updates"
      className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-900/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Daily Work Updates
            </h2>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {workUpdates.length} entries
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Log your daily accomplishments, project tags, and effort.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Total hours chip */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>Total Effort: {totalHours.toFixed(1)} hrs</span>
          </div>

          {/* Add update button */}
          {!isReadOnly ? (
            <button
              id="btn-add-work-update"
              onClick={onAddUpdate}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Day</span>
            </button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-medium border border-slate-200 dark:border-slate-700">
              <Lock className="w-3.5 h-3.5" />
              <span>Locked (Submitted)</span>
            </span>
          )}
        </div>
      </div>

      {/* Body / List */}
      <div className="p-6">
        {workUpdates.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center mb-3 shadow-xs">
              <div className="w-5 h-5 border-2 border-indigo-500 rotate-45"></div>
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
              No daily updates logged for this reporting period
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              Add your daily progress so your manager and the Gemini AI engine have complete context.
            </p>
            {!isReadOnly && (
              <button
                onClick={onAddUpdate}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Entry</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {workUpdates.map((update, idx) => (
              <div
                key={update.id}
                id={`work-update-item-${update.id}`}
                className="group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all hover:shadow-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      {formatDisplayDate(update.workDate)}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {update.projectTag}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {update.hoursSpent} hrs
                    </span>
                  </div>

                  {/* Actions for draft mode */}
                  {!isReadOnly && (
                    <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        id={`btn-edit-work-update-${update.id}`}
                        onClick={() => onEditUpdate(update)}
                        title="Edit Update"
                        className="p-2 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`btn-delete-work-update-${update.id}`}
                        onClick={() => onDeleteUpdate(update.id)}
                        title="Delete Update"
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {update.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
