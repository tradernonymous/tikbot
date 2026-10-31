import React from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { getDevFixtures } from '@/fixtures';
import { Flame, Plus, ShieldCheck, Check, X, Radio, MessageSquare, AlertTriangle } from 'lucide-react';

export default function CampaignsPage() {
  const fixtures = getDevFixtures();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Engagement Campaigns</h2>
          <p className="text-xs text-slate-400 mt-1">
            Governed boost campaigns (Likes, Comments, Saves, Shares, Live Views) with mandatory manual approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-500/30 text-white text-xs font-semibold shadow-sm transition-all">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Launch Live Boost</span>
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all">
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Safety & Compliance Overview Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Compliance Gate: ACTIVE</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Manual approval mandatory before automation dispatch. 100% of actions respect hourly & daily caps.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-xs mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Comment Bank</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Relatable niche templates with randomized human jitter (2m - 5m) to evade spam detection.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Auto-Pause Trigger</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Auto-halts campaigns if challenge rate reaches 15% or risk score reaches 80/100 (CRITICAL).
          </p>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-white">Active & Queued Campaigns</span>
          <span className="text-xs text-slate-400 font-mono">
            {fixtures.campaigns.length} CAMPAIGNS REGISTERED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-3 px-4 font-medium">Campaign Title</th>
                <th className="py-3 px-4 font-medium">Target URL</th>
                <th className="py-3 px-4 font-medium">Action Type</th>
                <th className="py-3 px-4 font-medium">Progress</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Approval Gate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {fixtures.campaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-white max-w-[220px] truncate">
                    {camp.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-cyan-400/90 max-w-[220px] truncate">
                    <a href={camp.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {camp.targetUrl}
                    </a>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs">{camp.actionType}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {camp.executedCount} / {camp.targetCount} ({Math.round((camp.executedCount / camp.targetCount) * 100)}%)
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={camp.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {camp.status === 'PENDING_APPROVAL' ? (
                      <div className="inline-flex gap-2">
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-all">
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-all">
                          <X className="w-3 h-3" />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-mono text-emerald-400">APPROVED</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
