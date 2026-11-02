import React from 'react';

export default function SettingsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading system settings..."
      className="space-y-6 animate-pulse max-w-4xl mx-auto"
    >
      <div className="h-8 w-44 rounded bg-slate-800/60" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-8 w-24 rounded-lg bg-slate-800/50" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-full rounded bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}
