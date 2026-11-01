import React from 'react';

export default function CalendarLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading calendar view..."
      className="space-y-6 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 rounded-lg bg-slate-800/40" />
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
