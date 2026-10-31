import React from 'react';
import Link from 'next/link';
import { LucideIcon, Inbox } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      role="region"
      aria-label={title}
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-900/30 p-8 text-center sm:p-12 ${className}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800/80 text-cyan-400">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>

      <h3 className="mt-4 text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
      <p className="mt-2 max-w-sm text-xs text-slate-400">{description}</p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              type="button"
              className="inline-flex items-center rounded-lg bg-cyan-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
