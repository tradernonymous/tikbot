import React from 'react';

export default function LiveLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading live intelligence..."
      className="space-y-6 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
        ))}
      </div>
      <div className="h-44 rounded-xl border border-slate-800/60 bg-slate-900/40 p-6" />
    </div>
  );
}
