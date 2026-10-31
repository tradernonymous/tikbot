'use client';

import React, { useState } from 'react';
import { BarChart2, Table, HelpCircle } from 'lucide-react';
import { EmptyState } from './EmptyState';

export interface MetricDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface MetricChartProps {
  title: string;
  series: MetricDataPoint[];
  provenance?: 'live' | 'cached' | 'unknown';
  valueFormatter?: (value: number) => string;
  className?: string;
}

export function MetricChart({
  title,
  series,
  provenance = 'live',
  valueFormatter = (v) => v.toLocaleString(),
  className = '',
}: MetricChartProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const provenanceConfig = {
    live: { label: 'Live', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    cached: { label: 'Cached', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    unknown: { label: 'Unknown', badge: 'bg-slate-800 text-slate-400 border-slate-700' },
  }[provenance];

  if (!series || series.length === 0) {
    return (
      <div
        role="region"
        aria-label={title}
        className={`rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-sm ${className}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${provenanceConfig.badge}`}>
            {provenanceConfig.label}
          </span>
        </div>
        <EmptyState
          icon={HelpCircle}
          title="No metric series available"
          description="Metrics will accumulate as jobs and scraping tasks complete."
        />
      </div>
    );
  }

  const maxValue = Math.max(...series.map((p) => p.value), 1);

  return (
    <div
      role="region"
      aria-label={title}
      className={`rounded-xl border border-slate-800 bg-[#0f172a] p-6 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{series.length} recorded data points</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${provenanceConfig.badge}`}>
            {provenanceConfig.label}
          </span>

          <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('chart')}
              type="button"
              aria-label="View visual chart"
              className={`p-1 rounded ${viewMode === 'chart' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <BarChart2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              type="button"
              aria-label="View accessible data table"
              className={`p-1 rounded ${viewMode === 'table' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Table className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'chart' ? (
        <div className="space-y-3">
          <div className="flex items-end gap-2 h-40 pt-6">
            {series.map((point, index) => {
              const heightPct = Math.round((point.value / maxValue) * 100);
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                  <div className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[10px] text-slate-200 font-mono shadow-lg whitespace-nowrap z-10 pointer-events-none">
                    {valueFormatter(point.value)} ({point.label || new Date(point.timestamp).toLocaleDateString()})
                  </div>
                  <div
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                    className="w-full rounded-t bg-cyan-600/70 group-hover:bg-cyan-500 transition-colors"
                  />
                  <span className="text-[10px] text-slate-500 font-mono truncate w-full text-center">
                    {point.label || new Date(point.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-[11px] font-semibold uppercase text-slate-400">
              <tr>
                <th scope="col" className="pb-2">Timestamp / Label</th>
                <th scope="col" className="pb-2 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {series.map((point, index) => (
                <tr key={index}>
                  <td className="py-2">{point.label || new Date(point.timestamp).toLocaleString()}</td>
                  <td className="py-2 text-right font-mono text-cyan-400">{valueFormatter(point.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
