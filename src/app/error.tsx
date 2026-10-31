'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootError({ error, reset }: ErrorProps) {
  return (
    <div
      role="alert"
      className="flex min-h-screen items-center justify-center bg-[#090d16] p-6 text-slate-100"
    >
      <div className="w-full max-w-md rounded-xl border border-red-500/20 bg-[#0f172a] p-8 shadow-2xl">
        <div className="flex items-center gap-3 text-red-400">
          <AlertCircle className="h-6 w-6" aria-hidden="true" />
          <h2 className="text-lg font-semibold tracking-wide">Application Error</h2>
        </div>

        <p className="mt-3 text-sm text-slate-400">
          An unexpected error interrupted execution. The application shell remains operational.
        </p>

        {error.digest && (
          <div className="mt-4 rounded bg-slate-900/60 p-2 font-mono text-xs text-slate-500">
            Digest: {error.digest}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => reset()}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

