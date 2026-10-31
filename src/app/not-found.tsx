import React from 'react';
import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090d16] p-6 text-slate-100">
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-[#0f172a] p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-cyan-400">
          <FileQuestion className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-100">Page Not Found</h2>
        <p className="mt-2 text-sm text-slate-400">
          The requested route or resource does not exist or has been relocated.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
