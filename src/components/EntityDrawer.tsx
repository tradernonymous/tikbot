'use client';

import React from 'react';
import {
  X,
  ExternalLink,
  Users,
  Flame,
  Calendar,
  Activity,
  FileText,
  Search,
  Shield,
  Clock,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export type EntityDrawerType =
  | 'account'
  | 'campaign'
  | 'publish_job'
  | 'task'
  | 'audit_log'
  | 'research_post';

export interface EntityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: EntityDrawerType;
  data: Record<string, any> | null;
  onAction?: (actionName: string, id: string) => void;
}

export function EntityDrawer({
  isOpen,
  onClose,
  entityType,
  data,
  onAction,
}: EntityDrawerProps) {
  if (!isOpen || !data) return null;

  const renderContent = () => {
    switch (entityType) {
      case 'account':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Username:</span>
                <span className="text-white font-semibold">{data.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Platform:</span>
                <span className="text-cyan-400">{data.platform || 'TIKTOK'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Warmup Day:</span>
                <span className="text-white">Day {data.warmupDay || 1}/7</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Health Score:</span>
                <span className="text-emerald-400 font-semibold">{data.healthScore ?? 100}%</span>
              </div>
              {data.proxyHost && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Bound Proxy:</span>
                  <span className="text-slate-300">{data.proxyHost}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Quick Navigation & Relations
              </h5>
              <div className="space-y-1.5 text-xs font-mono">
                <Link
                  href={`/dashboard/compliance?account=${data.id}`}
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <span>View Action Velocity & Caps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href={`/dashboard/panel?account=${data.id}`}
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <span>Dispatch Farm Task With Node</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'campaign':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Title:</span>
                <span className="text-white font-semibold">{data.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className={
                    data.status === 'APPROVED' || data.status === 'RUNNING'
                      ? 'text-emerald-400 font-bold'
                      : data.status === 'PENDING_APPROVAL'
                      ? 'text-amber-400 font-bold'
                      : 'text-slate-400'
                  }
                >
                  {data.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="text-cyan-400 font-bold">{data.actionType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Progress:</span>
                <span className="text-white">
                  {data.executedCount ?? 0} / {data.targetCount}
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
                <span className="text-slate-400 text-[10px]">Target Video:</span>
                <a
                  href={data.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] truncate"
                >
                  <span className="truncate">{data.targetUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Related Resources
              </h5>
              <div className="space-y-1.5 text-xs font-mono">
                <Link
                  href={`/dashboard/panel?campaign=${data.id}`}
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <span>View Dispatched Tasks</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'publish_job':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Account:</span>
                <span className="text-cyan-400 font-semibold">{data.account}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled:</span>
                <span className="text-white">{data.scheduledAt}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
                <span className="text-slate-400 text-[10px]">Caption:</span>
                <p className="text-slate-200 text-xs">{data.caption}</p>
              </div>
            </div>
          </div>
        );

      case 'audit_log':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Action:</span>
                <span className="text-cyan-400 font-bold">{data.action}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Operator:</span>
                <span className="text-white">{data.actorEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Resource:</span>
                <span className="text-white">{data.resourceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">IP:</span>
                <span className="text-slate-400">{data.ipAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-400">{data.timestamp}</span>
              </div>
            </div>
          </div>
        );

      case 'task':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Task Name:</span>
                <span className="text-cyan-400 font-semibold">{data.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="text-emerald-400 font-bold">{data.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attempts:</span>
                <span className="text-white">
                  {data.attempts ?? 0} / {data.maxAttempts ?? 3}
                </span>
              </div>
              {data.targetUrl && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 text-[10px]">Target URL:</span>
                  <a
                    href={data.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] truncate"
                  >
                    <span className="truncate">{data.targetUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
              {data.error && (
                <div className="p-2 rounded bg-rose-950/40 border border-rose-900/50 text-rose-300 text-[11px]">
                  {data.error}
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Actions
              </h5>
              <div className="space-y-1.5 text-xs font-mono">
                <Link
                  href="/dashboard/panel"
                  className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <span>Open Farm Execution Panel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );

      case 'research_post':
        return (
          <div className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 font-mono text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Creator:</span>
                <span className="text-cyan-400 font-semibold">{data.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Outlier Multiplier:</span>
                <span className="text-amber-400 font-bold">{data.outlierScore}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Views:</span>
                <span className="text-white font-semibold">
                  {typeof data.views === 'number' ? data.views.toLocaleString() : data.views}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Likes:</span>
                <span className="text-white font-semibold">
                  {typeof data.likes === 'number' ? data.likes.toLocaleString() : data.likes}
                </span>
              </div>
              {data.targetUrl && (
                <div className="flex flex-col gap-1 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 text-[10px]">Source TikTok:</span>
                  <a
                    href={data.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 text-[11px] truncate"
                  >
                    <span className="truncate">{data.targetUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h5 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Cross-Entity Execution
              </h5>
              <div className="space-y-1.5 text-xs font-mono">
                <Link
                  href={`/dashboard/campaigns?targetUrl=${encodeURIComponent(
                    data.targetUrl || ''
                  )}&actionType=LIKE`}
                  className="flex items-center justify-between p-2 rounded bg-cyan-950/40 border border-cyan-800/60 text-cyan-300 hover:text-cyan-100 transition-colors"
                >
                  <span>Launch Campaign From Post</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 text-xs font-mono text-slate-400">
            {JSON.stringify(data, null, 2)}
          </div>
        );
    }
  };

  const getTitle = () => {
    switch (entityType) {
      case 'account':
        return 'Account Detail';
      case 'campaign':
        return 'Campaign Detail';
      case 'publish_job':
        return 'Publish Slot Detail';
      case 'audit_log':
        return 'Audit Log Entry';
      case 'task':
        return 'Task Detail';
      case 'research_post':
        return 'Outlier Post Intelligence';
      default:
        return 'Entity Detail';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={getTitle()}
      className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200"
    >
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          {entityType === 'account' ? (
            <Users className="w-4 h-4 text-cyan-400" />
          ) : entityType === 'campaign' ? (
            <Flame className="w-4 h-4 text-amber-400" />
          ) : entityType === 'publish_job' ? (
            <Calendar className="w-4 h-4 text-emerald-400" />
          ) : entityType === 'audit_log' ? (
            <Shield className="w-4 h-4 text-purple-400" />
          ) : (
            <Activity className="w-4 h-4 text-cyan-400" />
          )}
          <h3 className="text-sm font-bold text-white">{getTitle()}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          aria-label="Close detail drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-1 overflow-y-auto">{renderContent()}</div>
    </div>
  );
}
