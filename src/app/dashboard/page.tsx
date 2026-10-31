'use client';

import React, { useState } from 'react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useOperations } from '@/context/OperationsContext';
import {
  Users,
  Flame,
  Search,
  Shield,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  X,
  Radio,
  ExternalLink,
  Activity,
  Terminal,
  Zap,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardOverview() {
  const {
    accounts,
    campaigns,
    approveCampaign,
    rejectCampaign,
    publishJobs,
    approvePublishJob,
    rejectPublishJob,
    farmTasks,
    researchedPosts,
    terminalLogs,
    killSwitchActive,
  } = useOperations();

  const [showLogs, setShowLogs] = useState(true);

  const totalAccounts = accounts.length;
  const activeAccounts = accounts.filter((a) => a.status === 'ACTIVE').length;
  const pendingCampaigns = campaigns.filter((c) => c.status === 'PENDING_APPROVAL');
  const pendingPublish = publishJobs.filter((p) => p.status === 'PENDING_APPROVAL');
  const totalPendingApprovals = pendingCampaigns.length + pendingPublish.length;
  const runningTasksCount = farmTasks.filter((t) => t.status === 'RUNNING').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Operational Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Operations Command Center</h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time farm orchestration, safety compliance status, and unified operator approval gate.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/panel"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Launch Farm Service</span>
          </Link>
          <Link
            href="/dashboard/research"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold shadow-sm transition-all"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span>Outlier Radar</span>
          </Link>
        </div>
      </div>

      {killSwitchActive && (
        <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-700/80 text-rose-300 text-xs flex items-center justify-between shadow-lg animate-pulse">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>EMERGENCY KILL SWITCH ACTIVE — All campaign dispatching and worker queues are frozen.</span>
          </div>
          <span className="text-[11px] font-mono text-white">RESUME FROM TOP BAR</span>
        </div>
      )}

      {/* Fleet Vitals Strip */}
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-slate-400 block text-[11px]">RUNNING TASKS</span>
          <span className="text-white font-bold text-sm">{runningTasksCount} Active Tasks</span>
          <span className="text-emerald-400 block text-[10px]">Backlog: Normal</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">FARM NODES</span>
          <span className="text-cyan-400 font-bold text-sm">{activeAccounts} Active / {totalAccounts} Total</span>
          <span className="text-slate-400 block text-[10px]">100% Sticky Residential</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">BAN CHALLENGE RATE</span>
          <span className="text-emerald-400 font-bold text-sm">0.0%</span>
          <span className="text-slate-400 block text-[10px]">Safe Threshold (&lt; 15%)</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px]">DAILY COMPLIANCE</span>
          <span className="text-purple-400 font-bold text-sm">STRICT ENFORCED</span>
          <span className="text-slate-400 block text-[10px]">Anti-Bot Jitter Active</span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Managed Farm Pool"
          value={`${activeAccounts} / ${totalAccounts}`}
          subtitle={`${Math.round((activeAccounts / Math.max(1, totalAccounts)) * 100)}% healthy active accounts`}
          trend="+2 warmed"
          trendPositive={true}
          icon={<Users className="w-4 h-4 text-cyan-400" />}
        />
        <StatCard
          title="Active Campaigns"
          value={campaigns.length}
          subtitle={`${pendingCampaigns.length} awaiting manual operator approval`}
          trend="Governed"
          trendPositive={true}
          icon={<Flame className="w-4 h-4 text-amber-400" />}
        />
        <StatCard
          title="Archived Intelligence"
          value={researchedPosts.length}
          subtitle="Outlier videos mined with transcripts"
          trend="5.4x max outlier"
          trendPositive={true}
          icon={<Search className="w-4 h-4 text-emerald-400" />}
        />
        <StatCard
          title="Compliance & Safety"
          value="100%"
          subtitle="All proxy sticky binds & daily caps enforced"
          trend="Safe"
          trendPositive={true}
          icon={<Shield className="w-4 h-4 text-purple-400" />}
        />
      </div>

      {/* Main Grid: Execution Queue + Real-Time Terminal Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Engagement Campaigns & Approval Queue */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-5 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Unified Operator Approval Queue</h3>
                <p className="text-xs text-slate-400">All campaigns and automated uploads require manual approval by default.</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/40">
                {totalPendingApprovals} PENDING REVIEW
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Target / Hook</th>
                    <th className="pb-3 font-medium">Progress</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Approval Gate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {/* Campaign items */}
                  {campaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-mono text-cyan-400">
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>{camp.actionType}</span>
                        </span>
                      </td>
                      <td className="py-3 font-medium text-white max-w-[200px] truncate">
                        {camp.title}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {camp.executedCount} / {camp.targetCount}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={camp.status} />
                      </td>
                      <td className="py-3 text-right">
                        {camp.status === 'PENDING_APPROVAL' ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              onClick={() => approveCampaign(camp.id)}
                              className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold transition-all flex items-center gap-1"
                              title="Approve campaign for automated dispatch"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => rejectCampaign(camp.id)}
                              className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[10px] font-semibold transition-all flex items-center gap-1"
                              title="Reject campaign"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] font-mono text-emerald-400">AUTHORIZED</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {/* Publishing pending jobs */}
                  {pendingPublish.map((pub) => (
                    <tr key={pub.id} className="hover:bg-slate-800/20 transition-colors bg-indigo-950/10">
                      <td className="py-3 font-mono text-indigo-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          <span>POST</span>
                        </span>
                      </td>
                      <td className="py-3 font-medium text-white max-w-[200px] truncate">
                        {pub.title}
                      </td>
                      <td className="py-3 font-mono text-slate-300">
                        {pub.account}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={pub.status} />
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex gap-1.5">
                          <button
                            onClick={() => approvePublishJob(pub.id)}
                            className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[10px] font-semibold transition-all flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => rejectPublishJob(pub.id)}
                            className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 text-[10px] font-semibold transition-all flex items-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Emergency Kill Switch override armed on top bar</span>
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard/campaigns"
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
              >
                <span>All Campaigns</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/dashboard/publishing"
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <span>Publish Queue</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Live Farm Dispatch & System Telemetry */}
        <div className="space-y-4">
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Quick Service Launch</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400">READY</span>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Dispatch high-retention view sessions, humanized likes, or live stream viewers directly to your farm nodes.
            </p>
            <div className="space-y-2">
              <Link
                href="/dashboard/panel?service=VIEW"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/60 border border-slate-800 text-xs transition-colors"
              >
                <span className="text-slate-200 font-medium">Video View Retention Boost</span>
                <span className="text-cyan-400 font-mono text-[11px]">4k/day cap &rarr;</span>
              </Link>
              <Link
                href="/dashboard/panel?service=LIKE"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/60 border border-slate-800 text-xs transition-colors"
              >
                <span className="text-slate-200 font-medium">Targeted Organic Likes</span>
                <span className="text-cyan-400 font-mono text-[11px]">1.2k/day cap &rarr;</span>
              </Link>
              <Link
                href="/dashboard/panel?service=LIVE_VIEW"
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800/60 border border-slate-800 text-xs transition-colors"
              >
                <span className="text-slate-200 font-medium">Live Stream Viewer Boost</span>
                <span className="text-cyan-400 font-mono text-[11px]">50 nodes &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Real Live Worker Terminal Stream */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <div
              onClick={() => setShowLogs((p) => !p)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-semibold text-white">Live Execution Stream</span>
              </div>
              <span className="text-[10px] text-cyan-400 font-mono">{showLogs ? 'HIDE' : 'EXPAND'}</span>
            </div>

            {showLogs && (
              <div className="mt-3 p-2.5 rounded-lg bg-black/80 border border-slate-800/80 font-mono text-[11px] text-slate-400 space-y-1 max-h-44 overflow-y-auto">
                {terminalLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={
                      log.includes('KILL_SWITCH') || log.includes('WARNING')
                        ? 'text-amber-400'
                        : log.includes('REGISTER') || log.includes('APPROVE')
                        ? 'text-emerald-400'
                        : 'text-cyan-300/90'
                    }
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}