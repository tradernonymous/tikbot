import React from 'react';

export default function CreatorsLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading creators CRM..."
      className="space-y-6 animate-pulse"
    >
      <div className="h-8 w-48 rounded bg-slate-800/60" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-72 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4" />
        ))}
      </div>
    </div>
  );
}
