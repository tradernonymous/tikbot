'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: ErrorProps) {
  return (
    <div
      role="alert"
      className="m-6 rounded-xl border border-red-500/20 bg-[#0f172a] p-8 text-slate-100 shadow-xl"
    >
      <div className="flex items-center gap-3 text-red-400">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
        <h2 className="text-lg font-semibold tracking-wide">Dashboard Segment Error</h2>
      </div>

      <p className="mt-3 text-sm text-slate-400">
        An issue occurred while rendering this dashboard view. Sidebar navigation and other panels remain accessible.
      </p>

      {error.digest && (
        <div className="mt-4 rounded bg-slate-900/60 p-2 font-mono text-xs text-slate-500">
          Digest: {error.digest}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={() => reset()}
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Reload Segment
        </button>
      </div>
    </div>
  );
}

