import React from 'react';

export type MetricProvenance = 'live' | 'cached' | 'simulated' | 'unknown';

export interface StatCardProps {
  title: string;
  value: string | number | null | undefined;
  subtitle?: string;
  trend?: string;
  trendPositive?: boolean;
  provenance?: MetricProvenance;
  icon?: React.ReactNode;
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  trendPositive = true,
  provenance,
  icon,
}: StatCardProps) {
  const displayValue =
    value === null || value === undefined || value === '' ? '—' : value;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 backdrop-blur-sm shadow-sm transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {provenance && (
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider font-semibold ${
                provenance === 'live'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : provenance === 'cached'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                  : provenance === 'simulated'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {provenance.toUpperCase()}
            </span>
          )}
          {icon && <div className="text-slate-400">{icon}</div>}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-white">{displayValue}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trendPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}
