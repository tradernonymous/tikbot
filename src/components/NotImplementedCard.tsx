import React from 'react';
import { AlertCircle, ExternalLink } from 'lucide-react';

export interface NotImplementedCardProps {
  featureName: string;
  explanation: string;
  issueUrl?: string;
  issueNumber?: number | string;
  className?: string;
}

export function NotImplementedCard({
  featureName,
  explanation,
  issueUrl,
  issueNumber,
  className = '',
}: NotImplementedCardProps) {
  return (
    <div
      className={`rounded-xl border border-amber-900/50 bg-amber-950/20 p-5 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <h4 className="text-sm font-semibold text-white">{featureName}</h4>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-900/40 border border-amber-700/50 text-amber-300 font-semibold uppercase tracking-wider">
          NOT IMPLEMENTED
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400 leading-relaxed">{explanation}</p>

      {issueUrl && (
        <div className="mt-3.5 flex items-center gap-2">
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <span>{issueNumber ? `Issue #${issueNumber}` : 'View Roadmap Issue'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
