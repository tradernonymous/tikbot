'use client';

import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="p-6 bg-red-950/40 border border-red-800 rounded-xl space-y-4 text-center max-w-lg mx-auto my-12"
    >
      <h2 className="text-lg font-bold text-red-200">Farm Services Failed to Load</h2>
      <p className="text-sm text-red-400">{error.message}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-red-800 hover:bg-red-700 text-white rounded text-sm font-medium"
      >
        Try Again
      </button>
    </div>
  );
}
