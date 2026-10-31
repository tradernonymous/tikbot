import React from 'react';

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading application..."
      className="flex min-h-screen items-center justify-center bg-[#090d16] p-6 text-slate-400"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-500" />
        <p className="text-sm font-medium tracking-wide">Loading workspace...</p>
      </div>
    </div>
  );
}
