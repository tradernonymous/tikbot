import React from 'react';

export default function PublishingLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading publishing console..."
      className="space-y-6 animate-pulse max-w-7xl mx-auto"
    >
      <div className="h-8 w-56 rounded bg-slate-800/60" />
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-12 w-full rounded bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}
