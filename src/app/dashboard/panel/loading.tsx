import React from 'react';

export default function PanelLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading farm services panel..."
      className="space-y-6 animate-pulse max-w-7xl mx-auto"
    >
      <div className="h-8 w-60 rounded bg-slate-800/60" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
        ))}
      </div>
    </div>
  );
}
