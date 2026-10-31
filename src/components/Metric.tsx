import React from 'react';

export type ProvenanceState = 'live' | 'cached' | 'unknown';

export interface MetricProps {
  label?: string;
  value: string | number | null | undefined;
  provenance: ProvenanceState;
  unit?: string;
  className?: string;
  subtext?: string;
}

const PROVENANCE_STYLES: Record<ProvenanceState, { label: string; className: string }> = {
  live: {
    label: 'LIVE',
    className: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  },
  cached: {
    label: 'CACHED',
    className: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  },
  unknown: {
    label: 'UNKNOWN',
    className: 'bg-slate-800 border-slate-700 text-slate-400',
  },
};

export function Metric({
  label,
  value,
  provenance,
  unit,
  className = '',
  subtext,
}: MetricProps) {
  const displayValue =
    value === null || value === undefined || value === '' ? '—' : value;

  const chip = PROVENANCE_STYLES[provenance] || PROVENANCE_STYLES.unknown;

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-slate-400 block text-[11px] font-mono tracking-wider uppercase font-semibold">
            {label}
          </span>
          <span
            data-provenance={provenance}
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${chip.className}`}
          >
            {chip.label}
          </span>
        </div>
      )}
      <div className="flex items-baseline gap-1">
        <span className="text-white font-bold text-sm font-mono">{displayValue}</span>
        {unit && <span className="text-slate-400 text-xs font-mono">{unit}</span>}
        {!label && (
          <span
            data-provenance={provenance}
            className={`ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${chip.className}`}
          >
            {chip.label}
          </span>
        )}
      </div>
      {subtext && <span className="text-slate-400 block text-[10px] mt-0.5">{subtext}</span>}
    </div>
  );
}
