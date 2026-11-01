import React from 'react';

export default function ReportsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading performance reports..."
      className="space-y-6 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-slate-800/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
