'use client';

import React from 'react';
import { Sparkles, X, Target, Calendar, User } from 'lucide-react';
import { useSessionContext } from '@/context/SessionContext';

export function ContextCarriedChip() {
  const {
    selectedAccountId,
    dateRange,
    carriedSource,
    carriedMetadata,
    clearCarriedContext,
  } = useSessionContext();

  // If no source is carried and no account is specifically carried, do not render chip
  if (!carriedSource && !selectedAccountId) {
    return null;
  }

  const title = carriedMetadata?.title || carriedMetadata?.hook || carriedMetadata?.authorHandle || selectedAccountId;

  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-700/60 text-xs text-cyan-200 animate-in fade-in duration-200"
    >
      <Target className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
      <span className="font-semibold text-cyan-300">Carrying:</span>
      <span className="font-mono text-cyan-100 max-w-[200px] truncate" title={String(title)}>
        {title}
      </span>
      {carriedSource && (
        <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-900/60 text-cyan-300 font-mono">
          {carriedSource}
        </span>
      )}
      <button
        type="button"
        onClick={() => clearCarriedContext()}
        aria-label="Clear carried context"
        className="p-0.5 rounded-full hover:bg-cyan-800/80 text-cyan-400 hover:text-white transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
