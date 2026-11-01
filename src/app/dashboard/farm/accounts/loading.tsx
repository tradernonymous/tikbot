import React from 'react';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading Farm Accounts">
      <div className="h-8 w-64 bg-slate-800 rounded"></div>
      <div className="h-10 w-96 bg-slate-800 rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-48 bg-slate-800 rounded-xl"></div>
        <div className="h-48 bg-slate-800 rounded-xl"></div>
        <div className="h-48 bg-slate-800 rounded-xl"></div>
      </div>
    </div>
  );
}
