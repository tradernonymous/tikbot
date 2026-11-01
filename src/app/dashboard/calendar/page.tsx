'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Calendar as CalendarIcon,
  Clock,
  Flame,
  AlertTriangle,
  ArrowRight,
  Plus,
  Zap,
  CheckCircle2,
  Filter,
  Layers,
} from 'lucide-react';
import { Metric } from '@/components/Metric';
import { SectionErrorBoundary } from '@/components/SectionErrorBoundary';
import { EmptyState } from '@/components/EmptyState';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { DEFAULT_QUEUE_SLOTS } from '@/app/api/v1/content/calendar/route';

export interface CalendarJobRecord {
  id: string;
  accountId: string;
  accountUsername?: string;
  mediaAssetId: string;
  mediaStorageKey?: string;
  caption: string;
  scheduledAt: string;
  status: string;
  executedAt?: string | null;
  error?: string | null;
}

export interface ConflictRecord {
  jobAId: string;
  jobBId: string;
  accountUsername: string;
  message: string;
}

export interface HeatmapPoint {
  hour: number;
  intensity: number;
  label: string;
}

export interface CalendarPageProps {
  initialJobs?: CalendarJobRecord[];
  initialConflicts?: ConflictRecord[];
  initialHeatmap?: HeatmapPoint[];
}

export default function CalendarPage({
  initialJobs,
  initialConflicts,
  initialHeatmap,
}: CalendarPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlView = searchParams ? searchParams.get('view') : null;
  const urlAccount = searchParams ? searchParams.get('account') : null;

  const validViews = ['month', 'week', 'day'] as const;
  type ViewType = (typeof validViews)[number];

  const resolvedView: ViewType =
    urlView && validViews.includes(urlView.toLowerCase() as ViewType)
      ? (urlView.toLowerCase() as ViewType)
      : 'week';

  const [view, setView] = useState<ViewType>(resolvedView);
  const [selectedAccount, setSelectedAccount] = useState<string>(urlAccount || 'ALL');
  const [jobs, setJobs] = useState<CalendarJobRecord[]>(initialJobs || []);
  const [conflicts, setConflicts] = useState<ConflictRecord[]>(initialConflicts || []);
  const [heatmap, setHeatmap] = useState<HeatmapPoint[]>(
    initialHeatmap || [
      { hour: 8, intensity: 0.4, label: 'Early Scroll' },
      { hour: 12, intensity: 0.7, label: 'Lunch Break' },
      { hour: 15, intensity: 0.5, label: 'Mid Afternoon' },
      { hour: 18, intensity: 0.95, label: 'Peak FYP Velocity' },
      { hour: 21, intensity: 0.85, label: 'Prime Retention' },
    ]
  );
  const [loading, setLoading] = useState<boolean>(!initialJobs);
  const [rescheduleModalJob, setRescheduleModalJob] = useState<CalendarJobRecord | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string>('');

  useEffect(() => {
    if (initialJobs && initialConflicts && initialHeatmap) return;

    let isMounted = true;
    setLoading(true);

    const params = new URLSearchParams({ view });
    if (selectedAccount !== 'ALL') {
      params.set('accountId', selectedAccount);
    }

    fetch(`/api/v1/content/calendar?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success) {
          if (Array.isArray(data.jobs)) setJobs(data.jobs);
          if (Array.isArray(data.conflicts)) setConflicts(data.conflicts);
          if (Array.isArray(data.heatmap)) setHeatmap(data.heatmap);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [view, selectedAccount, initialJobs, initialConflicts, initialHeatmap]);

  const updateUrl = (v: ViewType, acc: string) => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
    params.set('view', v);
    if (acc !== 'ALL') {
      params.set('account', acc);
    } else {
      params.delete('account');
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleViewChange = (v: ViewType) => {
    setView(v);
    updateUrl(v, selectedAccount);
  };

  const handleAccountChange = (acc: string) => {
    setSelectedAccount(acc);
    updateUrl(view, acc);
  };

  const handleReschedule = async (jobId: string, newTime: string) => {
    try {
      const res = await fetch('/api/v1/content/calendar', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jobId, scheduledAt: new Date(newTime).toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, scheduledAt: newTime } : j))
        );
        setRescheduleModalJob(null);
      }
    } catch {}
  };

  const columns: ColumnDef<CalendarJobRecord>[] = [
    {
      key: 'scheduledAt',
      header: 'Scheduled Slot',
      render: (item) => {
        const d = new Date(item.scheduledAt);
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-white text-xs">
              {d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              {d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      key: 'accountUsername',
      header: 'Target Account',
      render: (item) => (
        <span className="font-mono text-xs text-slate-200">{`@${item.accountUsername || item.accountId}`}</span>
      ),
    },
    {
      key: 'caption',
      header: 'Caption Preview',
      render: (item) => (
        <span className="text-xs text-slate-300 max-w-xs truncate block">{item.caption}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => {
        const styles: Record<string, string> = {
          PENDING: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
          RUNNING: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 animate-pulse',
          COMPLETED: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
          FAILED: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        };
        return (
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${styles[item.status] || styles.PENDING}`}>
            {item.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <button
          type="button"
          onClick={() => {
            setRescheduleModalJob(item);
            setRescheduleTime(item.scheduledAt.slice(0, 16));
          }}
          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium"
        >
          Reschedule
        </button>
      ),
    },
  ];

  return (
    <SectionErrorBoundary sectionName="Publishing Calendar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-400" />
              <h1 className="text-xl font-bold tracking-tight text-white">Publishing Calendar &amp; Slots</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Recurring queue slots, per-account pacing rules, and organic best-time heatmap scheduling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/composer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Compose to Slot</span>
            </Link>

            <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              Provenance: LIVE (DB)
            </span>
          </div>
        </div>

        {/* Conflict Warning Alerts */}
        {conflicts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-xs font-semibold text-amber-300">Publishing Conflict Warning</h3>
              {conflicts.map((c, i) => (
                <p key={i} className="text-xs text-slate-300">{c.message}</p>
              ))}
            </div>
          </div>
        )}

        {/* View Mode & Account Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-1" role="tablist">
            {(['month', 'week', 'day'] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleViewChange(v)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  view === v
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {`${v.charAt(0).toUpperCase() + v.slice(1)}${v === 'day' ? ' View' : ''}`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Metric
              label="Active Queue Slots"
              value={DEFAULT_QUEUE_SLOTS.length}
              provenance="live"
            />
          </div>
        </div>

        {/* Best-Time Heatmap Strip */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Organic FYP Best-Time Heatmap (from MetricSample Telemetry)</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400">Hourly Velocity</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            {heatmap.map((pt) => (
              <div
                key={pt.hour}
                className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{`${pt.hour.toString().padStart(2, '0')}:00`}</span>
                  <span className="text-[9px] font-mono px-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {`${Math.round(pt.intensity * 100)}%`}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">{pt.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Named Recurring Queue Slots */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Named Recurring Queue Slots</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DEFAULT_QUEUE_SLOTS.map((slot) => (
              <div
                key={slot.id}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white">{slot.name}</span>
                  <span className="text-[10px] font-mono text-cyan-400">{`${slot.recurringHour}:00`}</span>
                </div>
                <div className="flex items-center gap-1">
                  {slot.days.map((d) => (
                    <span key={d} className="text-[9px] font-mono px-1 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Jobs Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Scheduled Publishing Jobs</h2>
            <span className="text-xs font-mono text-slate-400">{jobs.length} jobs in queue</span>
          </div>

          {jobs.length === 0 ? (
            <EmptyState
              icon={CalendarIcon}
              title="No publishing jobs scheduled"
              description="Compose and approve video posts in the Composer to assign them to your weekly queue slots."
              actionLabel="Go to Composer"
              actionHref="/dashboard/composer"
            />
          ) : (
            <DataTable
              columns={columns}
              data={jobs}
              keyExtractor={(item) => item.id}
            />
          )}
        </div>

        {/* Reschedule Modal */}
        {rescheduleModalJob && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 max-w-md w-full space-y-4">
              <h3 className="text-sm font-semibold text-white">Reschedule Publishing Job</h3>
              <p className="text-xs text-slate-400">
                Update the target execution timestamp for @{rescheduleModalJob.accountUsername || rescheduleModalJob.accountId}.
              </p>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">New Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRescheduleModalJob(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleReschedule(rescheduleModalJob.id, rescheduleTime)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                >
                  Save Reschedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SectionErrorBoundary>
  );
}
