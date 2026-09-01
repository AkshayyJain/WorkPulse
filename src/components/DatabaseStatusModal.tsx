import React, { useState, useEffect } from 'react';
import { Database, Server, CheckCircle2, AlertCircle, RefreshCw, X, ShieldCheck, Zap, HardDrive } from 'lucide-react';
import { api } from '../services/api';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseStatusModal({ isOpen, onClose }: DatabaseStatusModalProps) {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await api.getDbStatus();
      setDbStatus(data);
    } catch (e: any) {
      setDbStatus({
        databaseType: 'Unavailable',
        connected: false,
        error: e.message || 'Failed to reach API diagnostics endpoint.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Database & Persistence Engine</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Entity-Service layer & persistence status</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs">Querying database engine status...</p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {/* Status Card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dbStatus?.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                )}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">{dbStatus?.databaseType || 'Document Store'}</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Database: <span className="font-mono text-indigo-600 dark:text-indigo-400">{dbStatus?.databaseName || 'workpulse_db'}</span>
                  </p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                dbStatus?.connected
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
              }`}>
                {dbStatus?.connected ? 'Online' : 'Fallback'}
              </span>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Connection Latency</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {dbStatus?.latencyMs ? `${dbStatus.latencyMs} ms` : '< 1 ms'}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs">
                  <HardDrive className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Total Collections</span>
                </div>
                <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {dbStatus?.collections ? Object.keys(dbStatus.collections).length : '5'}
                </p>
              </div>
            </div>

            {/* Collection Document Counts */}
            {dbStatus?.collections && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  Collection Document Counts
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">users</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dbStatus.collections.users ?? 0}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">work_updates</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dbStatus.collections.work_updates ?? 0}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">weekly_reports</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dbStatus.collections.weekly_reports ?? 0}</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">questions</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dbStatus.collections.questions ?? 0}</span>
                  </div>
                </div>
              </div>
            )}

            {/* MongoDB Atlas Setup Notice */}
            <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-950 dark:text-indigo-200">
              <div className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>MongoDB Atlas & Production Persistence</span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                To connect to your cloud cluster, provide your connection URI via the <code className="px-1 py-0.5 rounded bg-indigo-200/50 dark:bg-indigo-900/60 font-mono text-[10px]">MONGODB_URI</code> environment variable in your deployment settings.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={fetchStatus}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
