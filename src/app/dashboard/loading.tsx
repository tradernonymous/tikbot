import React from 'react';

export default function DashboardLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard view..."
      className="space-y-6 animate-pulse p-6"
    >
      {/* Top Banner Skeleton */}
      <div className="h-8 w-64 rounded bg-slate-800/60" />

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
            <div className="h-4 w-24 rounded bg-slate-800" />
            <div className="mt-4 h-8 w-32 rounded bg-slate-800" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="mb-4 h-6 w-48 rounded bg-slate-800" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-slate-800/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
