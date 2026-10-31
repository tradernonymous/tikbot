import React from 'react';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { getDevFixtures } from '@/fixtures';
import {
  Users,
  Flame,
  Search,
  Shield,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function DashboardOverview() {
  const fixtures = getDevFixtures();
  const totalAccounts = fixtures.accounts.length;
  const activeAccounts = fixtures.accounts.filter((a) => a.status === 'ACTIVE').length;
  const totalCampaigns = fixtures.campaigns.length;
  const pendingApprovals = fixtures.campaigns.filter((c) => c.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Operations Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics, managed account farm status, and campaign approval queue.
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Managed Farm Pool"
          value={`${activeAccounts} / ${totalAccounts}`}
          subtitle={`${Math.round((activeAccounts / totalAccounts) * 100)}% healthy active accounts`}
          trend="+2 warmed"
          trendPositive={true}
          icon={<Users className="w-4 h-4" />}
        />
        <StatCard
          title="Active Campaigns"
          value={totalCampaigns}
          subtitle={`${pendingApprovals} awaiting manual operator approval`}
          trend="Governed"
          trendPositive={true}
          icon={<Flame className="w-4 h-4" />}
        />
        <StatCard
          title="Archived Intelligence"
          value={fixtures.posts.length}
          subtitle="Outlier videos mined with transcripts"
          trend="4.82 max outlier"
          trendPositive={true}
          icon={<Search className="w-4 h-4" />}
        />
        <StatCard
          title="Compliance & Safety"
          value="100%"
          subtitle="All proxy sticky binds & daily caps enforced"
          trend="Safe"
          trendPositive={true}
          icon={<Shield className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Engagement Campaigns & Approval Queue */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Campaign Execution Queue</h3>
              <p className="text-xs text-slate-400">All automated engagements require manual approval by default.</p>
            </div>
            <span className="text-xs font-mono text-cyan-400">
              {pendingApprovals} PENDING REVIEW
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                  <th className="pb-3 font-medium">Campaign Title</th>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Progress</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {fixtures.campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 font-medium text-white max-w-[200px] truncate">
                      {camp.title}
                    </td>
                    <td className="py-3 font-mono text-cyan-400">{camp.actionType}</td>
                    <td className="py-3 font-mono text-slate-300">
                      {camp.executedCount} / {camp.targetCount}
                    </td>
                    <td className="py-3">
                      <StatusBadge status={camp.status} />
                    </td>
                    <td className="py-3 text-right">
                      {camp.status === 'PENDING_APPROVAL' ? (
                        <div className="inline-flex gap-1.5">
                          <button className="px-2 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-all">
                            Approve
                          </button>
                          <button className="px-2 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-all">
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">AUTHORIZED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Account Pool Health Status */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 backdrop-blur-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Farm Pool Velocity</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              HOURLY CAPS
            </span>
          </div>

          <div className="space-y-4">
            {fixtures.accounts.map((acc) => {
              const pct = Math.round((acc.actionsToday / acc.dailyCap) * 100);
              return (
                <div key={acc.id} className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white truncate max-w-[140px]">
                      @{acc.username}
                    </span>
                    <StatusBadge status={acc.status} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
                    <span>Actions: {acc.actionsToday}/{acc.dailyCap}</span>
                    <span>{pct}% cap</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct > 80 ? 'bg-amber-400' : 'bg-cyan-500'
                      }`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
            <span>Sticky Proxy Binding:</span>
            <span className="font-mono text-emerald-400">100% Pinned</span>
          </div>
        </div>
      </div>
    </div>
  );
}
