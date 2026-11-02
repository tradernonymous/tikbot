import React from 'react';

export default function CampaignsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading campaigns..."
      className="space-y-6 animate-pulse max-w-7xl mx-auto"
    >
      <div className="h-8 w-52 rounded bg-slate-800/60" />
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-28 rounded-lg bg-slate-800/50" />
        ))}
      </div>
      <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-6 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 w-full rounded bg-slate-800/50" />
        ))}
      </div>
    </div>
  );
}
