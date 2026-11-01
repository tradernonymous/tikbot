import React from 'react';

export default function ComposerLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading composer..."
      className="space-y-6 max-w-4xl animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-800/50" />
        ))}
      </div>
      <div className="h-44 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-28 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
        <div className="h-28 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
      </div>
    </div>
  );
}
