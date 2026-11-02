import React from 'react';

export default function ResearchLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading research intelligence..."
      className="space-y-6 animate-pulse max-w-7xl mx-auto"
    >
      <div className="h-8 w-52 rounded bg-slate-800/60" />
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
        <div className="h-10 w-full rounded bg-slate-800/50" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-lg bg-slate-800/40" />
          ))}
        </div>
      </div>
    </div>
  );
}
