'use client';

import React, { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { getDevFixtures } from '@/fixtures';
import {
  Flame,
  Plus,
  ShieldCheck,
  Check,
  X,
  Radio,
  MessageSquare,
  AlertTriangle,
  Play,
  Heart,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export default function CampaignsPage() {
  const fixtures = getDevFixtures();
  const [campaigns, setCampaigns] = useState(fixtures.campaigns);
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetUrl, setNewTargetUrl] = useState('');
  const [newActionType, setNewActionType] = useState<'LIKE' | 'COMMENT' | 'SAVE' | 'VIEW' | 'LIVE_VIEW'>('LIKE');
  const [newTargetCount, setNewTargetCount] = useState(100);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredCampaigns = campaigns.filter((camp) => {
    if (selectedActionFilter === 'ALL') return true;
    return camp.actionType === selectedActionFilter;
  });

  const handleApprove = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'APPROVED' as const } : c))
    );
    setToastMessage(`Campaign approved. Queued for automated dispatch.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleReject = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'COMPLETED' as const } : c))
    );
    setToastMessage(`Campaign rejected and archived.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTargetUrl) return;

    const newCamp: any = {
      id: `camp-${Date.now().toString().slice(-4)}`,
      title: newTitle,
      targetUrl: newTargetUrl,
      actionType: newActionType,
      targetCount: newTargetCount,
      executedCount: 0,
      status: 'PENDING_APPROVAL' as const,
      approvalId: `appr-${Date.now().toString().slice(-4)}`,
    };

    setCampaigns([newCamp, ...campaigns]);
    setToastMessage(`Campaign "${newTitle}" created and submitted for operator approval.`);
    setShowCreateModal(false);
    setNewTitle('');
    setNewTargetUrl('');
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Quick risk estimate
  const estimatedRiskTier = newTargetCount > 250 ? 'HIGH' : newTargetCount > 80 ? 'MEDIUM' : 'LOW';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Engagement Campaigns</h2>
          <p className="text-xs text-slate-400 mt-1">
            Governed boost campaigns (Likes, Comments, Saves, Shares, Live Views) with mandatory manual approval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/panel"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-500/30 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Launch Live Boost</span>
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-700/80 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Compliance Overview Cards */}
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

      {/* Campaigns Table Container */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'LIKE', 'COMMENT', 'SAVE', 'VIEW', 'LIVE_VIEW'].map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedActionFilter(filter)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedActionFilter === filter
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {filteredCampaigns.length} CAMPAIGNS REGISTERED
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
              {filteredCampaigns.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 font-medium text-white max-w-[220px] truncate">
                    {camp.title}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-cyan-400/90 max-w-[220px] truncate">
                    <a href={camp.targetUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {camp.targetUrl}
                    </a>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-cyan-400">{camp.actionType}</td>
                  <td className="py-3 px-4 font-mono text-xs">
                    {camp.executedCount} / {camp.targetCount} ({Math.round((camp.executedCount / camp.targetCount) * 100)}%)
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={camp.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {camp.status === 'PENDING_APPROVAL' ? (
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => handleApprove(camp.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-semibold transition-all"
                        >
                          <Check className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(camp.id)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-300 text-[10px] font-semibold transition-all"
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Create Governed Campaign</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Q4 Product Launch Engagement"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Target TikTok URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.tiktok.com/@username/video/..."
                  value={newTargetUrl}
                  onChange={(e) => setNewTargetUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Action Type</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="LIKE">Likes</option>
                    <option value="COMMENT">Comments</option>
                    <option value="SAVE">Saves</option>
                    <option value="VIEW">Retention Views</option>
                    <option value="LIVE_VIEW">Live Viewers</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Target Actions</label>
                  <input
                    type="number"
                    min={5}
                    max={1000}
                    value={newTargetCount}
                    onChange={(e) => setNewTargetCount(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400">
                <div className="flex justify-between">
                  <span>Pre-flight Risk Score:</span>
                  <span
                    className={
                      estimatedRiskTier === 'LOW'
                        ? 'text-emerald-400 font-bold'
                        : estimatedRiskTier === 'MEDIUM'
                        ? 'text-amber-400 font-bold'
                        : 'text-rose-400 font-bold'
                    }
                  >
                    {estimatedRiskTier} RISK
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Governance Rule:</span>
                  <span className="text-slate-300">Requires Manual Operator Sign-Off</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Submit for Approval</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
