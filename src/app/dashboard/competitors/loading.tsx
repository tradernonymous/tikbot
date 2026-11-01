import React from 'react';

export default function CompetitorsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading competitor intelligence..."
      className="space-y-6 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-800/50" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-full rounded bg-slate-800/50" />
          ))}
        </div>
      </div>
    </div>
  );
}
