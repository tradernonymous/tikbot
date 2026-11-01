import React from 'react';

export default function InboxLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading comment inbox..."
      className="space-y-6 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-800/50" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
        ))}
      </div>
    </div>
  );
}
