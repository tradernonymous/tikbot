import React from 'react';

export type StatusVariant =
  | 'ACTIVE'
  | 'WARMING'
  | 'COOLDOWN'
  | 'RESTRICTED'
  | 'BANNED'
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'HEALTHY'
  | 'DEGRADED'
  | 'DOWN';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const norm = status.toUpperCase();

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (['ACTIVE', 'APPROVED', 'HEALTHY', 'COMPLETED', 'UP'].includes(norm)) {
    colorClasses = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
  } else if (['WARMING', 'RUNNING'].includes(norm)) {
    colorClasses = 'bg-sky-950/80 text-sky-400 border-sky-800/60';
  } else if (['PENDING', 'PENDING_APPROVAL', 'DEGRADED', 'COOLDOWN'].includes(norm)) {
    colorClasses = 'bg-amber-950/80 text-amber-400 border-amber-800/60';
  } else if (['BANNED', 'FAILED', 'DOWN', 'RESTRICTED', 'REJECTED'].includes(norm)) {
    colorClasses = 'bg-rose-950/80 text-rose-400 border-rose-800/60';
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80" />
      {status}
    </span>
  );
}
